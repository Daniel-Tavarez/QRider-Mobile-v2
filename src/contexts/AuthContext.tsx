import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { geofenceService } from '../modules/geofence';
import { User } from '../types';

let GoogleSignin: any = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.warn('Google Sign-In not available');
}

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  console.log(user)
  const generateSlug = (): string => {
    return Math.random().toString(36).substring(2, 10);
  };

  const createUserDocument = async (
    uid: string,
    email: string,
    displayName: string,
    photoURL?: string
  ): Promise<User> => {
    const slug = generateSlug();
    
    const timestamp = firestore.Timestamp.now();
    const userData: User = {
      uid,
      email,
      displayName: displayName || email.split('@')[0] || 'QRider',
      photoURL: photoURL || undefined,
      slug,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await firestore().collection('users').doc(uid).set(userData);
    await firestore().collection('slugs').doc(slug).set({ 
      user_id: uid,
      created_at: timestamp
    });
    
    return userData;
  };

  const getUserDocument = async (uid: string): Promise<User | null> => {
    const userDoc = await firestore().collection('users').doc(uid).get();
    return userDoc.exists() ? (userDoc.data() as User) : null;
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
    
    const userDoc = await createUserDocument(
      result.user.uid,
      result.user.email!,
      displayName,
      result.user.photoURL || undefined
    );
    
    setUserData(userDoc);
    await AsyncStorage.setItem('user', JSON.stringify(userDoc));
  };

  const signIn = async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const signInWithGoogle = async () => {
    try {
      if (!GoogleSignin) {
        throw new Error('Google Sign-In no está disponible. Por favor, reconstruye la app después de instalar las dependencias.');
      }

      // Asegura configuración correcta (ID web client para ID token)
      try {
        GoogleSignin.configure({
          webClientId: '476161322544-062klmnbgjs7r7b9k26bdkb3bcooltve.apps.googleusercontent.com',
        });
      } catch (e) {
        // no fatal
      }

      // Verifica Google Play Services (Android)
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      } catch (e) {
        throw new Error('Actualiza Google Play Services en tu dispositivo.');
      }

      const response = await GoogleSignin.signIn();
      if (!response || response.type !== 'success') {
        throw new Error('Inicio de sesión cancelado.');
      }

      // Obtén tokens de forma fiable (evita idToken nulo); usa accessToken como respaldo
      let idToken: string | null | undefined = response.data?.idToken;
      let accessToken: string | null | undefined = undefined;
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = idToken || tokens?.idToken;
        accessToken = tokens?.accessToken || undefined;
      } catch {
        // ignorar
      }

      if (!idToken && !accessToken) {
        // Guía habitual: mismatch de packageName / SHA-1 o Web Client ID
        throw new Error(
          'No se pudo obtener credenciales de Google (idToken/accessToken). Verifica packageName, SHA-1/SHA-256 y Web Client ID en Firebase.'
        );
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken || null, accessToken || undefined);
      const result = await auth().signInWithCredential(googleCredential);

      let userDoc = await getUserDocument(result.user.uid);
      if (!userDoc) {
        userDoc = await createUserDocument(
          result.user.uid,
          result.user.email!,
          result.user.displayName || '',
          result.user.photoURL || undefined
        );
      }

      setUserData(userDoc);
      await AsyncStorage.setItem('user', JSON.stringify(userDoc));
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      // Mapear errores comunes a mensajes claros
      const code = error?.code || error?.message || '';
      if (typeof code === 'string') {
        if (code.includes('SIGN_IN_CANCELLED') || code.includes('cancelled')) {
          throw new Error('Inicio de sesión cancelado');
        }
        if (code.includes('DEVELOPER_ERROR') || code.includes('10')) {
          throw new Error('Configura el SHA-1/SHA-256 del keystore en Firebase y vuelve a descargar google-services.json.');
        }
        if (code.includes('PLAY_SERVICES_NOT_AVAILABLE')) {
          throw new Error('Google Play Services no disponible/actualiza en el dispositivo.');
        }
        if (code.includes('NETWORK_ERROR')) {
          throw new Error('Error de red. Revisa tu conexión.');
        }
        if (code.includes('auth/account-exists-with-different-credential')) {
          throw new Error('La cuenta ya existe con otro método. Inicia con ese método y vincula Google en tu perfil.');
        }
      }
      throw new Error('No se pudo iniciar sesión con Google');
    }
  };

  const logout = async () => {
    try {
      // Ensure any active event/geofence is stopped when logging out
      await geofenceService.stopGeofencing();
      await AsyncStorage.clear();
    } catch (e) {
      // non-fatal
      console.warn('Logout: stopGeofencing failed or not active');
    }
    try {
      if (GoogleSignin) {
        await GoogleSignin.signOut();
      }
    } catch {}
    await auth().signOut();
    await AsyncStorage.removeItem('user');
  };

  const resetPassword = async (email: string) => {
    await auth().sendPasswordResetEmail(email);
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener');

    if (GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: '476161322544-062klmnbgjs7r7b9k26bdkb3bcooltve.apps.googleusercontent.com',
        });
      } catch (e) {
        console.warn('Failed to configure GoogleSignin:', e);
      }
    }

    const timeout = setTimeout(() => {
      console.log('AuthContext: Timeout reached, setting loading to false');
      setLoading(false);
    }, 5000);

    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      console.log('AuthContext: Auth state changed', firebaseUser ? 'User logged in' : 'No user');
      clearTimeout(timeout);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          let userDoc = await getUserDocument(firebaseUser.uid);

          if (!userDoc) {
            userDoc = await createUserDocument(
              firebaseUser.uid,
              firebaseUser.email!,
              firebaseUser.displayName || '',
              firebaseUser.photoURL || undefined
            );
          }

          setUserData(userDoc);
          await AsyncStorage.setItem('user', JSON.stringify(userDoc));
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback offline: intenta cargar desde caché local
          try {
            const cached = await AsyncStorage.getItem('user');
            if (cached) {
              const parsed = JSON.parse(cached) as User;
              setUserData(parsed);
            }
          } catch {}
        }
      } else {
        // On any auth loss, stop geofencing and clear user cache
        try { await geofenceService.stopGeofencing(); } catch {}
        setUserData(null);
        await AsyncStorage.removeItem('user');
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
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
