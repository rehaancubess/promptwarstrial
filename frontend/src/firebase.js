import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getAnalytics, logEvent, isSupported } from "firebase/analytics";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app, auth, googleProvider, analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  // Initialize Analytics only in environments that support it (not SSR/Node)
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
} catch (e) {
  console.warn("Firebase config not complete. Auth may not work.", e);
}

/**
 * Log a custom analytics event.
 * Safe to call even if analytics is not initialized.
 * @param {string} eventName  - e.g. 'report_uploaded', 'voice_session_started'
 * @param {object} params     - additional event parameters
 */
export function trackEvent(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
}

export {
  auth,
  googleProvider,
  analytics,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
};
