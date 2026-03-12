import { useCallback } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { Dispatch, SetStateAction } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { saveDropToFirestore, deleteDrop } from '@/lib/firebase/drops';
import { getRandomStartTrack } from '@/hooks/useMusicPlayer';
import { unlockRandomSpotifyTrack, unlockRandomSoundCloudTrack } from '@/lib/utils/musicUnlocks';
import { getTrackNameFromUrl as getTrackNameFromUrlHelper } from '@/lib/utils/dropHelpers';
import { FACEBOOK_VIDEOS, getVideoName } from '@/constants/videos';
import { GRAFFITI_TO_MARKER_DESCRIPTION } from '@/utils/typeMapping';
import { RepNotificationPayload } from '@/lib/utils/dropRewards';
import { UserProfile, UserMarker, Drop } from '@/lib/types/blackout';
import { SurfaceType, GraffitiType } from '@/types';
import { MarkerDescription } from '@/constants/markers';

interface UseMusicDropReplacementParams {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  userProfileRef: React.MutableRefObject<UserProfile | null>;
  isCreatingDrop: boolean;
  drops: Drop[];
  musicDrops: any[];
  unlockedTracks: string[];
  selectedMarkerType: MarkerDescription;
  selectedMarkerColor: string;
  selectedSurface: SurfaceType;
  selectedGraffitiType: GraffitiType;
  selectedSpecialType: 'rainbow' | 'glow' | 'metallic' | null;

  setIsCreatingDrop: Dispatch<SetStateAction<boolean>>;
  setDrops: Dispatch<SetStateAction<Drop[]>>;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>;
  setUnlockedTracks: Dispatch<SetStateAction<string[]>>;
  setSelectedMusicDrop: Dispatch<SetStateAction<Drop | null>>;
  setShowDropTypeModal: Dispatch<SetStateAction<boolean>>;
  setPendingDropPosition: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>;
  setRepNotification: Dispatch<SetStateAction<RepNotificationPayload | null>>;
  setRecentlyUnlocked: Dispatch<SetStateAction<{ url: string; name: string; source: 'Spotify' | 'SoundCloud' } | null>>;
  setSongUnlockModal: Dispatch<SetStateAction<{ isOpen: boolean; trackUrl: string; trackName: string; source: string } | null>>;
  setVideoUnlockModal: Dispatch<SetStateAction<{ isOpen: boolean; videoUrl: string; source: string } | null>>;

  replaceMusicDropWithDropType: (id: string, type: 'marker' | 'photo' | 'music') => any;
  saveMarkerToFirestore: (marker: UserMarker) => Promise<string | null>;
  loadDrops: () => Promise<void>;
  loadAllMarkers: () => Promise<void>;
}

