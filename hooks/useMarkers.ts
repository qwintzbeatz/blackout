'use client';

import { useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, UserMarker, getMarkerColorByRank } from '@/lib/utils/types';
import { calculateDistance } from '@/lib/utils/helpers';

export const useMarkers = (user: User | null, userProfile: UserProfile | null) => {
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  const addMarker = useCallback(async (data: {
    position: [number, number];
    gpsPosition: [number, number] | null;
  }) => {
    if (!user || !userProfile) {
      console.log('Cannot add marker: No user or profile');
      return null;
    }

    // Calculate distance from GPS center if available
    let distanceFromCenter = null;
    if (data.gpsPosition) {
      distanceFromCenter = calculateDistance(
        data.gpsPosition[0], data.gpsPosition[1],
        data.position[0], data.position[1]
      );
    }

    const newMarker: UserMarker = {
      id: `user-marker-${Date.now()}`,
      position: data.position,
      name: 'Pole',
      description: 'Sticker/Slap',
      timestamp: new Date(),
      distanceFromCenter: distanceFromCenter || undefined,
      userId: user.uid,
      username: userProfile.username,
      userProfilePic: userProfile.profilePicUrl
    };

    console.log('Marker created:', newMarker);
    
    // Save to local state immediately
    setUserMarkers(prev => [...prev, newMarker]);
    
    // TODO: Save to Firestore
    console.log('Marker added (Firestore integration pending):', newMarker);
    
    return newMarker;
  }, [user, userProfile]);

  const deleteMarker = useCallback(async (id: string) => {
    // TODO: Delete from Firestore
    setUserMarkers(prev => prev.filter(marker => marker.id !== id));
  }, []);

  const deleteAllMarkers = useCallback(async () => {
    if (userMarkers.length > 0 && window.confirm(`Are you sure you want to delete all ${userMarkers.length} markers?`)) {
      // TODO: Delete from Firestore
      setUserMarkers([]);
    }
  }, [userMarkers]);

  const loadUserMarkers = useCallback(async () => {
    if (!user) return;
    
    setLoadingMarkers(true);
    try {
      // TODO: Load from Firestore
      console.log('Loading markers (Firestore integration pending)');
      // For now, just set loading to false
      setUserMarkers([]);
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      setLoadingMarkers(false);
    }
  }, [user]);

  return {
    userMarkers,
    loadingMarkers,
    addMarker,
    deleteMarker,
    deleteAllMarkers,
    loadUserMarkers,
    setUserMarkers
  };
};