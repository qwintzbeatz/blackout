// hooks/useMissionTriggers.ts
import { useEffect, useState, useCallback } from 'react';
import { useStoryManager } from '@/components/story/StoryManager';
import { UserMarker } from '@/lib/types/blackout';

interface UseMissionTriggersProps {
  userMarkers: UserMarker[];
  gpsPosition: [number, number] | null;
  userProfile: any;
}

export const useMissionTriggers = ({
  userMarkers,
  gpsPosition,
  userProfile
}: UseMissionTriggersProps) => {
  // Try to get the story manager, but don't crash if provider isn't available
  let storyManager;
  
  try {
    storyManager = useStoryManager();
  } catch (error) {
    console.warn('StoryManagerProvider not available, mission triggers disabled');
    storyManager = null;
  }
  
  const {
    storyProgress,
    activeMission,
    availableMissions,
    completeObjective,
    reportDisappearance,
    updateCrewTrust
  } = storyManager || {};

  const [activeMissions, setActiveMissions] = useState<string[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  // Check and trigger missions when conditions are met
  const checkMissionCompletion = useCallback((missionId: string, condition: boolean) => {
    if (condition && !completedMissions.includes(missionId)) {
      triggerMissionEvent(missionId, { timestamp: new Date() });
    }
  }, [completedMissions]);

  const triggerMissionEvent = useCallback(async (missionId: string, payload: any) => {
    console.log(`🎯 Mission triggered: ${missionId}`, payload);
    
    // Mark mission as active if not already active
    if (!activeMissions.includes(missionId)) {
      setActiveMissions(prev => [...prev, missionId]);
    }

    // Check if mission is completable
    const isCompleted = checkMissionCompletionCriterion(missionId, payload);
    if (isCompleted) {
      // Complete the mission
      setCompletedMissions(prev => [...prev, missionId]);
      setActiveMissions(prev => prev.filter(id => id !== missionId));
      console.log(`✅ Mission completed: ${missionId}`);
      
      // If we have a story manager, trigger the actual completion
      if (storyManager && completeObjective) {
        try {
          // Find the mission in available missions
          const mission = availableMissions?.find(m => m.id === missionId);
          if (mission) {
            // Complete all objectives for this mission
            for (const objective of mission.objectives) {
              await completeObjective(mission.id, objective.id, 1);
            }
          }
        } catch (error) {
          console.error('Error completing mission via story manager:', error);
        }
      }
    }
    
    return Promise.resolve();
  }, [activeMissions, availableMissions, storyManager]);

  // Messaging-related mission triggers
  const triggerMessagingEvent = useCallback((eventType: string, data: any) => {
    console.log(`Messaging event triggered: ${eventType}`, data);
    
    // Trigger messaging-related missions
    switch (eventType) {
      case 'first_message_sent':
        triggerMissionEvent('send_first_message', data);
        break;
      case 'crew_chat_interaction':
        triggerMissionEvent('participate_crew_chat', data);
        break;
      case 'direct_message_sent':
        triggerMissionEvent('send_direct_message', data);
        break;
      default:
        console.log(`Unknown messaging event: ${eventType}`);
    }
  }, [triggerMissionEvent]);

  // Check for marker placement objectives
  useEffect(() => {
    if (!storyProgress || !activeMission || !completeObjective) return;

    // Find placement objectives
    const placementObjectives = activeMission.objectives.filter(
      obj => obj.type === 'placement' && !obj.completed
    );

    placementObjectives.forEach(async (objective) => {
      // Check if target is count-based
      if (objective.target.type === 'count') {
        const requiredCount = objective.target.required || 1;
        const currentCount = userMarkers.length;
        
        if (currentCount >= requiredCount) {
          await completeObjective(activeMission.id, objective.id, requiredCount);
        } else {
          await completeObjective(activeMission.id, objective.id, currentCount);
        }
      }
    });
  }, [userMarkers.length, activeMission, storyProgress, completeObjective]);

  // Check for location-based objectives
  useEffect(() => {
    if (!gpsPosition || !activeMission || !storyProgress || !completeObjective) return;

    const locationObjectives = activeMission.objectives.filter(
      obj => obj.type === 'exploration' && !obj.completed
    );

    locationObjectives.forEach(async (objective) => {
      if (objective.target.type === 'location' && Array.isArray(objective.target.value)) {
        const [targetLat, targetLng] = objective.target.value as [number, number];
        const [currentLat, currentLng] = gpsPosition;
        
        // Calculate distance
        const distance = calculateDistance(
          currentLat,
          currentLng,
          targetLat,
          targetLng
        );
        
        const requiredDistance = objective.target.required || 100; // Default 100m
        
        if (distance <= requiredDistance) {
          await completeObjective(activeMission.id, objective.id, 1);
        }
      }
    });
  }, [gpsPosition, activeMission, storyProgress, completeObjective]);

  // Check for REP-based triggers
  useEffect(() => {
    if (!userProfile || !storyProgress || !availableMissions) return;

    const rep = userProfile.rep || 0;
    
    // Check available missions for REP triggers
    availableMissions.forEach(async (mission) => {
      if (mission.trigger.type === 'rep_reached' && rep >= mission.trigger.value) {
        // This mission should now be available (already handled by StoryManager)
      }
    });
    
    // Trigger missions based on REP milestones
    if (rep >= 50 && !completedMissions.includes('reach_50_rep')) {
      triggerMissionEvent('reach_50_rep', { rep });
    }
    if (rep >= 100 && !completedMissions.includes('reach_100_rep')) {
      triggerMissionEvent('reach_100_rep', { rep });
    }
    
    // Trigger missions based on markers placed
    if (userProfile.markersPlaced >= 3 && !completedMissions.includes('place_3_markers')) {
      triggerMissionEvent('place_3_markers', { count: userProfile.markersPlaced });
    }
    if (userProfile.markersPlaced >= 10 && !completedMissions.includes('place_10_markers')) {
      triggerMissionEvent('place_10_markers', { count: userProfile.markersPlaced });
    }
  }, [userProfile?.rep, userProfile?.markersPlaced, availableMissions, storyProgress, completedMissions, triggerMissionEvent]);

  // Function to calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Function to trigger when art disappears
  const triggerDisappearance = async (markerId: string, location: [number, number]) => {
    if (reportDisappearance) {
      await reportDisappearance(markerId, location);
    }
    
    // Also update crew trust (negative for some crews based on story)
    if (storyProgress && updateCrewTrust) {
      try {
        // BLAQWT gains trust when investigating (they're "helping")
        await updateCrewTrust('bqc', 5);
        
        // Other crews get smaller boosts
        await updateCrewTrust('sps', 2);
        await updateCrewTrust('lzt', 3);
        await updateCrewTrust('dgc', 2);
      } catch (error) {
        console.error('Error updating crew trust:', error);
      }
    }
  };

  // Simple mission completion checker
  const checkMissionCompletionCriterion = (missionId: string, payload: any): boolean => {
    // Simple completion criteria for demo purposes
    switch (missionId) {
      case 'place_3_markers':
        return payload?.count >= 3;
      case 'place_10_markers':
        return payload?.count >= 10;
      case 'reach_50_rep':
        return payload?.rep >= 50;
      case 'reach_100_rep':
        return payload?.rep >= 100;
      case 'send_first_message':
        return payload?.timestamp !== undefined;
      case 'participate_crew_chat':
        return payload?.messagesSent >= 3;
      case 'send_direct_message':
        return payload?.recipient !== undefined;
      default:
        return false;
    }
  };

  return {
    triggerDisappearance,
    checkMissionCompletion,
    triggerMissionEvent,
    triggerMessagingEvent,
    activeMissions,
    completedMissions
  };
};