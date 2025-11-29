import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// import DateTimePicker, {
//   DateTimePickerAndroid,
//   DateTimePickerEvent,
// } from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import {
  AddressInfo,
  BikeInfo,
  EmergencyContact,
  InsuranceInfo,
  PreferredCareInfo,
  Profile,
  RootStackParamList,
} from '../types';

type ProfileEditScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

type PreferencesForm = {
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
};

type ProfileForm = {
  fullName: string;
  nickname?: string;
  bloodType?: Profile['bloodType'];
  allergies?: string;
  medications?: string;
  medicalNotes?: string;
  dateOfBirth?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  contacts: EmergencyContact[];
  address?: AddressInfo;
  bike?: BikeInfo;
  insurances?: InsuranceInfo[];
  aeroAmbulance?: Profile['aeroAmbulance'];
  preferredCare?: PreferredCareInfo;
  preferences?: PreferencesForm;
};

const BLOOD_TYPES: Profile['bloodType'][] = [
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
];

const emptyContact = (): EmergencyContact => ({
  id: `${Date.now()}`,
  name: '',
  relationship: '',
  phone: '',
  whatsapp: false,
});

const emptyInsurance = (): InsuranceInfo => ({
  provider: '',
  planName: '',
  policyNumber: '',
  isPrimary: false,
  notes: '',
});

