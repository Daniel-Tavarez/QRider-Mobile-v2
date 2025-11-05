import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, AppStateStatus, Linking, Platform } from 'react-native';
import { TrackingService } from '../../lib/TrackingService.android';
import { geofenceService } from './GeofenceService';
import { syncManager } from './GeofenceSyncManager';
import { defineGeofenceTask } from './GeofenceTaskManager';
import { Checkpoint, GeofenceEvent, GeofenceStatus } from './types';

export const useGeofence = (eventId: string, userId: string) => {
  const [status, setStatus] = useState<GeofenceStatus>({
    isActive: false,
    checkpointsCount: 0,
    lastSync: null,
    pendingEvents: 0,
    isOnline: false,
  });

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [recentEvents, setRecentEvents] = useState<GeofenceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async () => {
    try {
      const isActive = await geofenceService.isGeofencingActive();
      const localCheckpoints = await geofenceService.getLocalCheckpoints(eventId);
      const pendingCount = await syncManager.getPendingEventsCount();
      const isOnline = await syncManager.isOnline();

      setStatus({
        isActive,
        checkpointsCount: localCheckpoints.length,
        lastSync: null,
        pendingEvents: pendingCount,
        isOnline,
      });

      setCheckpoints(localCheckpoints);

      const events = await syncManager.getAllEvents(eventId);
      setRecentEvents(events.slice(0, 10));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }, [eventId]);

  const initializeGeofencing = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      defineGeofenceTask(userId);

      const hasPermissions = await geofenceService.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Location permissions not granted');
      }

      if (Platform.OS === 'android') {
        try {
          await TrackingService.start(
            'QRider seguimiento activo',
            'Seguimiento en segundo plano habilitado'
          );
        } catch (e) {
          console.warn('Failed to start foreground service:', e);
        }
      }

      const shouldUpdate = await geofenceService.shouldUpdateCheckpoints(eventId);

      let downloadedCheckpoints: Checkpoint[];

      if (shouldUpdate) {
        console.log('Downloading fresh checkpoints...');
        downloadedCheckpoints = await geofenceService.downloadCheckpoints(eventId);
      } else {
        console.log('Using cached checkpoints...');
        downloadedCheckpoints = await geofenceService.getLocalCheckpoints(eventId);
      }

      if (downloadedCheckpoints.length === 0) {
        throw new Error('No checkpoints found for this event');
      }

      const registered = await geofenceService.registerGeofences(eventId, userId);

      if (!registered) {
        throw new Error('Failed to register geofences');
      }

      await updateStatus();

      console.log('Geofencing initialized successfully');

      if (Platform.OS === 'android') {
        Alert.alert(
          'Optimiza para background',
          'Para registrar checkpoints con la pantalla apagada:\n\n' +
            '1) Ajustes > Ubicación > QRider > Permitir todo el tiempo.\n' +
            '2) Ajustes > Batería > Optimización > Excluir QRider (Sin restricciones).\n' +
            '3) Mantén el GPS activado.',
          [
            { text: 'OK' },
            { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
          ]
        );
      } else if (Platform.OS === 'ios') {
        Alert.alert(
          'Permiso Siempre',
          'Para registrar checkpoints en segundo plano, ve a Ajustes > QRider > Ubicación y selecciona "Siempre". Activa "Ubicación precisa".',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize geofencing';
      setError(errorMessage);
      console.error('Error initializing geofencing:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId, userId, updateStatus]);

  const stopGeofencing = useCallback(async () => {
    try {
      await geofenceService.stopGeofencing();
      if (Platform.OS === 'android') {
        try { await TrackingService.stop(); } catch {}
      }
      await updateStatus();
    } catch (err) {
      console.error('Error stopping geofencing:', err);
    }
  }, [updateStatus]);

  const forceSync = useCallback(async () => {
    setLoading(true);
    try {
      const result = await syncManager.syncPendingEvents();
      console.log(`Sync result: ${result.success} successful, ${result.failed} failed`);
      await updateStatus();
      return result;
    } catch (err) {
      console.error('Error forcing sync:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateStatus]);

  const reloadCheckpoints = useCallback(async () => {
    setLoading(true);
    try {
      const downloadedCheckpoints = await geofenceService.downloadCheckpoints(eventId);

      if (downloadedCheckpoints.length > 0) {
        const isActive = await geofenceService.isGeofencingActive();

        if (isActive) {
          await geofenceService.stopGeofencing();
          await geofenceService.registerGeofences(eventId, userId);
        }
      }

      await updateStatus();
    } catch (err) {
      console.error('Error reloading checkpoints:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [eventId, updateStatus]);

  useEffect(() => {
    updateStatus();

    const interval = setInterval(() => {
      updateStatus();
    }, 10000);

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const isActive = await geofenceService.isGeofencingActive();
        if (isActive) {
          console.log('App returned to foreground, restarting geofencing...');
          await geofenceService.stopGeofencing();
          await geofenceService.registerGeofences(eventId, userId);
        }
        updateStatus();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [updateStatus, eventId, userId]);

  return {
    status,
    checkpoints,
    recentEvents,
    loading,
    error,
    initializeGeofencing,
    stopGeofencing,
    forceSync,
    reloadCheckpoints,
    updateStatus,
  };
};
