import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, { GeoError, GeoPosition } from 'react-native-geolocation-service';
import { geofenceService } from './GeofenceService';
import { syncManager } from './GeofenceSyncManager';
import { Checkpoint } from './types';

const INSIDE_STATE_KEY_PREFIX = 'geofence_inside_state_';
const LAST_EVENT_TS_KEY_PREFIX = 'geofence_last_event_ts_';

type InsideState = Record<string, boolean>; // checkpointId -> inside
type LastEventTs = Record<string, number | { t: number; type: 'ENTER' | 'EXIT' }>; // checkpointId -> last event info

class GeofenceMonitor {
  private watchId: number | null = null;
  private activeEventId: string | null = null;
  private userId: string | null = null;
  private checkpoints: Checkpoint[] = [];
  // Cooldown reducido para alta respuesta en vehículos
  private cooldownMs = 3_000; // 3s per checkpoint/type para evitar rebotes

  async start(eventId: string, userId: string) {
    this.activeEventId = eventId;
    this.userId = userId;
    this.checkpoints = await geofenceService.getLocalCheckpoints(eventId);

    // Ensure permissions (including background where possible)
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          // May be ignored on some versions; declared in Manifest for Android 10+
          'android.permission.ACCESS_BACKGROUND_LOCATION' as any,
        ]);
      } catch {
        // ignore
      }
    }

    // Stop any existing watcher
    if (this.watchId != null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.watchId = Geolocation.watchPosition(
      (pos) => this.onLocation(pos),
      (err) => this.onError(err),
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 3_000,
        fastestInterval: 1_500,
        showsBackgroundLocationIndicator: true,
        forceRequestLocation: true,
        useSignificantChanges: false,
      }
    );
  }

  stop() {
    if (this.watchId != null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.activeEventId = null;
    this.userId = null;
    this.checkpoints = [];
  }

  private async onLocation(position: GeoPosition) {
    try {
      if (!this.activeEventId || !this.userId) return;
      // If checkpoints changed (e.g., reloaded), refresh cache
      if (this.checkpoints.length === 0) {
        this.checkpoints = await geofenceService.getLocalCheckpoints(this.activeEventId);
        if (this.checkpoints.length === 0) return;
      }

      const { latitude, longitude } = position.coords;
      const now = Date.now();

      const insideKey = `${INSIDE_STATE_KEY_PREFIX}${this.activeEventId}`;
      const lastTsKey = `${LAST_EVENT_TS_KEY_PREFIX}${this.activeEventId}`;

      const insideJson = await AsyncStorage.getItem(insideKey);
      const lastTsJson = await AsyncStorage.getItem(lastTsKey);
      const inside: InsideState = insideJson ? JSON.parse(insideJson) : {};
      const lastTs: LastEventTs = lastTsJson ? JSON.parse(lastTsJson) : {};

      for (const cp of this.checkpoints) {
        const wasInside = !!inside[cp.id];
        const dist = this.distanceMeters(latitude, longitude, cp.latitude, cp.longitude);

        const lastRec = lastTs[cp.id];
        let lastTime = 0;
        let lastType: 'ENTER' | 'EXIT' | null = null;
        if (typeof lastRec === 'number') {
          lastTime = lastRec;
          lastType = null;
        } else if (lastRec && typeof lastRec === 'object') {
          lastTime = (lastRec as any).t || 0;
          lastType = (lastRec as any).type || null;
        }

        const cooledDownFor = (type: 'ENTER' | 'EXIT') => {
          if (lastType === type) {
            return now - lastTime > this.cooldownMs;
          }
          return true;
        };

        // Hysteresis para evitar rebotes en el borde del radio
        const hysteresis = Math.min(25, Math.max(10, cp.radius * 0.1));
        const enterThreshold = Math.max(0, cp.radius - hysteresis);
        const exitThreshold = cp.radius + hysteresis;

        if (!wasInside) {
          // Considerar entrada solo cuando cruza claramente por debajo del umbral
          if (dist <= enterThreshold) {
            if (cp.notify_on_enter && cooledDownFor('ENTER')) {
              await this.emitEvent('ENTER', cp, latitude, longitude);
              lastTs[cp.id] = { t: now, type: 'ENTER' } as any;
            }
            inside[cp.id] = true;
          } else {
            inside[cp.id] = false;
          }
        } else {
          // Considerar salida solo cuando cruza claramente por encima del umbral
          if (dist >= exitThreshold) {
            if (cp.notify_on_exit && cooledDownFor('EXIT')) {
              await this.emitEvent('EXIT', cp, latitude, longitude);
              lastTs[cp.id] = { t: now, type: 'EXIT' } as any;
            }
            inside[cp.id] = false;
          } else {
            inside[cp.id] = true;
          }
        }
      }

      await AsyncStorage.setItem(insideKey, JSON.stringify(inside));
      await AsyncStorage.setItem(lastTsKey, JSON.stringify(lastTs));

      // Opportunistic sync if online
      try {
        const online = await syncManager.isOnline();
        if (online) {
          await syncManager.syncPendingEvents();
        }
      } catch {}
    } catch (e) {
      console.error('GeofenceMonitor onLocation error:', e);
    }
  }

  private onError(error: GeoError) {
    console.warn('GeofenceMonitor location error', error.code, error.message);
  }

  private async emitEvent(eventType: 'ENTER' | 'EXIT', cp: Checkpoint, lat: number, lon: number) {
    if (!this.activeEventId || !this.userId) return;
    const event = {
      checkpointId: cp.id,
      checkpointName: cp.name,
      eventType,
      timestamp: new Date().toISOString(),
      latitude: lat,
      longitude: lon,
      userId: this.userId,
      eventId: this.activeEventId,
    } as const;
    try {
      await syncManager.saveEventLocally(event);
      console.log(`Geofence ${eventType} @ ${cp.name}`);
    } catch (e) {
      console.error('Failed saving geofence event:', e);
    }
  }

  private isWithinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusMeters: number) {
    const R = 6371000; // meters
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= radiusMeters;
  }

  private distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // meters
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const geofenceMonitor = new GeofenceMonitor();