export function ProfileEditScreen({ navigation }: ProfileEditScreenProps) {
  const { user, userData } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    fullName: userData?.displayName || '',
    primaryPhone: '',
    contacts: [],
    preferences: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 10);
    const formatted = [part1, part2, part3].filter(Boolean).join('-');
    return formatted;
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profileDoc = await firestore().collection('profiles').doc(user.uid).get();
      if (profileDoc.exists()) {
        const data = profileDoc.data() as Profile;
        setForm({
          fullName: data.fullName || '',
          nickname: data.nickname || '',
          bloodType: data.bloodType,
          allergies: data.allergies || '',
          medications: data.medications || '',
          medicalNotes: data.medicalNotes || '',
          dateOfBirth: data.dateOfBirth || '',
          primaryPhone: formatPhone(data.primaryPhone || ''),
          secondaryPhone: formatPhone(data.secondaryPhone || ''),
          contacts: (data.contacts || []).map(c => ({
            ...c,
            phone: formatPhone(c.phone || ''),
          })),
          address: data.address,
          bike: data.bike,
          insurances: data.insurances || [],
          aeroAmbulance: data.aeroAmbulance
            ? { ...data.aeroAmbulance, phone: formatPhone(data.aeroAmbulance.phone || '') }
            : undefined,
          preferredCare: data.preferredCare
            ? {
                ...data.preferredCare,
                doctorPhone: formatPhone(data.preferredCare.doctorPhone || ''),
              }
            : undefined,
          preferences: data.preferences || {},
        });
      } else {
        setForm(prev => ({
          ...prev,
          fullName: prev.fullName || user.displayName || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile for edit:', error);
      Alert.alert('Error', 'No se pudo cargar tu perfil.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updatePreference = (key: keyof PreferencesForm, value: boolean) => {
    setForm(prev => ({
      ...prev,
      preferences: { ...(prev.preferences || {}), [key]: value },
    }));
  };

  const updateContact = (id: string, field: keyof EmergencyContact, value: any) => {
    setForm(prev => ({
      ...prev,
      contacts: (prev.contacts || []).map(c => (c.id === id ? { ...c, [field]: value } : c)),
    }));
  };

  const removeContact = (id: string) => {
    setForm(prev => ({
      ...prev,
      contacts: (prev.contacts || []).filter(c => c.id !== id),
    }));
  };

  const updateInsurance = (idx: number, field: keyof InsuranceInfo, value: any) => {
    setForm(prev => {
      const list = [...(prev.insurances || [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...prev, insurances: list };
    });
  };

  const removeInsurance = (idx: number) => {
    setForm(prev => {
      const list = [...(prev.insurances || [])];
      list.splice(idx, 1);
      return { ...prev, insurances: list };
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const pruneUndefined = (value: any): any => {
        if (Array.isArray(value)) {
          return value
            .map(item => pruneUndefined(item))
            .filter(item => item !== undefined && item !== null);
        }
        if (value && typeof value === 'object') {
          const next: any = {};
          Object.keys(value).forEach(key => {
            const v = pruneUndefined(value[key]);
            if (v !== undefined) {
              next[key] = v;
            }
          });
          return next;
        }
        if (value === undefined) return undefined;
        return value;
      };

      const payload: Partial<Profile> = pruneUndefined({
        ...form,
        contacts: (form.contacts || []).filter(c => c.name || c.phone),
        insurances: (form.insurances || []).filter(
          i => i.provider || i.policyNumber || i.planName,
        ),
        updatedAt: firestore.FieldValue.serverTimestamp() as any,
        uid: user.uid,
      });
      await firestore().collection('profiles').doc(user.uid).set(payload, { merge: true });
      Alert.alert('Guardado', 'Perfil actualizado');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando perfil..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={22} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          <FormInput
            label="Nombre completo"
            value={form.fullName}
            onChangeText={text => updateField('fullName', text)}
          />
          <FormInput
            label="Apodo"
            value={form.nickname || ''}
            onChangeText={text => updateField('nickname', text)}
          />
          <FormInput
            label="Fecha de nacimiento"
            value={form.dateOfBirth || ''}
            onChangeText={text => updateField('dateOfBirth', text)}
          />
          {/* <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de nacimiento</Text>
            <Pressable onPress={openDatePicker}>
              <View style={styles.dateInput}>
                <Icon name="calendar-outline" size={18} color={theme.colors.gray[500]} />
                <Text style={styles.dateInputText}>
                  {form.dateOfBirth || 'Selecciona una fecha'}
                </Text>
              </View>
            </Pressable>
          </View> */}
          <FormInput
            label="Teléfono principal"
            value={form.primaryPhone}
            keyboardType="phone-pad"
            onChangeText={text => updateField('primaryPhone', formatPhone(text))}
          />
          <FormInput
            label="Teléfono secundario"
            value={form.secondaryPhone || ''}
            keyboardType="phone-pad"
            onChangeText={text => updateField('secondaryPhone', formatPhone(text))}
          />
          <FormInput
            label="País"
            value={form.address?.country || ''}
            onChangeText={text =>
              updateField('address', { ...(form.address || {}), country: text } as AddressInfo)
            }
          />
          <FormInput
            label="Provincia/Estado"
            value={form.address?.state || ''}
            onChangeText={text =>
              updateField('address', { ...(form.address || {}), state: text } as AddressInfo)
            }
          />
          <FormInput
            label="Ciudad"
            value={form.address?.city || ''}
            onChangeText={text =>
              updateField('address', { ...(form.address || {}), city: text } as AddressInfo)
            }
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Información médica</Text>
          <Text style={styles.label}>Tipo de sangre</Text>
          <View style={styles.chipRow}>
            {BLOOD_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  form.bloodType === type && styles.chipActive,
                ]}
                onPress={() => updateField('bloodType', type)}
              >
                <Text
                  style={[
                    styles.chipText,
                    form.bloodType === type && styles.chipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FormInput
            label="Alergias"
            value={form.allergies || ''}
            onChangeText={text => updateField('allergies', text)}
            multiline
          />
          <FormInput
            label="Medicamentos"
            value={form.medications || ''}
            onChangeText={text => updateField('medications', text)}
            multiline
          />
          <FormInput
            label="Notas médicas"
            value={form.medicalNotes || ''}
            onChangeText={text => updateField('medicalNotes', text)}
            multiline
          />
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contactos de emergencia</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => updateField('contacts', [...(form.contacts || []), emptyContact()])}
            >
              <Text style={styles.addButtonText}>Agregar</Text>
              <Icon name="plus" size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          {(form.contacts || []).map(contact => (
            <View key={contact.id} style={styles.cardItem}>
              <FormInput
                label="Nombre"
                value={contact.name}
                onChangeText={text => updateContact(contact.id, 'name', text)}
              />
              <FormInput
                label="Relación"
                value={contact.relationship}
                onChangeText={text => updateContact(contact.id, 'relationship', text)}
              />
              <FormInput
                label="Teléfono"
                value={contact.phone}
                keyboardType="phone-pad"
                onChangeText={text =>
                  updateContact(contact.id, 'phone', formatPhone(text))
                }
              />
              <View style={styles.switchRow}>
                <Text style={styles.label}>WhatsApp</Text>
                <Switch
                  value={!!contact.whatsapp}
                  onValueChange={value => updateContact(contact.id, 'whatsapp', value)}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.gray[300] }}
                  thumbColor={contact.whatsapp ? theme.colors.white : undefined}
                />
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeContact(contact.id)}
              >
                <Text style={styles.removeButtonText}>Eliminar contacto</Text>
              </TouchableOpacity>
            </View>
          ))}
          {form.contacts?.length === 0 && (
            <Text style={styles.helperText}>Agrega contactos para emergencias.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Moto</Text>
          <FormInput
            label="Marca"
            value={form.bike?.brand || ''}
            onChangeText={text =>
              updateField('bike', { ...(form.bike || {}), brand: text } as BikeInfo)
            }
          />
          <FormInput
            label="Modelo"
            value={form.bike?.model || ''}
            onChangeText={text =>
              updateField('bike', { ...(form.bike || {}), model: text } as BikeInfo)
            }
          />
          <FormInput
            label="Color"
            value={form.bike?.color || ''}
            onChangeText={text =>
              updateField('bike', { ...(form.bike || {}), color: text } as BikeInfo)
            }
          />
          <FormInput
            label="Placa"
            value={form.bike?.plate || ''}
            onChangeText={text =>
              updateField('bike', { ...(form.bike || {}), plate: text } as BikeInfo)
            }
          />
          <FormInput
            label="Seguro (compañía)"
            value={form.bike?.insurance?.company || ''}
            onChangeText={text =>
              updateField('bike', {
                ...(form.bike || {}),
                insurance: { ...(form.bike?.insurance || {}), company: text },
              } as BikeInfo)
            }
          />
          <FormInput
            label="Seguro (póliza)"
            value={form.bike?.insurance?.policy || ''}
            onChangeText={text =>
              updateField('bike', {
                ...(form.bike || {}),
                insurance: { ...(form.bike?.insurance || {}), policy: text },
              } as BikeInfo)
            }
          />
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seguros</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                updateField('insurances', [...(form.insurances || []), emptyInsurance()])
              }
            >
              <Text style={styles.addButtonText}>Agregar</Text>
              <Icon name="plus" size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          {(form.insurances || []).map((insurance, idx) => (
            <View key={idx} style={styles.cardItem}>
              <FormInput
                label="Proveedor"
                value={insurance.provider || ''}
                onChangeText={text => updateInsurance(idx, 'provider', text)}
              />
              <FormInput
                label="Plan"
                value={insurance.planName || ''}
                onChangeText={text => updateInsurance(idx, 'planName', text)}
              />
              <FormInput
                label="Póliza"
                value={insurance.policyNumber || ''}
                onChangeText={text => updateInsurance(idx, 'policyNumber', text)}
              />
              <FormInput
                label="Notas"
                value={insurance.notes || ''}
                onChangeText={text => updateInsurance(idx, 'notes', text)}
                multiline
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeInsurance(idx)}
              >
                <Icon name="trash" size={16} color={theme.colors.error} />
                <Text style={styles.removeButtonText}>Eliminar seguro</Text>
              </TouchableOpacity>
            </View>
          ))}
          {form.insurances?.length === 0 && (
            <Text style={styles.helperText}>Añade información de tus seguros.</Text>
          )}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Aero Ambulancia</Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Inscrito</Text>
            <Switch
              value={!!form.aeroAmbulance?.enrolled}
              onValueChange={value =>
                updateField('aeroAmbulance', { ...(form.aeroAmbulance || {}), enrolled: value })
              }
              trackColor={{ true: theme.colors.primary, false: theme.colors.gray[300] }}
              thumbColor={form.aeroAmbulance?.enrolled ? theme.colors.white : undefined}
            />
          </View>
          <FormInput
            label="Proveedor"
            value={form.aeroAmbulance?.provider || ''}
            onChangeText={text =>
              updateField('aeroAmbulance', { ...(form.aeroAmbulance || {}), provider: text })
            }
          />
          <FormInput
            label="ID miembro"
            value={form.aeroAmbulance?.memberId || ''}
            onChangeText={text =>
              updateField('aeroAmbulance', { ...(form.aeroAmbulance || {}), memberId: text })
            }
          />
          <FormInput
            label="Teléfono"
            value={form.aeroAmbulance?.phone || ''}
            onChangeText={text =>
              updateField('aeroAmbulance', {
                ...(form.aeroAmbulance || {}),
                phone: formatPhone(text),
              })
            }
          />
          <FormInput
            label="Notas"
            value={form.aeroAmbulance?.notes || ''}
            onChangeText={text =>
              updateField('aeroAmbulance', { ...(form.aeroAmbulance || {}), notes: text })
            }
            multiline
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Atención preferida</Text>
          <FormInput
            label="Clínica"
            value={form.preferredCare?.clinicName || ''}
            onChangeText={text =>
              updateField('preferredCare', { ...(form.preferredCare || {}), clinicName: text })
            }
          />
          <FormInput
            label="Doctor"
            value={form.preferredCare?.doctorName || ''}
            onChangeText={text =>
              updateField('preferredCare', { ...(form.preferredCare || {}), doctorName: text })
            }
          />
          <FormInput
            label="Teléfono doctor"
            value={form.preferredCare?.doctorPhone || ''}
            onChangeText={text =>
              updateField('preferredCare', {
                ...(form.preferredCare || {}),
                doctorPhone: formatPhone(text),
              })
            }
          />
          <FormInput
            label="Ciudad"
            value={form.preferredCare?.city || ''}
            onChangeText={text =>
              updateField('preferredCare', { ...(form.preferredCare || {}), city: text })
            }
          />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          <PrivacyToggle
            label="Mostrar tipo de sangre"
            description="Permite que otros vean tu tipo de sangre."
            value={form.preferences?.showBloodTypePublic !== false}
            onValueChange={v => updatePreference('showBloodTypePublic', v)}
          />
          <PrivacyToggle
            label="Mostrar alergias"
            description="Comparte alergias en tu perfil público."
            value={form.preferences?.showAllergies !== false}
            onValueChange={v => updatePreference('showAllergies', v)}
          />
          <PrivacyToggle
            label="Mostrar medicamentos"
            description="Permite ver tus medicamentos actuales."
            value={form.preferences?.showMedications !== false}
            onValueChange={v => updatePreference('showMedications', v)}
          />
          <PrivacyToggle
            label="Mostrar notas médicas"
            description="Incluye notas médicas en el perfil."
            value={form.preferences?.showMedicalNotes !== false}
            onValueChange={v => updatePreference('showMedicalNotes', v)}
          />
          <PrivacyToggle
            label="Mostrar dirección"
            description="Habilita mostrar tu país/ciudad."
            value={form.preferences?.showAddress !== false}
            onValueChange={v => updatePreference('showAddress', v)}
          />
          <PrivacyToggle
            label="Mostrar fecha de nacimiento"
            description="Permite ver tu fecha de nacimiento."
            value={form.preferences?.showDOB !== false}
            onValueChange={v => updatePreference('showDOB', v)}
          />
          <PrivacyToggle
            label="Mostrar seguros"
            description="Comparte detalles de seguros médicos."
            value={form.preferences?.showInsurances !== false}
            onValueChange={v => updatePreference('showInsurances', v)}
          />
          <PrivacyToggle
            label="Mostrar aero ambulancia"
            description="Permite ver tu estado en aero ambulancia."
            value={form.preferences?.showAeroAmbulance !== false}
            onValueChange={v => updatePreference('showAeroAmbulance', v)}
          />
          <PrivacyToggle
            label="Mostrar moto"
            description="Comparte datos de tu motocicleta."
            value={form.preferences?.showBikeInfo !== false}
            onValueChange={v => updatePreference('showBikeInfo', v)}
          />
          <PrivacyToggle
            label="Mostrar atención preferida"
            description="Comparte clínica o doctor preferido."
            value={form.preferences?.showPreferredCare !== false}
            onValueChange={v => updatePreference('showPreferredCare', v)}
          />
        </Card>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveProfile}
          disabled={saving}
          activeOpacity={0.9}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>
        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

type FormInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
};

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray[400]}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

type PrivacyToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function PrivacyToggle({ label, description, value, onValueChange }: PrivacyToggleProps) {
  return (
    <View style={styles.privacyRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.privacyLabel}>{label}</Text>
        <Text style={styles.privacyDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.colors.primary, false: theme.colors.gray[300] }}
        thumbColor={value ? theme.colors.white : undefined}
      />
    </View>
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
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
  content: {
    flex: 1,
    padding: theme.spacing.lg,
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
  inputGroup: {
    marginBottom: theme.spacing.sm,
  },
  label: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.gray[50],
  },
  dateInputText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    backgroundColor: theme.colors.gray[50],
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.white,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 7,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.typography.small.fontSize,
  },
  cardItem: {
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.gray[50],
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  removeButtonText: {
    color: theme.colors.error,
    fontWeight: '700',
  },
  helperText: {
    color: theme.colors.textSecondary,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  privacyLabel: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  privacyDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    marginTop: 2,
  },
  saveButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontWeight: '800',
    fontSize: theme.typography.body.fontSize,
  },
});
