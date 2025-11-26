import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { VehicleInfo } from '../../types';

interface VehicleCardProps {
  vehicle: VehicleInfo;
}

const getVehicleTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    motorcycle: 'Motocicleta',
    atv: 'ATV',
    car: 'Automóvil',
    bicycle: 'Bicicleta',
    other: 'Otro',
  };
  return labels[type] || type;
};

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.icon}>🏍️</Text>
        <View style={styles.content}>
          <Text style={styles.title}>
            {vehicle.brand} {vehicle.model}
          </Text>
          {vehicle.year && (
            <Text style={styles.detail}>Año: {vehicle.year}</Text>
          )}
        </View>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Tipo</Text>
          <Text style={styles.detailValue}>
            {getVehicleTypeLabel(vehicle.type)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Color</Text>
          <Text style={styles.detailValue}>{vehicle.color}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Placa</Text>
          <Text style={styles.detailValue}>{vehicle.plate}</Text>
        </View>
      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
