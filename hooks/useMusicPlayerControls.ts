/**
 * useMusicPlayerControls.ts
 * Extracted from page.tsx – track playback helpers.
 *
 * Usage:
 *   const { togglePlay, playNextTrack, playPreviousTrack, getCurrentTrackName, handleVolumeChange } =
 *     useMusicPlayerControls({ ... });
 */

import { useCallback } from 'react';
import { getTrackNameFromUrl as getTrackNameFromUrlHelper } from '@/lib/utils/dropHelpers';

interface UseMusicPlayerControlsParams {
  unlockedTracks: string[];
  currentTrackIndex: number;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  setCurrentTrackIndex: (v: number) => void;
  setVolume: (v: number) => void;
}

export const useMusicPlayerControls = ({
  unlockedTracks,
  currentTrackIndex,
  isPlaying,
  setIsPlaying,
  setCurrentTrackIndex,
  setVolume,
}: UseMusicPlayerControlsParams) => {

  const togglePlay = useCallback(() => {
    if (unlockedTracks.length === 0) return;
    setIsPlaying(!isPlaying);
  }, [unlockedTracks.length, isPlaying, setIsPlaying]);

  const playNextTrack = useCallback(() => {
    if (unlockedTracks.length === 0) return;
    setCurrentTrackIndex((currentTrackIndex + 1) % unlockedTracks.length);
    setIsPlaying(true);
  }, [unlockedTracks.length, currentTrackIndex, setCurrentTrackIndex, setIsPlaying]);

  const playPreviousTrack = useCallback(() => {
    if (unlockedTracks.length === 0) return;
    const prevIndex =
      currentTrackIndex > 0 ? currentTrackIndex - 1 : unlockedTracks.length - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  }, [unlockedTracks.length, currentTrackIndex, setCurrentTrackIndex, setIsPlaying]);

  const getCurrentTrackName = useCallback((): string => {
    if (unlockedTracks.length === 0) return 'No tracks unlocked';
    return getTrackNameFromUrlHelper(unlockedTracks[currentTrackIndex]);
  }, [unlockedTracks, currentTrackIndex]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(parseFloat(e.target.value));
    },
    [setVolume]
  );

  return { togglePlay, playNextTrack, playPreviousTrack, getCurrentTrackName, handleVolumeChange };
};
