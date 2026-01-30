export interface StoryMission {
  id: string;
  act: number;
  title: string;
  description: string;
  objectives: Array<{
    type: 'place_marker' | 'take_photo' | 'reach_location' | 'collaborate';
    target?: any;
    progress: number;
    required: number;
  }>;
  requiredCrew?: string;
  reward: {
    rep: number;
    unlockedTracks?: string[];
    abilities?: string[];
  };
  nextMissionId?: string;
}

export const STORY_MISSIONS: StoryMission[] = [
  {
    id: 'act1_intro',
    act: 1,
    title: 'First Tags',
    description: 'Place your first 3 markers to establish your presence in the scene',
    objectives: [
      { type: 'place_marker', progress: 0, required: 3 }
    ],
    reward: { rep: 50, unlockedTracks: [] }
  },
  {
    id: 'act1_join_crew',
    act: 1,
    title: 'Choose Your Crew',
    description: 'Every writer needs a crew. Join one to continue your journey',
    objectives: [
      { type: 'reach_location', target: { crew: 'any' }, progress: 0, required: 1 }
    ],
    reward: { rep: 100, abilities: ['crew_chat'] }
  }
];

export function checkMissionCompletion(
  mission: StoryMission,
  playerStats: { markersPlaced: number; crewId?: string }
): boolean {
  // Implementation logic
  return mission.objectives.every(obj => {
    switch (obj.type) {
      case 'place_marker':
        return playerStats.markersPlaced >= obj.required;
      default:
        return false;
    }
  });
}