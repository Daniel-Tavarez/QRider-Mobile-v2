# QRider Geofencing Module

Complete geofencing solution for the QRider mobile app backed by the local AsyncStorage-powered data store with offline support and background tracking.

## Features

- **Local Data Store Integration**: Pulls checkpoints and registrations via the shared `dataStore`
- **Offline-First**: Works without internet connection
- **Background Tracking**: Detects checkpoint entries/exits even when app is closed
- **Auto-Sync**: Automatically persists queued events to the data store when connection is restored
- **Local Persistence**: Uses AsyncStorage for checkpoint caching and pending event storage
- **React Hook**: Easy integration with `useGeofence` hook

## Architecture

```
src/modules/geofence/
├── types.ts                    - TypeScript interfaces
├── GeofenceService.ts          - Checkpoint download and geofence registration
├── GeofenceSyncManager.ts      - Offline storage and local data store sync
├── GeofenceTaskManager.ts      - Background task definition
├── useGeofence.ts              - React hook for components
└── index.ts                    - Module exports
```

## Data Flow

1. **Download**: Fetch checkpoints via `dataStore.getCheckpoints`
2. **Cache**: Save locally with AsyncStorage for offline access
3. **Register**: Create geofences with the monitor utilities
4. **Detect**: Background task captures enter/exit events
5. **Queue**: Save events to AsyncStorage with `synced: false`
6. **Sync**: Persist queued events through `dataStore.recordGeofenceEvent`

## Local Data Store

The geofencing module interacts with the shared `dataStore` in `src/lib/localDataStore.ts`. Key helpers:

- `getCheckpoints(eventId, routeId?)`: Retrieves the active checkpoints for an event (optionally filtered by route) and returns them sorted by sequence.
- `getRegistration(eventId, userId)`: Provides the rider's chosen route so checkpoints can be filtered client-side.
- `recordGeofenceEvent(event)`: Persists processed geofence activity so other parts of the app (progress, event detail) stay in sync.

Runtime caching and offline queues live entirely in AsyncStorage:

- `checkpoints_${eventId}`: Cached checkpoint list for quick reloads.
- `geofence_pending_events`: Queue of unsynced geofence events.
- `geofence_events_${eventId}`: Historical events per event to display in debug views.
- `checkpoint_progress_${eventId}_${userId}` / `checkpoint_exit_progress_${eventId}_${userId}`: Local progress markers used for deduplication.

## Usage

### Basic Implementation

```typescript
import { useGeofence } from './modules/geofence';

function EventScreen({ eventId, userId }) {
  const {
    status,
    checkpoints,
    recentEvents,
    loading,
    error,
    initializeGeofencing,
    stopGeofencing,
    forceSync,
  } = useGeofence(eventId, userId);

  // Start tracking
  const handleStart = async () => {
    await initializeGeofencing();
  };

  // Stop tracking
  const handleStop = async () => {
    await stopGeofencing();
  };

  return (
    <View>
      <Text>Status: {status.isActive ? 'Active' : 'Inactive'}</Text>
      <Text>Checkpoints: {status.checkpointsCount}</Text>
      <Text>Pending Events: {status.pendingEvents}</Text>

      <Button onPress={handleStart} title="Start Tracking" />
      <Button onPress={handleStop} title="Stop Tracking" />
      <Button onPress={forceSync} title="Force Sync" />
    </View>
  );
}
```

### Initialize Task Manager

In your app's root component (before navigation):

```typescript
import { defineGeofenceTask } from './modules/geofence';

export default function App() {
  useEffect(() => {
    // Define task with user ID
    defineGeofenceTask('user123');
  }, []);

  return <AppNavigator />;
}
```

## API Reference

### useGeofence(eventId, userId)

React hook for geofence management.

**Returns:**
- `status`: Current geofencing status
- `checkpoints`: Array of active checkpoints
- `recentEvents`: Last 10 events
- `loading`: Loading state
- `error`: Error message if any
- `initializeGeofencing()`: Start tracking
- `stopGeofencing()`: Stop tracking
- `forceSync()`: Manually trigger sync
- `reloadCheckpoints()`: Refresh checkpoints from the data store
- `updateStatus()`: Refresh status

### GeofenceService

Singleton service for checkpoint management.

