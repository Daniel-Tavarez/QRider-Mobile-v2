import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
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
import { Profile, RootStackParamList } from '../types';

type PublicProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'PublicProfile'>;

export function PublicProfileScreen({ route, navigation }: PublicProfileScreenProps) {
  const { uid } = route.params;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [uid]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profileDoc = await firestore()
        .collection('profiles')
        .doc(uid)
        .get();

      if (profileDoc.exists()) {
        setProfile(profileDoc.data() as Profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading public profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const prefs = useMemo(() => profile?.preferences ?? {}, [profile]);
  const showFlag = (flag?: boolean) => flag !== false;

  const showBloodType = showFlag(prefs.showBloodTypePublic) && !!profile?.bloodType;
  const showAllergies = showFlag(prefs.showAllergies) && !!profile?.allergies;
  const showMedications = showFlag(prefs.showMedications) && !!profile?.medications;
  const showMedicalNotes = showFlag(prefs.showMedicalNotes) && !!profile?.medicalNotes;
  const showDOB = showFlag(prefs.showDOB) && !!profile?.dateOfBirth;
  const showAddress = showFlag(prefs.showAddress) && !!profile?.address;
  const showInsurances = showFlag(prefs.showInsurances) && (profile?.insurances?.length ?? 0) > 0;
  const showBikeInfo = showFlag(prefs.showBikeInfo) && !!profile?.bike;
  const showAeroAmbulance = showFlag(prefs.showAeroAmbulance) && !!profile?.aeroAmbulance;
  const showPreferredCare = showFlag(prefs.showPreferredCare) && !!profile?.preferredCare;

  if (loading) {
    return <LoadingSpinner text="Cargando perfil..." />;
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={22} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil público</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyState}>
          <Icon name="alert-circle" size={40} color={theme.colors.gray[400]} />
          <Text style={styles.emptyText}>Perfil no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={22} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil público</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{profile.fullName}</Text>
              {profile.nickname && (
                <Text style={styles.heroNick}>“{profile.nickname}”</Text>
              )}
              {/* <Text style={styles.heroPhone}>{profile.primaryPhone}</Text>
              {profile.secondaryPhone && (
                <Text style={styles.heroPhone}>{profile.secondaryPhone}</Text>
              )} */}
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{profile.fullName}</Text>
          </View>
          {profile.nickname && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Apodo</Text>
              <Text style={styles.infoValue}>{profile.nickname}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono principal</Text>
            <Text style={styles.infoValue}>{profile.primaryPhone}</Text>
          </View>
          {profile.secondaryPhone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono secundario</Text>
              <Text style={styles.infoValue}>{profile.secondaryPhone}</Text>
            </View>
          )}
          {/* {showDOB && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
              <Text style={styles.infoValue}>{profile.dateOfBirth}</Text>
            </View>
          )} */}
          {showAddress && profile.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>
                {[profile.address.country, profile.address.state, profile.address.city]
                  .filter(Boolean)
                  .join(' • ') || 'N/D'}
              </Text>
            </View>
          )}
        </Card>

        {/* {profile.contacts?.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contactos de emergencia</Text>
            {profile.contacts.map(contact => (
              <View key={contact.id} style={styles.contactRow}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactRelation}>{contact.relationship}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                </View>
                {contact.whatsapp && (
                  <View style={styles.whatsappBadge}>
                    <Icon name="logo-whatsapp" size={14} color={theme.colors.white} />
                    <Text style={styles.whatsappText}>WhatsApp</Text>
                  </View>
                )}
              </View>
            ))}
          </Card>
        )} */}

        {(showBloodType || showAllergies || showMedications || showMedicalNotes) && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Información médica</Text>
            {showBloodType && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo de sangre</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{profile.bloodType}</Text>
                </View>
              </View>
            )}
            {showAllergies && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Alergias</Text>
                <Text style={styles.infoValue}>{profile.allergies}</Text>
              </View>
            )}
            {showMedications && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Medicamentos</Text>
                <Text style={styles.infoValue}>{profile.medications}</Text>
              </View>
            )}
            {showMedicalNotes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notas médicas</Text>
                <Text style={styles.infoValue}>{profile.medicalNotes}</Text>
              </View>
            )}
          </Card>
        )}

        {showInsurances && profile.insurances && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Seguros</Text>
            {profile.insurances.map((insurance, index) => (
              <View key={index} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{insurance.provider}</Text>
                <Text style={styles.infoValue}>
                  {[insurance.planName, insurance.policyNumber].filter(Boolean).join(' • ') || 'N/D'}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {showAeroAmbulance && profile.aeroAmbulance && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Aero Ambulancia</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Inscripción</Text>
              <Text style={styles.infoValue}>{profile.aeroAmbulance.enrolled ? 'Sí' : 'No'}</Text>
            </View>
            {profile.aeroAmbulance.provider && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Proveedor</Text>
                <Text style={styles.infoValue}>{profile.aeroAmbulance.provider}</Text>
              </View>
            )}
            {profile.aeroAmbulance.memberId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID miembro</Text>
                <Text style={styles.infoValue}>{profile.aeroAmbulance.memberId}</Text>
              </View>
            )}
            {profile.aeroAmbulance.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{profile.aeroAmbulance.phone}</Text>
              </View>
            )}
            {profile.aeroAmbulance.notes && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notas</Text>
                <Text style={styles.infoValue}>{profile.aeroAmbulance.notes}</Text>
              </View>
            )}
          </Card>
        )}

        {showPreferredCare && profile.preferredCare && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Atención preferida</Text>
            {profile.preferredCare.clinicName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Clínica</Text>
                <Text style={styles.infoValue}>{profile.preferredCare.clinicName}</Text>
              </View>
            )}
            {profile.preferredCare.doctorName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Doctor</Text>
                <Text style={styles.infoValue}>{profile.preferredCare.doctorName}</Text>
              </View>
            )}
            {profile.preferredCare.doctorPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono doctor</Text>
                <Text style={styles.infoValue}>{profile.preferredCare.doctorPhone}</Text>
              </View>
            )}
            {profile.preferredCare.city && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ciudad</Text>
                <Text style={styles.infoValue}>{profile.preferredCare.city}</Text>
              </View>
            )}
          </Card>
        )}

        {showBikeInfo && profile.bike && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Moto</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Marca</Text>
              <Text style={styles.infoValue}>{profile.bike.brand || 'N/D'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Modelo</Text>
              <Text style={styles.infoValue}>{profile.bike.model || 'N/D'}</Text>
            </View>
            {profile.bike.color && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Color</Text>
                <Text style={styles.infoValue}>{profile.bike.color}</Text>
              </View>
            )}
            {/* {profile.bike.plate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Placa</Text>
                <Text style={styles.infoValue}>{profile.bike.plate}</Text>
              </View>
            )} */}
            {profile.bike.insurance && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Seguro</Text>
                <Text style={styles.infoValue}>
                  {[profile.bike.insurance.company, profile.bike.insurance.policy]
                    .filter(Boolean)
                    .join(' • ') || 'N/D'}
                </Text>
              </View>
            )}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
    color: theme.colors.white,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  heroCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '800',
    color: theme.colors.text,
  },
  heroNick: {
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
    fontWeight: '600',
  },
  heroPhone: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
  sectionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  infoValue: {
    color: theme.colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    color: theme.colors.white,
    fontWeight: '800',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  contactName: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  contactRelation: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  contactPhone: {
    color: theme.colors.text,
    fontSize: theme.typography.small.fontSize,
  },
  whatsappBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  whatsappText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
});
