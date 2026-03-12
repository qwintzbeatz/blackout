import { MarkerName, MarkerDescription, CrewId, Gender } from '@/constants/markers';
import { LocationInfo } from '@/constants/locations';
import { SurfaceType } from '@/constants/surfaces';
import { GraffitiType } from '@/constants/graffitiTypes';

// Re-export for convenience
export type { SurfaceType } from '@/constants/surfaces';
export type { GraffitiType } from '@/constants/graffitiTypes';
export type { Gender } from '@/constants/markers';

// Special marker effect types
export type SpecialMarkerType = 'rainbow' | 'glow' | 'metallic' | null;

export interface UserProfile {
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
  crewLastReadTimestamps?: Record<string, any>; // For tracking unread chat messages
  hasReceivedCrewWelcomeMessage?: boolean; // For tracking initial crew welcome
  lastViewedStoryTimestamp?: any; // For tracking when user last viewed story content
  // Graffiti style unlock fields
  unlockedGraffitiTypes?: string[]; // Array of unlocked graffiti type IDs
  activeGraffitiStyle?: string; // Currently selected active style
  // Crew style variant unlock fields
  unlockedStyleVariants?: string[]; // Array of unlocked style variant IDs (e.g., "bqc-tag-1")
  selectedStyleVariant?: string; // Currently selected style variant ID
  // Graffiti style unlocks (SVG + Font hybrid system)
  unlockedGraffitiStyles?: string[]; // Array of unlocked style IDs (e.g., "bqc-tag-svg-1", "bqc-tag-font-2")
  selectedGraffitiStyle?: string; // Currently selected style ID
  selectedStyleType?: 'svg' | 'font'; // Currently selected style type
  // Color unlock fields
  unlockedColors?: string[]; // Array of unlocked color IDs
  selectedColor?: string; // Currently selected color hex
  // Video unlock fields
  unlockedVideos?: string[]; // Array of unlocked video URLs
}

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

export interface TopCrew {
  crewId: string;
  name: string;
  fullName?: string;
  totalRep: number;
  memberCount: number;
  leaderName: string;
  leaderUsername: string;
  leaderProfilePicUrl: string;
  leaderPosition?: [number, number];
  color: string;
  accentColor: string;
  description?: string;
  createdAt?: Date;
  lastActive: Date;
  members?: Array<{
    uid: string;
    username: string;
    rep: number;
    position?: [number, number];
  }>;
}

export interface SoundCloudTrack {
  url: string;
  title: string;
  isLoaded: boolean;
  iframeId?: string;
}

export interface CrewData {
  id: string;
  name: string;
  leader: string;
  description: string;
  bonus: string;
  color: string;
  accentColor: string;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
  userProfilePic?: string;
}

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
  // Surface and Graffiti Type (new) - optional for backward compatibility
  surface?: SurfaceType;
  graffitiType?: GraffitiType;
  // Special color effect type (rainbow, glow, metallic)
  specialType?: SpecialMarkerType;
  // Graffiti style ID (e.g., "bqc-tag-svg-1", "default-tag")
  styleId?: string;
  // Advanced REP calculation (new)
  repBreakdown?: {
    surfaceBase: number;
    graffitiBase: number;
    surfaceMultiplier: number;
    difficultyMultiplier: number;
    totalMultiplier: number;
    totalRep: number;
    breakdown: {
      surface: string;
      graffiti: string;
      bonuses: string[];
    };
  };
  // Edit tracking
  isEdited?: boolean;
  editHistory?: MarkerEdit[];
}

export interface MarkerEdit {
  editedBy: string;
  editedAt: Date;
  previousName?: MarkerName;
  previousDescription?: MarkerDescription;
  previousSurface?: SurfaceType;
  previousGraffitiType?: GraffitiType;
  previousRep?: number;
  reason?: string;
}

export interface Drop {
  id?: string;
  firestoreId?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  trackUrl?: string;
  trackName?: string;
  source?: string;
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
  // Surface and graffiti type fields
  surface?: SurfaceType;
  graffitiType?: GraffitiType;
  // Photo metadata for GPS-tagged photos
  photoMetadata?: {
    hasLocation: boolean;
    originalLat?: number;
    originalLng?: number;
    timestamp: Date;
  };
}

export interface NearbyCrewMember {
  uid: string;
  username: string;
  distance: number;
}

export interface CrewChatMessage {
  id: string;
  text: string;
  senderUid: string;
  senderName: string;
  avatar?: string;
  timestamp: number;
}

export interface DirectMessage {
  id: string;
  fromUid: string;
  toUid: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface DirectChat {
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: number;
}

export interface CrewChatUnreadStatus {
  [crewId: string]: number;
}

// Story mission types
export interface StoryMission {
  id: string;
  title: string;
  description: string;
  reward: number;
  progressThreshold?: number;
  completed: boolean;
  unlocked: boolean;
}

export interface BlackoutEvent {
  id: string;
  title: string;
  description: string;
  location: [number, number];
  radius: number;
  startTime: Date;
  endTime: Date;
  active: boolean;
  reward: number;
}
