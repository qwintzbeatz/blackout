// lib/types/blackout.ts

import { CrewId } from './story';
import { Timestamp } from 'firebase/firestore';

// Base marker types
export type MarkerName = 'Pole' | 'Sign' | 'E.Box' | 'Fence' | 'Wall' | 'Shutter' | 'Sewer' | 'Rooftop' | 'Ground' | 'Train' | 'Bridge' | 'Traffic Light' | 'Truck' | 'Van' | 'Post Box' | 'Speed Camera' | 'ATM Machine' | 'Bus Stop';
export type MarkerDescription = 'Sticker/Slap' | 'Stencil/Brand/Stamp' | 'Tag/Signature' | 'Etch/Scribe/Scratch' | 'Throw-Up' | 'Paste-Up/Poster' | 'Piece/Bombing' | 'Burner/Heater' | 'Roller/Blockbuster' | 'Extinguisher' | 'Mural';
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

// Crew Member type
export interface CrewMember {
  name: string;
  role: string;
  description: string;
  secret: string;
}

// Crew type (matches your crews.ts structure)
export interface Crew {
  id: string;
  name: string;
  fullName: string;
  description: string;
  leader: string;
  leaderBio: string;
  color: string;
  accentColor: string;
  bonus: string;
  style: string;
  motivation: string;
  plotTwist: string;
  members: CrewMember[];
}

// Comment type
export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
  userProfilePic?: string;
}

// Re-export surface and graffiti types from constants for consistency
// Note: These are used throughout the app - import from constants for the actual config
export type SurfaceType = 'pole' | 'sign' | 'ebox' | 'fence' | 'wall' | 'shutter' | 'sewer' | 'rooftop' | 'ground' | 'train' | 'bridge' | 'traffic_light' | 'truck' | 'van' | 'postbox' | 'speed_camera' | 'bus_stop';
export type GraffitiType = 'tag' | 'throw_up' | 'piece_bombing' | 'burner_heater' | 'roller_blockbuster' | 'stencil_brand_stamp' | 'paste_up_poster' | 'sticker_slap' | 'etch_scribe_scratch' | 'extinguisher' | 'mural';

// User Marker type
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
  repEarned?: number;
  createdAt?: Date;
  likes?: string[];
  comments?: Comment[];
  // New surface and graffiti type fields
  surface?: SurfaceType;
  graffitiType?: GraffitiType;
}

// Drop type
export interface Drop {
  id?: string;
  firestoreId?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  trackUrl?: string;
  createdBy: string;
  timestamp: Date;
  likes: string[];
  comments?: Comment[];
  username: string;
  userProfilePic: string;
  // Additional properties used in UI
  userId?: string;
  color?: string;
  repEarned?: number;
  markerType?: string;
  // Photo metadata for GPS-tagged photos
  photoMetadata?: {
    hasLocation: boolean;
    originalLat?: number;
    originalLng?: number;
    timestamp: Date;
  };
}

// User Profile type
export interface UserProfile {
  playerCharacterId?: string | null;
  uid: string;
  email: string;
  username: string;
  gender: Gender;
  profilePicUrl: string;
  rep: number;
  level: number;
  rank: string;
  totalMarkers: number;
  favoriteColor?: string;
  createdAt: Date;
  lastActive: Date;
  isSolo?: boolean;
  crewName?: string | null;
  crewId?: CrewId | null;
  isLeader?: boolean;
  unlockedTracks?: string[];
  crewJoinedAt?: Date | null;
  crewRank?: string;
  crewRep?: number;
  currentAct?: number;
  storyProgress?: number;
  markersPlaced?: number;
  photosTaken?: number;
  collaborations?: number;
  blackoutEventsInvestigated?: number;
  kaiTiakiEvaluationsReceived?: number;
  // Story mission fields
  activeMissions?: string[];
  completedMissions?: string[];
  // Rank progression fields
  nextRank?: string;
  repToNextRank?: number;
  rankProgressPercentage?: number;
  crewLastReadTimestamps?: Record<CrewId, Timestamp>; // New field for tracking unread chat messages
  hasReceivedCrewWelcomeMessage?: boolean; // New field for tracking if player received initial crew welcome
  lastViewedStoryTimestamp?: Timestamp; // New field for tracking when user last viewed story content
}

// Top Player type
export interface TopPlayer {
  uid: string;
  username: string;
  profilePicUrl: string;
  rank: string;
  rep: number;
  level: number;
  totalMarkers: number;
  position?: [number, number];
  lastActive: Date;
}

// SoundCloud Track type
export interface SoundCloudTrack {
  url: string;
  title: string;
  isLoaded: boolean;
  iframeId?: string;
}

// Location Info type
export interface LocationInfo {
  coords: [number, number];
  description: string;
}

// Nearby Crew Member type
export interface NearbyCrewMember {
  uid: string;
  username: string;
  distance: number;
}

// Player Character type reference
export interface PlayerCharacter {
  id: string;
  name: string;
  nickname?: string;
  bio: string;
  age: number;
  background: string;
  motivations: string[];
  personalityTraits: string[];
  specialAbilities: string[];
  weaknesses: string[];
  storyArc: string;
  dialogStyle: string;
  appearance: {
    gender: 'male' | 'female' | 'non-binary';
    height: string;
    build: string;
    hairStyle: string;
    clothingStyle: string;
    accessories: string[];
  };
  defaultCrew: string;
  crewRoles: string[];
  loyaltyScore: number;
  trustIssues: string[];
  stats: {
    artisticSkill: number;
    technicalSkill: number;
    socialSkill: number;
    stealthSkill: number;
    leadershipSkill: number;
  };
  characterGrowth: {
    startingBeliefs: string[];
    finalBeliefs: string[];
    keyDecisions: string[];
    plotImpact: string[];
  };
  relationships: {
    [crewId in CrewId]: {
      startingOpinion: number;
      maxOpinion: number;
      minOpinion: number;
      dialogueKeys: string[];
    };
  };
}

// Crew Data type (for simple crew selection)
export interface CrewData {
  id: string;
  name: string;
  leader: string;
  description: string;
  bonus: string;
  color: string;
  accentColor: string;
}

// Crew Chat Message type
export interface CrewChatMessage {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  avatar?: string;
  timestamp: number;
}

// Direct Message type
export interface DirectMessage {
  id: string;
  fromUid: string;
  toUid: string;
  text: string;
  timestamp: number;
  read: boolean;
}

// Direct Chat type
export interface DirectChat {
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: number;
}

// Crew Chat Unread Status type
export interface CrewChatUnreadStatus {
  [crewId: string]: number;
}
