import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { resetCompletedCheckpoints } from '../modules/geofence/GeofenceTaskManager';
import { useGeofence } from '../modules/geofence/useGeofence';
import { Event, EventRegistration, RootStackParamList } from '../types';

type EventDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EventDetail'
>;

const ACTIVE_EVENT_KEY = 'active_event_id';

export function EventDetailScreen({
  route,
  navigation,
}: EventDetailScreenProps) {
  const { eventId } = route.params;
  const { user, userData } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(
    null,
  );
  const [participants, setParticipants] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [isEventActive, setIsEventActive] = useState(false);

  const {
    status: geofenceStatus,
    initializeGeofencing,
    stopGeofencing,
    loading: geofenceLoading,
  } = useGeofence(eventId, user?.uid || '');

  useEffect(() => {
    loadEventData();
    checkActiveEvent();
  }, [eventId, user]);

  const checkActiveEvent = async () => {
    try {
      const activeEventId = await AsyncStorage.getItem(ACTIVE_EVENT_KEY);
      setIsEventActive(activeEventId === eventId);
    } catch (error) {
      console.error('Error checking active event:', error);
    }
  };

  const handleStartEvent = async () => {
    if (!user) return;

    Alert.alert(
      'Iniciar Evento',
      '¿Deseas iniciar el seguimiento de checkpoints? Tu ubicación será monitoreada durante el evento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              await resetCompletedCheckpoints(eventId);
              await initializeGeofencing();
              await AsyncStorage.setItem(ACTIVE_EVENT_KEY, eventId);
              setIsEventActive(true);
            } catch (error) {
              console.error('Error starting event:', error);
              Alert.alert('Error', 'No se pudo iniciar el evento');
            }
          },
        },
      ],
    );
  };

  const handleStopEvent = async () => {
    Alert.alert(
      'Detener Evento',
      '¿Deseas detener el seguimiento de checkpoints?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Detener',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopGeofencing();
              await AsyncStorage.removeItem(ACTIVE_EVENT_KEY);
              setIsEventActive(false);
            } catch (error) {
              console.error('Error stopping event:', error);
              Alert.alert('Error', 'No se pudo detener el evento');
            }
          },
        },
      ],
    );
  };

  const loadEventData = async () => {
    if (!user) return;

    try {
      const eventDoc = await firestore()
        .collection('events')
        .doc(eventId)
        .get();

      if (!eventDoc.exists()) {
        Alert.alert('Error', 'Evento no encontrado');
        navigation.goBack();
        return;
      }

      const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;
      setEvent(eventData);

      const registrationSnap = await firestore()
        .collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .where('uid', '==', user.uid)
        .get();

      if (!registrationSnap.empty) {
        setRegistration(registrationSnap.docs[0].data() as EventRegistration);
      }

      const participantsSnap = await firestore()
        .collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .get();

      setParticipants(
        participantsSnap.docs.map(doc => doc.data() as EventRegistration),
      );
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del evento');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEventData();
  };

  const handleJoinWithCode = async () => {
    if (!event || !user || !inviteCode) {
      Alert.alert('Error', 'Ingresa el código de invitación');
      return;
    }

    if (inviteCode.toUpperCase() !== event.inviteCode) {
      Alert.alert('Código incorrecto', 'El código de invitación no es válido');
      return;
    }

    await handleJoinEvent();
    setShowInviteInput(false);
    setInviteCode('');
  };

  const handleJoinEvent = async () => {
    if (!event || !user || !userData) return;

    try {
      if (event.capacity) {
        const goingCount = participants.filter(
          p => p.status === 'going',
        ).length;
        if (goingCount >= event.capacity) {
          Alert.alert(
            'Evento lleno',
            'Este evento ha alcanzado su capacidad máxima',
          );
          return;
        }
      }

      const registrationData = {
        eventId,
        uid: user.uid,
        status: 'maybe' as const,
        consentEmergencyShare: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore().collection('eventRegistrations').add(registrationData);
      await loadEventData();
      Alert.alert('¡Te has unido!', 'Ahora puedes confirmar tu asistencia');
    } catch (error) {
      console.error('Error joining event:', error);
      Alert.alert('Error', 'No se pudo unir al evento');
    }
  };

  const handleUpdateStatus = async (status: 'going' | 'maybe' | 'notgoing') => {
    if (!registration || !user) return;

    try {
      const registrationSnap = await firestore()
        .collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .where('uid', '==', user.uid)
        .get();

      if (!registrationSnap.empty) {
        await registrationSnap.docs[0].ref.update({
          status,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        setRegistration({ ...registration, status });
        await loadEventData();
        Alert.alert(
          'Estado actualizado',
          `Tu estado ha sido cambiado a: ${getStatusText(status)}`,
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTimestamp = (timestamp: { _seconds: number; _nanoseconds: number }): string => {
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir el enlace');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el enlace');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return theme.colors.success;
      case 'med':
        return theme.colors.warning;
      case 'hard':
        return theme.colors.error;
      default:
        return theme.colors.gray[500];
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'med':
        return 'Medio';
      case 'hard':
        return 'Difícil';
      default:
        return 'No especificado';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'going':
        return theme.colors.success;
      case 'maybe':
        return theme.colors.warning;
      case 'notgoing':
        return theme.colors.error;
      default:
        return theme.colors.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'going':
        return 'Voy';
      case 'maybe':
        return 'Tal vez';
      case 'notgoing':
        return 'No voy';
      default:
        return 'Sin confirmar';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando evento..." />;
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>Evento no encontrado</Text>
          <Button
            title="Volver"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = event.createdBy === user?.uid;
  const isEventPast = new Date(event.date) < new Date();
  const goingCount = participants.filter(p => p.status === 'going').length;
  const maybeCount = participants.filter(p => p.status === 'maybe').length;
  const totalCount = goingCount + maybeCount;

  console.log('EventDetailScreen - Debug:', {
    isAdmin,
    hasRegistration: !!registration,
    userId: user?.uid,
    eventCreatedBy: event.createdBy,
    shouldShowButtons: registration || isAdmin,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Evento</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.eventCard}>
          <Text style={styles.sectionTitle}>Detalles del evento</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Icon
                name="calendar"
                size={20}
                color={theme.colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fecha</Text>
                <Text style={styles.detailValue}>{formatDate(event.date)}</Text>
                {event.startTime && (
                  <Text style={styles.detailSubValue}>
                    Hora: {event.startTime}
                  </Text>
                )}
              </View>
            </View>

            {event.meetingPoint?.text && (
              <View style={styles.detailItem}>
                <Icon
                  name="location"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Punto de encuentro</Text>
                  <Text style={styles.detailValue}>
                    {event.meetingPoint.text}
                  </Text>
                  {event.meetingPoint.mapUrl && (
                    <TouchableOpacity
                      onPress={() => openLink(event.meetingPoint!.mapUrl!)}
                      style={styles.linkButton}
                    >
                      <Icon name="map" size={16} color={theme.colors.primary} />
                      <Text style={styles.linkText}>Ver en mapa</Text>
                    </TouchableOpacity>
                  )}
                  {event.meetingPoint.routeUrl && (
                    <TouchableOpacity
                      onPress={() => openLink(event.meetingPoint!.routeUrl!)}
                      style={styles.linkButton}
                    >
                      <Icon name="navigate" size={16} color={theme.colors.primary} />
                      <Text style={styles.linkText}>Ver ruta</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {event.capacity && (
              <View style={styles.detailItem}>
                <Icon
                  name="people"
                  size={20}
                  color={theme.colors.textSecondary}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Capacidad</Text>
                  <Text style={styles.detailValue}>
                    Máximo {event.capacity} participantes
                  </Text>
                </View>
              </View>
            )}

            {event.difficulty && (
              <View style={styles.detailItem}>
                <Icon
                  name="alert-circle"
                  size={20}
                  color={getDifficultyColor(event.difficulty)}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Dificultad</Text>
                  <Text style={styles.detailValue}>
                    {getDifficultyText(event.difficulty)}
                  </Text>
                </View>
              </View>
            )}

            {event.window && (
              <View style={styles.detailItem}>
                <Icon
                  name="time"
                  size={20}
                  color={theme.colors.info}
                />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ventana del evento</Text>
                  <Text style={styles.detailValue}>
                    Inicia: {formatTimestamp(event.window.start)}
                  </Text>
                  <Text style={styles.detailSubValue}>
                    Termina: {formatTimestamp(event.window.end)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailItem}>
              <Icon
                name={event.joinMode === 'public' ? 'globe' : 'lock-closed'}
                size={20}
                color={theme.colors.textSecondary}
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Modo de acceso</Text>
                <Text style={styles.detailValue}>
                  {event.joinMode === 'public' ? 'Público' : 'Privado (con código)'}
                </Text>
              </View>
            </View>
          </View>

          {event.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notas adicionales</Text>
              <Text style={styles.eventNotes}>{event.notes}</Text>
            </View>
          )}
        </Card>

        {/* <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Participantes</Text>
          <Text style={styles.summaryText}>
            Ve quién más va al evento y accede a sus perfiles públicos.
          </Text>
          <View style={styles.participantsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{goingCount}</Text>
              <Text style={styles.statLabel}>Confirmados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{maybeCount}</Text>
              <Text style={styles.statLabel}>Tal vez</Text>
            </View>
            {event.capacity && (
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{event.capacity}</Text>
                <Text style={styles.statLabel}>Capacidad</Text>
              </View>
            )}
          </View>
          {(registration || isAdmin) && (
            <>
              <Button
                title="Ver lista de participantes"
                onPress={() =>
                  navigation.navigate('Participants', { eventId: event.id })
                }
                style={styles.viewParticipantsBtn}
              />
            </>
          )}
        </Card> */}

        {isAdmin && event.inviteCode && (
          <Card style={styles.adminCard}>
            <View style={styles.adminHeader}>
              <Icon name="person" size={20} color={theme.colors.primary} />
              <Text style={styles.adminTitle}>Código de invitación</Text>
            </View>
            <Text style={styles.inviteCodeText}>{event.inviteCode}</Text>
            <Text style={styles.adminMessage}>
              Comparte este código con los participantes
            </Text>
          </Card>
        )}

        {(registration || isAdmin) && (
          <Card
            style={
              isEventActive
                ? { ...styles.eventControlCard, ...styles.eventActiveCard }
                : styles.eventControlCard
            }
          >
            <View style={styles.eventControlHeader}>
              <Icon
                name={isEventActive ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={
                  isEventActive
                    ? theme.colors.success
                    : theme.colors.textSecondary
                }
              />
              <Text style={styles.eventControlTitle}>
                {isEventActive ? 'Evento Activo' : 'Control de Evento'}
              </Text>
            </View>

            {isEventActive && (
              <View style={styles.activeStatusBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.activeStatusText}>
                  Rastreando checkpoints
                </Text>
              </View>
            )}

            <Text style={styles.eventControlMessage}>
              {isEventActive
                ? 'El seguimiento de tu ubicación está activo. Los checkpoints se registrarán automáticamente.'
                : 'Inicia el evento para comenzar el seguimiento de checkpoints.'}
            </Text>

            <Button
              title={isEventActive ? 'Detener Evento' : 'Iniciar Evento'}
              onPress={isEventActive ? handleStopEvent : handleStartEvent}
              loading={geofenceLoading}
              style={{
                ...styles.eventControlButton,
                ...(isEventActive
                  ? styles.stopEventButton
                  : styles.startEventButton),
              }}
            />

            {isEventActive && (
              <Button
                title="Ver progreso de checkpoints"
                onPress={() =>
                  navigation.navigate('Checkpoints', {
                    eventId: event.id,
                    userId: user?.uid || '',
                  })
                }
                style={styles.viewCheckpointsBtn}
              />
            )}

            {geofenceStatus.isActive && (
              <View style={styles.geofenceStats}>
                <Text style={styles.geofenceStatsText}>
                  📍 {geofenceStatus.checkpointsCount} checkpoints activos
                </Text>
                <Text style={styles.geofenceStatsText}>
                  {geofenceStatus.isOnline ? '🟢 En línea' : '🔴 Sin conexión'}
                </Text>
                {geofenceStatus.pendingEvents > 0 && (
                  <Text style={styles.geofenceStatsText}>
                    ⏳ {geofenceStatus.pendingEvents} eventos pendientes de
                    sincronizar
                  </Text>
                )}
              </View>
            )}
          </Card>
        )}

        {!registration && !isAdmin ? (
          <Card style={styles.joinCard}>
            {event.joinMode === 'code' && !showInviteInput ? (
              <View>
                <Text style={styles.joinTitle}>Evento Privado</Text>
                <Text style={styles.joinMessage}>
                  Este evento requiere un código de invitación para unirse.
                </Text>
                <Button
                  title="Ingresar código"
                  onPress={() => setShowInviteInput(true)}
                  style={styles.joinButton}
                />
              </View>
            ) : event.joinMode === 'code' && showInviteInput ? (
              <View>
                <Text style={styles.joinTitle}>Código de Invitación</Text>
                <TextInput
                  style={styles.codeInput}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Ingresa el código"
                  autoCapitalize="characters"
                />
                <View style={styles.codeButtons}>
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setShowInviteInput(false);
                      setInviteCode('');
                    }}
                    variant="outline"
                    style={styles.codeButton}
                  />
                  <Button
                    title="Unirse"
                    onPress={handleJoinWithCode}
                    style={styles.codeButton}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.joinTitle}>Unirse al Evento</Text>
                <Text style={styles.joinMessage}>
                  ¿Te gustaría participar en este evento?
                </Text>
                <Button
                  title="Unirse al evento"
                  onPress={handleJoinEvent}
                  style={styles.joinButton}
                />
              </View>
            )}
          </Card>
        ) : registration && !isAdmin ? (
          <Card style={styles.statusCard}>
            <Text style={styles.statusTitle}>Tu Estado</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  registration.status === 'going' && styles.statusButtonActive,
                  { borderColor: theme.colors.success },
                ]}
                onPress={() => handleUpdateStatus('going')}
              >
                <Icon
                  name="checkmark-circle"
                  size={20}
                  color={
                    registration.status === 'going'
                      ? theme.colors.white
                      : theme.colors.success
                  }
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    registration.status === 'going' &&
                      styles.statusButtonTextActive,
                  ]}
                >
                  Voy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  registration.status === 'maybe' && styles.statusButtonActive,
                  { borderColor: theme.colors.warning },
                ]}
                onPress={() => handleUpdateStatus('maybe')}
              >
                <Icon
                  name="help-circle"
                  size={20}
                  color={
                    registration.status === 'maybe'
                      ? theme.colors.white
                      : theme.colors.warning
                  }
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    registration.status === 'maybe' &&
                      styles.statusButtonTextActive,
                  ]}
                >
                  Tal vez
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusButton,
                  registration.status === 'notgoing' &&
                    styles.statusButtonActive,
                  { borderColor: theme.colors.error },
                ]}
                onPress={() => handleUpdateStatus('notgoing')}
              >
                <Icon
                  name="close-circle"
                  size={20}
                  color={
                    registration.status === 'notgoing'
                      ? theme.colors.white
                      : theme.colors.error
                  }
                />
                <Text
                  style={[
                    styles.statusButtonText,
                    registration.status === 'notgoing' &&
                      styles.statusButtonTextActive,
                  ]}
                >
                  No voy
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  eventCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailsGrid: {
    gap: theme.spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '500',
  },
  detailSubValue: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  notesSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  eventNotes: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    lineHeight: 22,
  },
  summaryCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  summaryText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  participantsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  viewParticipantsBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: '#D32F2F',
    marginBottom: theme.spacing.sm,
  },
  viewCheckpointsBtn: {
    marginTop: 0,
    backgroundColor: theme.colors.success,
  },
  adminCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  adminTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  adminMessage: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
  },
  joinCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
    marginBottom: theme.spacing.lg,
  },
  joinTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  joinMessage: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  joinButton: {
    marginBottom: 0,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  codeButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  codeButton: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#E8F5E8',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  statusTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    backgroundColor: theme.colors.white,
  },
  statusButtonActive: {
    backgroundColor: theme.colors.success,
  },
  statusButtonText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusButtonTextActive: {
    color: theme.colors.white,
  },
  eventControlCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.gray[400],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  eventActiveCard: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: theme.colors.success,
  },
  eventControlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  eventControlTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
    marginRight: theme.spacing.xs,
  },
  activeStatusText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.white,
  },
  eventControlMessage: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  eventControlButton: {
    marginBottom: theme.spacing.md,
  },
  startEventButton: {
    backgroundColor: theme.colors.success,
  },
  stopEventButton: {
    backgroundColor: theme.colors.error,
  },
  geofenceStats: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    gap: theme.spacing.xs,
  },
  geofenceStatsText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  linkText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
});
