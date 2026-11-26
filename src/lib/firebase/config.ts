/**
 * Samyak Guru — Firebase Cloud Messaging Configuration
 * Web App credentials for project: samyak-guru
 */

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const firebaseConfig: FirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB5rO3Yu6CGZCLTUKRu0VOkpNEZ9adZIdo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "samyak-guru.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "samyak-guru",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "samyak-guru.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "198127931057",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:198127931057:web:203ca6c04eabc9e8e51c90",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5FD4VZRLTM"
};
