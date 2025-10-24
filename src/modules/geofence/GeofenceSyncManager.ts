import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import firestore from '@react-native-firebase/firestore';
import { GeofenceEvent } from './types';

const PENDING_EVENTS_KEY = 'geofence_pending_events';
const ALL_EVENTS_KEY_PREFIX = 'geofence_events_';

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
      return true;
    } catch (error) {
      console.error('Error saving event locally:', error);
      return false;
    }
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
