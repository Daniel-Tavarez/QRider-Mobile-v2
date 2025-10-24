// Firebase config loader that prefers runtime environment variables.
// Priority: react-native-config (if installed) -> process.env -> embedded defaults
// NOTE: For production, keep secrets out of source control and use native env solutions.

let env: { [key: string]: string | undefined } = {};

try {
  // Try to load react-native-config if available (common for RN projects)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RNConfig = require('react-native-config');
  env = RNConfig && RNConfig.default ? RNConfig.default : RNConfig;
} catch (e) {
  // react-native-config not installed — fall back to process.env
  // process.env may be unavailable at runtime in some RN setups; it's useful for build-time only.
  // Keep empty if not present.
}

export const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY || 'AIzaSyDNMfYPvscr_AswdYhbkMfVCtckD0uEzUA',
  authDomain: env.FIREBASE_AUTH_DOMAIN || 'qriderrd.firebaseapp.com',
  projectId: env.FIREBASE_PROJECT_ID || 'qriderrd',
  storageBucket: env.FIREBASE_STORAGE_BUCKET || 'qriderrd.firebasestorage.app',
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '476161322544',
  appId: env.FIREBASE_APP_ID || '1:476161322544:web:ae9924e7977cfaba8887f5',
  measurementId: env.FIREBASE_MEASUREMENT_ID || 'G-YEEPEKDLDY',
};

