// src/config/firebaseConfig.ts
import firebase from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDNMfYPvscr_AswdYhbkMfVCtckD0uEzUA",
  authDomain: "qriderrd.firebaseapp.com",
  projectId: "qriderrd",
  storageBucket: "qriderrd.appspot.com",
  messagingSenderId: "476161322544",
  appId: "1:476161322544:web:ae9924e7977cfaba8887f5",
  measurementId: "G-YEEPEKDLDY"
};

// Solo inicializa si no existe una app activa
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
