'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { storage, realtimeDb } from '@/lib/firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref, get, onValue, set, remove, serverTimestamp } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { useSoundCloud } from '@/lib/soundcloud/hooks';

interface SoundCloudTrack {
  url: string;
  title: string;
  isLoaded: boolean;
  iframeId?: string;
}

interface UserProfile {
  uid: string;
  username: string;
  profilePicUrl: string;
  rep: number;
  level: number;
  rank: string;
  unlockedTracks?: string[];
}

interface MusicPlayerProps {
  userProfile: UserProfile | null;
  user: any;
  unlockedTracks: string[];
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;
  onTrackChange: (index: number) => void;
  onPlayStateChange: (playing: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onUnlockedTracksChange: (tracks: string[]) => void;
}



export const MusicPlayer: React.FC<MusicPlayerProps> = React.memo(({
  userProfile,
  user,
  unlockedTracks,
  currentTrackIndex,
  isPlaying,
  volume,
  onTrackChange,
  onPlayStateChange,
  onVolumeChange,
  onUnlockedTracksChange
}) => {
  const [soundCloudTracks, setSoundCloudTracks] = useState<SoundCloudTrack[]>([]);
  const [isSoundCloudLoading, setIsSoundCloudLoading] = useState(false);
  const soundCloudManager = useSoundCloud();

  // HIPHOP_TRACKS constant
  const HIPHOP_TRACKS = useMemo(() => [
    "https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1",
    "https://soundcloud.com/e-u-g-hdub-connected/hdub-party-ft-koers",
    "https://soundcloud.com/e-u-g-hdub-connected/fight-music",
    "https://soundcloud.com/e-u-g-hdub-connected/rockin-in-the-club",
    "https://soundcloud.com/e-u-g-hdub-connected/we-dont-owe-u-shit-ft-koers",
    "https://soundcloud.com/davidkdallas/runnin",
    "https://soundcloud.com/eke_87/eke-hangn-about",
    "https://soundcloud.com/hustle-kangs/so-good",
    "https://soundcloud.com/e-u-g-hdub-connected/b-o-p-freestyle-at-western",
    // ... more tracks
  ], []);

  // Helper function to get track name from URL
  const getTrackNameFromUrl = useCallback((url: string): string => {
    if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
    if (url.includes('soundcloud.com')) {
      const segments = url.split('/');
      const trackSegment = segments[segments.length - 1];
      return trackSegment.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return 'Unknown Track';
  }, []);

  // Function to create SoundCloud iframe URL
  const createSoundCloudIframeUrl = useCallback((trackUrl: string): string => {
    const params = new URLSearchParams({
      url: trackUrl,
      color: 'ff5500',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'false',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'false',
      sharing: 'false',
      buying: 'false',
      download: 'false',
      show_playcount: 'false',
      show_artwork: 'false',
      show_playlist: 'false'
    });
    
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  }, []);

  // Initialize main player
  const initializeMainPlayer = useCallback(() => {
    if (unlockedTracks.length === 0) return;

    const currentTrack = unlockedTracks[currentTrackIndex];
    if (!currentTrack || !currentTrack.includes('soundcloud.com')) return;

    const iframeId = 'soundcloud-main-player';
    
    const iframe = soundCloudManager.createIframe(iframeId, currentTrack, true);
    if (!iframe) return;

    const widget = soundCloudManager.createWidget(iframeId, currentTrack, {
      volume,
      onFinish: () => {
        onPlayStateChange(false);
        // Play next track
        const nextIndex = (currentTrackIndex + 1) % unlockedTracks.length;
        onTrackChange(nextIndex);
      },
      onError: (error: any) => {
        console.error('Main SoundCloud player error:', error);
      }
    });

    if (widget) {
      widget.bind(window.SC.Widget.Events.PLAY, () => {
        onPlayStateChange(true);
      });
      
      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        onPlayStateChange(false);
      });
    }
  }, [unlockedTracks, currentTrackIndex, volume, onPlayStateChange, onTrackChange, soundCloudManager]);

  // Play next track
  const playNextTrack = useCallback(() => {
    const nextIndex = (currentTrackIndex + 1) % unlockedTracks.length;
    onTrackChange(nextIndex);
  }, [currentTrackIndex, unlockedTracks.length, onTrackChange]);

  // Toggle play
  const togglePlay = useCallback(() => {
    if (unlockedTracks.length === 0) return;
    
    const iframeId = 'soundcloud-main-player';
    const widget = soundCloudManager.getWidget(iframeId);
    
    if (widget && typeof widget.toggle === 'function') {
      try {
        widget.toggle();
      } catch (error) {
        console.error('Failed to toggle playback:', error);
      }
    }
  }, [unlockedTracks, soundCloudManager]);

// Initialize SoundCloud manager and main player
  useEffect(() => {
    soundCloudManager.initialize().then(() => {
      initializeMainPlayer();
    });
  }, [initializeMainPlayer, soundCloudManager]);

  // Update widget when track changes
  useEffect(() => {
    if (unlockedTracks.length === 0) return;

    const currentTrack = unlockedTracks[currentTrackIndex];
    if (!currentTrack || !currentTrack.includes('soundcloud.com')) return;

    const iframeId = 'soundcloud-main-player';
    soundCloudManager.destroyWidget(iframeId);
    
    const iframe = soundCloudManager.createIframe(iframeId, currentTrack, true);
    if (!iframe) return;

    const widget = soundCloudManager.createWidget(iframeId, currentTrack, {
      volume,
      autoplay: isPlaying,
      onFinish: () => {
        onPlayStateChange(false);
        playNextTrack();
      },
      onError: (error: any) => {
        console.error('Track change SoundCloud error:', error);
      }
    });

    if (widget) {
      widget.bind(window.SC.Widget.Events.PLAY, () => {
        onPlayStateChange(true);
      });
      
      widget.bind(window.SC.Widget.Events.PAUSE, () => {
        onPlayStateChange(false);
      });
    }
  }, [currentTrackIndex, unlockedTracks, isPlaying, volume, playNextTrack, onPlayStateChange, soundCloudManager]);

  // Update volume
  useEffect(() => {
    const iframeId = 'soundcloud-main-player';
    const widget = soundCloudManager.getWidget(iframeId);
    
    if (widget && typeof widget.setVolume === 'function') {
      widget.setVolume(Math.round(volume * 100));
    }
  }, [volume, soundCloudManager]);

  // Initialize SoundCloud tracks
  useEffect(() => {
    const initializeSoundCloudTracks = async () => {
      const soundCloudUrls = unlockedTracks.filter(track => track.includes('soundcloud.com'));
      
      if (soundCloudUrls.length === 0) return;
      
      setIsSoundCloudLoading(true);
      
      const tracks = soundCloudUrls.map((url, index) => ({
        url,
        title: getTrackNameFromUrl(url),
        isLoaded: false,
        iframeId: `soundcloud-player-${Date.now()}-${index}`
      }));
      
      setSoundCloudTracks(tracks);
      setIsSoundCloudLoading(false);
    };

    initializeSoundCloudTracks();
  }, [unlockedTracks, getTrackNameFromUrl]);

  const currentTrack = unlockedTracks[currentTrackIndex];
  const trackName = currentTrack ? getTrackNameFromUrl(currentTrack) : 'No Track Selected';

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: '#e0e0e0',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      width: 'min(110vw, 400px)',
      maxHeight: '75vh',
      overflowY: 'auto' as const,
      border: '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(8px)',
      zIndex: 1200,
      position: 'relative' as 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
        paddingBottom: '10px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#10b981', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🎵</span>
          Music Player
          {unlockedTracks.length > 0 && (
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {currentTrackIndex + 1}/{unlockedTracks.length}
            </span>
          )}
        </h3>
      </div>

      {/* Current Track Info */}
      <div style={{
        marginBottom: '20px',
        textAlign: 'center',
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '8px'
      }}>
        {unlockedTracks.length === 0 ? (
          <div style={{ color: '#666' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎵</div>
            No tracks unlocked yet. Place markers to unlock music!
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {trackName}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {currentTrackIndex + 1} of {unlockedTracks.length}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {unlockedTracks.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              const prevIndex = currentTrackIndex === 0 ? unlockedTracks.length - 1 : currentTrackIndex - 1;
              onTrackChange(prevIndex);
            }}
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ⏮
          </button>
          
          <button
            onClick={togglePlay}
            style={{
              background: isPlaying ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              border: isPlaying ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
              color: 'white',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>
          
          <button
            onClick={playNextTrack}
            style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ⏭
          </button>
        </div>
      )}

      {/* Volume Control */}
      {unlockedTracks.length > 0 && (
        <div style={{
          marginBottom: '20px'
        }}>
          <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#333',
              outline: 'none'
            }}
          />
        </div>
      )}

      {/* Track List */}
      {unlockedTracks.length > 0 && (
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h4 style={{ 
            margin: '0 0 10px 0', 
            color: '#10b981', 
            fontSize: '14px' 
          }}>
            Unlocked Tracks:
          </h4>
          {unlockedTracks.map((track, index) => (
            <div
              key={track}
              onClick={() => onTrackChange(index)}
              style={{
                padding: '10px',
                margin: '5px 0',
                borderRadius: '6px',
                cursor: 'pointer',
                background: index === currentTrackIndex 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(255,255,255,0.05)',
                border: index === currentTrackIndex 
                  ? '1px solid rgba(16, 185, 129, 0.4)' 
                  : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (index !== currentTrackIndex) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentTrackIndex) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
            >
              <div style={{ fontSize: '14px' }}>
                {getTrackNameFromUrl(track)}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                Track {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading Indicator */}
      {isSoundCloudLoading && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#666'
        }}>
          Loading tracks...
        </div>
      )}
    </div>
  );
});

MusicPlayer.displayName = 'MusicPlayer';