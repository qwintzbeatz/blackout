/**
 * usePhotoDropHandler.ts
 * Extracted from page.tsx – handles GPS photo drop creation.
 */

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User as FirebaseUser } from 'firebase/auth';
import { uploadImageToImgBB } from '@/lib/services/imgbb';
import { saveDropToFirestore } from '@/lib/firebase/drops';
import { getRandomStartTrack } from '@/hooks/useMusicPlayer';
import { unlockRandomSoundCloudTrack } from '@/lib/utils/musicUnlocks';
import { getTrackNameFromUrl as getTrackNameFromUrlHelper } from '@/lib/utils/dropHelpers';
import { NZ_BOUNDS } from '@/constants/locations';
import { calculateRank, calculateLevel } from '@/utils/homeHelpers';
import {
  maybeShowCrewWelcome,
  maybeCompleteAct1Mission,
  RepNotificationPayload,
  NpcNotificationPayload,
} from '@/lib/utils/dropRewards';
import { Drop, UserProfile } from '@/lib/types/blackout';

interface UsePhotoDropHandlerParams {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isCreatingDrop: boolean;
  pendingDropPosition: { lat: number; lng: number } | null;
  gpsPosition: [number, number] | null;
  selectedMusicDrop: Drop | null;

  setIsCreatingDrop: Dispatch<SetStateAction<boolean>>;
  setIsUploadingPhoto: Dispatch<SetStateAction<boolean>>;
  setDrops: Dispatch<SetStateAction<Drop[]>>;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>;
  setUnlockedTracks: Dispatch<SetStateAction<string[]>>;
  setShowPhotoModal: Dispatch<SetStateAction<boolean>>;
  setPendingDropPosition: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>;
  setSelectedMusicDrop: Dispatch<SetStateAction<Drop | null>>;
  setSongUnlockModal: Dispatch<SetStateAction<{ isOpen: boolean; trackUrl: string; trackName: string; source: string } | null>>;
  setRecentlyUnlocked: Dispatch<SetStateAction<{ url: string; name: string; source: 'Spotify' | 'SoundCloud' } | null>>;
  setRepNotification: Dispatch<SetStateAction<RepNotificationPayload | null>>;
  setNpcWelcomeNotification: Dispatch<SetStateAction<NpcNotificationPayload | null>>;

  replaceMusicDropWithDropType: (id: string, type: 'photo') => void;
  loadDrops: () => Promise<void>;
}

