'use client';

import { useState, useCallback, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, UserMarker } from '@/lib/types/blackout';
import { calculateDistance } from '@/lib/utils';
import { useOptimizedFirestore } from '@/src/hooks/useOptimizedFirestore';
import { doc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PerformanceManager } from '@/src/lib/performance/PerformanceManager';

export const useMarkers = (user: User | null, userProfile: UserProfile | null) => {
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);

  // Get performance settings
  const performanceManager = PerformanceManager.getInstance();
  const performanceSettings = performanceManager.getSettings();

  // Use optimized Firestore hook for loading user's markers
  const {
    data: firestoreMarkers,
    loading: firestoreLoading,
    error: firestoreError,
    loadMore,
    refresh,
    clearCache
  } = useOptimizedFirestore<UserMarker>('markers', {
    pageSize: performanceSettings.markerLimit,
    filters: user ? [{ field: 'userId', op: '==', value: user.uid }] : [],
    orderByField: 'timestamp',
    orderDirection: 'desc'
  });

  // Sync Firestore markers to local state
  useEffect(() => {
    setUserMarkers(firestoreMarkers);
  }, [firestoreMarkers]);

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
      color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
      timestamp: new Date(),
      distanceFromCenter: distanceFromCenter || undefined,
      userId: user.uid,
      username: userProfile.username,
      userProfilePic: userProfile.profilePicUrl
    };

    console.log('Marker created:', newMarker);
    
    // Save to Firestore
    try {
      const docRef = await addDoc(collection(db, 'markers'), newMarker);
      const savedMarker = { ...newMarker, firestoreId: docRef.id };
      
      // Update local state with the saved marker
      setUserMarkers(prev => [...prev, savedMarker]);
      
      console.log('Marker saved to Firestore:', savedMarker);
    } catch (error) {
      console.error('Error saving marker to Firestore:', error);
      // Still add to local state even if Firestore fails
      setUserMarkers(prev => [...prev, newMarker]);
    }
    
    return newMarker;
  }, [user, userProfile]);

  const deleteMarker = useCallback(async (id: string) => {
    const markerToDelete = userMarkers.find(marker => marker.id === id);
    
    try {
      if (markerToDelete?.firestoreId) {
        // Delete from Firestore using the document ID
        await deleteDoc(doc(db, 'markers', markerToDelete.firestoreId));
        console.log('Marker deleted from Firestore:', id);
      }
      
      // Remove from local state
      setUserMarkers(prev => prev.filter(marker => marker.id !== id));
    } catch (error) {
      console.error('Error deleting marker from Firestore:', error);
      // Still remove from local state even if Firestore fails
      setUserMarkers(prev => prev.filter(marker => marker.id !== id));
    }
  }, [userMarkers]);

  const deleteAllMarkers = useCallback(async () => {
    if (userMarkers.length > 0 && window.confirm(`Are you sure you want to delete all ${userMarkers.length} markers?`)) {
      try {
        // Delete all markers from Firestore that have firestoreId
        const deletePromises = userMarkers
          .filter(marker => marker.firestoreId)
          .map(marker => deleteDoc(doc(db, 'markers', marker.firestoreId!)));
        
        await Promise.all(deletePromises);
        console.log('All markers deleted from Firestore');
        
        // Clear local state
        setUserMarkers([]);
        clearCache();
      } catch (error) {
        console.error('Error deleting all markers from Firestore:', error);
        // Still clear local state even if Firestore fails
        setUserMarkers([]);
      }
    }
  }, [userMarkers, clearCache]);

  const loadUserMarkers = useCallback(async () => {
    if (!user) return;
    
    setLoadingMarkers(true);
    try {
      // Load markers using the optimized hook
      await refresh();
      setUserMarkers(firestoreMarkers);
    } catch (error) {
      console.error('Error loading markers:', error);
    } finally {
      setLoadingMarkers(false);
    }
  }, [user, refresh, firestoreMarkers]);

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