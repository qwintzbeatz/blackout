// components/story/StoryManager.tsx
'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  StoryProgress,
  StoryMission,
  MissionStatus,
  Clue,
  DisappearanceReport,
  CrewId
} from '@/lib/types/story';
import { UserProfile, PlayerCharacter } from '@/lib/types/blackout';

// Import initial missions (we'll create this next)
import { INITIAL_STORY_MISSIONS, DAILY_MISSIONS } from '@/data/storyMissions';

interface StoryManagerContextType {
  // State
  storyProgress: StoryProgress | null;
  activeMission: StoryMission | null;
  availableMissions: StoryMission[];
  completedMissions: StoryMission[];
  crewTrust: Record<CrewId, number>;
  cluesFound: Clue[];
  disappearances: DisappearanceReport[];
  
  // Actions
  startMission: (missionId: string) => Promise<void>;
  completeObjective: (missionId: string, objectiveId: string, progress?: number) => Promise<void>;
  completeMission: (missionId: string) => Promise<void>;
  failMission: (missionId: string, reason?: string) => Promise<void>;
  abandonMission: (missionId: string) => Promise<void>;
  addClue: (clue: Omit<Clue, 'id' | 'foundAtTime'>) => Promise<void>;
  reportDisappearance: (markerId: string, location: [number, number]) => Promise<void>;
  updateCrewTrust: (crewId: CrewId, amount: number) => Promise<void>;
  unlockPlotReveal: (act: number) => Promise<void>;
  makeDecision: (decision: keyof StoryProgress['decisions'], value: any) => Promise<void>;
  
  // Getters
  getMissionStatus: (missionId: string) => MissionStatus;
  getCrewTrustLevel: (crewId: CrewId) => number;
  getStoryCompletion: () => number;
  getNextStoryMission: () => StoryMission | null;
  
  // Loading
  loading: boolean;
  error: string | null;
}

const StoryManagerContext = createContext<StoryManagerContextType | undefined>(undefined);

interface StoryManagerProviderProps {
  children: ReactNode;
  user: User | null;
  userProfile?: UserProfile | null;
}

