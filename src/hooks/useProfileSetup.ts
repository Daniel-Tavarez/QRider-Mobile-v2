import { useState } from 'react';
import { Alert } from 'react-native';
import { db, auth } from '../lib/firebase';
import {
  UserProfile,
  Gender,
  BloodType,
  VehicleType,
  EmergencyRelationship,
} from '../types';
import { validatePersonalInfo, validateMedicalInfo } from '../utils/validation';

interface ProfileSetupData {
  displayName: string;
  phone: string;
  birthDate?: Date;
  gender?: Gender;
  nationality?: string;
  photoURL?: string;
  bloodType?: BloodType;
  allergies?: string;
  medications?: string;
  medicalConditions?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: EmergencyRelationship;
  hasVehicle: boolean;
  vehicleType?: VehicleType;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleColor?: string;
  vehiclePlate?: string;
}

export const useProfileSetup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileSetupData>({
    displayName: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    hasVehicle: false,
  });

  const updateFormData = (data: Partial<ProfileSetupData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      const errors = validatePersonalInfo({
        displayName: formData.displayName,
        email: auth().currentUser?.email || '',
        phone: formData.phone,
        birthDate: formData.birthDate
          ? formData.birthDate.toISOString().split('T')[0]
          : undefined,
      });

      if (errors.length > 0) {
        Alert.alert('Error de validación', errors[0].message);
        return false;
      }
    }

    if (currentStep === 2) {
      const errors = validateMedicalInfo({
        bloodType: formData.bloodType,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship || 'other',
        },
      });

      if (errors.length > 0) {
        Alert.alert('Error de validación', errors[0].message);
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const createProfile = async (): Promise<boolean> => {
    setLoading(true);

    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        displayName: formData.displayName,
        email: user.email || '',
        phone: formData.phone,
        photoURL: formData.photoURL,
        birthDate: formData.birthDate
          ? formData.birthDate.toISOString().split('T')[0]
          : undefined,
        gender: formData.gender,
        nationality: formData.nationality,
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        medications: formData.medications,
        medicalConditions: formData.medicalConditions,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship || 'other',
        },
        ...(formData.hasVehicle &&
          formData.vehicleType && {
            vehicleInfo: {
              type: formData.vehicleType,
              brand: formData.vehicleBrand || '',
              model: formData.vehicleModel || '',
              year: formData.vehicleYear,
              color: formData.vehicleColor || '',
              plate: formData.vehiclePlate || '',
            },
          }),
        privacy: {
          showFullProfile: true,
          showPhone: true,
          showEmail: true,
          showVehicleInfo: true,
          showMedicalInfo: false,
        },
      };

      await db()
        .collection('userProfiles')
        .doc(user.uid)
        .set({
          ...profileData,
          createdAt: db.FieldValue.serverTimestamp(),
          updatedAt: db.FieldValue.serverTimestamp(),
        });

      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Error',
        'No pudimos crear tu perfil. Por favor intenta nuevamente.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    formData,
    loading,
    updateFormData,
    nextStep,
    prevStep,
    createProfile,
    validateCurrentStep,
  };
};
