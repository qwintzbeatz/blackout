// Add the types content from above
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

// East Auckland locations
export const EAST_AUCKLAND_LOCATIONS = {
  "Pakuranga Plaza": { 
    coords: [-36.8874, 174.8550] as [number, number], 
    description: "Major shopping center in East Auckland" 
  },
  "Howick Village": { 
    coords: [-36.8944, 174.9253] as [number, number], 
    description: "Historic village with cafes and shops" 
  },
  "Botany Town Centre": { 
    coords: [-36.9564, 174.9060] as [number, number], 
    description: "Large shopping mall and entertainment hub" 
  },
  "Maraetai Beach": { 
    coords: [-36.8809, 175.0390] as [number, number], 
    description: "Popular beach in East Auckland" 
  },
  "Musick Point": { 
    coords: [-36.8528, 174.9233] as [number, number], 
    description: "Historic point with golf course and views" 
  },
  "Lloyd Elsmore Park": { 
    coords: [-36.9152, 174.8943] as [number, number], 
    description: "Large park with sports facilities" 
  },
  "Highland Park": { 
    coords: [-36.9052, 174.9045] as [number, number], 
    description: "Suburban area with shopping center" 
  },
  "Bucklands Beach": { 
    coords: [-36.8650, 174.9050] as [number, number], 
    description: "Eastern suburb with coastal views" 
  },
  "Cockle Bay": { 
    coords: [-36.8864, 174.9589] as [number, number], 
    description: "Seaside suburb with bay views" 
  },
  "Somerville": { 
    coords: [-36.9436, 174.9186] as [number, number], 
    description: "Residential area near Botany" 
  }
} as const;