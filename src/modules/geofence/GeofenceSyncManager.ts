import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import { GeofenceEvent } from './types';

const PENDING_EVENTS_KEY = 'geofence_pending_events';
const ALL_EVENTS_KEY_PREFIX = 'geofence_events_';
const PROGRESS_KEY_PREFIX = 'checkpoint_progress_'; // `${PROGRESS_KEY_PREFIX}${eventId}_${userId}` (ENTER)
const EXIT_PROGRESS_KEY_PREFIX = 'checkpoint_exit_progress_'; // `${EXIT_PROGRESS_KEY_PREFIX}${eventId}_${userId}` (EXIT)

type LocalCheckpointProgress = {
  checkpointId: string;
  uid: string;
  eventId: string;
  timestamp: string; // ISO
  latitude: number;
  longitude: number;
};

type LocalExitProgress = {
  checkpointId: string;
  uid: string;
  eventId: string;
  timestamp: string; // ISO
  latitude: number;
  longitude: number;
};

export class GeofenceSyncManager {
  private static instance: GeofenceSyncManager;
  private syncInProgress: boolean = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  private constructor() {
    this.startNetworkListener();
  }

  static getInstance(): GeofenceSyncManager {
    if (!GeofenceSyncManager.instance) {
      GeofenceSyncManager.instance = new GeofenceSyncManager();
    }
    return GeofenceSyncManager.instance;
  }

  async saveEventLocally(event: Omit<GeofenceEvent, 'id' | 'synced'>): Promise<boolean> {
    try {
      const newEvent: GeofenceEvent = {
        ...event,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
      };

      const pendingEventsJson = await AsyncStorage.getItem(PENDING_EVENTS_KEY);
      const pendingEvents: GeofenceEvent[] = pendingEventsJson
        ? JSON.parse(pendingEventsJson)
        : [];

      pendingEvents.push(newEvent);
      await AsyncStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(pendingEvents));

      const eventKey = `${ALL_EVENTS_KEY_PREFIX}${event.eventId}`;
      const allEventsJson = await AsyncStorage.getItem(eventKey);
      const allEvents: GeofenceEvent[] = allEventsJson
        ? JSON.parse(allEventsJson)
        : [];

      allEvents.push(newEvent);
      await AsyncStorage.setItem(eventKey, JSON.stringify(allEvents));

      console.log(`Event saved locally: ${event.eventType} at ${event.checkpointName}`);

      // If this is an ENTER, also mark local checkpoint progress
      if (event.eventType === 'ENTER') {
        await this.saveCheckpointProgressLocal({
          checkpointId: event.checkpointId,
          uid: event.userId,
          eventId: event.eventId,
          timestamp: event.timestamp,
          latitude: event.latitude,
          longitude: event.longitude,
        });
      } else if (event.eventType === 'EXIT') {
        // If this is an EXIT, mark local exit progress to dedupe exits
        await this.saveExitProgressLocal({
          checkpointId: event.checkpointId,
          uid: event.userId,
          eventId: event.eventId,
          timestamp: event.timestamp,
          latitude: event.latitude,
          longitude: event.longitude,
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving event locally:', error);
      return false;
    }
  }

  private async saveCheckpointProgressLocal(progress: LocalCheckpointProgress): Promise<void> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${progress.eventId}_${progress.uid}`;
      const existingJson = await AsyncStorage.getItem(key);
      const list: LocalCheckpointProgress[] = existingJson ? JSON.parse(existingJson) : [];

      // Deduplicate by checkpointId (keep earliest)
      const already = list.find(p => p.checkpointId === progress.checkpointId);
      if (!already) {
        list.push(progress);
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    } catch (error) {
      console.error('Error saving local checkpoint progress:', error);
    }
  }

  private async saveExitProgressLocal(progress: LocalExitProgress): Promise<void> {
    try {
      const key = `${EXIT_PROGRESS_KEY_PREFIX}${progress.eventId}_${progress.uid}`;
      const existingJson = await AsyncStorage.getItem(key);
      const list: LocalExitProgress[] = existingJson ? JSON.parse(existingJson) : [];

      const already = list.find(p => p.checkpointId === progress.checkpointId);
      if (!already) {
        list.push(progress);
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    } catch (error) {
      console.error('Error saving local exit checkpoint progress:', error);
    }
  }

  async getLocalCheckpointProgress(eventId: string, uid: string): Promise<LocalCheckpointProgress[]> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${eventId}_${uid}`;
      const json = await AsyncStorage.getItem(key);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error getting local checkpoint progress:', error);
      return [];
    }
  }

  async getLocalExitProgress(eventId: string, uid: string): Promise<LocalExitProgress[]> {
    try {
      const key = `${EXIT_PROGRESS_KEY_PREFIX}${eventId}_${uid}`;
      const json = await AsyncStorage.getItem(key);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error('Error getting local exit checkpoint progress:', error);
      return [];
    }
  }

