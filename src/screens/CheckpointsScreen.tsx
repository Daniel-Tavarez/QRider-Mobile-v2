import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
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
import { geofenceService, syncManager } from '../modules/geofence';
import { Checkpoint as GeofenceCheckpoint } from '../modules/geofence/types';
import { CheckpointProgress, RootStackParamList } from '../types';

type CheckpointsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Checkpoints'
>;

const ACTIVE_EVENT_KEY = 'active_event_id';

export function CheckpointsScreen({
  route,
  navigation,
}: CheckpointsScreenProps) {
  const { eventId, userId, routeId } = route.params;
  const [checkpoints, setCheckpoints] = useState<GeofenceCheckpoint[]>([]);
  const [progress, setProgress] = useState<CheckpointProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEventActive, setIsEventActive] = useState(false);

  useEffect(() => {
    loadData();
    checkActiveEvent();
  }, [eventId, userId]);

  const checkActiveEvent = async () => {
    try {
      const activeEventId = await AsyncStorage.getItem(ACTIVE_EVENT_KEY);
      setIsEventActive(activeEventId === eventId);
    } catch (error) {
      console.error('Error checking active event:', error);
    }
  };

  const loadData = async () => {
    try {
      // Determine connectivity
      const state = await NetInfo.fetch();
      const isOnline =
        state.isConnected === true && state.isInternetReachable === true;

      // Load checkpoints - online from Firestore, otherwise from local cache
      let checkpointsData: GeofenceCheckpoint[] = [];
      if (isOnline) {
        let queryRef = firestore()
          .collection('checkpoints')
          .where('event_id', '==', eventId)
          .where('active', '==', true);

        if (routeId) {
          queryRef = queryRef.where('routeId', '==', routeId);
        }

        const checkpointsSnap = await queryRef.get();

        checkpointsData = checkpointsSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as unknown as GeofenceCheckpoint[];

        // Persist remote as source of truth
        try {
          await geofenceService.saveCheckpointsLocally(
            eventId,
            checkpointsData,
          );
          const validIds = checkpointsData.map(c => c.id);
          await syncManager.pruneLocalDataForEvent(eventId, userId, validIds);
        } catch {}
      } else {
        checkpointsData = await geofenceService.getLocalCheckpoints(eventId);
      }

      checkpointsData = (checkpointsData || []).sort(
        (a, b) => (a.sequence || 0) - (b.sequence || 0),
      );
      setCheckpoints(checkpointsData);
      console.log('Loaded checkpoints:', checkpointsData?.length || 0);
      const validIdSet = new Set(checkpointsData.map(c => c.id));

      // Load progress
      let remoteProgress: CheckpointProgress[] = [];
      if (isOnline) {
        const progressSnap = await firestore()
          .collection('checkpointProgress')
          .where('event_id', '==', eventId)
          .where('uid', '==', userId)
          .get();
        remoteProgress = progressSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        })) as unknown as CheckpointProgress[];
        // keep only progress that matches current checkpoints
        remoteProgress = remoteProgress.filter(rp =>
          validIdSet.has((rp as any).checkpointId),
        );
      }

      // Always include local progress so UI reflects offline ENTERs immediately
      const localProgress = await syncManager.getLocalCheckpointProgress(
        eventId,
        userId,
      );

      // Merge by checkpointId, prefer remote
      const byCheckpoint = new Map<string, any>();
      for (const rp of remoteProgress) {
        byCheckpoint.set((rp as any).checkpointId, rp);
      }
      for (const lp of localProgress) {
        if (
          !byCheckpoint.has(lp.checkpointId) &&
          validIdSet.has(lp.checkpointId)
        ) {
          byCheckpoint.set(lp.checkpointId, {
            id: `${eventId}_${userId}_${lp.checkpointId}`,
            checkpointId: lp.checkpointId,
            uid: lp.uid,
            event_id: lp.eventId,
            timestamp: lp.timestamp,
            latitude: lp.latitude,
            longitude: lp.longitude,
          } as any);
        }
      }

      setProgress(Array.from(byCheckpoint.values()) as any);
    } catch (error) {
      console.error('Error loading checkpoints:', error);
      // Fallback to purely local if Firestore calls fail
      try {
        const checkpointsData = await geofenceService.getLocalCheckpoints(
          eventId,
        );
        setCheckpoints(
          (checkpointsData || []).sort(
            (a, b) => (a.sequence || 0) - (b.sequence || 0),
          ),
        );
      } catch {}
      try {
        const localProgress = await syncManager.getLocalCheckpointProgress(
          eventId,
          userId,
        );
        const fallback = localProgress.map(lp => ({
          id: `${eventId}_${userId}_${lp.checkpointId}`,
          checkpointId: lp.checkpointId,
          uid: lp.uid,
          event_id: lp.eventId,
          timestamp: lp.timestamp,
          latitude: lp.latitude,
          longitude: lp.longitude,
        })) as any;
        setProgress(fallback);
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const isCheckpointCompleted = (checkpointId: string): boolean => {
    return progress.some(p => p.checkpointId === checkpointId);
  };

  const getCheckpointProgress = (
    checkpointId: string,
  ): CheckpointProgress | undefined => {
    return progress.find(p => p.checkpointId === checkpointId);
  };

  const formatTimestamp = (timestamp: any): string => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  };

  if (loading) {
    return <LoadingSpinner text="Cargando checkpoints..." />;
  }

  const completedCount = progress.length;
  const totalCount = checkpoints.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progreso de Ruta</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isEventActive && (
          <View style={styles.activeBanner}>
            <View style={styles.activeBannerContent}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeBannerText}>
                Evento Activo - Rastreando tu ubicación
              </Text>
            </View>
          </View>
        )}

        {checkpoints.length > 0 ? (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Progreso General</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {completedCount} de {totalCount} checkpoints completados
                </Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{completedCount}</Text>
                  <Text style={styles.statLabel}>Completados</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {totalCount - completedCount}
                  </Text>
                  <Text style={styles.statLabel}>Pendientes</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>
                    {Math.round(progressPercentage)}%
                  </Text>
                  <Text style={styles.statLabel}>Progreso</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.checkpointsCard}>
              <Text style={styles.sectionTitle}>Checkpoints de la Ruta</Text>

              <View style={styles.stepper}>
                {checkpoints.map((checkpoint, index) => {
                  const isCompleted = isCheckpointCompleted(checkpoint.id);
                  const checkpointProgress = getCheckpointProgress(
                    checkpoint.id,
                  );
                  const isLast = index === checkpoints.length - 1;

                  return (
                    <View key={checkpoint.id} style={styles.stepContainer}>
                      <View style={styles.stepLeft}>
                        <View
                          style={[
                            styles.stepCircle,
                            isCompleted && styles.stepCircleCompleted,
                          ]}
                        >
                          {isCompleted ? (
                            <Icon
                              name="checkmark-circle"
                              size={32}
                              color={theme.colors.success}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.stepNumber,
                                isCompleted && styles.stepNumberCompleted,
                              ]}
                            >
                              {checkpoint.sequence + 1}
                            </Text>
                          )}
                        </View>
                        {!isLast && (
                          <View
                            style={[
                              styles.stepLine,
                              isCompleted && styles.stepLineCompleted,
                            ]}
                          />
                        )}
                      </View>

                      <View
                        style={[
                          styles.stepContent,
                          !isLast && styles.stepContentWithLine,
                        ]}
                      >
                        <View
                          style={[
                            styles.stepCard,
                            isCompleted && styles.stepCardCompleted,
                          ]}
                        >
                          <View style={styles.stepHeader}>
                            <Text
                              style={[
                                styles.stepTitle,
                                isCompleted && styles.stepTitleCompleted,
                              ]}
                            >
                              {checkpoint.name}
                            </Text>
                            {isCompleted && (
                              <View style={styles.completedBadge}>
                                <Text style={styles.completedText}>
                                  Completado
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.stepDetails}>
                            <View style={styles.stepDetailItem}>
                              <Icon
                                name="location"
                                size={16}
                                color={
                                  isCompleted
                                    ? theme.colors.success
                                    : theme.colors.textSecondary
                                }
                              />
                              <Text style={styles.stepDetailText}>
                                {checkpoint.latitude.toFixed(6)},{' '}
                                {checkpoint.longitude.toFixed(6)}
                              </Text>
                            </View>

                            {checkpointProgress && (
                              <View style={styles.stepDetailItem}>
                                <Icon
                                  name="calendar"
                                  size={16}
                                  color={theme.colors.success}
                                />
                                <Text
                                  style={[
                                    styles.stepDetailText,
                                    styles.completedTime,
                                  ]}
                                >
                                  Entrada:{' '}
                                  {formatTimestamp(
                                    (checkpointProgress as any).timestamp,
                                  )}
                                </Text>
                              </View>
                            )}

                            {checkpointProgress &&
                              (checkpointProgress as any).exitTimestamp && (
                                <View style={styles.stepDetailItem}>
                                  <Icon
                                    name="log-out-outline"
                                    size={16}
                                    color={theme.colors.warning}
                                  />
                                  <Text
                                    style={[
                                      styles.stepDetailText,
                                      {
                                        color: theme.colors.warning,
                                        fontWeight: '600',
                                      },
                                    ]}
                                  >
                                    Salida:{' '}
                                    {formatTimestamp(
                                      (checkpointProgress as any).exitTimestamp,
                                    )}
                                  </Text>
                                </View>
                              )}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        ) : (
          <Card style={styles.emptyCard}>
            <Icon name="location" size={64} color={theme.colors.gray[400]} />
            <Text style={styles.emptyTitle}>Sin checkpoints</Text>
            <Text style={styles.emptyMessage}>
              Este evento no tiene checkpoints configurados
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
    backgroundColor: theme.colors.surface,
    paddingBottom: -theme.spacing.lg,
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
  activeBanner: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  activeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  activeBannerText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.white,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.white,
  },
  summaryCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  summaryTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.gray[200],
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 6,
  },
  progressText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  checkpointsCard: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  stepper: {
    paddingLeft: theme.spacing.sm,
  },
  stepContainer: {
    flexDirection: 'row',
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.gray[300],
  },
  stepCircleCompleted: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.success,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.gray[600],
  },
  stepNumberCompleted: {
    color: theme.colors.success,
  },
  stepLine: {
    width: 3,
    flex: 1,
    backgroundColor: theme.colors.gray[300],
    marginVertical: theme.spacing.xs,
  },
  stepLineCompleted: {
    backgroundColor: theme.colors.success,
  },
  stepContent: {
    flex: 1,
  },
  stepContentWithLine: {
    paddingBottom: theme.spacing.md,
  },
  stepCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
  },
  stepCardCompleted: {
    borderColor: theme.colors.success,
    backgroundColor: '#F1F8F4',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  stepTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    flex: 1,
  },
  stepTitleCompleted: {
    color: theme.colors.success,
  },
  completedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  completedText: {
    color: theme.colors.white,
    fontSize: theme.typography.small.fontSize,
    fontWeight: '600',
  },
  stepDetails: {
    gap: theme.spacing.sm,
  },
  stepDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stepDetailText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  completedTime: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyMessage: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
