'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
  embedUrl: string;
}

interface SpotifyPlayerProps {
  spotifyUrl: string;
  trackName?: string;
  onClose?: () => void;
}

// Convert Spotify URL to embed URL
function getEmbedUrl(spotifyUrl: string): string {
  // Handle different Spotify URL formats
  const trackMatch = spotifyUrl.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  const albumMatch = spotifyUrl.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
  const playlistMatch = spotifyUrl.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  
  let embedId = '';
  let type = 'track';
  
  if (trackMatch) {
    embedId = trackMatch[1];
    type = 'track';
  } else if (albumMatch) {
    embedId = albumMatch[1];
    type = 'album';
  } else if (playlistMatch) {
    embedId = playlistMatch[1];
    type = 'playlist';
  }
  
  if (embedId) {
    return `https://open.spotify.com/embed/${type}/${embedId}?utm_source=generator&theme=0`;
  }
  
  // If we couldn't parse the URL, return empty string
  console.warn('Could not parse Spotify URL:', spotifyUrl);
  return '';
}

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export default function SpotifyPlayer({
  spotifyUrl,
  trackName = 'Spotify Track',
  onClose,
}: SpotifyPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize embed URL
  useEffect(() => {
    if (spotifyUrl) {
      const url = getEmbedUrl(spotifyUrl);
      setEmbedUrl(url);
      setIsLoading(false);
    }
  }, [spotifyUrl]);

  // Listen for Spotify messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://open.spotify.com') {
        const { type } = event.data || {};
        if (type === 'play') {
          setIsPlaying(true);
        } else if (type === 'pause') {
          setIsPlaying(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClose = useCallback(() => {
    // Send pause message to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ command: 'pause' }, '*');
    }
    onClose?.();
  }, [onClose]);

  // Validate Spotify URL
  const isValidSpotifyUrl = useCallback(() => {
    const spotifyRegex = /^https?:\/\/(open\.)?spotify\.com\//;
    return spotifyRegex.test(spotifyUrl);
  }, [spotifyUrl]);

  if (!isValidSpotifyUrl()) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '68px',
        left: '0',
        right: '0',
        backgroundColor: 'rgba(20, 20, 30, 0.98)',
        borderTop: '1px solid rgba(30, 215, 96, 0.4)',
        zIndex: 1101,
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(30, 215, 96, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1ed760',
          }}>
            <SpotifyIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>
              Invalid Spotify URL
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Please use a Spotify share link
            </div>
          </div>
          {onClose && (
            <button onClick={handleClose} style={{
              width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: 'transparent', border: 'none', color: '#64748b',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '68px',
      left: '0',
      right: '0',
      backgroundColor: 'rgba(20, 20, 30, 0.98)',
      borderTop: '1px solid rgba(30, 215, 96, 0.4)',
      zIndex: 1101,
      backdropFilter: 'blur(10px)',
    }}>
      

      {/* Spotify Embed */}
      <div style={{
        width: '100%',
        height: isLoading ? '152px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}>
        {isLoading ? (
          <div style={{
            color: '#1ed760',
            fontSize: '14px',
          }}>
            Loading player...
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            width="100%"
            height="100"
            style={{ border: 'none' }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            title="Spotify Player"
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>
    </div>
  );
}

// Utility function to convert Spotify URLs
export function isSpotifyUrl(url: string): boolean {
  const spotifyRegex = /^https?:\/\/(open\.)?spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+/;
  return spotifyRegex.test(url);
}

// Export embed URL generator for external use
export function getSpotifyEmbedUrl(spotifyUrl: string): string {
  return getEmbedUrl(spotifyUrl);
}
