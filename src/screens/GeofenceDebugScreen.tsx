import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Card } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { theme } from '../constants/theme';
import { useGeofence } from '../modules/geofence';
import { RootStackParamList } from '../types';

type GeofenceDebugScreenProps = NativeStackScreenProps<RootStackParamList, 'GeofenceDebug'>;

export const GeofenceDebugScreen: React.FC<GeofenceDebugScreenProps> = ({ route, navigation }) => {
  const { eventId, userId } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const {
    status,
    checkpoints,
    recentEvents,
    loading,
    error,
    initializeGeofencing,
    stopGeofencing,
    forceSync,
    reloadCheckpoints,
    updateStatus,
  } = useGeofence(eventId, userId);

  const onRefresh = async () => {
    setRefreshing(true);
    await updateStatus();
    setRefreshing(false);
  };

  const handleInitialize = async () => {
    try {
      await initializeGeofencing();
      Alert.alert('Success', 'Geofencing initialized successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to initialize');
    }
  };

  const handleStop = async () => {
    try {
      await stopGeofencing();
      Alert.alert('Success', 'Geofencing stopped');
    } catch (err) {
      Alert.alert('Error', 'Failed to stop geofencing');
    }
  };

  const handleSync = async () => {
    try {
      const result = await forceSync();
      Alert.alert(
        'Sync Complete',
        `Successfully synced: ${result.success}\nFailed: ${result.failed}`
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to sync events');
    }
  };

  const handleReload = async () => {
    try {
      await reloadCheckpoints();
      Alert.alert('Success', 'Checkpoints reloaded successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to reload checkpoints');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geofence Debug</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Active:</Text>
            <View style={[styles.statusBadge, status.isActive ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={styles.statusBadgeText}>{status.isActive ? 'YES' : 'NO'}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Online:</Text>
            <View style={[styles.statusBadge, status.isOnline ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={styles.statusBadgeText}>{status.isOnline ? 'YES' : 'NO'}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Checkpoints:</Text>
            <Text style={styles.statusValue}>{status.checkpointsCount}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Events:</Text>
            <Text style={styles.statusValue}>{status.pendingEvents}</Text>
          </View>
        </Card>

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleInitialize}
            disabled={loading || status.isActive}
          >
            <Text style={styles.actionButtonText}>
              {status.isActive ? 'Already Active' : 'Initialize Geofencing'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton, loading && styles.disabledButton]}
            onPress={handleStop}
            disabled={loading || !status.isActive}
          >
            <Text style={styles.actionButtonText}>Stop Geofencing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton, loading && styles.disabledButton]}
            onPress={handleSync}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Force Sync ({status.pendingEvents})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton, loading && styles.disabledButton]}
            onPress={handleReload}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Reload Checkpoints</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.checkpointsCard}>
          <Text style={styles.sectionTitle}>Checkpoints ({checkpoints.length})</Text>
          {checkpoints.length === 0 ? (
            <Text style={styles.emptyText}>No checkpoints loaded</Text>
          ) : (
            checkpoints.map((checkpoint) => (
              <View key={checkpoint.id} style={styles.checkpointItem}>
                <View style={styles.checkpointHeader}>
                  <Text style={styles.checkpointName}>{checkpoint.name}</Text>
                  <Text style={styles.checkpointSequence}>#{checkpoint.sequence}</Text>
                </View>
                <Text style={styles.checkpointDetails}>
                  Lat: {checkpoint.latitude.toFixed(6)}, Lng: {checkpoint.longitude.toFixed(6)}
                </Text>
                <Text style={styles.checkpointDetails}>Radius: {checkpoint.radius}m</Text>
                <View style={styles.checkpointFlags}>
                  {checkpoint.notify_on_enter && (
                    <View style={styles.flag}>
                      <Text style={styles.flagText}>Enter</Text>
                    </View>
                  )}
                  {checkpoint.notify_on_exit && (
                    <View style={styles.flag}>
                      <Text style={styles.flagText}>Exit</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.eventsCard}>
          <Text style={styles.sectionTitle}>Recent Events ({recentEvents.length})</Text>
          {recentEvents.length === 0 ? (
            <Text style={styles.emptyText}>No events recorded</Text>
          ) : (
            recentEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventName}>{event.checkpointName}</Text>
                  <View
                    style={[
                      styles.eventTypeBadge,
                      event.eventType === 'ENTER' ? styles.enterBadge : styles.exitBadge,
                    ]}
                  >
                    <Text style={styles.eventTypeText}>{event.eventType}</Text>
                  </View>
                </View>
                <Text style={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
                <View style={styles.eventFooter}>
                  <Text style={styles.eventLocation}>
                    {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                  </Text>
                  <View
                    style={[
                      styles.syncBadge,
                      event.synced ? styles.syncedBadge : styles.pendingBadge,
                    ]}
                  >
                    <Text style={styles.syncBadgeText}>
                      {event.synced ? 'Synced' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.error,
  },
  statusBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorCard: {
    backgroundColor: theme.colors.error + '20',
    marginBottom: 15,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
  },
  actionsContainer: {
    marginBottom: 15,
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  checkpointsCard: {
    marginBottom: 15,
  },
  checkpointItem: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  checkpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkpointName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  checkpointSequence: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  checkpointDetails: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  checkpointFlags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  flag: {
    backgroundColor: theme.colors.primary + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  flagText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  eventsCard: {
    marginBottom: 20,
  },
  eventItem: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  enterBadge: {
    backgroundColor: theme.colors.success,
  },
  exitBadge: {
    backgroundColor: theme.colors.warning,
  },
  eventTypeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  syncedBadge: {
    backgroundColor: theme.colors.success + '30',
  },
  pendingBadge: {
    backgroundColor: theme.colors.warning + '30',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
