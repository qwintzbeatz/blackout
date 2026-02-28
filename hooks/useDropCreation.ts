/**
 * useDropCreation - Centralized drop creation state management
 * Handles marker drops, photo drops, and music drops
 */

import { useState, useCallback } from 'react';
import { doc, updateDoc, Timestamp, addDoc, collection } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { saveDropToFirestore } from '@/lib/firebase/drops';
import { uploadImageToImgBB } from '@/lib/services/imgbb';
import { calculateDistance } from '@/lib/utils/dropHelpers';
import { calculateRep, calculateEnhancedRank } from '@/utils/repCalculator';
import { NZ_BOUNDS } from '@/constants/locations';
import { Drop, UserMarker } from '@/lib/types/blackout';

export interface DropPosition {
  lat: number;
  lng: number;
}

export interface UseDropCreationOptions {
  user: User | null;
  userProfile: any;
  gpsPosition: [number, number] | null;
  selectedSurface?: string;
  selectedGraffitiType?: string;
  selectedMarkerColor?: string;
  selectedGraffitiStyle?: string;
  expandedRadius?: number;
  onSuccess?: (type: 'marker' | 'photo' | 'music', repEarned: number) => void;
  onError?: (error: string) => void;
}

export interface UseDropCreationReturn {
  // State
  pendingDropPosition: DropPosition | null;
  showDropTypeModal: boolean;
  showPhotoModal: boolean;
  isUploadingPhoto: boolean;
  
  // Actions
  setPendingDropPosition: (pos: DropPosition | null) => void;
  setShowDropTypeModal: (show: boolean) => void;
  setShowPhotoModal: (show: boolean) => void;
  
  // Drop creation
  handleMapClick: (lat: number, lng: number, distanceFromGPS: number) => boolean;
  createMarkerDrop: (markerData: Partial<UserMarker>) => Promise<{ success: boolean; repEarned?: number; error?: string }>;
  createPhotoDrop: (photoData: { file: File; location?: { lat: number; lng: number } }) => Promise<{ success: boolean; repEarned?: number; error?: string }>;
  createMusicDrop: (trackUrl: string) => Promise<{ success: boolean; error?: string }>;
}

