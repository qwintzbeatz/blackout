// components/MissionTriggerHandler.tsx
'use client';

import { useEffect } from 'react';
import { useMissionTriggers } from '@/hooks/useMissionTriggers';
import { useStoryManager } from '@/components/story/StoryManager';

interface MissionTriggerHandlerProps {
  userMarkers: any[];
  gpsPosition: [number, number] | null;
  userProfile: any;
  user: any;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  setRepNotification: any;
}

export default function MissionTriggerHandler({
  userMarkers,
  gpsPosition,
  userProfile,
  user,
  calculateDistance,
  setRepNotification
}: MissionTriggerHandlerProps) {
  const { triggerDisappearance } = useMissionTriggers({
    userMarkers,
    gpsPosition,
    userProfile
  });

  const { storyProgress } = useStoryManager();

  // Disappearance simulation
  useEffect(() => {
    const simulateDisappearance = async () => {
      if (!user || !gpsPosition || !storyProgress || Math.random() > 0.01) return;
      
      const markersNearby = userMarkers.filter(marker => {
        const distance = calculateDistance(
          gpsPosition[0],
          gpsPosition[1],
          marker.position[0],
          marker.position[1]
        );
        return distance < 1000; // Within 1km
      });
      
      if (markersNearby.length > 0) {
        const randomMarker = markersNearby[Math.floor(Math.random() * markersNearby.length)];
        await triggerDisappearance(randomMarker.id, randomMarker.position);
        
        setRepNotification({
          show: true,
          amount: 0,
          message: `🚨 ART DISAPPEARED!\n\nMarker by ${randomMarker.username || 'Unknown'} has vanished.\nInvestigate in Story panel.`
        });
      }
    };
    
    const interval = setInterval(simulateDisappearance, 60000); // Every minute
    return () => clearInterval(interval);
  }, [user, gpsPosition, userMarkers, storyProgress, triggerDisappearance, calculateDistance, setRepNotification]);

  return null; // This component doesn't render anything
}