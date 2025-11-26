import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, BloodType, Gender, VehicleType, EmergencyRelationship } from '../types';
import { COLORS } from '../constants/theme';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormInput, FormPicker, FormDatePicker, FormToggle } from '../components/forms';
import { useProfileEdit } from '../hooks/useProfileEdit';
import { PickerOption } from '../components/forms/FormPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

const BLOOD_TYPES: PickerOption[] = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
];

const GENDERS: PickerOption[] = [
  { label: 'Masculino', value: 'male' },
  { label: 'Femenino', value: 'female' },
  { label: 'Otro', value: 'other' },
  { label: 'Prefiero no decir', value: 'prefer-not-to-say' },
];

const RELATIONSHIPS: PickerOption[] = [
  { label: 'Esposo/a', value: 'spouse' },
  { label: 'Padre/Madre', value: 'parent' },
  { label: 'Hermano/a', value: 'sibling' },
  { label: 'Amigo/a', value: 'friend' },
  { label: 'Otro', value: 'other' },
];

const VEHICLE_TYPES: PickerOption[] = [
  { label: 'Motocicleta', value: 'motorcycle' },
  { label: 'ATV', value: 'atv' },
  { label: 'Automóvil', value: 'car' },
  { label: 'Bicicleta', value: 'bicycle' },
  { label: 'Otro', value: 'other' },
];

