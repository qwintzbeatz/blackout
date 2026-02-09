'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SoundCloudPlayerProps {
  trackUrl: string;
  isPlaying: boolean;
  onTrackEnd: () => void;
  onError?: (error: Error) => void;
  isMobile: boolean;
}

const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({
  trackUrl,
  isPlaying,
  onTrackEnd,
  onError,
  isMobile
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load SoundCloud Widget API
  useEffect(() => {
    const loadSoundCloudAPI = () => {
      if (window.SC) {
        setIsReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      script.onload = () => {
        console.log('SoundCloud API loaded');
        setIsReady(true);
      };
      script.onerror = () => {
        console.error('Failed to load SoundCloud API');
        onError?.(new Error('Failed to load SoundCloud API'));
      };
      document.body.appendChild(script);
    };

    loadSoundCloudAPI();
  }, [onError]);

  // Initialize widget when API is ready and iframe exists
  useEffect(() => {
    if (!isReady || !iframeRef.current) return;

    try {
      widgetRef.current = new window.SC.Widget(iframeRef.current);
      
      widgetRef.current.bind(window.SC.Widget.Events.READY, () => {
        console.log('SoundCloud widget ready');
        setIsLoading(false);
        
        // Bind to track finish
        widgetRef.current.bind(window.SC.Widget.Events.FINISH, () => {
          console.log('Track finished');
          onTrackEnd();
        });

        // Bind to play event
        widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
          console.log('Track playing');
        });

        // Bind to pause event
        widgetRef.current.bind(window.SC.Widget.Events.PAUSE, () => {
          console.log('Track paused');
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
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.unbind(window.SC.Widget.Events.READY);
          widgetRef.current.unbind(window.SC.Widget.Events.FINISH);
          widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
          widgetRef.current.unbind(window.SC.Widget.Events.PAUSE);
          widgetRef.current.unbind(window.SC.Widget.Events.ERROR);
        } catch (e) {
          // Ignore unbind errors
        }
      }
    };
  }, [isReady, onTrackEnd, onError]);

  // Handle play/pause
  useEffect(() => {
    if (!widgetRef.current || !isReady || isLoading) return;

    if (isPlaying) {
      widgetRef.current.play();
    } else {
      widgetRef.current.pause();
    }
  }, [isPlaying, isReady, isLoading]);

  // Generate iframe URL with all features enabled
  const getIframeUrl = () => {
    const params = new URLSearchParams({
      url: trackUrl,
      color: 'ff5500',
      auto_play: 'false', // We control this via API
      hide_related: 'false', // Show related
      show_comments: 'true', // Show comments
      show_user: 'true', // Show user
      show_reposts: 'false',
      show_teaser: 'true', // Show teaser
      visual: 'true', // Visual mode (shows artwork)
      sharing: 'true', // Allow sharing
      buying: 'true', // Show buy button
      download: 'true', // Show download
      show_playcount: 'true', // Show play count
      show_artwork: 'true', // Show artwork
      show_playlist: 'true' // Show playlist
    });

    return `https://w.soundcloud.com/player/?${params.toString()}`;
  };

  // Determine height based on mobile
  const playerHeight = isMobile ? '300px' : '400px';

  return (
    <div style={{
      width: '100%',
      height: playerHeight,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      borderRadius: '8px 8px 0 0',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {isLoading && (
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
          <div style={{
            textAlign: 'center',
            color: '#8a2be2'
          }}>
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
  );
};

// SoundCloud widget type (defined in SoundCloudManager.ts, referenced here)

export default SoundCloudPlayer;
