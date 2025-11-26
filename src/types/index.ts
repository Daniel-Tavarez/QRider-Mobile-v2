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

export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type VehicleType = 'motorcycle' | 'atv' | 'car' | 'bicycle' | 'other';
export type EmergencyRelationship = 'spouse' | 'parent' | 'sibling' | 'friend' | 'other';

export interface VehicleInfo {
  type: VehicleType;
  brand: string;
  model: string;
  year?: string;
  color: string;
  plate: string;
}

export interface PrivacySettings {
  showFullProfile: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showVehicleInfo: boolean;
  showMedicalInfo: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  photoURL?: string;

  birthDate?: string;
  gender?: Gender;
  nationality?: string;

  bloodType?: BloodType;
  allergies?: string;
  medications?: string;
  medicalConditions?: string;

  emergencyContact?: {
    name: string;
    phone: string;
    relationship: EmergencyRelationship;
  };

  vehicleInfo?: VehicleInfo;

  privacy: PrivacySettings;

  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
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
  insurances?: InsuranceInfo[];
  address?: AddressInfo;
  preferences?: PreferencesInfo;
  aeroAmbulance?: AeroAmbulanceInfo;
  preferredCare?: PreferredCareInfo;
  bike?: BikeInfo;
}

export interface RegistrationFields {
  displayName: boolean;
  email: boolean;
  phone: boolean;
  birthDate: boolean;
  bloodType: boolean;
  emergencyContact: boolean;
  emergencyPhone: boolean;
  vehicleInfo: boolean;
}

export interface Event {
  id: string;
  title: string;
  name?: string;
  description?: string;
  date: string;
  startTime?: string;
  location?: string;
  status?: 'draft' | 'published' | 'active' | 'finished';
  organizerId?: string;
  registrationFields?: RegistrationFields;
  meetingPoint: {
    lat?: number;
    lng?: number;
    text?: string;
    mapUrl?: string;
    routeUrl?: string;
  };
  difficulty?: 'easy' | 'medium' | 'hard' | 'med';
  notes?: string;
  createdBy: string;
  joinMode: 'public' | 'code';
  inviteCode?: string;
  multipleRoutes?: boolean;
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
  userId: string;
  uid: string;
  routeId: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'going' | 'maybe' | 'notgoing';
  registrationDate: FirebaseFirestoreTypes.Timestamp;
  consentEmergencyShare?: boolean;

  displayName: string;
  email: string;
  phone: string;
  birthDate?: string;
  bloodType?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  vehicleInfo?: VehicleInfo;

  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface RouteDoc {
  id: string;
  name: string;
  description?: string;
  eventId: string;
  active?: boolean;
  distance?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxParticipants?: number;
  currentParticipants: number;
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

export interface ParticipantStats {
  totalEvents: number;
  bestPosition?: number;
  lastEvent?: string;
}

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  ProfileSetup: undefined;
  ProfileEdit: undefined;
  EventDetail: { eventId: string };
  EventRegistration: { eventId: string };
  ParticipantProfile: { userId: string; eventId?: string };
  GeofenceDebug: { eventId: string; userId: string };
  Participants: { eventId: string };
  Checkpoints: { eventId: string; userId: string; routeId: string | null };
};
