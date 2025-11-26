import { UserProfile } from '../types';

export const getVisibleProfile = (
  profile: UserProfile,
  isOwner: boolean
): Partial<UserProfile> => {
  if (isOwner) {
    return profile;
  }

  if (profile.privacy.showFullProfile) {
    return {
      ...profile,
      bloodType: undefined,
      allergies: undefined,
      medications: undefined,
      medicalConditions: undefined,
      emergencyContact: undefined,
    };
  }

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    photoURL: profile.photoURL,

    email: profile.privacy.showEmail ? profile.email : undefined,
    phone: profile.privacy.showPhone ? profile.phone : undefined,
    vehicleInfo: profile.privacy.showVehicleInfo
      ? profile.vehicleInfo
      : undefined,

    birthDate: undefined,
    bloodType: undefined,
    allergies: undefined,
    medications: undefined,
    medicalConditions: undefined,
    emergencyContact: undefined,

    privacy: profile.privacy,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
};