export const usePhotoDropHandler = ({
  user,
  userProfile,
  isCreatingDrop,
  pendingDropPosition,
  gpsPosition,
  selectedMusicDrop,
  setIsCreatingDrop,
  setIsUploadingPhoto,
  setDrops,
  setUserProfile,
  setUnlockedTracks,
  setShowPhotoModal,
  setPendingDropPosition,
  setSelectedMusicDrop,
  setSongUnlockModal,
  setRecentlyUnlocked,
  setRepNotification,
  setNpcWelcomeNotification,
  replaceMusicDropWithDropType,
  loadDrops,
}: UsePhotoDropHandlerParams) => {

  const handlePhotoSelect = useCallback(
    async (photoData: { url: string; file: File; location?: { lat: number; lng: number } }) => {
      if (!user || !userProfile || isCreatingDrop) return;

      setIsCreatingDrop(true);
      setIsUploadingPhoto(true);

      try {
        let photoUrl: string;
        try {
          photoUrl = await uploadImageToImgBB(photoData.file);
        } catch (uploadError: any) {
          console.error('ImgBB upload failed:', uploadError);
          alert(`Photo upload failed: ${uploadError.message}. Please try a smaller image.`);
          setIsUploadingPhoto(false);
          return;
        }

        let dropLat: number, dropLng: number;
        let usePhotoLocation = false;

        if (photoData.location) {
          dropLat = photoData.location.lat;
          dropLng = photoData.location.lng;
          usePhotoLocation = true;

          const withinNZ =
            dropLat >= NZ_BOUNDS[0][0] && dropLat <= NZ_BOUNDS[1][0] &&
            dropLng >= NZ_BOUNDS[0][1] && dropLng <= NZ_BOUNDS[1][1];

          if (!withinNZ) {
            alert('⚠️ This photo was taken outside New Zealand.\n\nThe drop will be placed at your current location instead.');
            if (gpsPosition) {
              dropLat = gpsPosition[0];
              dropLng = gpsPosition[1];
              usePhotoLocation = false;
            } else {
              throw new Error('Photo location outside NZ and no GPS available');
            }
          }
        } else {
          if (!pendingDropPosition) throw new Error('No drop position available');
          dropLat = pendingDropPosition.lat;
          dropLng = pendingDropPosition.lng;
        }

        const newDrop: Drop = {
          lat: dropLat,
          lng: dropLng,
          photoUrl,
          createdBy: user.uid,
          timestamp: new Date(),
          likes: [],
          username: userProfile.username,
          userProfilePic: userProfile.profilePicUrl,
          photoMetadata: {
            hasLocation: usePhotoLocation,
            originalLat: photoData.location?.lat,
            originalLng: photoData.location?.lng,
            timestamp: new Date(photoData.file.lastModified),
          },
        };

        const dropId = await saveDropToFirestore(newDrop);
        if (!dropId) throw new Error('Failed to save drop');

        const repEarned = usePhotoLocation ? 15 : 10;
        const newRep = (userProfile.rep || 0) + repEarned;
        const newRank = calculateRank(newRep);
        const newLevel = calculateLevel(newRep);

        const currentTracks =
          userProfile.unlockedTracks && userProfile.unlockedTracks.length > 0
            ? userProfile.unlockedTracks
            : getRandomStartTrack();
        const unlockResult = unlockRandomSoundCloudTrack(currentTracks);
        const newTracks = unlockResult.newTracks;

        await updateDoc(doc(db, 'users', user.uid), {
          rep: newRep,
          rank: newRank,
          level: newLevel,
          unlockedTracks: newTracks,
          lastActive: Timestamp.now(),
          photosTaken: (userProfile.photosTaken || 0) + 1,
        });

        setUserProfile((prev) =>
          prev ? { ...prev, rep: newRep, rank: newRank, level: newLevel, unlockedTracks: newTracks, photosTaken: (prev.photosTaken || 0) + 1 } : prev
        );
        setUnlockedTracks(newTracks);
        setDrops((prev) => [{ ...newDrop, firestoreId: dropId, id: `drop-${dropId}` }, ...prev]);

        // Remove music drop if this photo is replacing one
        const replacementDropId = selectedMusicDrop?.id || selectedMusicDrop?.firestoreId;
        if ((selectedMusicDrop as any)?.discovered && replacementDropId) {
          replaceMusicDropWithDropType(replacementDropId, 'photo');
          setSelectedMusicDrop(null);
        }
        setShowPhotoModal(false);
        setPendingDropPosition(null);

        const trackUnlocked = newTracks.length > currentTracks.length;
        const unlockedTrackUrl = trackUnlocked ? newTracks[newTracks.length - 1] : '';
        const unlockedTrackName = trackUnlocked ? getTrackNameFromUrlHelper(unlockedTrackUrl) : '';

        if (trackUnlocked) {
          setSongUnlockModal({ isOpen: true, trackUrl: unlockedTrackUrl, trackName: unlockedTrackName, source: 'GPS PHOTO DROP' });
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
            ? `🎵 NEW TRACK UNLOCKED! 🎵\n\n${unlockedTrackName}`
            : `📸 Photo Drop Placed! +${repEarned} REP`,
        });

        await maybeShowCrewWelcome(userProfile, user.uid, 'photo', setNpcWelcomeNotification, setUserProfile);
        await maybeCompleteAct1Mission(userProfile, user.uid, setUserProfile, setRepNotification);

      } catch (error) {
        console.error('Error creating drop:', error);
        alert(`Failed to create drop: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploadingPhoto(false);
        setIsCreatingDrop(false);
      }
    },
    [
      user, userProfile, isCreatingDrop, pendingDropPosition, gpsPosition, selectedMusicDrop,
      setIsCreatingDrop, setIsUploadingPhoto, setDrops, setUserProfile, setUnlockedTracks,
      setShowPhotoModal, setPendingDropPosition, setSelectedMusicDrop, setSongUnlockModal,
      setRecentlyUnlocked, setRepNotification, setNpcWelcomeNotification,
      replaceMusicDropWithDropType, loadDrops,
    ]
  );

  return { handlePhotoSelect };
};