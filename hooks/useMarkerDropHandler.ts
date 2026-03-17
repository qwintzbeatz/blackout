/**
 * useMarkerDropHandler.ts
 * Extracted from page.tsx – handles graffiti-marker drop creation.
 */

import { useCallback } from 'react';
import { doc, updateDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User as FirebaseUser } from 'firebase/auth';
import { saveDropToFirestore } from '@/lib/firebase/drops';
import { getRandomStartTrack } from '@/hooks/useMusicPlayer';
import { unlockRandomSpotifyTrack } from '@/lib/utils/musicUnlocks';
import { getTrackNameFromUrl as getTrackNameFromUrlHelper } from '@/lib/utils/dropHelpers';
import { calculateRank, calculateLevel } from '@/utils/homeHelpers';
import {
  maybeShowCrewWelcome,
  maybeCompleteAct1Mission,
  RepNotificationPayload,
  NpcNotificationPayload,
} from '@/lib/utils/dropRewards';
import { GRAFFITI_TO_MARKER_DESCRIPTION, SURFACE_TO_MARKER_NAME } from '@/utils/typeMapping';
import { Drop, UserProfile, UserMarker } from '@/lib/types/blackout';
import { SurfaceType, GraffitiType } from '@/types';
import { MarkerDescription } from '@/constants/markers';

interface UseMarkerDropHandlerParams {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  userProfileRef: React.MutableRefObject<UserProfile | null>;
  isCreatingDrop: boolean;
  pendingDropPosition: { lat: number; lng: number } | null;
  selectedMusicDrop: (Drop & { discovered?: boolean }) | null;
  selectedMarkerType: MarkerDescription;
  selectedMarkerColor: string;
  selectedSurface: SurfaceType;
  selectedGraffitiType: GraffitiType;
  selectedSpecialType: 'rainbow' | 'glow' | 'metallic' | null;

  setIsCreatingDrop: (v: boolean) => void;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setUnlockedTracks: (tracks: string[]) => void;
  setShowDropTypeModal: (v: boolean) => void;
  setPendingDropPosition: (v: null) => void;
  setSelectedMusicDrop: (v: null) => void;
  setSongUnlockModal: (v: { isOpen: boolean; trackUrl: string; trackName: string; source: string }) => void;
  setRecentlyUnlocked: (v: { url: string; name: string; source: 'Spotify' | 'SoundCloud' }) => void;
  setRepNotification: React.Dispatch<React.SetStateAction<RepNotificationPayload | null>>;
  setNpcWelcomeNotification: React.Dispatch<React.SetStateAction<NpcNotificationPayload | null>>;

  saveMarkerToFirestore: (marker: UserMarker) => Promise<string | null>;
  handleMusicDropReplacement: (dropId: string, type: 'marker') => Promise<any>;
  loadDrops: () => Promise<void>;
  loadAllMarkers: () => Promise<void>;
  loadTopPlayers: () => Promise<void>;
}

