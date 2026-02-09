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

type PlayerState = 'compact' | 'expanded';

// Global flag to track if API is loaded
let isAPILoaded = false;
let apiLoadPromise: Promise<void> | null = null;

const loadSoundCloudAPI = (): Promise<void> => {
  if (isAPILoaded) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;
  
  apiLoadPromise = new Promise((resolve, reject) => {
    if (window.SC && window.SC.Widget) {
      isAPILoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => {
      console.log('SoundCloud API loaded');
      isAPILoaded = true;
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load SoundCloud API');
      reject(new Error('Failed to load SoundCloud API'));
    };
    document.body.appendChild(script);
  });

  return apiLoadPromise;
};

const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({
  trackUrl,
  isPlaying,
  onTrackEnd,
  onPlayPause,
  onError,
  isMobile,
  trackName
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [playerState, setPlayerState] = useState<PlayerState>('compact');
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
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
      // Invalid URL
    }
    return 'SoundCloud Track';
  }, [trackUrl, trackName]);

  // Load API on mount
  useEffect(() => {
    loadSoundCloudAPI().catch(err => {
      console.error('Failed to preload SoundCloud API:', err);
      onError?.(err);
    });
  }, [onError]);

  // Initialize widget when iframe is available
  useEffect(() => {
    if (!iframeRef.current || !isAPILoaded) return;

    const initWidget = () => {
      if (!iframeRef.current) return;
      try {
        widgetRef.current = new window.SC.Widget(iframeRef.current);
        
        widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
          console.log('SoundCloud widget ready');
          setIsWidgetReady(true);
          
          // Bind to events
          widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
            console.log('Track finished');
            onTrackEnd();
          });

          widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
            console.log('Track playing');
            onPlayPause(true);
          });

          widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
            console.log('Track paused');
            onPlayPause(false);
          });

          widgetRef.current.bind(window.SC.Widget.Events.ERROR, (e: any) => {
            console.error('SoundCloud error:', e);
            onError?.(new Error('SoundCloud playback error'));
          });
        });
      } catch (err) {
        console.error('Error initializing widget:', err);
        onError?.(err as Error);
      }
    };

    // Small delay to ensure iframe is fully loaded
    const timer = setTimeout(initWidget, 100);
    return () => clearTimeout(timer);
  }, [onTrackEnd, onPlayPause, onError]);

  // Handle play/pause commands from parent
  useEffect(() => {
    if (!widgetRef.current || !isWidgetReady) return;

    widgetRef.current.isPaused((paused: boolean) => {
      if (isPlaying && paused) {
        widgetRef.current.play();
      } else if (!isPlaying && !paused) {
        widgetRef.current.pause();
      }
    });
  }, [isPlaying, isWidgetReady]);

  // Handle first play - this is the key for mobile!
  const handlePlay = useCallback(async () => {
    if (!isWidgetReady) {
      console.log('Widget not ready yet');
      return;
    }

    try {
      // Direct play call - this should work on mobile after user interaction
      widgetRef.current.play();
      setHasStarted(true);
      setPlayerState('expanded');
      
      // Auto-minimize after 5 seconds
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
      autoMinimizeTimerRef.current = setTimeout(() => {
        setPlayerState('compact');
      }, 5000);
    } catch (err) {
      console.error('Error playing:', err);
      onError?.(err as Error);
    }
  }, [isWidgetReady, onError]);

  // Toggle expand/minimize
  const toggleExpand = useCallback(() => {
    if (playerState === 'expanded') {
      setPlayerState('compact');
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
    } else {
      setPlayerState('expanded');
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
      autoMinimizeTimerRef.current = setTimeout(() => {
        setPlayerState('compact');
      }, 5000);
    }
  }, [playerState]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
    };
  }, []);

  // Generate iframe URL - NO auto_play, we control it via API
  const getIframeUrl = useCallback(() => {
    const params = new URLSearchParams({
      url: trackUrl,
      color: 'ff5500',
      auto_play: 'false', // WE control this
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
  }, [trackUrl]);

  // Compact view
  if (playerState === 'compact') {
    return (
      <>
        {/* Hidden iframe for widget (always mounted) */}
        <div style={{
          position: 'fixed',
          bottom: '-1000px',
          left: '0',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0
        }}>
          <iframe
            ref={iframeRef}
            src={getIframeUrl()}
            width="100%"
            height="100%"
            frameBorder="no"
            scrolling="no"
            allow="autoplay"
            style={{ border: 'none' }}
            title="SoundCloud Widget"
          />
        </div>

        {/* Compact bar */}
        <div
          onClick={!hasStarted ? handlePlay : toggleExpand}
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
            {!isWidgetReady ? '⏳' : !hasStarted ? '🎵' : isPlaying ? '▶️' : '⏸️'}
          </div>

          {/* Track Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#8a2be2',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {getDisplayName()}
            </div>
            <div style={{
              fontSize: '12px',
              color: !isWidgetReady ? '#94a3b8' : !hasStarted ? '#94a3b8' : isPlaying ? '#10b981' : '#94a3b8',
              marginTop: '2px'
            }}>
              {!isWidgetReady ? 'Loading player...' : !hasStarted ? 'Tap to play' : isPlaying ? 'Now Playing' : 'Paused'}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!hasStarted) {
                handlePlay();
              } else {
                toggleExpand();
              }
            }}
            disabled={!isWidgetReady}
            style={{
              background: !isWidgetReady ? 'rgba(100, 100, 100, 0.2)' : 'rgba(138, 43, 226, 0.2)',
              border: '1px solid rgba(138, 43, 226, 0.4)',
              color: !isWidgetReady ? '#666' : '#8a2be2',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: !isWidgetReady ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {!isWidgetReady ? '⏳' : !hasStarted ? '▶️' : '▲'}
          </button>
        </div>
      </>
    );
  }

  // Expanded view
  return (
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
      {/* Header */}
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

      {/* Visible widget */}
      <div style={{ flex: 1 }}>
        <iframe
          src={getIframeUrl()}
          width="100%"
          height="100%"
          frameBorder="no"
          scrolling="no"
          allow="autoplay"
          style={{ border: 'none' }}
          title="SoundCloud Player"
        />
      </div>
    </div>
  );
};

export default SoundCloudPlayer;
