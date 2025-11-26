import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { db, auth } from '../lib/firebase';
import {
  Event,
  RouteDoc,
  EventRegistration,
  UserProfile,
  VehicleInfo,
} from '../types';

interface RegistrationFormData {
  routeId: string;
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
}

export const useEventRegistration = (eventId: string) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [routes, setRoutes] = useState<RouteDoc[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [existingRegistration, setExistingRegistration] =
    useState<EventRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    routeId: '',
    displayName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const [eventDoc, routesSnapshot, profileDoc, registrationSnapshot] =
        await Promise.all([
          db().collection('events').doc(eventId).get(),
          db()
            .collection('events')
            .doc(eventId)
            .collection('routes')
            .where('active', '==', true)
            .get(),
          db().collection('userProfiles').doc(user.uid).get(),
          db()
            .collection('eventRegistrations')
            .where('eventId', '==', eventId)
            .where('userId', '==', user.uid)
            .limit(1)
            .get(),
        ]);

      if (eventDoc.exists) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
      }

      const routesData = routesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RouteDoc[];
      setRoutes(routesData);

      if (profileDoc.exists) {
        const profile = {
          userId: profileDoc.id,
          ...profileDoc.data(),
        } as UserProfile;
        setUserProfile(profile);

        setFormData({
          routeId: '',
          displayName: profile.displayName,
          email: profile.email,
          phone: profile.phone,
          birthDate: profile.birthDate,
          bloodType: profile.bloodType,
          emergencyContact: profile.emergencyContact,
          vehicleInfo: profile.vehicleInfo,
        });
      }

      if (!registrationSnapshot.empty) {
        setExistingRegistration({
          id: registrationSnapshot.docs[0].id,
          ...registrationSnapshot.docs[0].data(),
        } as EventRegistration);
      }
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del evento');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (data: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateRegistration = async (): Promise<boolean> => {
    if (!formData.routeId) {
      Alert.alert('Error', 'Debes seleccionar una ruta');
      return false;
    }

    const selectedRoute = routes.find((r) => r.id === formData.routeId);
    if (!selectedRoute) {
      Alert.alert('Error', 'Ruta no válida');
      return false;
    }

    if (
      selectedRoute.maxParticipants &&
      selectedRoute.currentParticipants >= selectedRoute.maxParticipants
    ) {
      Alert.alert('Error', 'Esta ruta ya no tiene cupos disponibles');
      return false;
    }

    if (!formData.displayName || !formData.email || !formData.phone) {
      Alert.alert(
        'Error',
        'Por favor completa todos los campos requeridos'
      );
      return false;
    }

    return true;
  };

  const submitRegistration = async (): Promise<boolean> => {
    if (existingRegistration) {
      Alert.alert('Error', 'Ya estás inscrito en este evento');
      return false;
    }

    if (!(await validateRegistration())) {
      return false;
    }

    setSubmitting(true);

    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user');

      const registrationData: Omit<
        EventRegistration,
        'id' | 'createdAt' | 'updatedAt'
      > = {
        eventId,
        userId: user.uid,
        uid: user.uid,
        routeId: formData.routeId,
        status: 'confirmed',
        registrationDate: db.FieldValue.serverTimestamp() as any,
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        bloodType: formData.bloodType,
        emergencyContact: formData.emergencyContact,
        vehicleInfo: formData.vehicleInfo,
      };

      const batch = db().batch();

      const registrationRef = db().collection('eventRegistrations').doc();
      batch.set(registrationRef, {
        ...registrationData,
        createdAt: db.FieldValue.serverTimestamp(),
        updatedAt: db.FieldValue.serverTimestamp(),
      });

      const routeRef = db()
        .collection('events')
        .doc(eventId)
        .collection('routes')
        .doc(formData.routeId);
      batch.update(routeRef, {
        currentParticipants: db.FieldValue.increment(1),
      });

      await batch.commit();

      Alert.alert(
        '¡Inscrito!',
        'Te has registrado exitosamente al evento'
      );
      return true;
    } catch (error) {
      console.error('Error submitting registration:', error);
      Alert.alert(
        'Error',
        'No se pudo completar el registro. Intenta nuevamente.'
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    event,
    routes,
    userProfile,
    existingRegistration,
    loading,
    submitting,
    formData,
    updateFormData,
    submitRegistration,
    isAlreadyRegistered: !!existingRegistration,
  };
};
