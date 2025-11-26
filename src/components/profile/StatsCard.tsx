import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { ParticipantStats } from '../../types';

interface StatsCardProps {
  stats: ParticipantStats | null;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No hay estadísticas disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.totalEvents}</Text>
        <Text style={styles.statLabel}>Eventos participados</Text>
      </View>
      {stats.bestPosition && (
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.bestPosition}º</Text>
          <Text style={styles.statLabel}>Mejor posición</Text>
        </View>
      )}
      {stats.lastEvent && (
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.lastEvent}</Text>
          <Text style={styles.statLabel}>Último evento</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statItem: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
