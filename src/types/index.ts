import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type BloodType = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  slug: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  whatsapp?: boolean;
  email?: string;
}

export interface Profile {
  uid: string;
  fullName: string;
  nickname?: string;
  bloodType?: BloodType;
  allergies?: string;
  medications?: string;
  medicalNotes?: string;
  dateOfBirth?: string;
  nationalId?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  contacts: EmergencyContact[];
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  meetingPoint: {
    lat?: number;
    lng?: number;
    text?: string;
  };
  difficulty?: 'easy' | 'med' | 'hard';
  notes?: string;
  createdBy: string;
  joinMode: 'public' | 'code';
  inviteCode?: string;
  capacity?: number;
  emergencyWindow?: {
    start: string;
    end: string;
  };
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface EventRegistration {
  id?: string;
  eventId: string;
  uid: string;
  status: 'going' | 'maybe' | 'notgoing';
  consentEmergencyShare: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Checkpoint {
  id: string;
  eventId: string;
  name: string;
  sequence: number;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface CheckpointProgress {
  id: string;
  checkpointId: string;
  uid: string;
  eventId: string;
  timestamp: FirebaseFirestoreTypes.Timestamp;
  latitude: number;
  longitude: number;
}

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  EventDetail: { eventId: string };
  GeofenceDebug: { eventId: string; userId: string };
  Participants: { eventId: string };
  Checkpoints: { eventId: string; userId: string };
};