```typescript
import { geofenceService } from './modules/geofence';

// Request permissions
const hasPermissions = await geofenceService.requestPermissions();

// Download checkpoints from the local data store (routeId optional)
const checkpoints = await geofenceService.downloadCheckpoints(eventId, routeId ?? null);

// Register geofences
await geofenceService.registerGeofences(eventId, userId);

// Stop tracking
await geofenceService.stopGeofencing();

// Check if active
const isActive = geofenceService.isGeofencingActive();

// Get local checkpoints
const cached = geofenceService.getLocalCheckpoints(eventId);
```

### GeofenceSyncManager

Singleton service for offline storage and sync.

```typescript
import { syncManager } from './modules/geofence';

// Save event locally
await syncManager.saveEventLocally({
  checkpointId: 'cp123',
  checkpointName: 'Checkpoint 1',
  eventType: 'ENTER',
  timestamp: new Date().toISOString(),
  latitude: 18.4861,
  longitude: -69.9312,
  userId: 'user123',
  eventId: 'event123',
});

// Get pending events
const pending = await syncManager.getPendingEvents();

// Sync to the local data store
const result = await syncManager.syncPendingEvents();
console.log(`Synced: ${result.success}, Failed: ${result.failed}`);

// Check network status
const isOnline = await syncManager.isOnline();

// Clean old events
await syncManager.clearSyncedEvents(7); // older than 7 days
```

## Permissions

### iOS

Required in `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "NSLocationAlwaysAndWhenInUseUsageDescription": "Message for user",
      "NSLocationWhenInUseUsageDescription": "Message for user",
      "UIBackgroundModes": ["location"]
    }
  }
}
```

### Android

Required in `app.json`:

```json
{
  "android": {
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION"
    ]
  }
}
```

## Background Task

The module automatically handles background geofence events. When a user enters or exits a checkpoint:

1. Task wakes up in background
2. Records current location
3. Saves event to the AsyncStorage pending queue
4. Attempts sync to the shared data store if online
5. Returns to background

## Optimization

### Battery Optimization

- Uses native geofencing (iOS CoreLocation, Android Geofence API)
- Only activates when event is active
- Automatically stops when event ends

### Network Optimization

- Queues events offline
- Batches sync operations
- Auto-retries on connection restore

### Storage Optimization

- Cleans synced events after 7 days
- Persists queues via AsyncStorage to avoid DB overhead
- Deduplicates checkpoint progress entries per checkpoint

## Debugging

Navigate to GeofenceDebugScreen to view:

- Geofencing status (active/inactive)
- Network status (online/offline)
- List of registered checkpoints
- Recent events (enter/exit)
- Pending events count
- Manual controls (start, stop, sync, reload)

## Troubleshooting

### Geofences Not Triggering

1. Check permissions are granted (foreground + background)
2. Verify checkpoints are registered: `geofenceService.isGeofencingActive()`
3. Ensure radius is appropriate (minimum 100m recommended)
4. Check device location services are enabled

### Events Not Syncing

1. Verify network connection: `syncManager.isOnline()`
2. Check pending events: `syncManager.getPendingEvents()`
3. Manually trigger sync: `syncManager.syncPendingEvents()`
4. Review logs for `dataStore.recordGeofenceEvent` failures

### Task Not Running in Background

1. Verify `UIBackgroundModes` in iOS
2. Check Android permissions are granted
3. Ensure task is defined before geofencing starts
4. Test with device (not simulator for best results)

## Testing

### Local Testing

1. Use small radius (50-100m) for testing
2. Create test checkpoints near your location
3. Use GeofenceDebugScreen to monitor
4. Walk/drive through geofence boundaries

### Offline Testing

1. Start geofencing
2. Enable airplane mode
3. Pass through checkpoints
4. Check pending events in debug screen
5. Restore connection
6. Verify events sync to the data store (visible in the debug screen activity list)

## Performance

- **Startup**: ~500ms to initialize and register geofences
- **Event Detection**: Near-instant (native APIs)
- **Sync**: ~100ms per event (device I/O dependent)
- **Battery Impact**: Minimal (uses native geofencing)
- **Storage**: ~1KB per event, ~500 bytes per checkpoint

## Limitations

- Maximum 20 geofences on iOS (system limit)
- Minimum radius varies by platform (iOS: 100m, Android: variable)
- Background updates may be delayed in battery saver mode
- Web platform not supported (requires native APIs)

## Future Enhancements

- [ ] Geofence prioritization for 20+ checkpoints
- [ ] Advanced battery optimization modes
- [ ] Analytics and heat maps
- [ ] Checkpoint clustering for large events
- [ ] Push notifications on checkpoint detection
- [ ] Multi-event support
- [ ] Historical track replay
