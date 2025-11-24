import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { geofenceService } from '../modules/geofence';
import { dataStore } from '../lib/localDataStore';
import { User } from '../types';

let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.warn('Google Sign-In not available');
}

interface AuthContextType {
  user: User | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AUTH_USER_KEY = 'auth_user';
const USER_CACHE_KEY = 'user';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const persistSession = useCallback(async (authUser: User, profile: User) => {
    setUser(authUser);
    setUserData(profile);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile));
  }, []);

  const clearSession = useCallback(async () => {
    setUser(null);
    setUserData(null);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    await AsyncStorage.removeItem(USER_CACHE_KEY);
  }, []);

  const loadCachedSession = useCallback(async () => {
    try {
      const [authUserRaw, userRaw] = await Promise.all([
        AsyncStorage.getItem(AUTH_USER_KEY),
        AsyncStorage.getItem(USER_CACHE_KEY),
      ]);

      if (authUserRaw) {
        setUser(JSON.parse(authUserRaw) as User);
      }
      if (userRaw) {
        setUserData(JSON.parse(userRaw) as User);
      }
    } catch (error) {
      console.warn('AuthProvider: failed to restore session', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCachedSession();
  }, [loadCachedSession]);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const newUser = await dataStore.registerUser({ email, password, displayName });
      await persistSession(newUser, newUser);
    },
    [persistSession],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const authUser = await dataStore.authenticate(email, password);
      const profile = (await dataStore.getUser(authUser.uid)) ?? authUser;
      await persistSession(authUser, profile);
    },
    [persistSession],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!GoogleSignin) {
      throw new Error(
        'Google Sign-In no está disponible. Por favor, reconstruye la app después de instalar las dependencias.',
      );
    }

    try {
      try {
        GoogleSignin.configure({
          webClientId: '476161322544-062klmnbgjs7r7b9k26bdkb3bcooltve.apps.googleusercontent.com',
        });
      } catch (error) {
        console.warn('GoogleSignin configure failed', error);
      }

      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      } catch (error) {
        throw new Error('Actualiza Google Play Services en tu dispositivo.');
      }

      const response = await GoogleSignin.signIn();
      if (!response) {
        throw new Error('Inicio de sesión cancelado.');
      }

      const data = response.data || response.user || response;
      const account = data?.user || data;
      const email = account?.email;
      if (!email) {
        throw new Error('No se pudo obtener el email de la cuenta de Google.');
      }

      const displayName = account?.name || account?.displayName || email;
      const photoURL = account?.photo || account?.photoURL;

      const storedUser = await dataStore.upsertUserFromIdentity({
        uid: account?.id,
        email,
        displayName,
        photoURL,
      });

      await persistSession(storedUser, storedUser);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      const code = error?.code || error?.message || '';
      if (typeof code === 'string') {
        if (code.includes('SIGN_IN_CANCELLED') || code.includes('cancelled')) {
          throw new Error('Inicio de sesión cancelado');
        }
        if (code.includes('DEVELOPER_ERROR') || code.includes('10')) {
          throw new Error(
            'Verifica la configuración del cliente OAuth en Google Cloud para esta aplicación.',
          );
        }
        if (code.includes('PLAY_SERVICES_NOT_AVAILABLE')) {
          throw new Error('Google Play Services no disponible/actualiza en el dispositivo.');
        }
        if (code.includes('NETWORK_ERROR')) {
          throw new Error('Error de red. Revisa tu conexión.');
        }
      }
      throw new Error('No se pudo iniciar sesión con Google');
    }
  }, [persistSession]);

  const logout = async () => {
    try {
      // Ensure any active event/geofence is stopped when logging out
      await geofenceService.stopGeofencing();
      try {
        const { Platform } = require('react-native');
        if (Platform.OS === 'android') {
          const { TrackingService } = require('../lib/TrackingService');
          await TrackingService.stop();
        }
      } catch {}
    } catch (e) {
      // non-fatal
      console.warn('Logout: stopGeofencing failed or not active');
    }
    try {
      if (GoogleSignin) {
        await GoogleSignin.signOut();
      }
    } catch {}
    await clearSession();
  };

  const resetPassword = useCallback(async (email: string) => {
    const newPassword = `qr-${Math.random().toString(36).substring(2, 8)}`;
    await dataStore.updateUserPassword(email, newPassword);
    return newPassword;
  }, []);

  const value: AuthContextType = {
    user,
    userData,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
