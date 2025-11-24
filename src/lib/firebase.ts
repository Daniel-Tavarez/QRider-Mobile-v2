import { dataStore } from './localDataStore';

// Legacy Firebase shim kept for backwards compatibility.
// The project no longer relies on @react-native-firebase; all data access
// should go through the local data store instead.
export { dataStore as db };

