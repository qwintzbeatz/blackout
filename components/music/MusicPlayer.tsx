'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSoundCloud } from '@/lib/soundcloud/hooks';
import { getTrackNameFromUrl } from '@/lib/utils';

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

// SoundCloud embed URL helper
const createSoundCloudEmbedUrl = (trackUrl: string): string => {
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
};

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
  const [currentTrack, setCurrentTrack] = useState<SoundCloudTrack | null>(null);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const soundCloudManager = useSoundCloud();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);

  // Initialize SoundCloud manager and tracks
  useEffect(() => {
    soundCloudManager.initialize().then(() => {
      console.log('SoundCloud manager initialized');
    });
  }, [soundCloudManager]);

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
  }, [unlockedTracks]);

  // Get current track URL
  const currentTrackUrl = unlockedTracks[currentTrackIndex];
  const isCurrentTrackSoundCloud = currentTrackUrl?.includes('soundcloud.com');

  // Create SoundCloud embed when track changes
  useEffect(() => {
    if (!isCurrentTrackSoundCloud || !currentTrackUrl) return;

    // Destroy previous widget
    if (widgetRef.current) {
      try {
        widgetRef.current.unbind(window.SC?.Widget?.Events?.PLAY);
        widgetRef.current.unbind(window.SC?.Widget?.Events?.PAUSE);
        widgetRef.current.unbind(window.SC?.Widget?.Events?.FINISH);
        widgetRef.current.unbind(window.SC?.Widget?.Events?.READY);
      } catch (e) {
        console.warn('Error unbinding widget events:', e);
      }
      widgetRef.current = null;
    }

    // Clear iframe
    if (iframeRef.current) {
      iframeRef.current.src = '';
    }

    // Set new embed URL
    const embedUrl = createSoundCloudEmbedUrl(currentTrackUrl);
    if (iframeRef.current) {
      iframeRef.current.src = embedUrl;
    }

    // Initialize widget after iframe loads
    const initWidget = () => {
      if (!window.SC || !window.SC.Widget) {
        console.warn('SoundCloud widget not available');
        return;
      }

      try {
        widgetRef.current = new window.SC.Widget(iframeRef.current!);
        
        widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
          console.log('SoundCloud widget ready');
          if (isPlaying) {
            widgetRef.current.play();
          }
        });

        widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
          onPlayStateChange(true);
        });

        widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
          onPlayStateChange(false);
        });

        widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
          onPlayStateChange(false);
          // Auto play next track
          const nextIndex = (currentTrackIndex + 1) % unlockedTracks.length;
          onTrackChange(nextIndex);
        });
      } catch (error) {
        console.error('Failed to create SoundCloud widget:', error);
      }
    };

    // Wait for iframe to be ready
    if (iframeRef.current) {
      iframeRef.current.onload = initWidget;
      
      // If already loaded, init immediately
      if (iframeRef.current.contentDocument?.readyState === 'complete') {
        initWidget();
      }
    }
  }, [currentTrackUrl, isCurrentTrackSoundCloud, isPlaying, currentTrackIndex, unlockedTracks, onPlayStateChange, onTrackChange]);

  // Update volume
  useEffect(() => {
    if (widgetRef.current && typeof widgetRef.current.setVolume === 'function') {
      try {
        widgetRef.current.setVolume(Math.round(volume * 100));
      } catch (error) {
        console.error('Failed to set volume:', error);
      }
    }
  }, [volume]);

  // Play/pause control
  useEffect(() => {
    if (widgetRef.current) {
      try {
        if (isPlaying) {
          widgetRef.current.play();
        } else {
          widgetRef.current.pause();
        }
      } catch (error) {
        console.error('Failed to toggle playback:', error);
      }
    }
  }, [isPlaying]);

  const trackName = currentTrackUrl ? getTrackNameFromUrl(currentTrackUrl) : 'No Track Selected';

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
      position: 'relative' as const
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid rgba(138, 43, 226, 0.3)',
        paddingBottom: '10px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#8a2be2', 
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
              backgroundColor: 'rgba(138, 43, 226, 0.2)',
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
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#ff5500' }}>
              {trackName}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {isCurrentTrackSoundCloud ? '🔊 SoundCloud' : '🎵 Track'} • {currentTrackIndex + 1} of {unlockedTracks.length}
            </div>
          </div>
        )}
      </div>

      {/* SoundCloud Embed */}
      {isCurrentTrackSoundCloud && currentTrackUrl && (
        <div style={{
          marginBottom: '20px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}>
          <iframe
            ref={iframeRef}
            src={createSoundCloudEmbedUrl(currentTrackUrl)}
            width="100%"
            height="100"
            style={{ border: 'none', borderRadius: '8px' }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            title="SoundCloud Player"
          />
        </div>
      )}

      {/* Controls */}
      {unlockedTracks.length > 0 && isCurrentTrackSoundCloud && (
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
              background: 'rgba(138, 43, 226, 0.2)',
              border: '1px solid rgba(138, 43, 226, 0.3)',
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
            onClick={() => onPlayStateChange(!isPlaying)}
            style={{
              background: isPlaying ? 'rgba(239, 68, 68, 0.3)' : 'rgba(138, 43, 226, 0.3)',
              border: isPlaying ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(138, 43, 226, 0.4)',
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
            onClick={() => {
              const nextIndex = (currentTrackIndex + 1) % unlockedTracks.length;
              onTrackChange(nextIndex);
            }}
            style={{
              background: 'rgba(138, 43, 226, 0.2)',
              border: '1px solid rgba(138, 43, 226, 0.3)',
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
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block', color: '#ff5500' }}>
            🔊 Volume: {Math.round(volume * 100)}%
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
              background: `linear-gradient(to right, #ff5500 0%, #ff5500 ${volume * 100}%, #333 ${volume * 100}%, #333 100%)`,
              outline: 'none',
              cursor: 'pointer'
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
            color: '#ff5500', 
            fontSize: '14px' 
          }}>
            Your Tracks:
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
                  ? 'rgba(138, 43, 226, 0.2)' 
                  : 'rgba(255,255,255,0.05)',
                border: index === currentTrackIndex 
                  ? '1px solid rgba(138, 43, 226, 0.4)' 
                  : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
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
              <span style={{ 
                fontSize: '12px',
                color: index === currentTrackIndex ? '#8a2be2' : '#666',
                minWidth: '20px'
              }}>
                {index + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px' }}>
                  {getTrackNameFromUrl(track)}
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {track.includes('soundcloud.com') ? '🔊 SoundCloud' : '🎵 Track'}
                </div>
              </div>
              {index === currentTrackIndex && (
                <span style={{ fontSize: '10px', color: '#8a2be2' }}>
                  {isPlaying ? '▶️ Playing' : '⏸ Paused'}
                </span>
              )}
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
