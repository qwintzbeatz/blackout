// ========== CONSOLIDATED HELPER FUNCTIONS ==========
// This file consolidates all utility functions from main page and existing helpers

import { MarkerDescription, Gender, UserMarker } from '@/types';
import { HIPHOP_TRACKS } from '@/lib/constants';

// ========== DISTANCE AND LOCATION FUNCTIONS ==========

// Helper function to calculate distance between two coordinates in meters (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Helper function to calculate bounds from markers
export const calculateBoundsFromMarkers = (markers: UserMarker[]): [[number, number], [number, number]] | null => {
  if (markers.length === 0) return null;
  
  const lats = markers.map(m => m.position[0]);
  const lngs = markers.map(m => m.position[1]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  return [[minLat, minLng], [maxLat, maxLng]];
};

// ========== REPUTATION AND RANKING FUNCTIONS ==========

// REP Calculation Functions
export const calculateRepForMarker = (distanceFromCenter: number | null, markerDescription: MarkerDescription): number => {
  let rep = 10; // Base REP for placing any marker
  
  if (distanceFromCenter && distanceFromCenter <= 50) {
    rep += 5;
  }
  
  switch (markerDescription) {
    case 'Piece/Bombing':
    case 'Burner/Heater':
      rep += 15;
      break;
    case 'Throw-Up':
    case 'Roller/Blockbuster':
      rep += 10;
      break;
    case 'Stencil/Brand/Stamp':
    case 'Paste-Up/Poster':
      rep += 8;
      break;
    case 'Tag/Signature':
      rep += 5;
      break;
    default:
      rep += 3;
  }
  
  return rep;
};

// Basic rank calculation (from main page)
export const calculateRank = (rep: number): string => {
  if (rep >= 300) return 'WRITER';
  if (rep >= 100) return 'VANDAL';
  return 'TOY';
};

// Basic level calculation (from main page)
export const calculateLevel = (rep: number): number => {
  return Math.floor(rep / 100) + 1;
};

// Enhanced ranking system with 70 unique ranks (from helpers.ts)
export const calculateEnhancedRank = (rep: number): string => {
  // Apprentice Phase
  if (rep >= 20000) return 'GRAFFITI OMEGA ⭐⭐⭐';
  if (rep >= 15000) return 'URBAN ETERNAL ♾️';
  if (rep >= 12000) return 'STREET IMMORTAL ♾️';
  if (rep >= 10000) return 'WALL PANTHEON 🏛️';
  if (rep >= 9000) return 'SPRAY DEITY 🏛️';
  if (rep >= 8000) return 'GRAFFITI TITAN 🏛️';
  if (rep >= 7000) return 'CITY CELESTIAL ⭐⭐';
  if (rep >= 6000) return 'URBAN ARCHMAGE ⭐⭐';
  if (rep >= 5000) return 'STREET SORCERER 🧙‍♂️';
  if (rep >= 4500) return 'WALL WARLOCK 🧙‍♂️';
  if (rep >= 4000) return 'SPRAY CAN SAGE 🔥';
  if (rep >= 3500) return 'GRAFFITI DEMIGOD 🔥';
  
  // Mythical Phase
  if (rep >= 3000) return 'URBAN MYTH 🌟';
  if (rep >= 2800) return 'STREET SOVEREIGN 👑';
  if (rep >= 2600) return "BUFFER'S BANE 👻";
  if (rep >= 2400) return 'CITY SHADOW 👻';
  if (rep >= 2200) return 'URBAN NINJA ⚔️';
  if (rep >= 2000) return 'STREET SAMURAI ⚔️';
  if (rep >= 1800) return 'WALL WHISPERER 🎨';
  if (rep >= 1600) return 'SPRAY GOD 🎨';
  if (rep >= 1400) return 'GRAFFITI DEITY ⭐';
  if (rep >= 1200) return 'URBAN LEGEND ⭐';
  
  // Elite Phase
  if (rep >= 1000) return 'STREET LEGEND ⭐';
  if (rep >= 980) return 'METROPOLIS MONARCH 👑';
  if (rep >= 950) return 'URBAN EMPEROR 👑';
  if (rep >= 920) return 'STREET KING 👑';
  if (rep >= 890) return 'BUFFER BREAKER';
  if (rep >= 860) return 'CITY MARKER';
  if (rep >= 830) return 'STREET PHILOSOPHER';
  if (rep >= 800) return 'URBAN PIONEER';
  if (rep >= 770) return 'RAIL ROYALTY';
  if (rep >= 740) return 'UNDERGROUND LEGEND';
  if (rep >= 710) return 'BUFFER NEMESIS';
  if (rep >= 680) return 'STYLE INNOVATOR';
  if (rep >= 650) return 'CITY COVERER';
  if (rep >= 620) return 'STREET ARTIST';
  if (rep >= 590) return 'WALL CONQUEROR';
  if (rep >= 560) return 'BOMBING GENERAL';
  if (rep >= 530) return 'PIECE MASTER';
  
  // Advanced Phase
  if (rep >= 500) return 'WRITER';
  if (rep >= 480) return 'STREET VETERAN';
  if (rep >= 460) return 'STYLE DEVELOPER';
  if (rep >= 440) return 'AREA DOMINATOR';
  if (rep >= 420) return 'BUFF RESISTANT';
  if (rep >= 400) return 'STREET TACTICIAN';
  if (rep >= 380) return 'LAYER LORD';
  if (rep >= 360) return 'COLOR THEORIST';
  if (rep >= 340) return 'OUTLINE SPECIALIST';
  if (rep >= 320) return 'TAG TEAMER';
  if (rep >= 300) return 'STREET SOLDIER';
  if (rep >= 280) return 'WALL CLAIMER';
  if (rep >= 260) return 'BURNER APPRENTICE';
  if (rep >= 240) return 'THROW-UP KING';
  if (rep >= 220) return 'FADE MASTER';
  if (rep >= 200) return 'SUBWAY RUNNER';
  if (rep >= 180) return 'NIGHT SHIFTER';
  if (rep >= 160) return 'WHEELMAN';
  if (rep >= 140) return 'SLAPPER';
  if (rep >= 120) return 'BOMBER';
  
  // Intermediate Phase
  if (rep >= 100) return 'VANDAL';
  if (rep >= 90) return 'BUFFER ESCAPER';
  if (rep >= 80) return 'ROLLER';
  if (rep >= 70) return 'STENCILER';
  if (rep >= 60) return 'FILL-IN';
  if (rep >= 50) return 'STREET TOY';
  if (rep >= 40) return 'SKETCHER';
  if (rep >= 30) return 'OUTLINE';
  if (rep >= 20) return 'MARKER KID';
  if (rep >= 10) return 'SCRIBBLER';
  
  // Apprentice Phase
  return 'TOY';
};

// Enhanced level calculation for more frequent level ups (from helpers.ts)
export const calculateEnhancedLevel = (rep: number): number => {
  return Math.floor(rep / 50) + 1; // More frequent level ups
};

// Rank progression tracking (from helpers.ts)
const rankTiers = [
  { name: 'TOY', repRequired: 0 },
  { name: 'SCRIBBLER', repRequired: 10 },
  { name: 'MARKER KID', repRequired: 20 },
  { name: 'OUTLINE', repRequired: 30 },
  { name: 'SKETCHER', repRequired: 40 },
  { name: 'STREET TOY', repRequired: 50 },
  { name: 'FILL-IN', repRequired: 60 },
  { name: 'STENCILER', repRequired: 70 },
  { name: 'ROLLER', repRequired: 80 },
  { name: 'BUFFER ESCAPER', repRequired: 90 },
  { name: 'VANDAL', repRequired: 100 },
  { name: 'BOMBER', repRequired: 120 },
  { name: 'SLAPPER', repRequired: 140 },
  { name: 'WHEELMAN', repRequired: 160 },
  { name: 'NIGHT SHIFTER', repRequired: 180 },
  { name: 'SUBWAY RUNNER', repRequired: 200 },
  { name: 'FADE MASTER', repRequired: 220 },
  { name: 'THROW-UP KING', repRequired: 240 },
  { name: 'BURNER APPRENTICE', repRequired: 260 },
  { name: 'WALL CLAIMER', repRequired: 280 },
  { name: 'STREET SOLDIER', repRequired: 300 },
  { name: 'TAG TEAMER', repRequired: 320 },
  { name: 'OUTLINE SPECIALIST', repRequired: 340 },
  { name: 'COLOR THEORIST', repRequired: 360 },
  { name: 'LAYER LORD', repRequired: 380 },
  { name: 'STREET TACTICIAN', repRequired: 400 },
  { name: 'BUFF RESISTANT', repRequired: 420 },
  { name: 'AREA DOMINATOR', repRequired: 440 },
  { name: 'STYLE DEVELOPER', repRequired: 460 },
  { name: 'STREET VETERAN', repRequired: 480 },
  { name: 'WRITER', repRequired: 500 },
  { name: 'PIECE MASTER', repRequired: 530 },
  { name: 'BOMBING GENERAL', repRequired: 560 },
  { name: 'WALL CONQUEROR', repRequired: 590 },
  { name: 'STREET ARTIST', repRequired: 620 },
  { name: 'CITY COVERER', repRequired: 650 },
  { name: 'STYLE INNOVATOR', repRequired: 680 },
  { name: 'BUFFER NEMESIS', repRequired: 710 },
  { name: 'UNDERGROUND LEGEND', repRequired: 740 },
  { name: 'RAIL ROYALTY', repRequired: 770 },
  { name: 'URBAN PIONEER', repRequired: 800 },
  { name: 'STREET PHILOSOPHER', repRequired: 830 },
  { name: 'CITY MARKER', repRequired: 860 },
  { name: 'BUFFER BREAKER', repRequired: 890 },
  { name: 'STREET KING', repRequired: 920 },
  { name: 'URBAN EMPEROR', repRequired: 950 },
  { name: 'METROPOLIS MONARCH', repRequired: 980 },
  { name: 'STREET LEGEND ⭐', repRequired: 1000 },
  { name: 'URBAN LEGEND ⭐', repRequired: 1200 },
  { name: 'GRAFFITI DEITY ⭐', repRequired: 1400 },
  { name: 'SPRAY GOD 🎨', repRequired: 1600 },
  { name: 'WALL WHISPERER 🎨', repRequired: 1800 },
  { name: 'STREET SAMURAI ⚔️', repRequired: 2000 },
  { name: 'URBAN NINJA ⚔️', repRequired: 2200 },
  { name: 'CITY SHADOW 👻', repRequired: 2400 },
  { name: "BUFFER'S BANE 👻", repRequired: 2600 },
  { name: 'STREET SOVEREIGN 👑', repRequired: 2800 },
  { name: 'URBAN MYTH 🌟', repRequired: 3000 },
  { name: 'GRAFFITI DEMIGOD 🔥', repRequired: 3500 },
  { name: 'SPRAY CAN SAGE 🔥', repRequired: 4000 },
  { name: 'WALL WARLOCK 🧙‍♂️', repRequired: 4500 },
  { name: 'STREET SORCERER 🧙‍♂️', repRequired: 5000 },
  { name: 'URBAN ARCHMAGE ⭐⭐', repRequired: 6000 },
  { name: 'CITY CELESTIAL ⭐⭐', repRequired: 7000 },
  { name: 'GRAFFITI TITAN 🏛️', repRequired: 8000 },
  { name: 'SPRAY DEITY 🏛️', repRequired: 9000 },
  { name: 'WALL PANTHEON 🏛️', repRequired: 10000 },
  { name: 'STREET IMMORTAL ♾️', repRequired: 12000 },
  { name: 'URBAN ETERNAL ♾️', repRequired: 15000 },
  { name: 'GRAFFITI OMEGA ⭐⭐⭐', repRequired: 20000 }
];

// Helper function to get rank progression info
export const getRankInfo = (rep: number) => {
  const currentRank = calculateEnhancedRank(rep);
  const currentIndex = rankTiers.findIndex(tier => tier.name === currentRank);
  const nextRank = currentIndex < rankTiers.length - 1 ? rankTiers[currentIndex + 1].name : null;
  const repToNext = nextRank ? rankTiers[currentIndex + 1].repRequired - rep : 0;
  
  let progress = 0;
  if (nextRank && currentIndex >= 0) {
    const currentTierRep = rankTiers[currentIndex].repRequired;
    const nextTierRep = rankTiers[currentIndex + 1].repRequired;
    progress = ((rep - currentTierRep) / (nextTierRep - currentTierRep)) * 100;
  } else {
    progress = 100;
  }
  
  return { 
    currentRank, 
    nextRank, 
    repToNext, 
    progress: Math.max(0, Math.min(100, progress))
  };
};

// ========== MUSIC AND MEDIA FUNCTIONS ==========

// Helper function to unlock a random track
export const unlockRandomTrack = (currentUnlocked: string[]): string[] => {
  // Get tracks that haven't been unlocked yet
  const availableTracks = HIPHOP_TRACKS.filter(track =>
    !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) return currentUnlocked;

  // Pick random track
  const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];

  return [...currentUnlocked, randomTrack];
};