export const useMarkerDropHandler = ({
  user,
  userProfile,
  userProfileRef,
  isCreatingDrop,
  pendingDropPosition,
  selectedMusicDrop,
  selectedMarkerType,
  selectedMarkerColor,
  selectedSurface,
  selectedGraffitiType,
  selectedSpecialType,
  setIsCreatingDrop,
  setUserProfile,
  setUnlockedTracks,
  setShowDropTypeModal,
  setPendingDropPosition,
  setSelectedMusicDrop,
  setSongUnlockModal,
  setRecentlyUnlocked,
  setRepNotification,
  setNpcWelcomeNotification,
  saveMarkerToFirestore,
  handleMusicDropReplacement,
  loadDrops,
  loadAllMarkers,
  loadTopPlayers,
}: UseMarkerDropHandlerParams) => {

  const handleMarkerDrop = useCallback(async () => {
    if (!user || !userProfile || !pendingDropPosition || isCreatingDrop) return;

    // If replacing a discovered music drop
    if (selectedMusicDrop && selectedMusicDrop.discovered) {
      await handleMusicDropReplacement(selectedMusicDrop.id!, 'marker');
      setSelectedMusicDrop(null);
      setShowDropTypeModal(false);
      return;
    }

    setIsCreatingDrop(true);

    // Safety timeout to prevent stuck loading state
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout: Resetting isCreatingDrop (marker)');
      setIsCreatingDrop(false);
    }, 10000);

    try {
      const newDrop: Drop = {
        lat: pendingDropPosition.lat,
        lng: pendingDropPosition.lng,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
      };

      const dropId = await saveDropToFirestore(newDrop);

      const currentUserProfile = userProfileRef.current;
      const isFirstTag = (currentUserProfile?.totalMarkers || 0) === 0;
      const forcedFirstTagStyleId = `${currentUserProfile?.crewId || 'bqc'}-tag-svg-2`;
      const currentStyleId = isFirstTag
        ? forcedFirstTagStyleId
        : currentUserProfile?.selectedGraffitiStyle;

      const markerData: UserMarker = {
        id: `temp-${Date.now()}`,
        position: [pendingDropPosition.lat, pendingDropPosition.lng],
        name: SURFACE_TO_MARKER_NAME[selectedSurface],
        description: GRAFFITI_TO_MARKER_DESCRIPTION[selectedGraffitiType],
        color: selectedMarkerColor,
        timestamp: new Date(),
        userId: user.uid,
        username: currentUserProfile?.username,
        userProfilePic: currentUserProfile?.profilePicUrl,
        surface: selectedSurface as any,
        graffitiType: selectedGraffitiType as any,
        specialType: selectedSpecialType,
        styleId: currentStyleId,
      };

      const markerId = await saveMarkerToFirestore(markerData);

      if (dropId && markerId) {
        const repEarned = 5;
        const newRep = (userProfile.rep || 0) + repEarned;
        const newRank = calculateRank(newRep);
        const newLevel = calculateLevel(newRep);

        const currentTracks =
          userProfile.unlockedTracks && userProfile.unlockedTracks.length > 0
            ? userProfile.unlockedTracks
            : getRandomStartTrack();
        const unlockResult = unlockRandomSpotifyTrack(currentTracks);
        const newTracks = unlockResult.newTracks;

        // 🔧 PERFORMANCE: Use batch writes to reduce write operations
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', user.uid);
        
        // Only update fields that have changed
        const userUpdates: any = {
          lastActive: Timestamp.now(),
          rep: newRep,
          level: newLevel,
          rank: newRank,
          unlockedTracks: newTracks
        };

        // Add first tag style updates only if this is the first tag
        if (isFirstTag) {
          userUpdates.selectedGraffitiStyle = forcedFirstTagStyleId;
          userUpdates.selectedStyleVariant = forcedFirstTagStyleId;
          userUpdates.activeGraffitiStyle = 'tag';
        }

        batch.update(userRef, userUpdates);

        // Commit the batch
        await batch.commit();

        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                rep: newRep,
                level: newLevel,
                rank: newRank,
                unlockedTracks: newTracks,
                ...(isFirstTag
                  ? {
                      selectedGraffitiStyle: forcedFirstTagStyleId,
                      selectedStyleVariant: forcedFirstTagStyleId,
                      activeGraffitiStyle: 'tag',
                    }
                  : {}),
              }
            : null
        );
        setUnlockedTracks(newTracks);

        const trackUnlocked = newTracks.length > currentTracks.length;
        const unlockedTrackUrl = trackUnlocked ? newTracks[newTracks.length - 1] : '';
        const unlockedTrackName = trackUnlocked
          ? getTrackNameFromUrlHelper(unlockedTrackUrl)
          : '';

        if (trackUnlocked) {
          setSongUnlockModal({
            isOpen: true,
            trackUrl: unlockedTrackUrl,
            trackName: unlockedTrackName,
            source: 'MARKER DROP',
          });
          setRecentlyUnlocked({
            url: unlockedTrackUrl,
            name: unlockedTrackName,
            source: unlockedTrackUrl.includes('open.spotify.com') ? 'Spotify' : 'SoundCloud',
          });
        }

        setRepNotification({
          show: true,
          amount: repEarned,
          message: trackUnlocked
            ? `🎵 ${unlockedTrackName} Unlocked! 🎵\n${selectedMarkerType} marker placed!`
            : `${selectedMarkerType} marker placed!`,
        });

        await loadDrops();
        await loadAllMarkers();
        await loadTopPlayers();

        await maybeShowCrewWelcome(userProfile, user.uid, 'marker', setNpcWelcomeNotification, setUserProfile);
        await maybeCompleteAct1Mission(userProfile, user.uid, setUserProfile, setRepNotification);
      }

      setShowDropTypeModal(false);
      setPendingDropPosition(null);
    } catch (error) {
      console.error('Error creating marker drop:', error);
      alert(`Failed to create marker drop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearTimeout(safetyTimeout);
      setIsCreatingDrop(false);
    }
  }, [
    user, userProfile, userProfileRef, isCreatingDrop, pendingDropPosition, selectedMusicDrop,
    selectedMarkerType, selectedMarkerColor, selectedSurface, selectedGraffitiType, selectedSpecialType,
    setIsCreatingDrop, setUserProfile, setUnlockedTracks, setShowDropTypeModal, setPendingDropPosition,
    setSelectedMusicDrop, setSongUnlockModal, setRecentlyUnlocked, setRepNotification, setNpcWelcomeNotification,
    saveMarkerToFirestore, handleMusicDropReplacement, loadDrops, loadAllMarkers, loadTopPlayers,
  ]);

  return { handleMarkerDrop };
};
