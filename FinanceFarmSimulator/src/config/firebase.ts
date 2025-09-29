import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "finance-farm-simulator.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "finance-farm-simulator",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "finance-farm-simulator.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456789",
};

// Lazy initialization to prevent startup timeouts
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

function initializeFirebase() {
  if (app) return { app, auth: auth!, firestore: firestore! };
  
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      
      // Initialize Auth with AsyncStorage persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      
      firestore = getFirestore(app);
    } else {
      app = getApps()[0];
      auth = getAuth(app);
      firestore = getFirestore(app);
    }
    
    return { app, auth, firestore };
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Return mock objects for development
    return {
      app: {} as FirebaseApp,
      auth: {} as Auth,
      firestore: {} as Firestore
    };
  }
}

// Getter functions that initialize on first access
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const { app: initializedApp } = initializeFirebase();
    return initializedApp;
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const { auth: initializedAuth } = initializeFirebase();
    return initializedAuth;
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    const { firestore: initializedFirestore } = initializeFirebase();
    return initializedFirestore;
  }
  return firestore;
}

// Legacy exports for backward compatibility
export { getFirebaseApp as app, getFirebaseAuth as auth, getFirebaseFirestore as firestore };
export default getFirebaseApp;