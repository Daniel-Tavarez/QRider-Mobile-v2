import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
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
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';

const ACTIVE_EVENT_KEY = 'active_event_id';
const eventCacheKeyFor = (eventId: string) => `event_cache_${eventId}`;

interface EventsScreenProps {
  navigation: any;
}

export function EventsScreen({ navigation }: EventsScreenProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [participantCounts, setParticipantCounts] = useState<
    Record<string, number>
  >({});
  const [attendedCount, setAttendedCount] = useState(0);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [activeEventTitle, setActiveEventTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadActiveEvent = async () => {
    try {
      const eventId = await AsyncStorage.getItem(ACTIVE_EVENT_KEY);
      setActiveEventId(eventId);
      if (eventId) {
        let title: string | null = null;
        try {
          const cached = await AsyncStorage.getItem(eventCacheKeyFor(eventId));
          if (cached) {
            const parsed = JSON.parse(cached);
            title = parsed?.event?.title ?? null;
          }
        } catch { }

        if (!title) {
          try {
            const doc = await firestore().collection('events').doc(eventId).get();
            if (doc.exists()) {
              const data = doc.data() as Event;
              title = (data as any).title ?? null;
              await AsyncStorage.setItem(
                eventCacheKeyFor(eventId),
                JSON.stringify({ event: { ...data, id: doc.id } }),
              );
            }
          } catch { }
        }

        setActiveEventTitle(title);
      } else {
        setActiveEventTitle(null);
      }
    } catch (error) {
      console.error('Error loading active event:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const state = await NetInfo.fetch();
      const isOnline =
        state.isConnected === true && state.isInternetReachable === true;
      if (!isOnline) {
        await loadActiveEvent();
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const formattedDate = yesterday.toISOString().split('T')[0];
      const querySnapshot = await firestore()
        .collection('events')
        .where('date', '>=', formattedDate)
        .orderBy('date', 'desc')
        .get();

      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      setEvents(eventsData);

      // Load participant counts for each event
      const counts: Record<string, number> = {};
      for (const event of eventsData) {
        const countSnap = await firestore()
          .collection('eventRegistrations')
          .where('eventId', '==', event.id)
          .where('status', 'in', ['going', 'maybe'])
          .count()
          .get();

        counts[event.id] = countSnap.data().count;
      }
      setParticipantCounts(counts);

      // Load attended count for current user
      if (user?.uid) {
        const attendedSnap = await firestore()
          .collection('eventRegistrations')
          .where('uid', '==', user.uid)
          .count()
          .get();
        setAttendedCount(attendedSnap.data().count ?? 0);
      } else {
        setAttendedCount(0);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      await loadActiveEvent();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const getDifficultyColor = (difficulty?: string) => {
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

  const getDifficultyText = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'med':
        return 'Intermedio';
      case 'hard':
        return 'Difícil';
      default:
        return 'No especificado';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isEventPast = (eventDate: string): boolean => {
    return new Date(eventDate) < new Date();
  };

  if (loading) {
    return <LoadingSpinner text="Cargando eventos..." />;
  }

  const upcomingEvents = events.filter(e => !isEventPast(e.date));
  const pastEvents = events.filter(e => isEventPast(e.date));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View>
            <View style={styles.topRow}>

              <Text style={styles.heroKicker}>Próximas rutas</Text>
              <View style={styles.heroBadge}>
                <Icon name="calendar" size={20} color={theme.colors.primary} />
                <Text style={styles.heroBadgeText}>
                  {upcomingEvents.length} activos
                </Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>Eventos & checkpoints</Text>
            <Text style={styles.heroSubtitle}>
              Consulta los rides activos, confirma asistencia y revisa notas antes de salir.
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Eventos activos</Text>
            <Text style={styles.metricValue}>{upcomingEvents.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Finalizados</Text>
            <Text style={styles.metricValueMuted}>{pastEvents.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Asistidos</Text>
            <Text style={styles.metricValue}>{attendedCount}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeEventId && (
          <TouchableOpacity
            onPress={() => navigation.navigate('EventDetail', { eventId: activeEventId })}
            activeOpacity={0.9}
          >
            <Card style={styles.activeEventCard}>
              <View style={styles.activeEventRow}>
                <View style={styles.activeEventIcon}>
                  <Icon name="compass" size={18} color={theme.colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeEventLabel}>Evento activo</Text>
                  <Text style={styles.activeEventTitle}>
                    {activeEventTitle || 'Reanudar seguimiento'}
                  </Text>
                </View>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.gray[500]}
                />
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {events.length > 0 ? (
          events.map((event, index) => {
            const isLast = index === events.length - 1;
            const going = participantCounts[event.id] || 0;
            const capacityCopy = event.capacity
              ? `${going}/${event.capacity}`
              : `${going} confirmados`;
            const isPast = isEventPast(event.date);

            return (
              <TouchableOpacity
                key={event.id}
                onPress={() =>
                  navigation.navigate('EventDetail', { eventId: event.id })
                }
                activeOpacity={0.85}
              >
                <Card
                  style={StyleSheet.flatten([
                    styles.eventCard,
                    isLast && styles.eventItemLast,
                    isPast && styles.eventCardPast,
                  ])}
                >
                  <View style={styles.eventTopRow}>
                    <View style={styles.eventBadgeRow}>
                      <View style={styles.chip}>
                        <Icon
                          name="calendar"
                          size={16}
                          color={theme.colors.white}
                        />
                        <Text style={styles.chipText}>
                          {formatDate(event.date)}
                        </Text>
                        {event.startTime && (
                          <Text style={styles.chipTextMuted}>
                            · {event.startTime}
                          </Text>
                        )}
                      </View>
                      {event.difficulty && (
                        <View
                          style={[
                            styles.difficultyPill,
                            { backgroundColor: getDifficultyColor(event.difficulty) },
                          ]}
                        >
                          <Text style={styles.difficultyPillText}>
                            {getDifficultyText(event.difficulty)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.eventTitle}>{event.title}</Text>

                  {event.meetingPoint?.text && (
                    <View style={styles.meetingPoint}>
                      <Icon
                        name="location"
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                      <Text style={styles.meetingPointText} numberOfLines={2}>
                        {event.meetingPoint.text}
                      </Text>
                    </View>
                  )}

                  {event.notes && (
                    <Text style={styles.eventNotes} numberOfLines={2}>
                      {event.notes}
                    </Text>
                  )}

                  <View style={styles.eventFooter}>
                    <View style={styles.capacityInfo}>
                      <View style={styles.capacityBadge}>
                        <Icon
                          name="people"
                          size={16}
                          color={theme.colors.white}
                        />
                        <Text style={styles.capacityText}>{capacityCopy}</Text>
                      </View>
                      {isPast && (
                        <Text style={styles.pastText}>Finalizado</Text>
                      )}
                      {event.createdBy === user?.uid && (
                        <View style={styles.adminChip}>
                          <Text style={styles.adminChipText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    <Icon
                      name="chevron-forward"
                      size={22}
                      color={theme.colors.gray[500]}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Icon
              name="calendar-outline"
              size={64}
              color={theme.colors.gray[400]}
            />
            <Text style={styles.emptyTitle}>No hay eventos disponibles</Text>
            <Text style={styles.emptyMessage}>
              Los eventos aparecerán aquí cuando estén disponibles.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  hero: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  heroKicker: {
    color: theme.colors.white,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  heroTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '800',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: theme.typography.body.fontSize,
    lineHeight: 22,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  heroBadgeText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: theme.typography.caption.fontSize,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.small.fontSize,
    marginBottom: theme.spacing.xs,
  },
  metricValue: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: theme.typography.h3.fontSize,
  },
  metricValueMuted: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: theme.typography.h3.fontSize,
  },
  activeEventCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  activeEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  activeEventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeEventLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '700',
  },
  activeEventTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: theme.typography.body.fontSize,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.gray[50],
  },
  eventCard: {
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    padding: theme.spacing.lg,
  },
  eventItemLast: {
    marginBottom: theme.spacing.xxl,
  },
  eventCardPast: {
    opacity: 0.8,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  eventBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  chipText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: theme.typography.small.fontSize,
  },
  chipTextMuted: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    fontSize: theme.typography.small.fontSize,
  },
  difficultyPill: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  difficultyPillText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: theme.typography.small.fontSize,
  },
  adminChip: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  adminChipText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  eventTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.2,
  },
  meetingPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  meetingPointText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  eventNotes: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  capacityText: {
    fontSize: 13,
    color: theme.colors.white,
    fontWeight: '700',
  },
  pastText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
