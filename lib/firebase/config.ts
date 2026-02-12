import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  databaseURL: "https://blackout-3a073-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// Connect to emulators – ONLY in development
if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  // Use 127.0.0.1 instead of localhost to avoid occasional IPv6 resolution issues on Windows/macOS
  // Firestore: note NO http:// prefix – the function expects host + port separately
  connectFirestoreEmulator(db, '127.0.0.1', 8090);
  
  // Auth: needs the http:// prefix because it's a full URL
  connectAuthEmulator(auth, 'http://127.0.0.1:9200');
  
  // Realtime Database: host + port (no http://)
  connectDatabaseEmulator(realtimeDb, '127.0.0.1', 9010);

  console.log('🔥 Connected to Firebase Emulators (Firestore @8090, Auth @9200, RTDB @9010)');
}