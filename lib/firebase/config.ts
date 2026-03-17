import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, persistentLocalCache } from 'firebase/firestore';
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

// MONITORING: Keep an eye on Firestore usage in Firebase Console (Usage tab).
// If reads exceed 50K/day, consider further optimizations or upgrade to Blaze plan.
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// Connect to emulators – ONLY in development
if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  // Use environment variable for host to support mobile device testing
  // Default to '127.0.0.1' for local development, or set to your computer's local IP for mobile testing
  const emulatorHost = process.env.NEXT_PUBLIC_EMULATOR_HOST || '127.0.0.1';
  
  // Firestore: note NO http:// prefix – the function expects host + port separately
  connectFirestoreEmulator(db, emulatorHost, 8090);
  
  // Auth: needs the http:// prefix because it's a full URL
  connectAuthEmulator(auth, `http://${emulatorHost}:9200`);
  
  // Realtime Database: host + port (no http://)
  connectDatabaseEmulator(realtimeDb, emulatorHost, 9010);

  console.log(`🔥 Connected to Firebase Emulators at ${emulatorHost} (Firestore @8090, Auth @9200, RTDB @9010)`);
}
