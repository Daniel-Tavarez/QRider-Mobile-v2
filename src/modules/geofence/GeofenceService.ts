import AsyncStorage from '@react-native-async-storage/async-storage';
// Replaced expo-location/task-manager usage with plain React Native compatible implementations.
// For accurate/background geofencing you should integrate a native library such as
// react-native-background-geolocation (TransistorSoft) or implement native geofencing
// via platform APIs. Below we provide minimal, JS-based fallbacks so the project is
// no longer dependent on Expo packages.
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { dataStore } from '../../lib/localDataStore';
import { geofenceMonitor } from './GeofenceMonitor';
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
        const toRequest: string[] = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];
        // Android 13+: ask notifications permission for foreground service notification
        try {
          if (Platform.Version >= 33) {
            const postNotif = (PermissionsAndroid as any)?.PERMISSIONS
              ?.POST_NOTIFICATIONS;
            if (postNotif) toRequest.push(postNotif);
          }
        } catch {}

        const granted = await PermissionsAndroid.requestMultiple(
          toRequest as any,
        );

        let ok =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
            PermissionsAndroid.RESULTS.GRANTED;

        if (!ok) {
          console.log('Location permission not granted on Android');
          return false;
        }

        // Android 10+: ACCESS_BACKGROUND_LOCATION
        try {
          if (Platform.Version >= 29) {
            const bgPerm = (PermissionsAndroid as any)?.PERMISSIONS
              ?.ACCESS_BACKGROUND_LOCATION;
            if (bgPerm) {
              const bg = await PermissionsAndroid.request(bgPerm);
              if (bg !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert(
                  'Permiso en segundo plano requerido',
                  'Para registrar checkpoints con la pantalla apagada, permite "Ubicación: Permitir todo el tiempo" y desactiva optimizaciones de batería para QRider.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Abrir Ajustes',
                      onPress: () => Linking.openSettings(),
                    },
                  ],
                );
              }
            }
          }
        } catch (e) {
          console.warn('ACCESS_BACKGROUND_LOCATION request error:', e);
        }
        return ok;
      }

      if (Platform.OS === 'ios') {
        try {
          const auth = await Geolocation.requestAuthorization('always');
          return auth === 'granted' || (auth as any) === 'authorizedAlways';
        } catch (e) {
          console.warn('iOS requestAuthorization(always) failed:', e);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async downloadCheckpoints(
    eventId: string,
    routeId: string | null,
  ): Promise<Checkpoint[]> {
    try {
      const checkpoints = await dataStore.getCheckpoints(eventId, routeId);
      const sorted = checkpoints.slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      await this.saveCheckpointsLocally(eventId, sorted);
      return sorted;
    } catch (error) {
      console.error('Error downloading checkpoints:', error);
      return this.getLocalCheckpoints(eventId);
    }
  }

  async saveCheckpointsLocally(
    eventId: string,
    checkpoints: Checkpoint[],
  ): Promise<void> {
    try {
      const key = `${CHECKPOINTS_KEY_PREFIX}${eventId}`;
      await AsyncStorage.setItem(key, JSON.stringify(checkpoints));
      console.log(
        `Saved ${checkpoints.length} checkpoints locally for event ${eventId}`,
      );
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

  async shouldUpdateCheckpoints(
    eventId: string,
    routeId: string | null,
  ): Promise<boolean> {
    try {
      const localCheckpoints = await this.getLocalCheckpoints(eventId);

      if (localCheckpoints.length === 0) {
        return true;
      }

      const remoteCheckpoints = await dataStore.getCheckpoints(eventId, routeId);
      if (remoteCheckpoints.length !== localCheckpoints.length) {
        return true;
      }

      const localMap = new Map(localCheckpoints.map(cp => [cp.id, cp.updated_at]));
      return remoteCheckpoints.some(cp => localMap.get(cp.id) !== cp.updated_at);
    } catch (error) {
      console.error('Error checking if checkpoints need update:', error);
      return false;
    }
  }

  async registerGeofences(eventId: string, userId?: string): Promise<boolean> {
    try {
      let checkpoints = await this.getLocalCheckpoints(eventId);

      // If there is a routeId in the user's eventRegistration, filter checkpoints by that route
      try {
        if (userId) {
          const registration = await dataStore.getRegistration(eventId, userId);
          const selectedRouteId: string | undefined | null = registration?.routeId;
          if (selectedRouteId) {
            const filtered = checkpoints.filter((cp: any) =>
              cp?.routeId ? cp.routeId === selectedRouteId : true,
            );
            if (filtered.length > 0) {
              checkpoints = filtered as any;
            } else {
              console.warn('No route-matching checkpoints found; using full checkpoint set');
            }
          }
        }
      } catch (e) {
        console.warn('Could not apply route filter for checkpoints:', e);
      }

      if (checkpoints.length === 0) {
        console.log('No checkpoints to register');
        return false;
      }

      // Store regions locally. NOTE: this does NOT start native geofencing.
      // Integrate a native geofencing/background-location library to get real geofence
      // callbacks (recommended: react-native-background-geolocation by TransistorSoft)
      const regions: GeofenceRegion[] = checkpoints.map(checkpoint => ({
        identifier: checkpoint.id,
        latitude: checkpoint.latitude,
        longitude: checkpoint.longitude,
        radius: checkpoint.radius,
        notifyOnEnter: checkpoint.notify_on_enter,
        notifyOnExit: checkpoint.notify_on_exit,
      }));

      await AsyncStorage.setItem(
        `${CHECKPOINTS_KEY_PREFIX}${eventId}`,
        JSON.stringify(checkpoints),
      );
      await AsyncStorage.setItem(ACTIVE_EVENT_ID_KEY, eventId);
      await AsyncStorage.setItem(GEOFENCES_ACTIVE_KEY, 'true');

      // Start JS-based geofence monitor (foreground/background while app is alive)
      try {
        if (userId) {
          await geofenceMonitor.start(eventId, userId);
        }
      } catch (e) {
        console.warn('Failed to start GeofenceMonitor:', e);
      }

      console.log(
        `Saved ${regions.length} geofences for event ${eventId} (native geofencing NOT started)`,
      );

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
      try {
        geofenceMonitor.stop();
      } catch {}
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
    return new Promise(resolve => {
      try {
        // Use global geolocation if available. For better accuracy on Android, consider
        // installing react-native-geolocation-service and configuring native permissions.
        const geo: any =
          (globalThis as any).navigator?.geolocation ||
          (globalThis as any).geolocation;

        if (geo && typeof geo.getCurrentPosition === 'function') {
          geo.getCurrentPosition(
            (pos: any) => {
              resolve(pos);
            },
            (err: any) => {
              console.error('Error getting current location:', err);
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
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
