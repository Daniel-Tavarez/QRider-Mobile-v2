import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Icon } from '../components/common/Icon';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';

// Screens
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AuthScreen } from '../screens/AuthScreen';
import { CheckpointsScreen } from '../screens/CheckpointsScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { EventsScreen } from '../screens/EventsScreen';
import { GeofenceDebugScreen } from '../screens/GeofenceDebugScreen';
import { ParticipantsScreen } from '../screens/ParticipantsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        tabBarIcon: ({
          focused,
          color,
          size,
        }: {
          focused: boolean;
          color: string;
          size: number;
        }) => {
          let iconName: string;

          if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.white,
        tabBarInactiveTintColor: theme.colors.gray[50],
        tabBarStyle: {
          backgroundColor: theme.colors.primary,
          borderTopWidth: 1,
          paddingTop: 0,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ tabBarLabel: 'Eventos' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Iniciando QRider..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="EventDetail"
              component={EventDetailScreen}
              options={{ title: 'Detalle del Evento' }}
            />
            <Stack.Screen
              name="GeofenceDebug"
              component={GeofenceDebugScreen}
              options={{ title: 'Geofence Debug' }}
            />
            <Stack.Screen
              name="Participants"
              component={ParticipantsScreen}
              options={{ title: 'Participantes' }}
            />
            <Stack.Screen
              name="Checkpoints"
              component={CheckpointsScreen}
              options={{ title: 'Checkpoints' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