export const useMusicDropReplacement = ({
  user,
  userProfile,
  userProfileRef,
  isCreatingDrop,
  drops,
  musicDrops,
  unlockedTracks,
  selectedMarkerType,
  selectedMarkerColor,
  selectedSurface,
  selectedGraffitiType,
  selectedSpecialType,
  setIsCreatingDrop,
  setDrops,
  setUserProfile,
  setUnlockedTracks,
  setSelectedMusicDrop,
  setShowDropTypeModal,
  setPendingDropPosition,
  setRepNotification,
  setRecentlyUnlocked,
  setSongUnlockModal,
  setVideoUnlockModal,
  replaceMusicDropWithDropType,
  saveMarkerToFirestore,
  loadDrops,
  loadAllMarkers,
}: UseMusicDropReplacementParams) => {

  const handleMusicDropReplacement = useCallback(async (
    dropId: string,
    dropType: 'marker' | 'photo' | 'music'
  ) => {
    if (!user || !userProfile || isCreatingDrop) return null;

    setIsCreatingDrop(true);

    try {
      const originalDrop =
        musicDrops.find(d => d.id === dropId) ||
        drops.find(d => d.id === dropId || d.firestoreId === dropId);

      if (!originalDrop) {
        console.warn(`⚠️ Could not find original drop with ID: ${dropId}`);
        return null;
      }

      const replacementData = replaceMusicDropWithDropType(dropId, dropType);
      setDrops(prev => prev.filter(d => d.id !== dropId && d.firestoreId !== dropId));

      const firestoreDrop = drops.find(d => d.id === dropId || d.firestoreId === dropId);
      if (firestoreDrop?.firestoreId) {
        deleteDrop(firestoreDrop.firestoreId).catch(err =>
          console.error('Error deleting drop from Firestore:', err)
        );
      }

      if (!replacementData) {
        console.warn('⚠️ Replacement data not found');
        return null;
      }

      // ── Create a new drop at the same location ───────────────────────────
      let newDropId: string | null = null;
      let dropRepReward = 0;
      const dropLat = 'position' in originalDrop ? originalDrop.position[0] : originalDrop.lat;
      const dropLng = 'position' in originalDrop ? originalDrop.position[1] : originalDrop.lng;

      try {
        if (dropType === 'marker') {
          dropRepReward = 5;
          const newMarker: UserMarker = {
            id: `temp-${Date.now()}`,
            position: [dropLat, dropLng],
            name: selectedMarkerType || 'Tag',
            description: GRAFFITI_TO_MARKER_DESCRIPTION[selectedGraffitiType] || 'tag',
            color: selectedMarkerColor,
            timestamp: new Date(),
            userId: user.uid,
            username: userProfile.username,
            userProfilePic: userProfile.profilePicUrl,
            surface: selectedSurface as any,
            graffitiType: selectedGraffitiType as any,
            specialType: selectedSpecialType,
            styleId: userProfileRef.current?.selectedGraffitiStyle,
          };
          newDropId = await saveMarkerToFirestore(newMarker);
        } else if (dropType === 'photo') {
          dropRepReward = 10;
          newDropId = await saveDropToFirestore({
            lat: dropLat,
            lng: dropLng,
            photoUrl: 'https://via.placeholder.com/400x400?text=Music+Drop+Replacement',
            createdBy: user.uid,
            timestamp: new Date(),
            likes: [],
            username: userProfile.username,
            userProfilePic: userProfile.profilePicUrl,
          });
        } else if (dropType === 'music') {
          const tracks = userProfile.unlockedTracks ?? unlockedTracks;
          if (tracks.length > 0) {
            const trackToDrop = tracks[0];
            newDropId = await saveDropToFirestore({
              lat: dropLat,
              lng: dropLng,
              trackUrl: trackToDrop,
              createdBy: user.uid,
              timestamp: new Date(),
              likes: [],
              username: userProfile.username,
              userProfilePic: userProfile.profilePicUrl,
            });
            const newTracks = tracks.filter(t => t !== trackToDrop);
            await updateDoc(doc(db, 'users', user.uid), { unlockedTracks: newTracks, lastActive: Timestamp.now() });
            setUserProfile(prev => prev ? { ...prev, unlockedTracks: newTracks } : null);
            setUnlockedTracks(newTracks);
          }
        }

        if (newDropId) {
          await loadDrops();
          await loadAllMarkers();
        }
      } catch (err) {
        console.error(`❌ Error creating ${dropType} drop:`, err);
      }

      // ── Calculate unlock rewards ─────────────────────────────────────────
      let rewardTrackUrl = '';
      let rewardTrackName = '';
      let rewardSource = '';
      let rewardMessage = '';

      switch (dropType) {
        case 'marker': {
          const currentTracks = userProfile.unlockedTracks?.length
            ? userProfile.unlockedTracks : getRandomStartTrack();
          const { newTracks } = unlockRandomSpotifyTrack(currentTracks);
          const trackUnlocked = newTracks.length > currentTracks.length;
          const unlockedUrl = trackUnlocked ? newTracks[newTracks.length - 1] : '';
          const unlockedName = trackUnlocked ? getTrackNameFromUrlHelper(unlockedUrl) : '';

          rewardTrackUrl = unlockedUrl;
          rewardTrackName = unlockedName;
          rewardSource = 'Spotify';

          await updateDoc(doc(db, 'users', user.uid), { unlockedTracks: newTracks, lastActive: Timestamp.now() });
          setUserProfile(prev => prev ? { ...prev, unlockedTracks: newTracks } : null);
          setUnlockedTracks(newTracks);

          rewardMessage = trackUnlocked
            ? `${unlockedName} Unlocked!\n${selectedMarkerType || 'Marker'} marker placed!`
            : `${selectedMarkerType || 'Marker'} marker placed!`;

          if (trackUnlocked) {
            setSongUnlockModal({ isOpen: true, trackUrl: unlockedUrl, trackName: unlockedName, source: 'MARKER DROP' });
          }
          break;
        }
        case 'photo': {
          const photoTracks = userProfile.unlockedTracks?.length
            ? userProfile.unlockedTracks : getRandomStartTrack();
          const { newTracks: newPhotoTracks } = unlockRandomSoundCloudTrack(photoTracks);
          const photoTrackUnlocked = newPhotoTracks.length > photoTracks.length;
          const unlockedUrl = photoTrackUnlocked ? newPhotoTracks[newPhotoTracks.length - 1] : '';
          const unlockedName = photoTrackUnlocked ? getTrackNameFromUrlHelper(unlockedUrl) : '';

          rewardTrackUrl = unlockedUrl;
          rewardTrackName = unlockedName;
          rewardSource = 'SoundCloud';

          await updateDoc(doc(db, 'users', user.uid), { unlockedTracks: newPhotoTracks, lastActive: Timestamp.now() });
          setUserProfile(prev => prev ? { ...prev, unlockedTracks: newPhotoTracks } : null);
          setUnlockedTracks(newPhotoTracks);

          rewardMessage = photoTrackUnlocked ? `NEW TRACK UNLOCKED!\n\n${unlockedName}` : 'Photo drop placed!';
          if (photoTrackUnlocked) {
            setSongUnlockModal({ isOpen: true, trackUrl: unlockedUrl, trackName: unlockedName, source: 'GPS PHOTO DROP' });
          }
          break;
        }
        case 'music': {
          const currentVideos = userProfile.unlockedVideos || [];
          const available = FACEBOOK_VIDEOS.filter(v => !currentVideos.includes(v));
          if (available.length > 0) {
            const randomVideo = available[Math.floor(Math.random() * available.length)];
            const newVideos = [...currentVideos, randomVideo];
            rewardTrackUrl = randomVideo;
            rewardTrackName = getVideoName(randomVideo);
            rewardSource = 'Facebook Video';
            rewardMessage = `🎬 Music Drop Replacement: Unlocked ${rewardTrackName}!`;
            await updateDoc(doc(db, 'users', user.uid), { unlockedVideos: newVideos, lastActive: Timestamp.now() });
            setUserProfile(prev => prev ? { ...prev, unlockedVideos: newVideos } : null);
            setVideoUnlockModal({ isOpen: true, videoUrl: randomVideo, source: 'MUSIC DROP REPLACEMENT' });
          } else {
            rewardMessage = '🎬 Music Drop Replacement: All Facebook videos already unlocked!';
          }
          break;
        }
      }

      const repAmount = ('repReward' in originalDrop ? originalDrop.repReward : 15) || 15;
      const totalRep = dropType === 'marker' ? dropRepReward : repAmount + dropRepReward;
      const finalMessage = dropRepReward > 0
        ? `${rewardMessage} (+${dropRepReward} REP for new ${dropType} drop)`
        : rewardMessage;

      setRepNotification({ show: true, amount: totalRep, message: finalMessage });

      if (rewardTrackUrl && rewardSource !== 'Facebook Video') {
        setRecentlyUnlocked({ url: rewardTrackUrl, name: rewardTrackName, source: rewardSource as 'Spotify' | 'SoundCloud' });
      }

      setSelectedMusicDrop(null);
      setShowDropTypeModal(false);
      setPendingDropPosition(null);

      return replacementData;
    } catch (error) {
      console.error('Error handling music drop replacement:', error);
      return null;
    } finally {
      setIsCreatingDrop(false);
    }
  }, [
    user, userProfile, userProfileRef, isCreatingDrop, drops, musicDrops, unlockedTracks,
    selectedMarkerType, selectedMarkerColor, selectedSurface, selectedGraffitiType, selectedSpecialType,
    setIsCreatingDrop, setDrops, setUserProfile, setUnlockedTracks, setSelectedMusicDrop,
    setShowDropTypeModal, setPendingDropPosition, setRepNotification, setRecentlyUnlocked,
    setSongUnlockModal, setVideoUnlockModal, replaceMusicDropWithDropType, saveMarkerToFirestore,
    loadDrops, loadAllMarkers,
  ]);

  return { handleMusicDropReplacement };
};
