import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RouteDoc } from '../types';
import { COLORS } from '../constants/theme';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FormInput, FormPicker } from '../components/forms';
import { useEventRegistration } from '../hooks/useEventRegistration';
import { PickerOption } from '../components/forms/FormPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'EventRegistration'>;

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

export const EventRegistrationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const {
    event,
    routes,
    userProfile,
    existingRegistration,
    loading,
    submitting,
    formData,
    updateFormData,
    submitRegistration,
    isAlreadyRegistered,
  } = useEventRegistration(eventId);

  const [selectedRoute, setSelectedRoute] = useState<RouteDoc | null>(null);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <Button title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  if (isAlreadyRegistered) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Ya estás inscrito</Text>
          <Text style={styles.successText}>
            Ya tienes una inscripción activa para este evento
          </Text>
          <Button title="Volver al evento" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleRouteSelection = (route: RouteDoc) => {
    setSelectedRoute(route);
    updateFormData({ routeId: route.id });
  };

  const handleSubmit = async () => {
    const success = await submitRegistration();
    if (success) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inscripción</Text>
        <Text style={styles.headerSubtitle}>{event.title || event.name}</Text>
      </View>

      <ScrollView style={styles.content}>
        {routes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              1. Selecciona una Ruta *
            </Text>
            <Text style={styles.sectionDescription}>
              Elige la ruta en la que participarás
            </Text>
            {routes.map((routeItem) => {
              const isSelected = selectedRoute?.id === routeItem.id;
              const isFull =
                routeItem.maxParticipants &&
                routeItem.currentParticipants >= routeItem.maxParticipants;

              return (
                <TouchableOpacity
                  key={routeItem.id}
                  style={[
                    styles.routeCard,
                    isSelected && styles.routeCardSelected,
                    isFull && styles.routeCardDisabled,
                  ]}
                  onPress={() => !isFull && handleRouteSelection(routeItem)}
                  disabled={isFull}
                >
                  <View style={styles.routeHeader}>
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.routeInfo}>
                      <Text
                        style={[
                          styles.routeName,
                          isFull && styles.textDisabled,
                        ]}
                      >
                        {routeItem.name}
                      </Text>
                      {routeItem.description && (
                        <Text style={styles.routeDescription}>
                          {routeItem.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.routeDetails}>
                    {routeItem.distance && (
                      <Text style={styles.routeDetail}>
                        📏 {routeItem.distance} km
                      </Text>
                    )}
                    {routeItem.difficulty && (
                      <Text style={styles.routeDetail}>
                        ⚠️ {getDifficultyText(routeItem.difficulty)}
                      </Text>
                    )}
                    {routeItem.maxParticipants && (
                      <Text
                        style={[
                          styles.routeDetail,
                          isFull && styles.textError,
                        ]}
                      >
                        👥 {routeItem.currentParticipants}/
                        {routeItem.maxParticipants} cupos
                      </Text>
                    )}
                  </View>
                  {isFull && (
                    <Text style={styles.fullBadge}>Ruta llena</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Información Personal
          </Text>
          <Text style={styles.sectionDescription}>
            Verifica y actualiza tu información si es necesario
          </Text>

          <FormInput
            label="Nombre completo"
            value={formData.displayName}
            onChangeText={(text) => updateFormData({ displayName: text })}
            required
            placeholder="Tu nombre completo"
          />

          <FormInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => updateFormData({ email: text })}
            required
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormInput
            label="Teléfono"
            value={formData.phone}
            onChangeText={(text) => updateFormData({ phone: text })}
            required
            placeholder="+1 809-555-0123"
            keyboardType="phone-pad"
          />

          {event.registrationFields?.bloodType && (
            <FormPicker
              label="Tipo de sangre"
              value={formData.bloodType}
              options={BLOOD_TYPES}
              onValueChange={(value) => updateFormData({ bloodType: value })}
              placeholder="Seleccionar"
            />
          )}
        </View>

        {event.registrationFields?.emergencyContact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              3. Contacto de Emergencia
            </Text>
            <Text style={styles.sectionDescription}>
              Persona a contactar en caso de emergencia
            </Text>

            <FormInput
              label="Nombre del contacto"
              value={formData.emergencyContact?.name || ''}
              onChangeText={(text) =>
                updateFormData({
                  emergencyContact: {
                    ...formData.emergencyContact,
                    name: text,
                    phone: formData.emergencyContact?.phone || '',
                    relationship: formData.emergencyContact?.relationship || '',
                  },
                })
              }
              required
              placeholder="Nombre completo"
            />

            <FormInput
              label="Teléfono del contacto"
              value={formData.emergencyContact?.phone || ''}
              onChangeText={(text) =>
                updateFormData({
                  emergencyContact: {
                    ...formData.emergencyContact,
                    name: formData.emergencyContact?.name || '',
                    phone: text,
                    relationship: formData.emergencyContact?.relationship || '',
                  },
                })
              }
              required
              placeholder="+1 809-555-0123"
              keyboardType="phone-pad"
            />

            <FormPicker
              label="Relación"
              value={formData.emergencyContact?.relationship}
              options={RELATIONSHIPS}
              onValueChange={(value) =>
                updateFormData({
                  emergencyContact: {
                    ...formData.emergencyContact,
                    name: formData.emergencyContact?.name || '',
                    phone: formData.emergencyContact?.phone || '',
                    relationship: value,
                  },
                })
              }
              placeholder="Seleccionar"
            />
          </View>
        )}

        {event.registrationFields?.vehicleInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              4. Información de Vehículo
            </Text>
            <Text style={styles.sectionDescription}>
              Datos del vehículo con el que participarás
            </Text>

            <FormPicker
              label="Tipo de vehículo"
              value={formData.vehicleInfo?.type}
              options={VEHICLE_TYPES}
              onValueChange={(value) =>
                updateFormData({
                  vehicleInfo: {
                    ...formData.vehicleInfo,
                    type: value as any,
                    brand: formData.vehicleInfo?.brand || '',
                    model: formData.vehicleInfo?.model || '',
                    color: formData.vehicleInfo?.color || '',
                    plate: formData.vehicleInfo?.plate || '',
                  },
                })
              }
              placeholder="Seleccionar"
            />

            <FormInput
              label="Marca"
              value={formData.vehicleInfo?.brand || ''}
              onChangeText={(text) =>
                updateFormData({
                  vehicleInfo: {
                    ...formData.vehicleInfo,
                    brand: text,
                    type: formData.vehicleInfo?.type || 'motorcycle',
                    model: formData.vehicleInfo?.model || '',
                    color: formData.vehicleInfo?.color || '',
                    plate: formData.vehicleInfo?.plate || '',
                  },
                })
              }
              placeholder="Yamaha"
            />

            <FormInput
              label="Modelo"
              value={formData.vehicleInfo?.model || ''}
              onChangeText={(text) =>
                updateFormData({
                  vehicleInfo: {
                    ...formData.vehicleInfo,
                    model: text,
                    type: formData.vehicleInfo?.type || 'motorcycle',
                    brand: formData.vehicleInfo?.brand || '',
                    color: formData.vehicleInfo?.color || '',
                    plate: formData.vehicleInfo?.plate || '',
                  },
                })
              }
              placeholder="WR450F"
            />

            <FormInput
              label="Color"
              value={formData.vehicleInfo?.color || ''}
              onChangeText={(text) =>
                updateFormData({
                  vehicleInfo: {
                    ...formData.vehicleInfo,
                    color: text,
                    type: formData.vehicleInfo?.type || 'motorcycle',
                    brand: formData.vehicleInfo?.brand || '',
                    model: formData.vehicleInfo?.model || '',
                    plate: formData.vehicleInfo?.plate || '',
                  },
                })
              }
              placeholder="Azul"
            />

            <FormInput
              label="Placa"
              value={formData.vehicleInfo?.plate || ''}
              onChangeText={(text) =>
                updateFormData({
                  vehicleInfo: {
                    ...formData.vehicleInfo,
                    plate: text.toUpperCase(),
                    type: formData.vehicleInfo?.type || 'motorcycle',
                    brand: formData.vehicleInfo?.brand || '',
                    model: formData.vehicleInfo?.model || '',
                    color: formData.vehicleInfo?.color || '',
                  },
                })
              }
              placeholder="A123456"
              autoCapitalize="characters"
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={submitting ? 'Procesando...' : 'Confirmar Inscripción'}
            onPress={handleSubmit}
            disabled={submitting || (routes.length > 0 && !formData.routeId)}
            loading={submitting}
          />
          {routes.length > 0 && !formData.routeId && (
            <Text style={styles.warningText}>
              * Debes seleccionar una ruta para continuar
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'Fácil';
    case 'medium':
      return 'Medio';
    case 'hard':
      return 'Difícil';
    default:
      return 'No especificado';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    marginTop: 4,
  },
  content: {
    flex: 1,
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
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  routeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  routeCardDisabled: {
    opacity: 0.5,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  routeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  routeDetail: {
    fontSize: 14,
    color: COLORS.text,
  },
  textDisabled: {
    color: COLORS.textSecondary,
  },
  textError: {
    color: COLORS.error,
    fontWeight: '600',
  },
  fullBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.error,
    color: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: 8,
  },
});
