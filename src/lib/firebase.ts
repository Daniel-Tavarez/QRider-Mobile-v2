import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import { firebaseConfig } from '../../firebase.config';

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export services
export const auth = firebase.auth();
export const db = firebase.firestore();

// Google Auth Provider
export const googleProvider = firebase.auth.GoogleAuthProvider.credential(null);
// Note: For React Native, we'll handle scopes through the native OAuth flow

export { firebase as app };