  /**
   * Remove local progress and local events for checkpoints that are no longer valid
   * for a given event. Use when remote checkpoints have changed and should override local.
   */
  async pruneLocalDataForEvent(
    eventId: string,
    uid: string,
    validCheckpointIds: string[]
  ): Promise<{ prunedProgress: number; prunedPending: number; prunedAllEvents: number }> {
    let prunedProgress = 0;
    let prunedPending = 0;
    let prunedAllEvents = 0;

    try {
      // Progress
      const progressKey = `${PROGRESS_KEY_PREFIX}${eventId}_${uid}`;
      const progressJson = await AsyncStorage.getItem(progressKey);
      if (progressJson) {
        const list: LocalCheckpointProgress[] = JSON.parse(progressJson);
        const filtered = list.filter(p => validCheckpointIds.includes(p.checkpointId));
        prunedProgress = list.length - filtered.length;
        if (prunedProgress > 0) {
          await AsyncStorage.setItem(progressKey, JSON.stringify(filtered));
        }
      }
    } catch (error) {
      console.error('Error pruning local checkpoint progress:', error);
    }

    try {
      // Exit progress
      const exitKey = `${EXIT_PROGRESS_KEY_PREFIX}${eventId}_${uid}`;
      const exitJson = await AsyncStorage.getItem(exitKey);
      if (exitJson) {
        const list: LocalExitProgress[] = JSON.parse(exitJson);
        const filtered = list.filter(p => validCheckpointIds.includes(p.checkpointId));
        const prunedExit = list.length - filtered.length;
        if (prunedExit > 0) {
          await AsyncStorage.setItem(exitKey, JSON.stringify(filtered));
        }
      }
    } catch (error) {
      console.error('Error pruning local exit checkpoint progress:', error);
    }

    try {
      // Pending events (unsynced)
      const pendingJson = await AsyncStorage.getItem(PENDING_EVENTS_KEY);
      if (pendingJson) {
        const pending: GeofenceEvent[] = JSON.parse(pendingJson);
        const filtered = pending.filter(
          e => e.eventId !== eventId || validCheckpointIds.includes(e.checkpointId)
        );
        prunedPending = pending.length - filtered.length;
        if (prunedPending > 0) {
          await AsyncStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(filtered));
        }
      }
    } catch (error) {
      console.error('Error pruning pending geofence events:', error);
    }

    try {
      // All events cache (for UI)
      const allKey = `${ALL_EVENTS_KEY_PREFIX}${eventId}`;
      const allJson = await AsyncStorage.getItem(allKey);
      if (allJson) {
        const all: GeofenceEvent[] = JSON.parse(allJson);
        const filtered = all.filter(e => validCheckpointIds.includes(e.checkpointId));
        prunedAllEvents = all.length - filtered.length;
        if (prunedAllEvents > 0) {
          await AsyncStorage.setItem(allKey, JSON.stringify(filtered));
        }
      }
    } catch (error) {
      console.error('Error pruning all events cache:', error);
    }

    if (prunedProgress + prunedPending + prunedAllEvents > 0) {
      console.log(
        `Pruned local data for event ${eventId}: progress=${prunedProgress}, pending=${prunedPending}, all=${prunedAllEvents}`
      );
    }

