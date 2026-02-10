import { useState, useRef, useCallback, useEffect } from 'react';

// Types
export interface SoundCloudTrack {
  id: number;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  streamUrl: string;
  waveformUrl?: string;
}

export interface SoundCloudPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
  track: SoundCloudTrack | null;
  hasUserInteracted: boolean;
}

export interface SoundCloudPlayerActions {
  loadTrack: (url: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  togglePlay: () => Promise<void>;
  clearError: () => void;
  dismissInteractedPrompt: () => void;
}

// Constants
const DEFAULT_VOLUME = 0.7;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Hook
export function useSoundCloudPlayer() {
  // State
  const [state, setState] = useState<SoundCloudPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: DEFAULT_VOLUME,
    error: null,
    track: null,
    hasUserInteracted: false,
  });

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const lastVolumeRef = useRef(DEFAULT_VOLUME);

  // Fetch track from API
  const fetchTrack = useCallback(async (url: string): Promise<SoundCloudTrack | null> => {
    try {
      const response = await fetch('/api/soundcloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load track');
      }

      if (!data.success || !data.track) {
        throw new Error('Invalid response from server');
      }

      return data.track;
    } catch (error) {
      console.error('Error fetching track:', error);
      throw error;
    }
  }, []);

  // Load track
  const loadTrack = useCallback(async (url: string) => {
    if (typeof window !== 'undefined' && !state.hasUserInteracted) {
      setState(prev => ({ ...prev, hasUserInteracted: true }));
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const track = await fetchTrack(url);
      
      if (!track) {
        throw new Error('Track not found');
      }

      // Create or reuse audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      } else {
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = 'anonymous';
        
        // Add event listeners
        audioRef.current.addEventListener('loadedmetadata', () => {
          if (audioRef.current) {
            setState(prev => ({ ...prev, duration: audioRef.current!.duration, isLoading: false }));
          }
        });

        audioRef.current.addEventListener('timeupdate', () => {
          if (audioRef.current) {
            setState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }));
          }
        });

        audioRef.current.addEventListener('ended', () => {
          setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        });

        audioRef.current.addEventListener('error', (e: Event) => {
          console.error('Audio error:', e);
          const errorMessages: Record<number, string> = {
            1: 'Playback aborted by user',
            2: 'Network error - check your connection',
            3: 'Decoding error - file format not supported',
            4: 'Audio source not supported',
          };
          
          const errorMessage = errorMessages[audioRef.current?.error?.code || 0] || 
            'Unable to play this track. Try a different one.';
          
          setState(prev => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            error: errorMessage,
          }));
        });

        audioRef.current.addEventListener('canplay', () => {
          setState(prev => ({ ...prev, isLoading: false }));
        });

        audioRef.current.addEventListener('waiting', () => {
          setState(prev => ({ ...prev, isLoading: true }));
        });

        audioRef.current.addEventListener('playing', () => {
          setState(prev => ({ ...prev, isLoading: false }));
        });
      }

      audioRef.current.volume = lastVolumeRef.current;
      audioRef.current.src = track.streamUrl;

      // Wait for canplay or error
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Load timeout')), 10000);
        
        const cleanup = () => {
          clearTimeout(timeout);
          audioRef.current?.removeEventListener('canplay', onCanPlay);
          audioRef.current?.removeEventListener('error', onError);
        };

        const onCanPlay = () => {
          cleanup();
          resolve();
        };

        const onError = (e: Event) => {
          cleanup();
          reject(e);
        };

        audioRef.current?.addEventListener('canplay', onCanPlay, { once: true });
        audioRef.current?.addEventListener('error', onError, { once: true });
      });

      setState(prev => ({
        ...prev,
        track,
        isLoading: false,
        duration: audioRef.current?.duration || 0,
        error: null,
      }));

      retryCountRef.current = 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load track';
      
      // Retry logic
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setState(prev => ({ ...prev, isLoading: true }));
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return loadTrack(url);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [fetchTrack, state.hasUserInteracted]);

  // Play
  const play = useCallback(async () => {
    if (!audioRef.current) {
      if (state.track) {
        audioRef.current = new Audio(state.track.streamUrl);
        audioRef.current.volume = lastVolumeRef.current;
        audioRef.current.crossOrigin = 'anonymous';
        
        // Add minimal event listeners
        audioRef.current.addEventListener('ended', () => {
          setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        });
        
        audioRef.current.addEventListener('error', (e: Event) => {
          setState(prev => ({
            ...prev,
            isPlaying: false,
            isLoading: false,
            error: 'Playback error. Tap to try again.',
          }));
        });
      } else {
        return;
      }
    }

    try {
      await audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
    } catch (error) {
      console.error('Play error:', error);
      
      // Handle autoplay restrictions
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setState(prev => ({
          ...prev,
          error: 'Tap the play button to start playing music.',
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: 'Unable to play. Tap to try again.',
        }));
      }
    }
  }, [state.track]);

  // Pause
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Toggle play
  const togglePlay = useCallback(async () => {
    if (state.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  // Seek
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
    audioRef.current.currentTime = clampedTime;
    setState(prev => ({ ...prev, currentTime: clampedTime }));
  }, []);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    
    lastVolumeRef.current = clampedVolume;
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Dismiss interacted prompt
  const dismissInteractedPrompt = useCallback(() => {
    setState(prev => ({ ...prev, hasUserInteracted: true }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Persist volume to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundcloud_volume', lastVolumeRef.current.toString());
    }
  }, [state.volume]);

  // Load saved volume on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('soundcloud_volume');
      if (savedVolume) {
        const volume = parseFloat(savedVolume);
        if (!isNaN(volume) && volume >= 0 && volume <= 1) {
          lastVolumeRef.current = volume;
          setState(prev => ({ ...prev, volume }));
        }
      }
    }
  }, []);

  return {
    state,
    actions: {
      loadTrack,
      play,
      pause,
      seek,
      setVolume,
      togglePlay,
      clearError,
      dismissInteractedPrompt,
    },
  };
}

export default useSoundCloudPlayer;
