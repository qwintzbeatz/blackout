// Add the types content from above
import { CrewId } from '../types/story';

// Export CrewId for use in other files
export type { CrewId } from '../types/story';

// Marker name options
export const MARKER_NAMES = ['Pole', 'Sign', 'E.Box', 'Fence', 'Wall', 'Shutter', 'Sewer', 'Rooftop', 'Ground', 'Train', 'Brigde', 'Traffic Light', 'Truck', 'Van', 'Post Box', 'Speed Camera', 'ATM Machine', 'Bus Stop'] as const;
export type MarkerName = typeof MARKER_NAMES[number];

// Marker description options
export const MARKER_DESCRIPTIONS = ['Sticker/Slap', 'Stencil/Brand/Stamp', 'Tag', 'Etch/Scribe/Scratch', 'Throw-Up', 'Paste-Up/Poster', 'Piece/Bombing', 'Burner/Heater', 'Roller/Blockbuster', 'Extinguisher', 'Mural'] as const;
export type MarkerDescription = typeof MARKER_DESCRIPTIONS[number];

// Type for user-placed markers
export interface UserMarker {
  id: string;
  position: [number, number];
  name: MarkerName;
  description: MarkerDescription;
  color: string;
  timestamp: Date;
  distanceFromCenter?: number;
  userId?: string;
  firestoreId?: string;
  username?: string;
  userProfilePic?: string;
}

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  profilePicUrl: string;
  xp: number;
  level: number;
  rank: string;
  totalMarkers: number;
  favoriteColor?: string;
  createdAt: Date;
  lastActive: Date;
  // Crew fields
  crewId?: CrewId | null;
  crewName?: string | null;
  isSolo?: boolean; // true if user chose to go solo
}

// Drop interface for GPS game with photos and social interaction
export interface Drop {
  id?: string;
  firestoreId?: string;
  lat: number;
  lng: number;
  photoUrl?: string; // Optional - marker drops don't have photos
  trackUrl?: string; // Optional - music drops: track saved with drop, placer loses it
  createdBy: string; // User UID
  timestamp: Date;
  likes: string[]; // Array of user UIDs who liked
  username?: string; // Optional username for display
  userProfilePic?: string; // Optional profile pic for display
}

// Marker colors
export const MARKER_COLORS = [
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#4dabf7' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Gray', value: '#6b7280' }
] as const;

// Rank system
export const RANK_SYSTEM = [
  { rank: 'TOY', xpRequired: 0, color: '#808080' },
  { rank: 'VANDAL', xpRequired: 100, color: '#FF6B6B' },
  { rank: 'WRITER', xpRequired: 300, color: '#4ECDC4' },
] as const;

// New Zealand locations for Blackout game
export const NEW_ZEALAND_LOCATIONS = {
  // Auckland Region
  "Auckland CBD": {
    coords: [-36.8485, 174.7633] as [number, number],
    description: "Heart of Auckland city - Sky Tower and central business district"
  },
  "Mission Bay": {
    coords: [-36.8477, 174.8294] as [number, number],
    description: "Popular beach suburb with cafes and coastal walks"
  },
  "Wellington CBD": {
    coords: [-41.2924, 174.7787] as [number, number],
    description: "New Zealand's capital city center with Parliament Buildings"
  },
  "Te Papa Museum": {
    coords: [-41.2904, 174.7822] as [number, number],
    description: "National museum of New Zealand - Te Papa Tongarewa"
  },
  "Christchurch CBD": {
    coords: [-43.5321, 172.6362] as [number, number],
    description: "Christchurch city center with Canterbury Cathedral"
  },
  "Christchurch Botanic Gardens": {
    coords: [-43.5309, 172.6166] as [number, number],
    description: "Beautiful botanical gardens in Christchurch"
  },
  "Dunedin CBD": {
    coords: [-45.8742, 170.5036] as [number, number],
    description: "Dunedin city center with historic architecture"
  },
  "Otago Peninsula": {
    coords: [-45.8756, 170.6788] as [number, number],
    description: "Scenic peninsula with albatross colony and lighthouses"
  },
  "Queenstown CBD": {
    coords: [-45.0312, 168.6626] as [number, number],
    description: "Adventure capital of NZ with Lake Wakatipu views"
  },
  "Skyline Queenstown": {
    coords: [-45.0298, 168.6589] as [number, number],
    description: "Iconic skyline with panoramic views of Queenstown"
  },
  "Rotorua Polynesian Spa": {
    coords: [-38.1368, 176.2497] as [number, number],
    description: "World-famous Polynesian Spa thermal pools"
  },
  "Rainbow Springs Nature Park": {
    coords: [-38.1686, 176.1567] as [number, number],
    description: "Kiwi bird sanctuary and nature conservation park"
  },
  "Franz Josef Glacier": {
    coords: [-43.4671, 170.1833] as [number, number],
    description: "Iconic glacier in Westland Tai Poutini National Park"
  },
  "Milford Sound": {
    coords: [-44.6167, 167.8667] as [number, number],
    description: "World Heritage fjord with seals and dolphins"
  },
  "Abel Tasman National Park": {
    coords: [-40.8333, 173.0500] as [number, number],
    description: "Golden Bay national park with pristine beaches"
  }
} as const;

// Keep EAST_AUCKLAND_LOCATIONS for backward compatibility but mark as deprecated
/** @deprecated Use NEW_ZEALAND_LOCATIONS instead */
export const EAST_AUCKLAND_LOCATIONS = NEW_ZEALAND_LOCATIONS;

