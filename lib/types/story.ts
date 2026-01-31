// lib/types/story.ts
import { Timestamp } from 'firebase/firestore';

export type CrewId = 'bqc' | 'sps' | 'lzt' | 'dgc' | string;
export type MissionType = 'investigation' | 'placement' | 'collaboration' | 'exploration' | 'story' | 'crew';
export type MissionStatus = 'locked' | 'available' | 'active' | 'completed' | 'failed';
export type TriggerType = 'marker_placed' | 'rep_reached' | 'location_visited' | 'crew_trust' | 'mission_completed' | 'time_elapsed';

export interface MissionObjective {
  id: string;
  type: MissionType;
  description: string;
  target: {
    type: 'count' | 'location' | 'quality' | 'collaboration' | 'investigation';
    value: number | string | [number, number];
    required?: number;
  };
  completed: boolean;
  progress: number;
  maxProgress: number;
}

export interface MissionReward {
  rep: number;
  crewTrust: Partial<Record<CrewId, number>>;
  unlockedTracks?: string[];
  unlockedAbilities?: string[];
  items?: string[];
  storyClues?: string[];
}

export interface StoryMission {
  id: string;
  act: number;
  chapter: number;
  title: string;
  subtitle: string;
  description: string;
  storyText: string[];
  requiredCrew?: CrewId | 'any' | 'none';
  requiredMissions?: string[]; // IDs of missions that must be completed first
  trigger: {
    type: TriggerType;
    value: any;
  };
  objectives: MissionObjective[];
  rewards: MissionReward;
  locationHint?: {
    coords: [number, number];
    radius: number;
    description: string;
  };
  timeLimit?: number; // in hours
  isMainStory: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  createdAt: Date;
  updatedAt: Date;
}

export interface Clue {
  id: string;
  title: string;
  description: string;
  foundAt: [number, number];
  foundAtTime: Date;
  missionId: string;
  crewHint?: CrewId;
  isRedHerring: boolean;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface DisappearanceReport {
  id: string;
  markerId: string;
  disappearedAt: Date;
  location: [number, number];
  reporterId: string;
  reporterName: string;
  crewId: CrewId;
  investigationStatus: 'reported' | 'investigating' | 'solved' | 'unsolved';
  cluesFound: string[]; // Clue IDs
  suspectedCrew?: CrewId;
  notes?: string;
}

export interface StoryProgress {
  userId: string;
  currentAct: number;
  currentChapter: number;
  activeMissionId?: string;
  completedMissions: string[];
  failedMissions: string[];
  crewTrust: Record<CrewId, number>;
  cluesFound: Clue[];
  disappearancesInvestigated: DisappearanceReport[];
  plotRevealed: {
    act1: boolean; // The Vanishing
    act2: boolean; // The Patterns
    act3: boolean; // The Betrayal
    act4: boolean; // The Resistance
    act5: boolean; // The Final Gallery
    act6: boolean; // The New Dawn
  };
  decisions: {
    crewJoined?: CrewId;
    betrayedCrew?: boolean;
    joinedResistance?: boolean;
    finalChoice?: 'forgive' | 'punish' | 'reform';
  };
  lastUpdated: Date;
  totalPlayTime: number; // in minutes
  storyPoints: number;
}