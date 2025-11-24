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
import { dataStore } from '../lib/localDataStore';
import { Event } from '../types';

interface EventsScreenProps {
  navigation: any;
}

export function EventsScreen({ navigation }: EventsScreenProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [participantCounts, setParticipantCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await dataStore.getUpcomingEvents();
      setEvents(eventsData);

      const counts: Record<string, number> = {};
      for (const event of eventsData) {
        counts[event.id] = await dataStore.countParticipants(event.id, ['going', 'maybe']);
      }
      setParticipantCounts(counts);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {events.length > 0 ? (
          events.map((event, index) => {
            const isLast = index === events.length - 1;

            return (
              <TouchableOpacity
                key={event.id}
                onPress={() =>
                  navigation.navigate('EventDetail', { eventId: event.id })
                }
                activeOpacity={0.7}
              >
                <Card
                  style={StyleSheet.flatten([
                    styles.eventCard,
                    isLast && styles.eventItemLast,
                  ])}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventMeta}>
                        <View style={styles.eventDate}>
                          <Icon
                            name="calendar"
                            size={16}
                            color={theme.colors.textSecondary}
                          />
                          <Text style={styles.eventDateText}>
                            {formatDate(event.date)}
                          </Text>
                          {event.startTime && (
                            <Text style={styles.eventTime}>
                              {event.startTime}
                            </Text>
                          )}
                        </View>
                        {isEventPast(event.date) && (
                          <View style={styles.pastBadge}>
                            <Text style={styles.pastText}>Finalizado</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.eventBadges}>
                      {event.createdBy === user?.uid && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminText}>Admin</Text>
                        </View>
                      )}
                      {event.difficulty && (
                        <View
                          style={[
                            styles.difficultyBadge,
                            {
                              backgroundColor: getDifficultyColor(
                                event.difficulty,
                              ),
                            },
                          ]}
                        >
                          <Text style={styles.difficultyText}>
                            {getDifficultyText(event.difficulty)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {event.meetingPoint.text && (
                    <View style={styles.meetingPoint}>
                      <Icon
                        name="location"
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                      <Text style={styles.meetingPointText}>
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
                      <Icon
                        name="people"
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                      <Text style={styles.capacityText}>
                        {event.capacity
                          ? `${participantCounts[event.id] || 0}/${
                              event.capacity
                            }`
                          : `${participantCounts[event.id] || 0} confirmados`}
                      </Text>
                    </View>
                    <Icon
                      name="chevron-forward"
                      size={20}
                      color={theme.colors.gray[400]}
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
    backgroundColor: theme.colors.surface,
    paddingBottom: -theme.spacing.lg,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  eventCard: {
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventItemLast: {
    marginBottom: theme.spacing.xxl,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  eventInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDateText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  eventTime: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  pastBadge: {
    backgroundColor: theme.colors.gray[400],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  pastText: {
    color: theme.colors.white,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  eventBadges: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  joinModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  joinModeText: {
    color: theme.colors.white,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  difficultyText: {
    color: theme.colors.white,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  adminBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  adminText: {
    color: theme.colors.white,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
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
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
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
