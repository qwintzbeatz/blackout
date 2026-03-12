/**
 * firestoreTypes.ts
 * Firestore-specific interfaces extracted from page.tsx.
 * Add to (or re-export from) your existing lib/types/blackout.ts as needed.
 */

import { Timestamp } from 'firebase/firestore';
import { MarkerDescription } from '@/constants/markers';

export interface FirestoreMarker {
  position: [number, number];
  name: string;
  description: MarkerDescription;
  color: string;
  timestamp: Timestamp;
  userId: string;
  username: string;
  userProfilePic: string;
  createdAt: Timestamp;
  distanceFromCenter: number | null;
  repEarned: number;
  specialType?: 'rainbow' | 'glow' | 'metallic' | null;
  surface?: string;
  graffitiType?: string;
  styleId?: string;
  crewId?: string;
}