export const StoryManagerProvider: React.FC<StoryManagerProviderProps> = ({
  children,
  user,
  userProfile
}) => {
  const [storyProgress, setStoryProgress] = useState<StoryProgress | null>(null);
  const [activeMission, setActiveMission] = useState<StoryMission | null>(null);
  const [availableMissions, setAvailableMissions] = useState<StoryMission[]>([]);
  const [completedMissions, setCompletedMissions] = useState<StoryMission[]>([]);
  const [crewTrust, setCrewTrust] = useState<Record<CrewId, number>>({
    bqc: 0,
    sps: 0,
    lzt: 0,
    dgc: 0
  });
  const [cluesFound, setCluesFound] = useState<Clue[]>([]);
  const [disappearances, setDisappearances] = useState<DisappearanceReport[]>([]);
  const [playerCharacter, setPlayerCharacter] = useState<PlayerCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load player character when user profile changes
  useEffect(() => {
    if (userProfile?.playerCharacterId) {
      loadPlayerCharacter();
    } else {
      setPlayerCharacter(null);
    }
  }, [userProfile?.playerCharacterId]);

  const loadPlayerCharacter = async () => {
    if (!userProfile?.playerCharacterId) return;
    
    try {
      // Import characters directly
      import('@/lib/types/playerCharacters').then((characters) => {
        const character = characters.ALL_PLAYER_CHARACTERS.find(
          (c: PlayerCharacter) => c.id === userProfile.playerCharacterId
        );
        
        if (character) {
          setPlayerCharacter(character);
        }
      }).catch((err) => {
        console.error('Error loading player character:', err);
      });
    } catch (err) {
      console.error('Error loading player character:', err);
    }
  };

  // Initialize story progress when user logs in
  useEffect(() => {
    if (user) {
      initializeStoryProgress();
    } else {
      // Reset state when user logs out
      setStoryProgress(null);
      setActiveMission(null);
      setAvailableMissions([]);
      setCompletedMissions([]);
      setCrewTrust({ bqc: 0, sps: 0, lzt: 0, dgc: 0 });
      setCluesFound([]);
      setDisappearances([]);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  // Load story progress from Firestore
  useEffect(() => {
    if (!user) {
      setStoryProgress(null);
      setLoading(false);
      return;
    }

    const loadStoryProgress = async () => {
      try {
        setLoading(true);
        const storyRef = doc(db, 'storyProgress', user.uid);
        const storySnap = await getDoc(storyRef);

        if (storySnap.exists()) {
          const data = storySnap.data();
          const progress: StoryProgress = {
            userId: user.uid,
            currentAct: data.currentAct || 1,
            currentChapter: data.currentChapter || 1,
            activeMissionId: data.activeMissionId,
            completedMissions: data.completedMissions || [],
            failedMissions: data.failedMissions || [],
            crewTrust: data.crewTrust || { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
            cluesFound: data.cluesFound?.map((c: any) => ({
              ...c,
              foundAtTime: c.foundAtTime?.toDate() || new Date()
            })) || [],
            disappearancesInvestigated: data.disappearancesInvestigated?.map((d: any) => ({
              ...d,
              disappearedAt: d.disappearedAt?.toDate() || new Date()
            })) || [],
            plotRevealed: data.plotRevealed || {
              act1: false,
              act2: false,
              act3: false,
              act4: false,
              act5: false,
              act6: false
            },
            decisions: data.decisions || {},
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            totalPlayTime: data.totalPlayTime || 0,
            storyPoints: data.storyPoints || 0
          };
          
          setStoryProgress(progress);
          setCrewTrust(progress.crewTrust);
          setCluesFound(progress.cluesFound);
          setDisappearances(progress.disappearancesInvestigated);
          
          // Load missions
          await loadMissions(progress);
        } else {
          // Initialize new story progress
          await initializeStoryProgress();
        }
      } catch (err: any) {
        console.error('Error loading story progress:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStoryProgress();
  }, [user]);

  const initializeStoryProgress = async () => {
    if (!user) return;

    try {
      const initialProgress: StoryProgress = {
        userId: user.uid,
        currentAct: 1,
        currentChapter: 1,
        completedMissions: [],
        failedMissions: [],
        crewTrust: { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
        cluesFound: [],
        disappearancesInvestigated: [],
        plotRevealed: {
          act1: false,
          act2: false,
          act3: false,
          act4: false,
          act5: false,
          act6: false
        },
        decisions: {},
        lastUpdated: new Date(),
        totalPlayTime: 0,
        storyPoints: 0
      };

      const storyRef = doc(db, 'storyProgress', user.uid);
      await setDoc(storyRef, {
        ...initialProgress,
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(initialProgress);
      setCrewTrust(initialProgress.crewTrust);
      
      // Load initial missions
      await loadMissions(initialProgress);
    } catch (err: any) {
      console.error('Error initializing story progress:', err);
      setError(err.message);
    }
  };

  const loadMissions = async (progress: StoryProgress) => {
    try {
      // Filter missions based on current progress
      const allMissions = [...INITIAL_STORY_MISSIONS, ...DAILY_MISSIONS];
      
      const available = allMissions.filter(mission => {
        // Check if mission is already completed
        if (progress.completedMissions.includes(mission.id)) return false;
        
        // Check if mission is failed
        if (progress.failedMissions.includes(mission.id)) return false;
        
        // Check act requirement
        if (mission.act > progress.currentAct) return false;
        
        // Check chapter requirement
        if (mission.chapter > progress.currentChapter) return false;
        
        // Check required missions
        if (mission.requiredMissions && mission.requiredMissions.length > 0) {
          return mission.requiredMissions.every(id => 
            progress.completedMissions.includes(id)
          );
        }
        
        // Check crew requirement - simplified for now
        if (mission.requiredCrew && mission.requiredCrew !== 'any') {
          // For now, allow all missions to be available
          // This will be enhanced when we have user profile data
          return true;
        }
        
        return true;
      });
      
      setAvailableMissions(available);
      
      // Set active mission
      if (progress.activeMissionId) {
        const active = allMissions.find(m => m.id === progress.activeMissionId);
        setActiveMission(active || null);
      }
      
      // Load completed missions
      const completed = allMissions.filter(mission => 
        progress.completedMissions.includes(mission.id)
      );
      setCompletedMissions(completed);
      
    } catch (err: any) {
      console.error('Error loading missions:', err);
      setError(err.message);
    }
  };

  const startMission = async (missionId: string) => {
    if (!user || !storyProgress) return;

    try {
      const mission = [...INITIAL_STORY_MISSIONS, ...DAILY_MISSIONS].find(m => m.id === missionId);
      if (!mission) throw new Error('Mission not found');

      // Update Firestore
      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        activeMissionId: missionId,
        lastUpdated: Timestamp.now()
      });

      // Update local state
      setStoryProgress(prev => prev ? {
        ...prev,
        activeMissionId: missionId,
        lastUpdated: new Date()
      } : null);
      
      setActiveMission(mission);
      
      // Remove from available missions
      setAvailableMissions(prev => prev.filter(m => m.id !== missionId));

      console.log(`Started mission: ${mission.title}`);

    } catch (err: any) {
      console.error('Error starting mission:', err);
      setError(err.message);
    }
  };

  const completeObjective = async (missionId: string, objectiveId: string, progress?: number) => {
    if (!user || !activeMission || activeMission.id !== missionId) return;

    try {
      // Find the objective
      const objectiveIndex = activeMission.objectives.findIndex(obj => obj.id === objectiveId);
      if (objectiveIndex === -1) return;

      const objective = activeMission.objectives[objectiveIndex];
      
      // Update progress
      const newProgress = progress !== undefined ? progress : objective.progress + 1;
      const isCompleted = newProgress >= objective.maxProgress;

      // Clone and update objectives
      const updatedObjectives = [...activeMission.objectives];
      updatedObjectives[objectiveIndex] = {
        ...objective,
        progress: Math.min(newProgress, objective.maxProgress),
        completed: isCompleted
      };

      // Update local state
      const updatedMission = {
        ...activeMission,
        objectives: updatedObjectives
      };
      
      setActiveMission(updatedMission);

      // Check if all objectives are completed
      const allCompleted = updatedObjectives.every(obj => obj.completed);
      if (allCompleted) {
        // Mission is ready to be completed
        console.log(`Mission ${missionId} objectives completed! Ready to complete mission.`);
      }

    } catch (err: any) {
      console.error('Error completing objective:', err);
      setError(err.message);
    }
  };

  const completeMission = async (missionId: string) => {
    if (!user || !storyProgress) return;

    try {
      const mission = [...INITIAL_STORY_MISSIONS, ...DAILY_MISSIONS].find(m => m.id === missionId);
      if (!mission) throw new Error('Mission not found');

      // Calculate new progress
      const newCompletedMissions = [...storyProgress.completedMissions, missionId];
      const newStoryPoints = storyProgress.storyPoints + mission.rewards.rep;
      
      // Update crew trust
      const newCrewTrust = { ...storyProgress.crewTrust };
      Object.entries(mission.rewards.crewTrust).forEach(([crewId, amount]) => {
        newCrewTrust[crewId as CrewId] = (newCrewTrust[crewId as CrewId] || 0) + (amount as number);
      });

      // Check if this unlocks the next act/chapter
      let newAct = storyProgress.currentAct;
      let newChapter = storyProgress.currentChapter;
      
      if (mission.isMainStory) {
        // Find next main story mission
        const nextMission = INITIAL_STORY_MISSIONS.find(m => 
          m.act === mission.act && 
          m.chapter === mission.chapter + 1 &&
          m.isMainStory
        );
        
        if (nextMission) {
          newChapter = mission.chapter + 1;
        } else {
          // Move to next act
          const nextActMission = INITIAL_STORY_MISSIONS.find(m => 
            m.act === mission.act + 1 && 
            m.chapter === 1 &&
            m.isMainStory
          );
          
          if (nextActMission) {
            newAct = mission.act + 1;
            newChapter = 1;
          }
        }
      }

      // Update Firestore
      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        completedMissions: newCompletedMissions,
        activeMissionId: null,
        crewTrust: newCrewTrust,
        currentAct: newAct,
        currentChapter: newChapter,
        storyPoints: newStoryPoints,
        lastUpdated: Timestamp.now()
      });

      // Also update user's REP in users collection
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        rep: storyProgress.storyPoints + mission.rewards.rep,
        lastUpdated: Timestamp.now()
      });

      // Update local state
      const updatedProgress: StoryProgress = {
        ...storyProgress,
        completedMissions: newCompletedMissions,
        activeMissionId: undefined,
        crewTrust: newCrewTrust,
        currentAct: newAct,
        currentChapter: newChapter,
        storyPoints: newStoryPoints,
        lastUpdated: new Date()
      };

      setStoryProgress(updatedProgress);
      setCrewTrust(newCrewTrust);
      setActiveMission(null);
      setCompletedMissions(prev => [...prev, mission]);
      setAvailableMissions(prev => prev.filter(m => m.id !== missionId));

      console.log(`Completed mission: ${mission.title}`);
      console.log(`Rewards: ${mission.rewards.rep} REP, Crew Trust updated`);

      // Show completion notification (you can implement this)
      // showNotification(`🎉 Mission Complete: ${mission.title}`, `+${mission.rewards.rep} REP`);

    } catch (err: any) {
      console.error('Error completing mission:', err);
      setError(err.message);
    }
  };

  const failMission = async (missionId: string, reason?: string) => {
    if (!user || !storyProgress) return;

    try {
      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        failedMissions: [...storyProgress.failedMissions, missionId],
        activeMissionId: null,
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(prev => prev ? {
        ...prev,
        failedMissions: [...prev.failedMissions, missionId],
        activeMissionId: undefined,
        lastUpdated: new Date()
      } : null);
      
      setActiveMission(null);
      setAvailableMissions(prev => prev.filter(m => m.id !== missionId));

      console.log(`Failed mission: ${missionId}`, reason);

    } catch (err: any) {
      console.error('Error failing mission:', err);
      setError(err.message);
    }
  };

  const abandonMission = async (missionId: string) => {
    if (!user || !storyProgress) return;

    try {
      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        activeMissionId: null,
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(prev => prev ? {
        ...prev,
        activeMissionId: undefined,
        lastUpdated: new Date()
      } : null);
      
      setActiveMission(null);
      
      // Add back to available missions
      const mission = [...INITIAL_STORY_MISSIONS, ...DAILY_MISSIONS].find(m => m.id === missionId);
      if (mission) {
        setAvailableMissions(prev => [...prev, mission]);
      }

      console.log(`Abandoned mission: ${missionId}`);

    } catch (err: any) {
      console.error('Error abandoning mission:', err);
      setError(err.message);
    }
  };

  const addClue = async (clueData: Omit<Clue, 'id' | 'foundAtTime'>) => {
    if (!user || !storyProgress) return;

    try {
      const clue: Clue = {
        ...clueData,
        id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        foundAtTime: new Date()
      };

      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        cluesFound: [...storyProgress.cluesFound, clue],
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(prev => prev ? {
        ...prev,
        cluesFound: [...prev.cluesFound, clue],
        lastUpdated: new Date()
      } : null);
      
      setCluesFound(prev => [...prev, clue]);

      console.log(`Added clue: ${clue.title}`);

    } catch (err: any) {
      console.error('Error adding clue:', err);
      setError(err.message);
    }
  };

  const reportDisappearance = async (markerId: string, location: [number, number]) => {
    if (!user || !storyProgress) return;

    try {
      const disappearance: DisappearanceReport = {
        id: `disappearance-${Date.now()}`,
        markerId,
        disappearedAt: new Date(),
        location,
        reporterId: user.uid,
        reporterName: 'Anonymous',
        crewId: 'bqc',
        investigationStatus: 'reported',
        cluesFound: [],
        suspectedCrew: undefined,
        notes: 'Fresh disappearance reported'
      };

      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        disappearancesInvestigated: [...storyProgress.disappearancesInvestigated, disappearance],
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(prev => prev ? {
        ...prev,
        disappearancesInvestigated: [...prev.disappearancesInvestigated, disappearance],
        lastUpdated: new Date()
      } : null);
      
      setDisappearances(prev => [...prev, disappearance]);

      console.log(`Reported disappearance at ${location}`);

      // Trigger investigation mission if not already active
      const investigationMission = availableMissions.find(m => 
        m.id === 'investigation_1' && !storyProgress.completedMissions.includes('investigation_1')
      );
      
      if (investigationMission) {
        await startMission('investigation_1');
      }

    } catch (err: any) {
      console.error('Error reporting disappearance:', err);
      setError(err.message);
    }
  };

  const updateCrewTrust = async (crewId: CrewId, amount: number) => {
    if (!user || !storyProgress) return;

    try {
      const newTrust = { ...storyProgress.crewTrust };
      newTrust[crewId] = Math.max(0, (newTrust[crewId] || 0) + amount);

      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        crewTrust: newTrust,
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(prev => prev ? {
        ...prev,
        crewTrust: newTrust,
        lastUpdated: new Date()
      } : null);
      
      setCrewTrust(newTrust);

      console.log(`Updated ${crewId} trust: ${newTrust[crewId]}`);

    } catch (err: any) {
      console.error('Error updating crew trust:', err);
      setError(err.message);
    }
  };

  const unlockPlotReveal = async (act: number) => {
    if (!user || !storyProgress) return;

    try {
      const plotKey = `act${act}` as keyof StoryProgress['plotRevealed'];
      
      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        [`plotRevealed.${plotKey}`]: true,
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(prev => prev ? {
        ...prev,
        plotRevealed: {
          ...prev.plotRevealed,
          [plotKey]: true
        },
        lastUpdated: new Date()
      } : null);

      console.log(`Unlocked plot reveal for Act ${act}`);

    } catch (err: any) {
      console.error('Error unlocking plot reveal:', err);
      setError(err.message);
    }
  };

  const makeDecision = async (decision: keyof StoryProgress['decisions'], value: any) => {
    if (!user || !storyProgress) return;

    try {
      const storyRef = doc(db, 'storyProgress', user.uid);
      await updateDoc(storyRef, {
        [`decisions.${decision}`]: value,
        lastUpdated: Timestamp.now()
      });

      setStoryProgress(prev => prev ? {
        ...prev,
        decisions: {
          ...prev.decisions,
          [decision]: value
        },
        lastUpdated: new Date()
      } : null);

      console.log(`Made decision: ${decision} = ${value}`);

    } catch (err: any) {
      console.error('Error making decision:', err);
      setError(err.message);
    }
  };

  const getMissionStatus = (missionId: string): MissionStatus => {
    if (!storyProgress) return 'locked';
    
    if (storyProgress.completedMissions.includes(missionId)) return 'completed';
    if (storyProgress.failedMissions.includes(missionId)) return 'failed';
    if (storyProgress.activeMissionId === missionId) return 'active';
    
    const mission = [...INITIAL_STORY_MISSIONS, ...DAILY_MISSIONS].find(m => m.id === missionId);
    if (!mission) return 'locked';
    
    // Check requirements
    if (mission.act > storyProgress.currentAct) return 'locked';
    if (mission.chapter > storyProgress.currentChapter) return 'locked';
    
    if (mission.requiredMissions && mission.requiredMissions.length > 0) {
      const allRequiredCompleted = mission.requiredMissions.every(id => 
        storyProgress.completedMissions.includes(id)
      );
      if (!allRequiredCompleted) return 'locked';
    }
    
    return 'available';
  };

  const getCrewTrustLevel = (crewId: CrewId): number => {
    return crewTrust[crewId] || 0;
  };

  const getStoryCompletion = (): number => {
    if (!storyProgress) return 0;
    
    const totalMainMissions = INITIAL_STORY_MISSIONS.filter(m => m.isMainStory).length;
    const completedMainMissions = INITIAL_STORY_MISSIONS.filter(m => 
      m.isMainStory && storyProgress.completedMissions.includes(m.id)
    ).length;
    
    return Math.round((completedMainMissions / totalMainMissions) * 100);
  };

  const getNextStoryMission = (): StoryMission | null => {
    if (!storyProgress) return null;
    
    const nextMission = INITIAL_STORY_MISSIONS.find(m => 
      m.isMainStory &&
      m.act === storyProgress.currentAct &&
      m.chapter === storyProgress.currentChapter &&
      !storyProgress.completedMissions.includes(m.id) &&
      !storyProgress.failedMissions.includes(m.id)
    );
    
    return nextMission || null;
  };

  const value: StoryManagerContextType = {
    // State
    storyProgress,
    activeMission,
    availableMissions,
    completedMissions,
    crewTrust,
    cluesFound,
    disappearances,
    
    // Actions
    startMission,
    completeObjective,
    completeMission,
    failMission,
    abandonMission,
    addClue,
    reportDisappearance,
    updateCrewTrust,
    unlockPlotReveal,
    makeDecision,
    
    // Getters
    getMissionStatus,
    getCrewTrustLevel,
    getStoryCompletion,
    getNextStoryMission,
    
    // Loading
    loading,
    error
  };

  return (
    <StoryManagerContext.Provider value={value}>
      {children}
    </StoryManagerContext.Provider>
  );
};

// Custom hook to use the story manager
export const useStoryManager = () => {
  const context = useContext(StoryManagerContext);
  if (context === undefined) {
    console.warn('useStoryManager used without StoryManagerProvider');
    // Return a default value to prevent crashes
    return {
      storyProgress: null,
      activeMission: null,
      availableMissions: [],
      completedMissions: [],
      crewTrust: { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
      cluesFound: [],
      disappearances: [],
      startMission: async () => {},
      completeObjective: async () => {},
      completeMission: async () => {},
      failMission: async () => {},
      abandonMission: async () => {},
      addClue: async () => {},
      reportDisappearance: async () => {},
      updateCrewTrust: async () => {},
      unlockPlotReveal: async () => {},
      makeDecision: async () => {},
      getMissionStatus: () => 'locked' as MissionStatus,
      getCrewTrustLevel: () => 0,
      getStoryCompletion: () => 0,
      getNextStoryMission: () => null,
      loading: false,
      error: null
    };
  }
  return context;
};
