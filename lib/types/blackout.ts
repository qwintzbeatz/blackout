// lib/types/blackout.ts
// Consolidated type definitions - re-export from main types/index.ts

export * from '@/types';

// Additional Firestore-specific types
export interface FirestoreMarker {
  position: [number, number];
  name: string;
  description: string;
  color: string;
  timestamp: any; // Firestore Timestamp
  userId: string;
  username: string;
  userProfilePic: string;
  createdAt: any; // Firestore Timestamp
  distanceFromCenter: number | null;
  repEarned: number;
  specialType?: 'rainbow' | 'glow' | 'metallic' | null;
  surface?: string;
  graffitiType?: string;
  styleId?: string;
  crewId?: string;
}

// Legacy types for backward compatibility (if needed)
export type MarkerName = 'Pole' | 'Sign' | 'E.Box' | 'Fence' | 'Wall' | 'Shutter' | 'Sewer' | 'Rooftop' | 'Ground' | 'Train' | 'Bridge' | 'Traffic Light' | 'Truck' | 'Van' | 'Post Box' | 'Speed Camera' | 'ATM Machine' | 'Bus Stop';
export type MarkerDescription = 'Sticker/Slap' | 'Stencil/Brand/Stamp' | 'Tag/Signature' | 'Etch/Scribe/Scratch' | 'Throw-Up' | 'Paste-Up/Poster' | 'Piece/Bombing' | 'Burner/Heater' | 'Roller/Blockbuster' | 'Extinguisher' | 'Mural';
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type CrewId = 'bqc' | 'sps' | 'lzt' | 'dgc' | null;
