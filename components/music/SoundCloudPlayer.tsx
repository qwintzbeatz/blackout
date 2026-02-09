'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SoundCloudPlayerProps {
  trackUrl: string;
  isPlaying: boolean;
  onTrackEnd: () => void;
  onPlayPause: (isPlaying: boolean) => void;
  onError?: (error: Error) => void;
  isMobile: boolean;
  trackName?: string;
}

type PlayerState = 'unloaded' | 'loading' | 'loaded-expanded' | 'loaded-minimized';

const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({
  trackUrl,
  isPlaying,
  onTrackEnd,
  onPlayPause,
  onError,
  isMobile,
  trackName = 'Track'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('unloaded');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const autoMinimizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get display name from URL
  const getDisplayName = useCallback(() => {
    if (trackName && trackName !== 'Track') return trackName;
    try {
      const url = new URL(trackUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (e) {
      // Invalid URL, use default
    }
    return 'SoundCloud Track';
  }, [trackUrl, trackName]);

  // Load SoundCloud Widget API
  const loadSoundCloudAPI = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.SC && window.SC.Widget) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      script.onload = () => {
        console.log('SoundCloud API loaded');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load SoundCloud API');
        reject(new Error('Failed to load SoundCloud API'));
      };
      document.body.appendChild(script);
    });
  }, []);

  // Initialize widget
  const initializeWidget = useCallback(async () => {
    if (!iframeRef.current || !window.SC) return;

    try {
      widgetRef.current = new window.SC.Widget(iframeRef.current);
      
      widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
        console.log('SoundCloud widget ready');
        setIsWidgetReady(true);
        setPlayerState('loaded-expanded');
        
        // Auto-play and start auto-minimize timer
        widgetRef.current.play();
        onPlayPause(true);
        
        // Auto-minimize after 5 seconds
        autoMinimizeTimerRef.current = setTimeout(() => {
          setPlayerState('loaded-minimized');
        }, 5000);
        
        // Bind to track finish
        widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
          console.log('Track finished');
          onTrackEnd();
        });

        // Bind to play/pause events
        widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
          console.log('Track playing');
          setInternalIsPlaying(true);
        });

        widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
          console.log('Track paused');
          setInternalIsPlaying(false);
        });

        // Bind to error
        widgetRef.current.bind(window.SC.Widget.Events.ERROR, (e: any) => {
          console.error('SoundCloud error:', e);
          onError?.(new Error('SoundCloud playback error'));
        });
      });
    } catch (err) {
      console.error('Error initializing SoundCloud widget:', err);
      onError?.(err as Error);
      setPlayerState('unloaded');
    }
  }, [onTrackEnd, onPlayPause, onError]);

  // Handle first user interaction
  const handleFirstInteraction = useCallback(async () => {
    if (playerState !== 'unloaded') return;
    
    setPlayerState('loading');
    
    try {
      await loadSoundCloudAPI();
      // Widget will auto-initialize when iframe mounts
    } catch (err) {
      console.error('Failed to load SoundCloud:', err);
      setPlayerState('unloaded');
      onError?.(err as Error);
    }
  }, [playerState, loadSoundCloudAPI, onError]);

  // Handle external play/pause commands
  useEffect(() => {
    if (!widgetRef.current || !isWidgetReady) return;
    
    if (isPlaying && !internalIsPlaying) {
      widgetRef.current.play();
    } else if (!isPlaying && internalIsPlaying) {
      widgetRef.current.pause();
    }
  }, [isPlaying, isWidgetReady, internalIsPlaying]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
    };
  }, []);

  // Handle manual expand/minimize
  const toggleExpand = useCallback(() => {
    if (playerState === 'loaded-expanded') {
      setPlayerState('loaded-minimized');
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
    } else if (playerState === 'loaded-minimized') {
      setPlayerState('loaded-expanded');
      // Restart auto-minimize timer
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
      autoMinimizeTimerRef.current = setTimeout(() => {
        setPlayerState('loaded-minimized');
      }, 5000);
    }
  }, [playerState]);

  // Generate iframe URL
  const getIframeUrl = () => {
    const params = new URLSearchParams({
      url: trackUrl,
      color: 'ff5500',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'true',
      sharing: 'true',
      buying: 'false',
      download: 'false',
      show_playcount: 'true',
      show_artwork: 'true',
      show_playlist: 'false'
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  };

  // Compact bar (unloaded or minimized)
  const renderCompactBar = () => (
    <div
      onClick={playerState === 'unloaded' ? handleFirstInteraction : toggleExpand}
      style={{
        position: 'fixed',
        bottom: '68px',
        left: '0',
        right: '0',
        height: '64px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderTop: '1px solid rgba(138, 43, 226, 0.3)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '8px 12px' : '10px 20px',
        gap: '12px',
        cursor: 'pointer',
        zIndex: 1101,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
      }}
    >
      {/* Icon */}
      <div style={{
        width: '48px',
        height: '48px',
        backgroundColor: 'rgba(138, 43, 226, 0.2)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        flexShrink: 0
      }}>
        {playerState === 'loading' ? '⏳' : '🎵'}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#8a2be2',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {playerState === 'loading' ? 'Loading SoundCloud...' : getDisplayName()}
        </div>
        <div style={{
          fontSize: '12px',
          color: internalIsPlaying ? '#10b981' : '#94a3b8',
          marginTop: '2px'
        }}>
          {playerState === 'unloaded' ? 'Tap to play' : internalIsPlaying ? '▶ Playing' : '⏸ Paused'}
        </div>
      </div>

      {/* Expand/Play Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (playerState === 'unloaded') {
            handleFirstInteraction();
          } else {
            toggleExpand();
          }
        }}
        style={{
          background: 'rgba(138, 43, 226, 0.2)',
          border: '1px solid rgba(138, 43, 226, 0.4)',
          color: '#8a2be2',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {playerState === 'unloaded' ? '▶️' : playerState === 'loading' ? '⏳' : playerState === 'loaded-expanded' ? '▼' : '▲'}
      </button>
    </div>
  );

  // Full widget
  const renderFullWidget = () => (
    <div
      style={{
        position: 'fixed',
        bottom: '68px',
        left: '0',
        right: '0',
        height: isMobile ? '300px' : '400px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        borderTop: '1px solid rgba(138, 43, 226, 0.3)',
        zIndex: 1101,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
      }}
    >
      {/* Header with minimize button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(138, 43, 226, 0.2)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#8a2be2'
        }}>
          🎵 {getDisplayName()}
        </div>
        <button
          onClick={toggleExpand}
          style={{
            background: 'none',
            border: 'none',
            color: '#8a2be2',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
        >
          ▼
        </button>
      </div>

      {/* Widget iframe */}
      <div style={{ flex: 1, position: 'relative' }}>
        {playerState === 'loading' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10
          }}>
            <div style={{ textAlign: 'center', color: '#8a2be2' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
              <div>Loading SoundCloud...</div>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={getIframeUrl()}
          width="100%"
          height="100%"
          frameBorder="no"
          scrolling="no"
          allow="autoplay"
          style={{
            border: 'none',
            backgroundColor: 'transparent'
          }}
          title="SoundCloud Player"
        />
      </div>
    </div>
  );

  // Render based on state
  if (playerState === 'unloaded' || playerState === 'loaded-minimized') {
    return renderCompactBar();
  }

  return renderFullWidget();
};

export default SoundCloudPlayer;
