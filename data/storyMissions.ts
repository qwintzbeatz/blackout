export interface StoryMission {
  id: string;
  title: string;
  description: string;
  type: 'exploration' | 'marker' | 'social' | 'creative' | 'challenge';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  repReward: number;
  requirements?: string[];
  crewTrust?: Record<string, number>;
  location?: [number, number];
  duration?: number; // in hours
  isActive: boolean;
}

export const INITIAL_STORY_MISSIONS: StoryMission[] = [
  {
    id: 'act1_intro',
    title: 'Welcome to the Underground',
    description: 'Place your first marker and introduce yourself to the scene',
    type: 'marker',
    difficulty: 'easy',
    repReward: 25,
    requirements: [],
    isActive: true
  },
  {
    id: 'act1_explore',
    title: 'Know Your Territory',
    description: 'Visit 3 different NZ cities and explore their graffiti scenes',
    type: 'exploration',
    difficulty: 'easy',
    repReward: 50,
    requirements: ['act1_intro'],
    isActive: false
  },
  {
    id: 'act1_crew',
    title: 'Find Your Crew',
    description: 'Connect with local writers or join a crew',
    type: 'social',
    difficulty: 'medium',
    repReward: 75,
    requirements: ['act1_intro', 'act1_explore'],
    isActive: false
  }
];

export const DAILY_MISSIONS: StoryMission[] = [
  {
    id: 'daily_marker',
    title: 'Daily Tag',
    description: 'Place at least one marker today',
    type: 'marker',
    difficulty: 'easy',
    repReward: 15,
    isActive: true
  },
  {
    id: 'daily_social',
    title: 'Connect & Share',
    description: 'Comment on another writer\'s work or send a message',
    type: 'social',
    difficulty: 'easy',
    repReward: 10,
    isActive: true
  },
  {
    id: 'daily_explore',
    title: 'Urban Explorer',
    description: 'Discover a new spot in your city',
    type: 'exploration',
    difficulty: 'medium',
    repReward: 20,
    isActive: true
  }
];