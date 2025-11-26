import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { db, auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { validateProfile } from '../utils/validation';

export const useProfileEdit = () => {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const profileDoc = await db()
        .collection('profiles')
        .doc(user.uid)
        .get();

      if (profileDoc.exists) {
        setProfile({
          userId: profileDoc.id,
          ...profileDoc.data(),
        } as UserProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  const saveProfile = async (): Promise<boolean> => {
    if (!profile) return false;


    setSaving(true);

    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No authenticated user');

      await db()
        .collection('profiles')
        .doc(user.uid)
        .update({
          ...profile,
          updatedAt: db.FieldValue.serverTimestamp(),
        });

      setHasChanges(false);
      Alert.alert('¡Perfil actualizado!', 'Tus cambios han sido guardados');
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el perfil. Intenta nuevamente.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    hasChanges,
    updateProfile,
    saveProfile,
    reload: loadProfile,
  };
};
