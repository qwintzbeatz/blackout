/**
 * useMusicPlayer - Centralized music player state management
 * Handles track playback, queue management, and unlock logic
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SPOTIFY_TRACKS } from '@/constants/all_tracks';
import { HIPHOP_TRACKS } from '@/constants/tracks';
import { getTrackNameFromUrl, isSpotifyUrl } from '@/lib/utils/dropHelpers';
import { getTrackName } from '@/constants/all_tracks';

// Get a random starting track
const getRandomStartTrack = (): string[] => {
  const randomIndex = Math.floor(Math.random() * SPOTIFY_TRACKS.length);
  return [SPOTIFY_TRACKS[randomIndex]];
};

export interface UseMusicPlayerOptions {
  initialTracks?: string[];
  onTrackUnlock?: (trackUrl: string, trackName: string) => void;
}

export interface UseMusicPlayerReturn {
  // State
  unlockedTracks: string[];
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  showPlayer: boolean;
  currentTrackName: string;
  currentTrackUrl: string | null;
  isSpotify: boolean;
  
  // Actions
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (volume: number) => void;
  setShowPlayer: (show: boolean) => void;
  selectTrack: (index: number) => void;
  
  // Track management
  unlockRandomTrack: () => { url: string; name: string; source: 'Spotify' | 'SoundCloud' } | null;
  removeTrack: (trackUrl: string) => void;
  setTracks: (tracks: string[]) => void;
  syncFromProfile: (tracks: string[]) => void;
}

export function useMusicPlayer(options: UseMusicPlayerOptions = {}): UseMusicPlayerReturn {
  const { initialTracks, onTrackUnlock } = options;
  
  // Initialize with provided tracks or random start track
  const [unlockedTracks, setUnlockedTracks] = useState<string[]>(
    initialTracks && initialTracks.length > 0 ? initialTracks : getRandomStartTrack()
  );
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showPlayer, setShowPlayer] = useState(false);
  
  // Track if we've attempted autoplay
  const autoplayAttempted = useRef(false);

  // Autoplay on mount (after a small delay for iframe to mount)
  useEffect(() => {
    if (unlockedTracks.length > 0 && !isPlaying && !autoplayAttempted.current) {
      autoplayAttempted.current = true;
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [unlockedTracks.length]);

  // Get current track info
  const currentTrackUrl = unlockedTracks[currentTrackIndex] || null;
  const currentTrackName = currentTrackUrl 
    ? getTrackNameFromUrl(currentTrackUrl) || getTrackName(currentTrackUrl)
    : 'No tracks unlocked';
  const isSpotify = currentTrackUrl ? isSpotifyUrl(currentTrackUrl) : true;

  // Playback controls
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  
  const togglePlay = useCallback(() => {
    if (unlockedTracks.length === 0) return;
    setIsPlaying(prev => !prev);
  }, [unlockedTracks.length]);

  const playNext = useCallback(() => {
    if (unlockedTracks.length === 0) return;
    setCurrentTrackIndex(prev => (prev + 1) % unlockedTracks.length);
    setIsPlaying(true);
  }, [unlockedTracks.length]);

  const playPrevious = useCallback(() => {
    if (unlockedTracks.length === 0) return;
    setCurrentTrackIndex(prev => prev > 0 ? prev - 1 : unlockedTracks.length - 1);
    setIsPlaying(true);
  }, [unlockedTracks.length]);

  const selectTrack = useCallback((index: number) => {
    if (index >= 0 && index < unlockedTracks.length) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      setShowPlayer(true);
    }
  }, [unlockedTracks.length]);

  // Unlock a random track
  const unlockRandomTrack = useCallback((): { url: string; name: string; source: 'Spotify' | 'SoundCloud' } | null => {
    // Combine Spotify and SoundCloud tracks
    const ALL_TRACKS = [...SPOTIFY_TRACKS, ...HIPHOP_TRACKS];
    
    // Get tracks that haven't been unlocked yet
    const availableTracks = ALL_TRACKS.filter(track => !unlockedTracks.includes(track));

    if (availableTracks.length === 0) return null;

    // Pick random track
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    const trackName = getTrackNameFromUrl(randomTrack) || getTrackName(randomTrack);
    const source = isSpotifyUrl(randomTrack) ? 'Spotify' : 'SoundCloud';
    
    // Add to unlocked tracks
    setUnlockedTracks(prev => [...prev, randomTrack]);
    
    // Notify callback
    if (onTrackUnlock) {
      onTrackUnlock(randomTrack, trackName);
    }
    
    return { url: randomTrack, name: trackName, source };
  }, [unlockedTracks, onTrackUnlock]);

  // Remove a track (e.g., when dropping it on the map)
  const removeTrack = useCallback((trackUrl: string) => {
    setUnlockedTracks(prev => {
      const newTracks = prev.filter(t => t !== trackUrl);
      // Adjust current index if needed
      if (currentTrackIndex >= newTracks.length && newTracks.length > 0) {
        setCurrentTrackIndex(newTracks.length - 1);
      }
      return newTracks;
    });
  }, [currentTrackIndex]);

  // Set tracks directly
  const setTracks = useCallback((tracks: string[]) => {
    setUnlockedTracks(tracks);
    if (currentTrackIndex >= tracks.length && tracks.length > 0) {
      setCurrentTrackIndex(tracks.length - 1);
    }
  }, [currentTrackIndex]);

  // Sync from user profile
  const syncFromProfile = useCallback((tracks: string[]) => {
    if (tracks && tracks.length > 0) {
      setUnlockedTracks(tracks);
      if (currentTrackIndex >= tracks.length) {
        setCurrentTrackIndex(0);
      }
    }
  }, [currentTrackIndex]);

  return {
    // State
    unlockedTracks,
    currentTrackIndex,
    isPlaying,
    volume,
    showPlayer,
    currentTrackName,
    currentTrackUrl,
    isSpotify,
    
    // Actions
    play,
    pause,
    togglePlay,
    playNext,
    playPrevious,
    setVolume,
    setShowPlayer,
    selectTrack,
    
    // Track management
    unlockRandomTrack,
    removeTrack,
    setTracks,
    syncFromProfile,
  };
}

// Helper to get a random start track (exported for use in other modules)
export { getRandomStartTrack };