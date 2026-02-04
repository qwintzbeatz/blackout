import { MarkerName, MarkerDescription, CrewId, Gender } from '@/constants/markers';
import { LocationInfo } from '@/constants/locations';

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
}

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
  username: string;
  userProfilePic: string;
}

export interface NearbyCrewMember {
  uid: string;
  username: string;
  distance: number;
}

export interface CrewChatMessage {
  id: string;
  text: string;
  uid: string;
  username: string;
  avatar?: string;
  timestamp: number;
  failed?: boolean;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePic: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'location' | 'photo' | 'crew_invite';
  location?: [number, number];
  photoUrl?: string;
}

export interface DirectChat {
  chatId: string;
  participantIds: string[];
  participantNames: string[];
  participantProfilePics: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}