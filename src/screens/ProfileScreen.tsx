import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Linking,
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

  const parseHtmlList = (html?: string): string[] => {
    if (!html) return [];
    const items: string[] = [];
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match: RegExpExecArray | null;
    while ((match = liRegex.exec(html)) !== null) {
      const text = match[1].replace(/<[^>]+>/g, '').trim();
      if (text) items.push(text);
    }
    if (items.length) return items;
    const stripped = html.replace(/<[^>]+>/g, '').trim();
    return stripped ? stripped.split(/\n+/) : [];
  };

  const stripHtml = (html?: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').trim();
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profileDoc = await firestore()
        .collection('profiles')
        .doc(user.uid)
        .get();
      if (profileDoc.exists()) {
        const data = profileDoc.data() as Profile;
        setProfile(data);
        await AsyncStorage.setItem(`profile:${user.uid}`, JSON.stringify(data));
      } else {
        const cached = await AsyncStorage.getItem(`profile:${user.uid}`);
        if (cached) setProfile(JSON.parse(cached) as Profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      try {
        const cached = await AsyncStorage.getItem(`profile:${user.uid}`);
        if (cached) setProfile(JSON.parse(cached) as Profile);
      } catch { }
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phoneNumber: string) => {
    const url = `https://wa.me/+1${phoneNumber.replace(/\D/g, '')}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.log('No se puede abrir WhatsApp');
        }
      })
      .catch(err => console.error('Error al abrir WhatsApp:', err));
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
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <View style={styles.topRow}>
              <Text style={styles.heroKicker}>Tu identidad</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Icon name="log-out-outline" size={20} color={theme.colors.white} />
                <Text style={styles.logoutText}>Salir</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroTitle}>Perfil QRider</Text>
            <Text style={styles.heroSubtitle}>
              Datos de emergencia, contactos y seguro en un solo lugar.
            </Text>
          </View>
        </View>

        <Card style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userData?.displayName || 'Usuario'}
              </Text>
              <Text style={styles.userEmail}>{userData?.email}</Text>
            </View>
          </View>
        </Card>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {profile ? (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Información Personal</Text>
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
                    <Text style={styles.infoValue}>
                      {profile.secondaryPhone}
                    </Text>
                  </View>
                )}
                {!!profile.dateOfBirth && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
                    <Text style={styles.infoValue}>{profile.dateOfBirth}</Text>
                  </View>
                )}
                {!!profile.address && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Dirección</Text>
                    <Text style={styles.infoValue}>
                      {[
                        profile.address.country,
                        profile.address.state,
                        profile.address.city,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
              {profile.contacts.length > 0 ? (
                profile.contacts.map((contact, index) => (
                  <View key={index} style={styles.contactItem}>
                    <View style={styles.contactLeft}>
                      <View style={styles.contactAvatar}>
                        <Text style={styles.contactAvatarText}>
                          {contact.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactRelation}>
                          {contact.relationship}
                        </Text>
                        <Text style={styles.contactPhone}>{contact.phone}</Text>
                      </View>
                    </View>
                    {contact.whatsapp && (
                      <TouchableOpacity
                        style={styles.whatsappBadge}
                        onPress={() => openWhatsApp(contact.phone)}
                      >
                        <Icon
                          name="logo-whatsapp"
                          size={12}
                          color={theme.colors.white}
                        />
                        <Text style={styles.whatsappText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No hay contactos de emergencia registrados
                </Text>
              )}
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Información Médica</Text>
              <View style={styles.infoGrid}>
                {profile.bloodType ? (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Tipo de sangre</Text>
                    <View style={styles.bloodTypeBadge}>
                      <Text style={styles.bloodTypeText}>
                        {profile.bloodType}
                      </Text>
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
                  {parseHtmlList(profile.allergies).length ? (
                    <View>
                      {parseHtmlList(profile.allergies).map((t, i) => (
                        <Text key={i} style={styles.infoValue}>
                          • {t}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.infoValueEmpty}>
                      Ninguna registrada
                    </Text>
                  )}
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Medicamentos</Text>
                  {parseHtmlList(profile.medications).length ? (
                    <View>
                      {parseHtmlList(profile.medications).map((t, i) => (
                        <Text key={i} style={styles.infoValue}>
                          • {t}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.infoValueEmpty}>
                      Ninguno registrado
                    </Text>
                  )}
                </View>
                {!!profile.medicalNotes && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Notas médicas</Text>
                    <Text style={styles.infoValue}>
                      {stripHtml(profile.medicalNotes)}
                    </Text>
                  </View>
                )}
                {!!profile.preferredCare && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Atención preferida</Text>
                    <View style={styles.wrapinfoValue}>
                      {profile.preferredCare.clinicName && (
                        <Text style={styles.infoValue}>
                          Clínica: {profile.preferredCare.clinicName}
                        </Text>
                      )}

                      {profile.preferredCare.doctorName && (
                        <Text style={styles.infoValue}>
                          Doctor(a): {profile.preferredCare.doctorName}
                        </Text>
                      )}

                      {profile.preferredCare.city && (
                        <Text style={styles.infoValue}>
                          Ciudad: {profile.preferredCare.city}
                        </Text>
                      )}

                      {profile.preferredCare.doctorPhone && (
                        <Text style={styles.infoValue}>
                          Teléfono: {profile.preferredCare.doctorPhone}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                {!!profile.insurances?.length && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Seguros de salud</Text>
                    {profile.insurances.map((ins, idx) => (
                      <View style={styles.wrapinfoValue} key={idx}>
                        <Text style={styles.infoValue}>
                          Proveedor: {ins.provider || '—'}
                        </Text>

                        {ins.planName ? (
                          <Text style={styles.infoValue}>
                            Plan: {ins.planName}
                          </Text>
                        ) : null}

                        {ins.policyNumber ? (
                          <Text style={styles.infoValue}>
                            Póliza: {ins.policyNumber}
                          </Text>
                        ) : null}

                        <Text style={styles.infoValue}>
                          Tipo: {ins.isPrimary ? 'Primario' : 'Secundario'}
                        </Text>

                        {ins.notes ? (
                          <Text style={styles.infoValue}>
                            Notas: {ins.notes}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
                {!!profile.aeroAmbulance && (
                  <View style={styles.wrapinfoValue}>
                    <Text style={styles.infoLabel}>Aeroambulancia</Text>
                    <Text style={styles.infoValue}>
                      Proveedor: {profile.aeroAmbulance.provider || '—'}
                    </Text>

                    <Text style={styles.infoValue}>
                      Estado:{' '}
                      {profile.aeroAmbulance.enrolled
                        ? 'Miembro'
                        : 'No inscrito'}
                    </Text>

                    {profile.aeroAmbulance.memberId ? (
                      <Text style={styles.infoValue}>
                        ID de miembro: {profile.aeroAmbulance.memberId}
                      </Text>
                    ) : null}

                    {profile.aeroAmbulance.phone ? (
                      <Text style={styles.infoValue}>
                        Teléfono: {profile.aeroAmbulance.phone}
                      </Text>
                    ) : null}

                    {!!profile.aeroAmbulance.notes && (
                      <Text style={styles.infoValue}>
                        Notas: {profile.aeroAmbulance.notes}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </Card>

            <Card
              style={[styles.sectionCard, styles.moreMarginBottom]}
            >
              <Text style={styles.sectionTitle}>Vehículo</Text>
              {profile.bike ? (
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Marca / Modelo</Text>
                    <Text style={styles.infoValue}>
                      {[
                        profile.bike.brand,
                        profile.bike.model,
                        profile.bike.color,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </View>
                  {!!profile.bike.plate && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Placa</Text>
                      <Text style={styles.infoValue}>{profile.bike.plate}</Text>
                    </View>
                  )}
                  {!!profile.bike.insurance && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Seguro</Text>
                      <Text style={styles.infoValue}>
                        {[
                          profile.bike.insurance.company,
                          profile.bike.insurance.policy,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                      {!!profile.bike.insurance.expiry && (
                        <Text style={styles.infoValue}>
                          Vence: {profile.bike.insurance.expiry}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.emptyText}>
                  Sin información de vehículo
                </Text>
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
  hero: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  heroKicker: {
    color: theme.colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: theme.typography.body.fontSize,
    lineHeight: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
  },
  userCard: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  moreMarginBottom: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
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
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  wrapinfoValue: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.gray[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    color: theme.colors.white,
    fontWeight: '800',
  },
  contactInfo: {
    flex: 1,
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
    fontWeight: '700',
  },
  whatsappBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#1DA653',
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
