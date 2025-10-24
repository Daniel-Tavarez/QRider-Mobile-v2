import firestore from '@react-native-firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
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
import { Event, EventRegistration, Profile, RootStackParamList } from '../types';

type ParticipantsScreenProps = NativeStackScreenProps<RootStackParamList, 'Participants'>;

interface ParticipantWithProfile extends EventRegistration {
  profile?: Profile;
}

export function ParticipantsScreen({ route, navigation }: ParticipantsScreenProps) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      const eventDoc = await firestore()
        .collection('events')
        .doc(eventId)
        .get();
      
      if (eventDoc.exists) {
        setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event);
      }

      const participantsSnap = await firestore()
        .collection('eventRegistrations')
        .where('eventId', '==', eventId)
        .get();

      const participantsData = await Promise.all(
        participantsSnap.docs.map(async (docSnap) => {
          const registration = docSnap.data() as EventRegistration;

          try {
            const profileDoc = await firestore()
              .collection('profiles')
              .doc(registration.uid)
              .get();
            if (profileDoc.exists) {
              return {
                ...registration,
                profile: profileDoc.data() as Profile
              };
            }
          } catch (error) {
            console.error('Error loading profile:', error);
          }

          return registration;
        })
      );

      setParticipants(participantsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'going': return theme.colors.success;
      case 'maybe': return theme.colors.warning;
      case 'notgoing': return theme.colors.error;
      default: return theme.colors.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'going': return 'Confirmado';
      case 'maybe': return 'Tal vez';
      case 'notgoing': return 'No va';
      default: return 'Pendiente';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando participantes..." />;
  }

  const goingCount = participants.filter(p => p.status === 'going').length;
  const maybeCount = participants.filter(p => p.status === 'maybe').length;
  const notGoingCount = participants.filter(p => p.status === 'notgoing').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Participantes</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {event && (
          <Card style={styles.eventCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventSubtitle}>
              {participants.length} {participants.length === 1 ? 'participante' : 'participantes'}
            </Text>
          </Card>
        )}

        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.statNumber}>{goingCount}</Text>
              <Text style={styles.statLabel}>Confirmados</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="help-circle" size={24} color={theme.colors.warning} />
              <Text style={styles.statNumber}>{maybeCount}</Text>
              <Text style={styles.statLabel}>Tal vez</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="close-circle" size={24} color={theme.colors.error} />
              <Text style={styles.statNumber}>{notGoingCount}</Text>
              <Text style={styles.statLabel}>No van</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.participantsCard}>
          <Text style={styles.sectionTitle}>Lista de participantes</Text>
          <Text style={styles.sectionSubtitle}>
            Ve quién más va al evento y accede a sus perfiles públicos.
          </Text>

          {participants.length > 0 ? (
            participants.map((participant, index) => (
              <View key={`${participant.uid}-${index}`} style={styles.participantItem}>
                <View style={styles.participantLeft}>
                  <View style={[
                    styles.participantAvatar,
                    { backgroundColor: getStatusColor(participant.status) }
                  ]}>
                    <Text style={styles.participantAvatarText}>
                      {participant.profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>
                      {participant.profile?.fullName || 'Usuario'}
                    </Text>
                    {participant.profile?.primaryPhone && (
                      <Text style={styles.participantPhone}>
                        {participant.profile.primaryPhone}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(participant.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(participant.status)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="people" size={48} color={theme.colors.gray[400]} />
              <Text style={styles.emptyText}>No hay participantes aún</Text>
            </View>
          )}
        </Card>
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
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.white,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  eventCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  eventTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  eventSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.white,
    opacity: 0.9,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  participantsCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  participantAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  participantPhone: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});