export function useDropCreation(options: UseDropCreationOptions): UseDropCreationReturn {
  const {
    user,
    userProfile,
    gpsPosition,
    selectedSurface = 'wall',
    selectedGraffitiType = 'tag',
    selectedMarkerColor = '#10b981',
    selectedGraffitiStyle,
    expandedRadius = 50,
    onSuccess,
    onError
  } = options;

  // State
  const [pendingDropPosition, setPendingDropPosition] = useState<DropPosition | null>(null);
  const [showDropTypeModal, setShowDropTypeModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Handle map click - returns true if valid drop location
  const handleMapClick = useCallback((lat: number, lng: number, distanceFromGPS: number): boolean => {
    // Check if user is authenticated
    if (!user) {
      onError?.('Please sign in first!');
      return false;
    }

    // Check if profile exists
    if (!userProfile) {
      onError?.('Please complete your profile first!');
      return false;
    }

    // Check if within radius
    if (distanceFromGPS > expandedRadius) {
      return false;
    }

    // Set pending position and show modal
    setPendingDropPosition({ lat, lng });
    setShowDropTypeModal(true);
    return true;
  }, [user, userProfile, expandedRadius, onError]);

  // Create marker drop
  const createMarkerDrop = useCallback(async (markerData: Partial<UserMarker>): Promise<{ success: boolean; repEarned?: number; error?: string }> => {
    if (!user || !userProfile || !pendingDropPosition) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const { lat, lng } = pendingDropPosition;

      // Calculate REP
      const repResult = calculateRep(
        selectedSurface as any,
        selectedGraffitiType as any,
        {
          hasStreakBonus: false
        }
      );

      // Create marker in Firestore - include ALL style info for font rendering
      const markerDoc = {
        position: [lat, lng] as [number, number],
        color: selectedMarkerColor,
        surface: selectedSurface,
        graffitiType: selectedGraffitiType,
        // CRITICAL FIX: Include all style properties
        styleId: selectedGraffitiStyle || userProfile.selectedGraffitiStyle || `${userProfile.crewId || 'bqc'}-tag`,
        styleType: (selectedGraffitiStyle || userProfile.selectedGraffitiStyle || '').includes('svg') ? 'svg' : 'font',
        playerTagName: userProfile.username || null,
        crewId: userProfile.crewId || 'bqc',
        variant: selectedGraffitiStyle || userProfile.selectedGraffitiStyle || `${userProfile.crewId || 'bqc'}-tag`,
        userId: user.uid,
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
        timestamp: Timestamp.now(),
        createdAt: Timestamp.now(),
        repEarned: repResult.rep,
        likes: [],
        comments: []
      };

      await addDoc(collection(db, 'markers'), markerDoc);

      // Update user REP
      const newRep = (userProfile.rep || 0) + repResult.rep;
      const newRank = calculateEnhancedRank(newRep);
      const newLevel = Math.floor(newRep / 100) + 1;

      await updateDoc(doc(db, 'users', user.uid), {
        rep: newRep,
        rank: newRank,
        level: newLevel,
        totalMarkers: (userProfile.totalMarkers || 0) + 1,
        lastActive: Timestamp.now()
      });

      // Reset state
      setShowDropTypeModal(false);
      setPendingDropPosition(null);

      onSuccess?.('marker', repResult.rep);
      return { success: true, repEarned: repResult.rep };

    } catch (error: any) {
      console.error('Error creating marker drop:', error);
      onError?.(error.message);
      return { success: false, error: error.message };
    }
  }, [user, userProfile, pendingDropPosition, selectedSurface, selectedGraffitiType, selectedMarkerColor, onSuccess, onError]);

  // Create photo drop
  const createPhotoDrop = useCallback(async (photoData: { file: File; location?: { lat: number; lng: number } }): Promise<{ success: boolean; repEarned?: number; error?: string }> => {
    if (!user || !userProfile) {
      return { success: false, error: 'Please sign in first!' };
    }

    setIsUploadingPhoto(true);

    try {
      // Upload photo to ImgBB
      let photoUrl: string;
      try {
        photoUrl = await uploadImageToImgBB(photoData.file);
      } catch (uploadError: any) {
        setIsUploadingPhoto(false);
        return { success: false, error: `Photo upload failed: ${uploadError.message}` };
      }

      // Determine drop location
      let dropLat: number, dropLng: number;
      let usePhotoLocation = false;

      if (photoData.location) {
        dropLat = photoData.location.lat;
        dropLng = photoData.location.lng;
        usePhotoLocation = true;

        // Check if within NZ bounds
        const withinNZ = dropLat >= NZ_BOUNDS[0][0] && dropLat <= NZ_BOUNDS[1][0] &&
                        dropLng >= NZ_BOUNDS[0][1] && dropLng <= NZ_BOUNDS[1][1];

        if (!withinNZ) {
          if (gpsPosition) {
            dropLat = gpsPosition[0];
            dropLng = gpsPosition[1];
            usePhotoLocation = false;
          } else {
            setIsUploadingPhoto(false);
            return { success: false, error: 'Photo location outside NZ and no GPS available' };
          }
        }
      } else if (pendingDropPosition) {
        dropLat = pendingDropPosition.lat;
        dropLng = pendingDropPosition.lng;
      } else {
        setIsUploadingPhoto(false);
        return { success: false, error: 'No drop position available' };
      }

      // Create drop with explicit values
      const dropId = await saveDropToFirestore({
        lat: dropLat,
        lng: dropLng,
        photoUrl,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl
      });

      if (!dropId) {
        setIsUploadingPhoto(false);
        return { success: false, error: 'Failed to save drop' };
      }

      // Calculate REP - GPS-tagged photos get bonus
      const repEarned = usePhotoLocation ? 15 : 10;
      const newRep = (userProfile.rep || 0) + repEarned;
      const newRank = calculateEnhancedRank(newRep);
      const newLevel = Math.floor(newRep / 100) + 1;

      await updateDoc(doc(db, 'users', user.uid), {
        rep: newRep,
        rank: newRank,
        level: newLevel,
        photosTaken: (userProfile.photosTaken || 0) + 1,
        lastActive: Timestamp.now()
      });

      // Reset state
      setShowPhotoModal(false);
      setPendingDropPosition(null);
      setIsUploadingPhoto(false);

      onSuccess?.('photo', repEarned);
      return { success: true, repEarned };

    } catch (error: any) {
      console.error('Error creating photo drop:', error);
      setIsUploadingPhoto(false);
      onError?.(error.message);
      return { success: false, error: error.message };
    }
  }, [user, userProfile, pendingDropPosition, gpsPosition, onSuccess, onError]);

  // Create music drop
  const createMusicDrop = useCallback(async (trackUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !userProfile || !pendingDropPosition) {
      return { success: false, error: 'Missing required data' };
    }

    try {
      const { lat, lng } = pendingDropPosition;

      // Create drop with explicit values
      const dropId = await saveDropToFirestore({
        lat,
        lng,
        trackUrl,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl
      });

      if (!dropId) {
        return { success: false, error: 'Failed to save drop' };
      }

      // Remove track from user's collection
      const currentTracks = userProfile.unlockedTracks || [];
      const newTracks = currentTracks.filter((t: string) => t !== trackUrl);

      await updateDoc(doc(db, 'users', user.uid), {
        unlockedTracks: newTracks,
        lastActive: Timestamp.now()
      });

      // Reset state
      setShowDropTypeModal(false);
      setPendingDropPosition(null);

      onSuccess?.('music', 5);
      return { success: true };

    } catch (error: any) {
      console.error('Error creating music drop:', error);
      onError?.(error.message);
      return { success: false, error: error.message };
    }
  }, [user, userProfile, pendingDropPosition, onSuccess, onError]);

  return {
    // State
    pendingDropPosition,
    showDropTypeModal,
    showPhotoModal,
    isUploadingPhoto,
    
    // Actions
    setPendingDropPosition,
    setShowDropTypeModal,
    setShowPhotoModal,
    
    // Drop creation
    handleMapClick,
    createMarkerDrop,
    createPhotoDrop,
    createMusicDrop,
  };
}