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
import { FormInput, FormPicker, FormDatePicker, FormToggle } from '../components/forms';
import { StepIndicator } from '../components/profile/StepIndicator';
import { useProfileSetup } from '../hooks/useProfileSetup';
import { PickerOption } from '../components/forms/FormPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

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

export const ProfileSetupScreen: React.FC<Props> = ({ navigation }) => {
  const {
    currentStep,
    formData,
    loading,
    updateFormData,
    nextStep,
    prevStep,
    createProfile,
  } = useProfileSetup();

  const handleFinish = async () => {
    const success = await createProfile();
    if (success) {
      setTimeout(() => {
        navigation.replace('Main');
      }, 1500);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onContinue={nextStep} />;
      case 1:
        return (
          <PersonalInfoStep
            formData={formData}
            updateFormData={updateFormData}
            onBack={prevStep}
            onContinue={nextStep}
          />
        );
      case 2:
        return (
          <MedicalInfoStep
            formData={formData}
            updateFormData={updateFormData}
            onBack={prevStep}
            onContinue={nextStep}
          />
        );
      case 3:
        return (
          <VehicleInfoStep
            formData={formData}
            updateFormData={updateFormData}
            onBack={prevStep}
            onFinish={handleFinish}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentStep > 0 && (
        <StepIndicator currentStep={currentStep - 1} totalSteps={3} />
      )}
      {renderStep()}
    </SafeAreaView>
  );
};

const WelcomeStep: React.FC<{ onContinue: () => void }> = ({ onContinue }) => {
  return (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.welcomeContent}>
        <Text style={styles.welcomeIcon}>👋</Text>
        <Text style={styles.welcomeTitle}>¡Bienvenido a QRider!</Text>
        <Text style={styles.welcomeSubtitle}>Tu perfil es para toda la vida</Text>
        <Text style={styles.welcomeText}>
          Vamos a crear tu perfil permanente. Solo lo llenas una vez y lo
          usarás para registrarte en todos los eventos de manera instantánea.
        </Text>
        <Text style={styles.welcomeText}>
          Tu información estará segura y podrás configurar tu privacidad en
          cualquier momento.
        </Text>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button title="Comenzar" onPress={onContinue} />
      </View>
    </View>
  );
};

const PersonalInfoStep: React.FC<{
  formData: any;
  updateFormData: (data: any) => void;
  onBack: () => void;
  onContinue: () => void;
}> = ({ formData, updateFormData, onBack, onContinue }) => {
  return (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepTitle}>Cuéntanos sobre ti</Text>
        <Text style={styles.stepSubtitle}>
          * Campos obligatorios
        </Text>

        <FormInput
          label="Nombre completo"
          value={formData.displayName}
          onChangeText={(text) => updateFormData({ displayName: text })}
          required
          placeholder="Juan Pérez"
        />

        <FormInput
          label="Teléfono"
          value={formData.phone}
          onChangeText={(text) => updateFormData({ phone: text })}
          required
          placeholder="+1 809-555-0123"
          keyboardType="phone-pad"
        />

        <FormDatePicker
          label="Fecha de nacimiento"
          value={formData.birthDate}
          onChange={(date) => updateFormData({ birthDate: date })}
          required
          maximumDate={new Date()}
        />

        <FormPicker
          label="Género"
          value={formData.gender}
          options={GENDERS}
          onValueChange={(value) => updateFormData({ gender: value as Gender })}
          placeholder="Seleccionar"
        />

        <FormInput
          label="Nacionalidad"
          value={formData.nationality || ''}
          onChangeText={(text) => updateFormData({ nationality: text })}
          placeholder="República Dominicana"
        />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <Button
            title="Atrás"
            onPress={onBack}
            variant="outline"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Continuar"
            onPress={onContinue}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>
    </View>
  );
};