// Helper function to get track name from URL
export const getTrackNameFromUrl = (url: string): string => {
  if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
  if (url.includes('soundcloud.com')) {
    // Extract track name from SoundCloud URL
    const segments = url.split('/');
    const trackSegment = segments[segments.length - 1];
    return trackSegment.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  return 'Unknown Track';
};

// Function to create SoundCloud iframe URL
export const createSoundCloudIframeUrl = (trackUrl: string): string => {
  const params = new URLSearchParams({
    url: trackUrl,
    color: 'ff5500',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'false',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
    sharing: 'false',
    buying: 'false',
    download: 'false',
    show_playcount: 'false',
    show_artwork: 'false',
    show_playlist: 'false'
  });
  
  return `https://w.soundcloud.com/player/?${params.toString()}`;
};

// ========== AVATAR GENERATION ==========

// Updated avatar generator function with gender-specific avatars and size parameter
export const generateAvatarUrl = (userId: string, username: string, gender?: Gender, size: number = 80): string => {
  const seed = username || userId;
  
  // Define avatar styles based on gender
  let avatarStyle = 'open-peeps'; // default style
  
  if (gender === 'male') {
    avatarStyle = 'adventurer'; // boyish/ masculine style
  } else if (gender === 'female') {
    avatarStyle = 'avataaars'; // girlish/ feminine style
  } else if (gender === 'other') {
    avatarStyle = 'bottts'; // alien/robot style for 'other'
  } else if (gender === 'prefer-not-to-say') {
    avatarStyle = 'identicon'; // android/geometric style
  }
  
  // Color palette for avatars
  const colors = [
    '4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316',
    '3b82f6', '06b6d4', '8b5cf6', 'ef4444', '84cc16', '14b8a6'
  ];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Construct URL based on style
  let url = '';
  
  switch (avatarStyle) {
    case 'adventurer': // Male (boyish)
      url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${selectedColor}&size=${size}`;
      break;
      
    case 'avataaars': // Female (girlish)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}&size=${size}`;
      break;
      
    case 'bottts': // Other (alien/robot)
      url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${selectedColor}&size=${size}`;
      break;
      
    case 'identicon': // Prefer not to say (android/geometric)
      url = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${selectedColor}&size=${size}`;
      break;
      
    default: // open-peeps as fallback
      url = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}&backgroundColor=${selectedColor}&size=${size}`;
  }
  
  return url;
};

// Simplified avatar generator (from helpers.ts)
export const generateSimpleAvatarUrl = (userId: string, username: string, gender?: string, size: number = 80): string => {
  // Use DiceBear API for free avatars
  const seed = username || userId;
  const colors = ['4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316'];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Build DiceBear URL with size parameter
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}&size=${size}`;
  
  // Add optional features based on gender
  if (gender === 'male' && Math.random() > 0.5) {
    url += '&facialHair=beard';
  }
  
  return url;
};

// ========== END OF HELPER FUNCTIONS ==========