export const ProfileEditScreen: React.FC<Props> = ({ navigation }) => {
  const { profile, loading, saving, hasChanges, updateProfile, saveProfile } = useProfileEdit();

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          title="Guardar"
          onPress={handleSave}
          disabled={!hasChanges || saving}
          size="small"
        />
      ),
    });
  }, [hasChanges, saving]);

  const handleSave = async () => {
    const success = await saveProfile();
    if (success) {
      navigation.goBack();
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        '¿Estás seguro de que quieres salir sin guardar los cambios?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Salir',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) {
        return;
      }

      e.preventDefault();
      handleGoBack();
    });

    return unsubscribe;
  }, [navigation, hasChanges]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
          <Button title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          <FormInput
            label="Nombre completo"
            value={profile.displayName || ''}
            onChangeText={(text) => updateProfile({ displayName: text })}
            required
            placeholder="Juan Pérez"
          />

          <FormInput
            label="Email"
            value={profile.email || ''}
            editable={false}
            placeholder="tu@email.com"
            helperText="El email no se puede cambiar"
          />

          <FormInput
            label="Teléfono"
            value={profile.phone || ''}
            onChangeText={(text) => updateProfile({ phone: text })}
            required
            placeholder="+1 809-555-0123"
            keyboardType="phone-pad"
          />

          <FormDatePicker
            label="Fecha de nacimiento"
            value={profile.birthDate ? new Date(profile.birthDate) : undefined}
            onChange={(date) =>
              updateProfile({ birthDate: date.toISOString().split('T')[0] })
            }
            maximumDate={new Date()}
          />

          <FormPicker
            label="Género"
            value={profile.gender}
            options={GENDERS}
            onValueChange={(value) => updateProfile({ gender: value as Gender })}
            placeholder="Seleccionar"
          />

          <FormInput
            label="Nacionalidad"
            value={profile.nationality || ''}
            onChangeText={(text) => updateProfile({ nationality: text })}
            placeholder="República Dominicana"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Médica</Text>
          <View style={styles.banner}>
            <Text style={styles.bannerIcon}>🚨</Text>
            <Text style={styles.bannerText}>
              Esta información está disponible en tu QR de emergencia
            </Text>
          </View>

          <FormPicker
            label="Tipo de sangre"
            value={profile.bloodType}
            options={BLOOD_TYPES}
            onValueChange={(value) =>
              updateProfile({ bloodType: value as BloodType })
            }
            placeholder="Seleccionar"
          />

          <FormInput
            label="Alergias"
            value={profile.allergies || ''}
            onChangeText={(text) => updateProfile({ allergies: text })}
            placeholder="Ej: Penicilina, maní, etc."
            multiline
            numberOfLines={3}
          />

          <FormInput
            label="Medicamentos actuales"
            value={profile.medications || ''}
            onChangeText={(text) => updateProfile({ medications: text })}
            placeholder="Medicamentos que tomas regularmente"
            multiline
            numberOfLines={3}
          />

          <FormInput
            label="Condiciones médicas"
            value={profile.medicalConditions || ''}
            onChangeText={(text) => updateProfile({ medicalConditions: text })}
            placeholder="Ej: Diabetes, asma, etc."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
          <View style={styles.banner}>
            <Text style={styles.bannerIcon}>📞</Text>
            <Text style={styles.bannerText}>
              Este contacto puede ser llamado en caso de emergencia
            </Text>
          </View>

          <FormInput
            label="Nombre del contacto"
            value={profile.emergencyContact?.name || ''}
            onChangeText={(text) =>
              updateProfile({
                emergencyContact: {
                  ...profile.emergencyContact,
                  name: text,
                  phone: profile.emergencyContact?.phone || '',
                  relationship: profile.emergencyContact?.relationship || 'other',
                },
              })
            }
            required
            placeholder="Nombre completo"
          />

          <FormInput
            label="Teléfono del contacto"
            value={profile.emergencyContact?.phone || ''}
            onChangeText={(text) =>
              updateProfile({
                emergencyContact: {
                  ...profile.emergencyContact,
                  name: profile.emergencyContact?.name || '',
                  phone: text,
                  relationship: profile.emergencyContact?.relationship || 'other',
                },
              })
            }
            required
            placeholder="+1 809-555-0123"
            keyboardType="phone-pad"
          />

          <FormPicker
            label="Relación"
            value={profile.emergencyContact?.relationship}
            options={RELATIONSHIPS}
            onValueChange={(value) =>
              updateProfile({
                emergencyContact: {
                  ...profile.emergencyContact,
                  name: profile.emergencyContact?.name || '',
                  phone: profile.emergencyContact?.phone || '',
                  relationship: value as EmergencyRelationship,
                },
              })
            }
            placeholder="Seleccionar"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Vehículo</Text>
          <Text style={styles.sectionDescription}>
            Esta información es opcional
          </Text>

          <FormToggle
            label="Tengo vehículo"
            value={!!profile.vehicleInfo}
            onValueChange={(value) => {
              if (!value) {
                updateProfile({ vehicleInfo: undefined });
              } else {
                updateProfile({
                  vehicleInfo: {
                    type: 'motorcycle',
                    brand: '',
                    model: '',
                    color: '',
                    plate: '',
                  },
                });
              }
            }}
          />

          {profile.vehicleInfo && (
            <>
              <FormPicker
                label="Tipo de vehículo"
                value={profile.vehicleInfo.type}
                options={VEHICLE_TYPES}
                onValueChange={(value) =>
                  updateProfile({
                    vehicleInfo: {
                      ...profile.vehicleInfo!,
                      type: value as VehicleType,
                    },
                  })
                }
                placeholder="Seleccionar"
              />

              <FormInput
                label="Marca"
                value={profile.vehicleInfo.brand}
                onChangeText={(text) =>
                  updateProfile({
                    vehicleInfo: {
                      ...profile.vehicleInfo!,
                      brand: text,
                    },
                  })
                }
                placeholder="Yamaha"
              />

              <FormInput
                label="Modelo"
                value={profile.vehicleInfo.model}
                onChangeText={(text) =>
                  updateProfile({
                    vehicleInfo: {
                      ...profile.vehicleInfo!,
                      model: text,
                    },
                  })
                }
                placeholder="WR450F"
              />

              {profile.vehicleInfo.year && (
                <FormInput
                  label="Año"
                  value={profile.vehicleInfo.year}
                  onChangeText={(text) =>
                    updateProfile({
                      vehicleInfo: {
                        ...profile.vehicleInfo!,
                        year: text,
                      },
                    })
                  }
                  placeholder="2023"
                  keyboardType="numeric"
                />
              )}

              <FormInput
                label="Color"
                value={profile.vehicleInfo.color}
                onChangeText={(text) =>
                  updateProfile({
                    vehicleInfo: {
                      ...profile.vehicleInfo!,
                      color: text,
                    },
                  })
                }
                placeholder="Azul"
              />

              <FormInput
                label="Placa"
                value={profile.vehicleInfo.plate}
                onChangeText={(text) =>
                  updateProfile({
                    vehicleInfo: {
                      ...profile.vehicleInfo!,
                      plate: text.toUpperCase(),
                    },
                  })
                }
                placeholder="A123456"
                autoCapitalize="characters"
              />
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacidad</Text>
          <Text style={styles.sectionDescription}>
            Tu QR de emergencia siempre mostrará info médica y contacto de
            emergencia
          </Text>

          <FormToggle
            label="Perfil público completo"
            value={profile.privacy?.showFullProfile ?? true}
            onValueChange={(value) =>
              updateProfile({
                privacy: {
                  ...profile.privacy,
                  showFullProfile: value,
                  showPhone: value,
                  showEmail: value,
                  showVehicleInfo: value,
                  showMedicalInfo: false,
                },
              })
            }
            description="Permite que otros participantes vean tu información"
          />

          {!profile.privacy?.showFullProfile && (
            <>
              <FormToggle
                label="Mostrar teléfono"
                value={profile.privacy?.showPhone ?? false}
                onValueChange={(value) =>
                  updateProfile({
                    privacy: {
                      ...profile.privacy,
                      showFullProfile: false,
                      showPhone: value,
                      showEmail: profile.privacy?.showEmail ?? false,
                      showVehicleInfo: profile.privacy?.showVehicleInfo ?? false,
                      showMedicalInfo: false,
                    },
                  })
                }
              />

              <FormToggle
                label="Mostrar email"
                value={profile.privacy?.showEmail ?? false}
                onValueChange={(value) =>
                  updateProfile({
                    privacy: {
                      ...profile.privacy,
                      showFullProfile: false,
                      showPhone: profile.privacy?.showPhone ?? false,
                      showEmail: value,
                      showVehicleInfo: profile.privacy?.showVehicleInfo ?? false,
                      showMedicalInfo: false,
                    },
                  })
                }
              />

              <FormToggle
                label="Mostrar información de vehículo"
                value={profile.privacy?.showVehicleInfo ?? false}
                onValueChange={(value) =>
                  updateProfile({
                    privacy: {
                      ...profile.privacy,
                      showFullProfile: false,
                      showPhone: profile.privacy?.showPhone ?? false,
                      showEmail: profile.privacy?.showEmail ?? false,
                      showVehicleInfo: value,
                      showMedicalInfo: false,
                    },
                  })
                }
              />
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={saving ? 'Guardando...' : 'Guardar Cambios'}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            loading={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: COLORS.background,
    backgroundColor: COLORS.surface,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: COLORS.surface,
  },
});
