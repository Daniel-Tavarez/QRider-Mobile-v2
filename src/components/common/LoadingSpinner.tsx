import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  text?: string;
  color?: string;
}

export function LoadingSpinner({ 
  size = 'large', 
  text = 'Cargando...', 
  color = theme.colors.primary 
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
  },
  text: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});