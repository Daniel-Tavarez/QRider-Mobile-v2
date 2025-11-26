import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { db, auth } from '../lib/firebase';
import { UserProfile, ParticipantStats } from '../types';
import { getVisibleProfile } from '../utils/privacyHelpers';

export const useParticipantProfile = (userId: string) => {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [stats, setStats] = useState<ParticipantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const currentUser = auth().currentUser;
      const isOwner = currentUser?.uid === userId;
      setIsOwnProfile(isOwner);

      const profileDoc = await db()
        .collection('profiles')
        .doc(userId)
        .get();

      if (!profileDoc.exists) {
        Alert.alert('Error', 'Perfil no encontrado');
        return;
      }

      const fullProfile = {
        userId: profileDoc.id,
        ...profileDoc.data(),
      } as UserProfile;

      const visibleProfile = getVisibleProfile(fullProfile, isOwner);
      setProfile(visibleProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const registrationsSnapshot = await db()
        .collection('eventRegistrations')
        .where('userId', '==', userId)
        .where('status', '==', 'confirmed')
        .get();

      const totalEvents = registrationsSnapshot.size;

      let lastEvent: string | undefined;
      if (!registrationsSnapshot.empty) {
        const lastReg = registrationsSnapshot.docs[0].data();
        if (lastReg.eventId) {
          const eventDoc = await db()
            .collection('events')
            .doc(lastReg.eventId)
            .get();
          if (eventDoc.exists) {
            lastEvent = eventDoc.data()?.title || eventDoc.data()?.name;
          }
        }
      }

      setStats({
        totalEvents,
        lastEvent,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return {
    profile,
    stats,
    loading,
    isOwnProfile,
    reload: loadProfile,
  };
};
