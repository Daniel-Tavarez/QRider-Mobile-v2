import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';

export function ProfileScreen() {
  const { user, userData, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const profileDoc = await firestore().collection('profiles').doc(user.uid).get();
      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as Profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando perfil..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out-outline" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <Card style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{userData?.displayName || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{userData?.email}</Text>
              <Text style={styles.userSlug}>@{userData?.slug}</Text>
            </View>
          </View>
        </Card>

        {profile ? (
          <>
            {/* Personal Information */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>👤 Información Personal</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Nombre completo</Text>
                  <Text style={styles.infoValue}>{profile.fullName}</Text>
                </View>
                {profile.nickname && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Apodo</Text>
                    <Text style={styles.infoValue}>"{profile.nickname}"</Text>
                  </View>
                )}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Teléfono principal</Text>
                  <Text style={styles.infoValue}>{profile.primaryPhone}</Text>
                </View>
                {profile.secondaryPhone && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Teléfono secundario</Text>
                    <Text style={styles.infoValue}>{profile.secondaryPhone}</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Medical Information */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🏥 Información Médica</Text>
              <View style={styles.infoGrid}>
                {profile.bloodType ? (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Tipo de sangre</Text>
                    <View style={styles.bloodTypeBadge}>
                      <Text style={styles.bloodTypeText}>{profile.bloodType}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Tipo de sangre</Text>
                    <Text style={styles.infoValueEmpty}>No especificado</Text>
                  </View>
                )}
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Alergias</Text>
                  <Text style={styles.infoValue}>
                    {profile.allergies || 'Ninguna registrada'}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Medicamentos</Text>
                  <Text style={styles.infoValue}>
                    {profile.medications || 'Ninguno registrado'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Emergency Contacts */}
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📞 Contactos de Emergencia</Text>
              {profile.contacts.length > 0 ? (
                profile.contacts.map((contact, index) => (
                  <View key={index} style={styles.contactItem}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelation}>{contact.relationship}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                    {contact.whatsapp && (
                      <View style={styles.whatsappBadge}>
                        <Icon name="logo-whatsapp" size={12} color={theme.colors.white} />
                        <Text style={styles.whatsappText}>WhatsApp</Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No hay contactos de emergencia registrados</Text>
              )}
            </Card>
          </>
        ) : (
          <Card style={styles.emptyCard}>
            <Icon name="person-add" size={64} color={theme.colors.gray[400]} />
            <Text style={styles.emptyTitle}>Perfil no encontrado</Text>
            <Text style={styles.emptyMessage}>
              Necesitas completar tu perfil de emergencia para usar QRider.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.white,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  userCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  userSlug: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  infoGrid: {
    gap: theme.spacing.lg,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    paddingBottom: theme.spacing.md,
  },
  infoLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '500',
  },
  infoValueEmpty: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  bloodTypeBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  bloodTypeText: {
    color: theme.colors.white,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
  },
  contactItem: {
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  contactName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  contactRelation: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  contactPhone: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.primary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  whatsappBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  whatsappText: {
    color: theme.colors.white,
    fontSize: theme.typography.small.fontSize,
    marginLeft: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});