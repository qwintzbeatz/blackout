/**
 * useMusicDropHandler.ts
 * Extracted from page.tsx – handles music drop placement.
 */

import { useCallback } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User as FirebaseUser } from 'firebase/auth';
import { saveDropToFirestore } from '@/lib/firebase/drops';
import { getTrackNameFromUrl as getTrackNameFromUrlHelper } from '@/lib/utils/dropHelpers';
import {
  maybeShowCrewWelcome,
  maybeCompleteAct1Mission,
  RepNotificationPayload,
  NpcNotificationPayload,
} from '@/lib/utils/dropRewards';
import { Drop, UserProfile } from '@/lib/types/blackout';

interface UseMusicDropHandlerParams {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isCreatingDrop: boolean;
  pendingDropPosition: { lat: number; lng: number } | null;
  selectedMusicDrop: Drop | null;
  selectedTrackForMusicDrop: string | null;
  unlockedTracks: string[];

  setIsCreatingDrop: (v: boolean) => void;
  setUserProfile: (updater: (prev: UserProfile | null) => UserProfile | null) => void;
  setUnlockedTracks: (tracks: string[]) => void;
  setSelectedTrackForMusicDrop: (v: null) => void;
  setShowDropTypeModal: (v: boolean) => void;
  setPendingDropPosition: (v: null) => void;
  setSelectedMusicDrop: (v: null) => void;
  setRepNotification: (v: RepNotificationPayload) => void;
  setNpcWelcomeNotification: (v: NpcNotificationPayload) => void;

  handleMusicDropReplacement: (dropId: string, type: 'music') => Promise<any>;
  loadDrops: () => Promise<void>;
}

export const useMusicDropHandler = ({
  user,
  userProfile,
  isCreatingDrop,
  pendingDropPosition,
  selectedMusicDrop,
  selectedTrackForMusicDrop,
  unlockedTracks,
  setIsCreatingDrop,
  setUserProfile,
  setUnlockedTracks,
  setSelectedTrackForMusicDrop,
  setShowDropTypeModal,
  setPendingDropPosition,
  setSelectedMusicDrop,
  setRepNotification,
  setNpcWelcomeNotification,
  handleMusicDropReplacement,
  loadDrops,
}: UseMusicDropHandlerParams) => {

  const handleMusicDrop = useCallback(
    async (trackUrl?: string) => {
      if (!user || !userProfile || !pendingDropPosition || isCreatingDrop) return;

      // If replacing a discovered music drop
      if (selectedMusicDrop && selectedMusicDrop.discovered) {
        await handleMusicDropReplacement(selectedMusicDrop.id, 'music');
        setSelectedMusicDrop(null);
        setShowDropTypeModal(false);
        return;
      }

      const tracks = userProfile.unlockedTracks ?? unlockedTracks;
      if (tracks.length === 0) return;

      setIsCreatingDrop(true);
      const trackToDrop = trackUrl || selectedTrackForMusicDrop || tracks[0];

      try {
        const newDrop: Drop = {
          lat: pendingDropPosition.lat,
          lng: pendingDropPosition.lng,
          trackUrl: trackToDrop,
          createdBy: user.uid,
          timestamp: new Date(),
          likes: [],
          username: userProfile.username,
          userProfilePic: userProfile.profilePicUrl,
        };

        const dropId = await saveDropToFirestore(newDrop);
        if (!dropId) throw new Error('Failed to save drop');

        const newTracks = tracks.filter((t) => t !== trackToDrop);

        // Update Firestore + local state
        setUserProfile((prev) => (prev ? { ...prev, unlockedTracks: newTracks } : null));
        await updateDoc(doc(db, 'users', user.uid), {
          unlockedTracks: newTracks,
          lastActive: Timestamp.now(),
        });
        setUnlockedTracks(newTracks);
        setSelectedTrackForMusicDrop(null);

        setRepNotification({
          show: true,
          amount: 0,
          message: `Music drop placed! You gave away "${getTrackNameFromUrlHelper(trackToDrop)}". ${
            newTracks.length === 0
              ? 'You have no songs left.'
              : `${newTracks.length} track(s) remaining.`
          }`,
        });

        await maybeShowCrewWelcome(userProfile, user.uid, 'music', setNpcWelcomeNotification, setUserProfile);
        await maybeCompleteAct1Mission(userProfile, user.uid, setUserProfile, setRepNotification);

        await loadDrops();
        setShowDropTypeModal(false);
        setPendingDropPosition(null);
      } catch (e) {
        console.error('Error creating music drop:', e);
        alert(`Failed to place music drop: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setIsCreatingDrop(false);
      }
    },
    [
      user, userProfile, isCreatingDrop, pendingDropPosition, selectedMusicDrop,
      selectedTrackForMusicDrop, unlockedTracks,
      setIsCreatingDrop, setUserProfile, setUnlockedTracks, setSelectedTrackForMusicDrop,
      setShowDropTypeModal, setPendingDropPosition, setSelectedMusicDrop,
      setRepNotification, setNpcWelcomeNotification,
      handleMusicDropReplacement, loadDrops,
    ]
  );

  return { handleMusicDrop };
};
