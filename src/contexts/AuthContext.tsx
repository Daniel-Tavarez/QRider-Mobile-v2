import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

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

  // En React Native, signInWithGoogle se manejará de manera diferente
  const signInWithGoogle = async () => {
    throw new Error('Google sign in no está disponible en React Native. Use GoogleSignin.');
  };

  const logout = async () => {
    await auth().signOut();
    await AsyncStorage.removeItem('user');
  };

  const resetPassword = async (email: string) => {
    await auth().sendPasswordResetEmail(email);
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
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
        }
      } else {
        setUserData(null);
        await AsyncStorage.removeItem('user');
      }
      
      setLoading(false);
    });

    return unsubscribe;
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