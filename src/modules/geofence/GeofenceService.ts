import AsyncStorage from '@react-native-async-storage/async-storage';
// Replaced expo-location/task-manager usage with plain React Native compatible implementations.
// For accurate/background geofencing you should integrate a native library such as
// react-native-background-geolocation (TransistorSoft) or implement native geofencing
// via platform APIs. Below we provide minimal, JS-based fallbacks so the project is
// no longer dependent on Expo packages.
import firestore from '@react-native-firebase/firestore';
import { PermissionsAndroid, Platform } from 'react-native';
import { Checkpoint, GeofenceRegion } from './types';

const GEOFENCE_TASK_NAME = 'geofence-task';
const CHECKPOINTS_KEY_PREFIX = 'checkpoints_';
const GEOFENCES_ACTIVE_KEY = 'geofences_active';
const ACTIVE_EVENT_ID_KEY = 'active_event_id';

export class GeofenceService {
  private static instance: GeofenceService;

  private constructor() {}

  static getInstance(): GeofenceService {
    if (!GeofenceService.instance) {
      GeofenceService.instance = new GeofenceService();
    }
    return GeofenceService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        console.log('Requesting location permissions on Android');
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const ok =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;

        if (!ok) {
          console.log('Location permission not granted on Android');
        }
        // Note: background location permission on Android requires manifest + runtime handling
        return ok;
      }

      // On iOS the location permission prompt is driven by Info.plist entries.
      // Assume permissions will be requested via native dialogs when needed.
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async downloadCheckpoints(eventId: string): Promise<Checkpoint[]> {
    try {
      const querySnapshot = await firestore()
        .collection('checkpoints')
        .where('event_id', '==', eventId)
        .where('active', '==', true)
        .get();

      const checkpoints: Checkpoint[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        checkpoints.push({
          id: doc.id,
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius,
          notify_on_enter: data.notify_on_enter,
          notify_on_exit: data.notify_on_exit,
          sequence: data.sequence,
          active: data.active,
          event_id: data.event_id,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      });

      checkpoints.sort((a, b) => a.sequence - b.sequence);

      this.saveCheckpointsLocally(eventId, checkpoints);

      return checkpoints;
    } catch (error) {
      console.error('Error downloading checkpoints:', error);
      return this.getLocalCheckpoints(eventId);
    }
  }

  async saveCheckpointsLocally(eventId: string, checkpoints: Checkpoint[]): Promise<void> {
    try {
      const key = `${CHECKPOINTS_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify(checkpoints));
      console.log(`Saved ${checkpoints.length} checkpoints locally for event ${eventId}`);
    } catch (error) {
      console.error('Error saving checkpoints locally:', error);
    }
  }

  async getLocalCheckpoints(eventId: string): Promise<Checkpoint[]> {
    try {
      const key = `${CHECKPOINTS_KEY_PREFIX}${eventId}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) {
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting local checkpoints:', error);
      return [];
    }
  }

  async shouldUpdateCheckpoints(eventId: string): Promise<boolean> {
    try {
      const localCheckpoints = await this.getLocalCheckpoints(eventId);

      if (localCheckpoints.length === 0) {
        return true;
      }

      const querySnapshot = await firestore()
        .collection('checkpoints')
        .where('event_id', '==', eventId)
        .where('active', '==', true)
        .get();

      if (querySnapshot.size !== localCheckpoints.length) {
        return true;
      }

      let needsUpdate = false;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const localCheckpoint = localCheckpoints.find(cp => cp.id === doc.id);

        if (!localCheckpoint || localCheckpoint.updated_at !== data.updated_at) {
          needsUpdate = true;
        }
      });

      return needsUpdate;
    } catch (error) {
      console.error('Error checking if checkpoints need update:', error);
      return false;
    }
  }

  async registerGeofences(eventId: string): Promise<boolean> {
    try {
      const checkpoints = await this.getLocalCheckpoints(eventId);

      if (checkpoints.length === 0) {
        console.log('No checkpoints to register');
        return false;
      }

      // Store regions locally. NOTE: this does NOT start native geofencing.
      // Integrate a native geofencing/background-location library to get real geofence
      // callbacks (recommended: react-native-background-geolocation by TransistorSoft)
      const regions: GeofenceRegion[] = checkpoints.map((checkpoint) => ({
        identifier: checkpoint.id,
        latitude: checkpoint.latitude,
        longitude: checkpoint.longitude,
        radius: checkpoint.radius,
        notifyOnEnter: checkpoint.notify_on_enter,
        notifyOnExit: checkpoint.notify_on_exit,
      }));

      await AsyncStorage.setItem(`${CHECKPOINTS_KEY_PREFIX}${eventId}`, JSON.stringify(checkpoints));
      await AsyncStorage.setItem(ACTIVE_EVENT_ID_KEY, eventId);
      await AsyncStorage.setItem(GEOFENCES_ACTIVE_KEY, 'true');

      console.log(`Saved ${regions.length} geofences for event ${eventId} (native geofencing NOT started)`);

      return true;
    } catch (error) {
      console.error('Error registering geofences:', error);
      return false;
    }
  }

  async stopGeofencing(): Promise<void> {
    try {
      // Stop geofencing: for now clear stored active flags. If you integrate a native
      // geofencing library, call its stop/teardown method here.
      await AsyncStorage.removeItem(ACTIVE_EVENT_ID_KEY);
      await AsyncStorage.setItem(GEOFENCES_ACTIVE_KEY, 'false');
      console.log('Geofencing stopped (native geofencing was not active)');
    } catch (error) {
      console.error('Error stopping geofencing:', error);
    }
  }

  async isGeofencingActive(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(GEOFENCES_ACTIVE_KEY);
      return value === 'true';
    } catch (error) {
      return false;
    }
  }

  async getActiveEventId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_EVENT_ID_KEY);
    } catch (error) {
      return null;
    }
  }

  async getCurrentLocation(): Promise<any | null> {
    return new Promise((resolve) => {
      try {
        // Use global geolocation if available. For better accuracy on Android, consider
        // installing react-native-geolocation-service and configuring native permissions.
  const geo: any = (globalThis as any).navigator?.geolocation || (globalThis as any).geolocation;

        if (geo && typeof geo.getCurrentPosition === 'function') {
          geo.getCurrentPosition(
            (pos: any) => {
              resolve(pos);
            },
            (err: any) => {
              console.error('Error getting current location:', err);
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
          );
        } else {
          console.warn('No geolocation available on this platform');
          resolve(null);
        }
      } catch (error) {
        console.error('Error getting current location:', error);
        resolve(null);
      }
    });
  }

  async clearLocalData(eventId: string): Promise<void> {
    try {
      const key = `${CHECKPOINTS_KEY_PREFIX}${eventId}`;
      await AsyncStorage.removeItem(key);
      console.log(`Cleared local data for event ${eventId}`);
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }
}

export const geofenceService = GeofenceService.getInstance();
