import AsyncStorage from '@react-native-async-storage/async-storage';
// Replaced Expo task/Location usage - this project is pure React Native (no Expo).
// Real background geofencing requires a native library (recommended: react-native-background-geolocation).
// For now we provide a JS-only placeholder to keep code compiling and allow local storage of events.

const GEOFENCE_TASK_NAME = 'geofence-task';
const ACTIVE_EVENT_KEY = 'active_event_id';
const COMPLETED_CHECKPOINTS_KEY = 'completed_checkpoints_';

type GeofencingEventData = {
  eventType: 'ENTER' | 'EXIT' | string;
  region: { identifier: string; latitude: number; longitude: number };
};

export const defineGeofenceTask = (userId: string) => {
  // Placeholder: no native background task is defined here. To get real geofence
  // callbacks when the device enters/exits regions, integrate a native library.
  console.log('defineGeofenceTask called - no-op in non-Expo JS fallback', userId);
};

export const isGeofenceTaskDefined = (): boolean => {
  // No background JS task is defined in the RN-only fallback.
  return false;
};

export const getGeofenceTaskName = (): string => {
  return GEOFENCE_TASK_NAME;
};

const markCheckpointAsCompleted = async (eventId: string, checkpointId: string): Promise<void> => {
  try {
    const key = `${COMPLETED_CHECKPOINTS_KEY}${eventId}`;
    const completedJson = await AsyncStorage.getItem(key);
    const completed: string[] = completedJson ? JSON.parse(completedJson) : [];

    if (!completed.includes(checkpointId)) {
      completed.push(checkpointId);
      await AsyncStorage.setItem(key, JSON.stringify(completed));
      console.log(`Checkpoint ${checkpointId} marked as completed`);
    }
  } catch (error) {
    console.error('Error marking checkpoint as completed:', error);
  }
};

const getCompletedCheckpointsCount = async (eventId: string): Promise<number> => {
  try {
    const key = `${COMPLETED_CHECKPOINTS_KEY}${eventId}`;
    const completedJson = await AsyncStorage.getItem(key);
    const completed: string[] = completedJson ? JSON.parse(completedJson) : [];
    return completed.length;
  } catch (error) {
    console.error('Error getting completed checkpoints count:', error);
    return 0;
  }
};

export const resetCompletedCheckpoints = async (eventId: string): Promise<void> => {
  try {
    const key = `${COMPLETED_CHECKPOINTS_KEY}${eventId}`;
    await AsyncStorage.removeItem(key);
    console.log(`Reset completed checkpoints for event ${eventId}`);
  } catch (error) {
    console.error('Error resetting completed checkpoints:', error);
  }
};
