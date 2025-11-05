import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, { GeoError, GeoPosition } from 'react-native-geolocation-service';
import { geofenceService } from './GeofenceService';
import { syncManager } from './GeofenceSyncManager';
import { Checkpoint } from './types';

const INSIDE_STATE_KEY_PREFIX = 'geofence_inside_state_';
const LAST_EVENT_TS_KEY_PREFIX = 'geofence_last_event_ts_';

type InsideState = Record<string, boolean>; // checkpointId -> inside
type LastEventTs = Record<string, number>; // checkpointId -> epoch ms

class GeofenceMonitor {
  private watchId: number | null = null;
  private activeEventId: string | null = null;
  private userId: string | null = null;
  private checkpoints: Checkpoint[] = [];
  private cooldownMs = 60_000; // 60s cooldown per checkpoint to prevent flapping

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
        distanceFilter: 15,
        interval: 10_000,
        fastestInterval: 5_000,
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
        const isInside = this.isWithinRadius(latitude, longitude, cp.latitude, cp.longitude, cp.radius);
        const last = lastTs[cp.id] || 0;
        const cooledDown = now - last > this.cooldownMs;

        if (!wasInside && isInside && cp.notify_on_enter && cooledDown) {
          await this.emitEvent('ENTER', cp, latitude, longitude);
          inside[cp.id] = true;
          lastTs[cp.id] = now;
        } else if (wasInside && !isInside && cp.notify_on_exit && cooledDown) {
          await this.emitEvent('EXIT', cp, latitude, longitude);
          inside[cp.id] = false;
          lastTs[cp.id] = now;
        } else {
          // keep state as-is
          inside[cp.id] = isInside;
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
}

export const geofenceMonitor = new GeofenceMonitor();