    return { prunedProgress, prunedPending, prunedAllEvents };
  }

  async getPendingEvents(): Promise<GeofenceEvent[]> {
    try {
      const pendingEventsJson = await AsyncStorage.getItem(PENDING_EVENTS_KEY);
      if (!pendingEventsJson) {
        return [];
      }

      const events: GeofenceEvent[] = JSON.parse(pendingEventsJson);
      return events.filter(e => !e.synced);
    } catch (error) {
      console.error('Error getting pending events:', error);
      return [];
    }
  }

  async getAllEvents(eventId: string): Promise<GeofenceEvent[]> {
    try {
      const eventKey = `${ALL_EVENTS_KEY_PREFIX}${eventId}`;
      const allEventsJson = await AsyncStorage.getItem(eventKey);

      if (!allEventsJson) {
        return [];
      }

      const events: GeofenceEvent[] = JSON.parse(allEventsJson);
      return events.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting all events:', error);
      return [];
    }
  }

  async syncPendingEvents(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) {
      console.log('Sync already in progress...');
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;

    try {
      const pendingEvents = await this.getPendingEvents();

      if (pendingEvents.length === 0) {
        console.log('No pending events to sync');
        this.syncInProgress = false;
        return { success: 0, failed: 0 };
      }

      console.log(`Syncing ${pendingEvents.length} pending events to Firebase...`);

      const syncedEventIds: string[] = [];
      let failedCount = 0;

      for (const event of pendingEvents) {
        try {
          await firestore()
            .collection('events')
            .doc(event.eventId)
            .collection('checkpoints_logs')
            .add({
              checkpoint_id: event.checkpointId,
              event_type: event.eventType,
              user_id: event.userId,
              latitude: event.latitude,
              longitude: event.longitude,
              timestamp: event.timestamp,
              synced_at: firestore.FieldValue.serverTimestamp(),
            });

          // Upsert checkpointProgress on ENTER to reflect completion
          if (event.eventType === 'ENTER') {
            const docId = `${event.eventId}_${event.userId}_${event.checkpointId}`;
            const docRef = firestore().collection('checkpointProgress').doc(docId);
            await docRef.set(
              {
                checkpointId: event.checkpointId,
                uid: event.userId,
                event_id: event.eventId,
                latitude: event.latitude,
                longitude: event.longitude,
                // preserve event timestamp for progress
                timestamp: (firestore as any).Timestamp?.fromDate
                  ? (firestore as any).Timestamp.fromDate(new Date(event.timestamp))
                  : event.timestamp,
                updated_at: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          } else if (event.eventType === 'EXIT') {
            // Update same progress doc with exit fields
            const docId = `${event.eventId}_${event.userId}_${event.checkpointId}`;
            const docRef = firestore().collection('checkpointProgress').doc(docId);
            await docRef.set(
              {
                checkpointId: event.checkpointId,
                uid: event.userId,
                event_id: event.eventId,
                exitLatitude: event.latitude,
                exitLongitude: event.longitude,
                exitTimestamp: (firestore as any).Timestamp?.fromDate
                  ? (firestore as any).Timestamp.fromDate(new Date(event.timestamp))
                  : event.timestamp,
                updated_at: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }

          syncedEventIds.push(event.id);
          console.log(`Event synced successfully: ${event.id}`);
        } catch (error) {
          console.error(`Error syncing event ${event.id}:`, error);
          failedCount++;
        }
      }

      if (syncedEventIds.length > 0) {
        await this.markEventsAsSynced(syncedEventIds);
      }

      console.log(`Sync completed: ${syncedEventIds.length}/${pendingEvents.length} events synced`);
      return { success: syncedEventIds.length, failed: failedCount };
    } catch (error) {
      console.error('Error during sync:', error);
      return { success: 0, failed: 0 };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async markEventsAsSynced(eventIds: string[]): Promise<void> {
    try {
      const pendingEventsJson = await AsyncStorage.getItem(PENDING_EVENTS_KEY);
      if (!pendingEventsJson) return;

      const pendingEvents: GeofenceEvent[] = JSON.parse(pendingEventsJson);

      const updatedEvents = pendingEvents.map(event =>
        eventIds.includes(event.id)
          ? { ...event, synced: true }
          : event
      );

      await AsyncStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(updatedEvents));

      const eventGroups = new Map<string, GeofenceEvent[]>();
      for (const event of updatedEvents) {
        if (!eventGroups.has(event.eventId)) {
          eventGroups.set(event.eventId, []);
        }
        eventGroups.get(event.eventId)!.push(event);
      }

      for (const [eventId, events] of eventGroups.entries()) {
        const eventKey = `${ALL_EVENTS_KEY_PREFIX}${eventId}`;
        await AsyncStorage.setItem(eventKey, JSON.stringify(events));
      }

      console.log(`Marked ${eventIds.length} events as synced`);
    } catch (error) {
      console.error('Error marking events as synced:', error);
    }
  }

  async getPendingEventsCount(): Promise<number> {
    try {
      const pendingEvents = await this.getPendingEvents();
      return pendingEvents.length;
    } catch (error) {
      console.error('Error getting pending events count:', error);
      return 0;
    }
  }

  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  private startNetworkListener(): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: any) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Network connected, attempting to sync...');
        this.syncPendingEvents();
      }
    });
  }

  stopNetworkListener(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  async clearLocalEvents(eventId: string): Promise<void> {
    try {
      const eventKey = `${ALL_EVENTS_KEY_PREFIX}${eventId}`;
      await AsyncStorage.removeItem(eventKey);

      const pendingEventsJson = await AsyncStorage.getItem(PENDING_EVENTS_KEY);
      if (pendingEventsJson) {
        const pendingEvents: GeofenceEvent[] = JSON.parse(pendingEventsJson);
        const filteredEvents = pendingEvents.filter(e => e.eventId !== eventId);
        await AsyncStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(filteredEvents));
      }

      console.log(`Cleared all events for event ${eventId}`);
    } catch (error) {
      console.error('Error clearing local events:', error);
    }
  }

  async clearAllSyncedEvents(): Promise<void> {
    try {
      const pendingEventsJson = await AsyncStorage.getItem(PENDING_EVENTS_KEY);
      if (!pendingEventsJson) return;

      const pendingEvents: GeofenceEvent[] = JSON.parse(pendingEventsJson);
      const unsyncedEvents = pendingEvents.filter(e => !e.synced);

      await AsyncStorage.setItem(PENDING_EVENTS_KEY, JSON.stringify(unsyncedEvents));

      console.log('Cleared all synced events from storage');
    } catch (error) {
      console.error('Error clearing synced events:', error);
    }
  }
}

export const syncManager = GeofenceSyncManager.getInstance();
