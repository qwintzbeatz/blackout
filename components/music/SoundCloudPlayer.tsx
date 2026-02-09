'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

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

const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({
  trackUrl,
  isPlaying,
  onTrackEnd,
  onPlayPause,
  onError,
  isMobile,
  trackName
}) => {
  const [playerState, setPlayerState] = useState<PlayerState>('compact');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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

  // Generate iframe URL
  const getIframeUrl = useCallback(() => {
    const params = new URLSearchParams({
      url: trackUrl,
      color: 'ff5500',
      auto_play: hasInteracted && isPlaying ? 'true' : 'false',
      hide_related: 'false',
      show_comments: 'true',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'true',
      visual: 'true',
      sharing: 'true',
      buying: 'true',
      download: 'true',
      show_playcount: 'true',
      show_artwork: 'true',
      show_playlist: 'true'
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  }, [trackUrl, hasInteracted, isPlaying]);

  // Handle first interaction
  const handleInteraction = useCallback(() => {
    if (!hasInteracted) {
      setHasInteracted(true);
      onPlayPause(true);
    }
    setPlayerState('expanded');
    setIsReady(true);
    
    // Auto-minimize after 5 seconds
    if (autoMinimizeTimerRef.current) {
      clearTimeout(autoMinimizeTimerRef.current);
    }
    autoMinimizeTimerRef.current = setTimeout(() => {
      setPlayerState('compact');
    }, 5000);
  }, [hasInteracted, onPlayPause]);

  // Toggle expand/minimize
  const toggleExpand = useCallback(() => {
    if (playerState === 'expanded') {
      setPlayerState('compact');
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
    } else {
      setPlayerState('expanded');
      // Restart auto-minimize timer
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
      autoMinimizeTimerRef.current = setTimeout(() => {
        setPlayerState('compact');
      }, 5000);
    }
  }, [playerState]);

  // Handle play/pause from parent
  useEffect(() => {
    // When parent changes isPlaying, we need to reload iframe with new auto_play param
    // This is a limitation of the simple iframe approach
    if (hasInteracted && iframeRef.current) {
      // Reload iframe with new auto_play setting
      const currentSrc = iframeRef.current.src;
      const newSrc = getIframeUrl();
      if (currentSrc !== newSrc) {
        iframeRef.current.src = newSrc;
      }
    }
  }, [isPlaying, hasInteracted, getIframeUrl]);

  // Handle track end - simple iframe can't detect this, so we use a timer approximation
  useEffect(() => {
    // Since we can't detect track end with simple iframe,
    // we'll check periodically if audio is still playing
    // This is imperfect but better than nothing
    const checkInterval = setInterval(() => {
      // We can't actually detect if track ended, so this is placeholder
      // In practice, users will need to manually skip tracks
    }, 10000);

    return () => clearInterval(checkInterval);
  }, [onTrackEnd]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoMinimizeTimerRef.current) {
        clearTimeout(autoMinimizeTimerRef.current);
      }
    };
  }, []);

  // Compact view
  if (playerState === 'compact') {
    return (
      <div
        onClick={!hasInteracted ? handleInteraction : toggleExpand}
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
          {!hasInteracted ? '🎵' : isPlaying ? '▶️' : '⏸️'}
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
            color: !hasInteracted ? '#94a3b8' : isPlaying ? '#10b981' : '#94a3b8',
            marginTop: '2px'
          }}>
            {!hasInteracted ? 'Tap to play music' : isPlaying ? 'Now Playing' : 'Paused'}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!hasInteracted) {
              handleInteraction();
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
          {!hasInteracted ? '▶️' : '▲'}
        </button>
      </div>
    );
  }

  // Expanded view with iframe
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

      {/* SoundCloud Iframe */}
      <div style={{ flex: 1, position: 'relative' }}>
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
};

export default SoundCloudPlayer;