const MedicalInfoStep: React.FC<{
  formData: any;
  updateFormData: (data: any) => void;
  onBack: () => void;
  onContinue: () => void;
}> = ({ formData, updateFormData, onBack, onContinue }) => {
  return (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepTitle}>Información de seguridad</Text>
        <Text style={styles.stepSubtitle}>
          Esta información puede salvar tu vida
        </Text>

        <View style={styles.banner}>
          <Text style={styles.bannerIcon}>🚨</Text>
          <Text style={styles.bannerText}>
            En caso de emergencia, esta información estará disponible en tu
            código QR. Personal médico podrá acceder a ella sin necesidad de
            desbloquear tu teléfono.
          </Text>
        </View>

        <FormPicker
          label="Tipo de sangre"
          value={formData.bloodType}
          options={BLOOD_TYPES}
          onValueChange={(value) =>
            updateFormData({ bloodType: value as BloodType })
          }
          required
          placeholder="Seleccionar"
        />

        <FormInput
          label="Alergias"
          value={formData.allergies || ''}
          onChangeText={(text) => updateFormData({ allergies: text })}
          placeholder="Ej: Penicilina, maní, etc."
          multiline
          numberOfLines={3}
        />

        <FormInput
          label="Medicamentos actuales"
          value={formData.medications || ''}
          onChangeText={(text) => updateFormData({ medications: text })}
          placeholder="Medicamentos que tomas regularmente"
          multiline
          numberOfLines={3}
        />

        <FormInput
          label="Condiciones médicas"
          value={formData.medicalConditions || ''}
          onChangeText={(text) => updateFormData({ medicalConditions: text })}
          placeholder="Ej: Diabetes, asma, etc."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.sectionTitle}>Contacto de Emergencia *</Text>

        <FormInput
          label="Nombre"
          value={formData.emergencyContactName}
          onChangeText={(text) =>
            updateFormData({ emergencyContactName: text })
          }
          required
          placeholder="Nombre del contacto"
        />

        <FormInput
          label="Teléfono"
          value={formData.emergencyContactPhone}
          onChangeText={(text) =>
            updateFormData({ emergencyContactPhone: text })
          }
          required
          placeholder="+1 809-555-0123"
          keyboardType="phone-pad"
        />

        <FormPicker
          label="Relación"
          value={formData.emergencyContactRelationship}
          options={RELATIONSHIPS}
          onValueChange={(value) =>
            updateFormData({
              emergencyContactRelationship: value as EmergencyRelationship,
            })
          }
          required
          placeholder="Seleccionar"
        />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <Button
            title="Atrás"
            onPress={onBack}
            variant="outline"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Continuar"
            onPress={onContinue}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
      </View>
    </View>
  );
};

const VehicleInfoStep: React.FC<{
  formData: any;
  updateFormData: (data: any) => void;
  onBack: () => void;
  onFinish: () => void;
  loading: boolean;
}> = ({ formData, updateFormData, onBack, onFinish, loading }) => {
  return (
    <View style={styles.stepContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.stepTitle}>¿Participas con vehículo?</Text>
        <Text style={styles.stepSubtitle}>
          Puedes agregar esta información ahora o después
        </Text>

        <FormToggle
          label="Agregar vehículo"
          value={formData.hasVehicle}
          onValueChange={(value) => updateFormData({ hasVehicle: value })}
        />

        {formData.hasVehicle && (
          <>
            <FormPicker
              label="Tipo"
              value={formData.vehicleType}
              options={VEHICLE_TYPES}
              onValueChange={(value) =>
                updateFormData({ vehicleType: value as VehicleType })
              }
              required
              placeholder="Seleccionar"
            />

            <FormInput
              label="Marca"
              value={formData.vehicleBrand || ''}
              onChangeText={(text) => updateFormData({ vehicleBrand: text })}
              required={formData.hasVehicle}
              placeholder="Yamaha"
            />

            <FormInput
              label="Modelo"
              value={formData.vehicleModel || ''}
              onChangeText={(text) => updateFormData({ vehicleModel: text })}
              required={formData.hasVehicle}
              placeholder="WR450F"
            />

            <FormInput
              label="Año"
              value={formData.vehicleYear || ''}
              onChangeText={(text) => updateFormData({ vehicleYear: text })}
              placeholder="2023"
              keyboardType="numeric"
            />

            <FormInput
              label="Color"
              value={formData.vehicleColor || ''}
              onChangeText={(text) => updateFormData({ vehicleColor: text })}
              required={formData.hasVehicle}
              placeholder="Azul"
            />

            <FormInput
              label="Placa"
              value={formData.vehiclePlate || ''}
              onChangeText={(text) =>
                updateFormData({ vehiclePlate: text.toUpperCase() })
              }
              required={formData.hasVehicle}
              placeholder="A123456"
              autoCapitalize="characters"
            />
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <Button
            title="Atrás"
            onPress={onBack}
            variant="outline"
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title={loading ? 'Creando...' : 'Crear mi Perfil'}
            onPress={onFinish}
            style={{ flex: 1, marginLeft: 8 }}
            disabled={loading}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stepContainer: {
    flex: 1,
  },
  welcomeContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  scrollContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 16,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: COLORS.errorLight,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  buttonRow: {
    flexDirection: 'row',
  },
});
