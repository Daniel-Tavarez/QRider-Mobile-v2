export type Checkpoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  notify_on_enter: boolean;
  notify_on_exit: boolean;
  sequence: number;
  active: boolean;
  event_id: string;
  routeId?: string;
  created_at: string;
  updated_at: string;
};

export type GeofenceEvent = {
  id: string;
  checkpointId: string;
  checkpointName: string;
  eventType: 'ENTER' | 'EXIT';
  timestamp: string;
  latitude: number;
  longitude: number;
  synced: boolean;
  userId: string;
  eventId: string;
};

export type GeofenceRegion = {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
};

export type GeofenceStatus = {
  isActive: boolean;
  checkpointsCount: number;
  lastSync: string | null;
  pendingEvents: number;
  isOnline: boolean;
};

export type GeofenceTaskData = {
  eventType: 'enter' | 'exit';
  region: {
    identifier: string;
    latitude: number;
    longitude: number;
  };
};
