import { useState } from 'react';
import { Alert } from 'react-native';
import { db, auth } from '../lib/firebase';
import {
  UserProfile,
  BloodType,
  ContactInfo,
} from '../types';

interface ProfileSetupData {
  fullName: string;
  nickname?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  dateOfBirth?: Date;
  nationalId?: string;
  bloodType?: BloodType;
  allergies?: string;
  medications?: string;
  medicalNotes?: string;
  contacts: ContactInfo[];
  bikeBrand?: string;
  bikeModel?: string;
  bikeColor?: string;
  bikePlate?: string;
}

export const useProfileSetup = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileSetupData>({
    fullName: '',
    primaryPhone: '',
    contacts: [],
  });

  const updateFormData = (data: Partial<ProfileSetupData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      if (!formData.fullName || formData.fullName.length < 3) {
        Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
        return false;
      }
      if (!formData.primaryPhone || formData.primaryPhone.length < 10) {
        Alert.alert('Error', 'El teléfono es inválido');
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.contacts.length === 0) {
        Alert.alert('Error', 'Debes agregar al menos un contacto de emergencia');
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

      const profileData: Partial<UserProfile> = {
        uid: user.uid,
        fullName: formData.fullName,
        nickname: formData.nickname,
        primaryPhone: formData.primaryPhone,
        secondaryPhone: formData.secondaryPhone,
        dateOfBirth: formData.dateOfBirth
          ? formData.dateOfBirth.toISOString().split('T')[0]
          : undefined,
        nationalId: formData.nationalId,
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        medications: formData.medications,
        medicalNotes: formData.medicalNotes,
        contacts: formData.contacts,
        bike: (formData.bikeBrand || formData.bikeModel || formData.bikeColor || formData.bikePlate) ? {
          brand: formData.bikeBrand,
          model: formData.bikeModel,
          color: formData.bikeColor,
          plate: formData.bikePlate,
        } : undefined,
        preferences: {
          showBloodTypePublic: true,
          showBikeInfo: true,
          showAllergies: false,
          showMedicalNotes: false,
          showMedications: false,
        },
      };

      await db()
        .collection('profiles')
        .doc(user.uid)
        .set({
          ...profileData,
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
