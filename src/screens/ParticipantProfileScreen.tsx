import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/theme';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ProfileHeader,
  ProfileSection,
  InfoRow,
  VehicleCard,
  StatsCard,
  PrivacyBanner,
  PrivateInfo,
} from '../components/profile';
import { useParticipantProfile } from '../hooks/useParticipantProfile';

type Props = NativeStackScreenProps<RootStackParamList, 'ParticipantProfile'>;

export const ParticipantProfileScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { userId, eventId } = route.params;
  const { profile, stats, loading, isOwnProfile } = useParticipantProfile(userId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Perfil no encontrado</Text>
          <Button title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ProfileHeader
          photoURL={profile.photoURL}
          displayName={profile.displayName || 'Usuario'}
          isOwnProfile={isOwnProfile}
        />

        <ProfileSection title="Información de Contacto">
          {profile.email ? (
            <InfoRow
              icon="📧"
              label="Email"
              value={profile.email}
              onPress={() => Linking.openURL(`mailto:${profile.email}`)}
            />
          ) : (
            <PrivateInfo text="Email no disponible" />
          )}

          {profile.phone ? (
            <InfoRow
              icon="📱"
              label="Teléfono"
              value={profile.phone}
              onPress={() => Linking.openURL(`tel:${profile.phone}`)}
            />
          ) : (
            <PrivateInfo text="Teléfono no disponible" />
          )}
        </ProfileSection>

        {profile.vehicleInfo ? (
          <ProfileSection title="Vehículo">
            <VehicleCard vehicle={profile.vehicleInfo} />
          </ProfileSection>
        ) : (
          profile.privacy?.showVehicleInfo === false && (
            <ProfileSection title="Vehículo">
              <PrivateInfo text="Información de vehículo no disponible" />
            </ProfileSection>
          )
        )}

        <ProfileSection title="Estadísticas">
          <StatsCard stats={stats} />
        </ProfileSection>

        {!profile.privacy?.showFullProfile && !isOwnProfile && (
          <PrivacyBanner message="Este usuario ha configurado su perfil como privado" />
        )}

        {isOwnProfile && (
          <View style={styles.buttonContainer}>
            <Button
              title="Editar mi perfil"
              onPress={() => navigation.navigate('ProfileEdit')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  buttonContainer: {
    padding: 16,
  },
});
