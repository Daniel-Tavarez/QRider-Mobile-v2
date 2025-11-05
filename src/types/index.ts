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

export interface InsuranceInfo {
  provider: string;
  planName?: string;
  policyNumber?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface AddressInfo {
  country?: string;
  state?: string;
  city?: string;
}

export interface PreferencesInfo {
  showBloodTypePublic?: boolean;
  showAeroAmbulance?: boolean;
  showBikeInfo?: boolean;
  showAddress?: boolean;
  showMedicalNotes?: boolean;
  showInsurances?: boolean;
  showMedications?: boolean;
  showPreferredCare?: boolean;
  showDOB?: boolean;
  showAllergies?: boolean;
}

export interface AeroAmbulanceInfo {
  enrolled?: boolean;
  provider?: string;
  memberId?: string;
  phone?: string;
  notes?: string;
}

export interface PreferredCareInfo {
  clinicName?: string;
  doctorName?: string;
  doctorPhone?: string;
  city?: string;
}

export interface BikeInsuranceInfo {
  policy?: string;
  expiry?: string; // ISO
  company?: string;
}

export interface BikeInfo {
  brand?: string;
  model?: string;
  color?: string;
  plate?: string;
  insurance?: BikeInsuranceInfo;
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
  // Extended fields
  insurances?: InsuranceInfo[];
  address?: AddressInfo;
  preferences?: PreferencesInfo;
  aeroAmbulance?: AeroAmbulanceInfo;
  preferredCare?: PreferredCareInfo;
  bike?: BikeInfo;
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
    mapUrl?: string;
    routeUrl?: string;
  };
  difficulty?: 'easy' | 'med' | 'hard';
  notes?: string;
  createdBy: string;
  joinMode: 'public' | 'code';
  inviteCode?: string;
  capacity?: number;
  window?: {
    start: {
      _nanoseconds: number;
      _seconds: number;
    };
    end: {
      _nanoseconds: number;
      _seconds: number;
    };
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
  // Optional structured fields for entry/exit
  entryTimestamp?: FirebaseFirestoreTypes.Timestamp;
  exitTimestamp?: FirebaseFirestoreTypes.Timestamp;
  entryLatitude?: number;
  entryLongitude?: number;
  exitLatitude?: number;
  exitLongitude?: number;
}

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  EventDetail: { eventId: string };
  GeofenceDebug: { eventId: string; userId: string };
  Participants: { eventId: string };
  Checkpoints: { eventId: string; userId: string };
};
