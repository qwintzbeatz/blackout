'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface SoundCloudPlayerProps {
  trackUrl: string;
  trackName?: string;
  onClose?: () => void;
}

export default function SoundCloudPlayer({
  trackUrl,
  trackName = 'SoundCloud Track',
  onClose,
}: SoundCloudPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Build SoundCloud widget URL (compact player - height=120)
  const getEmbedUrl = useCallback(() => {
    const params = new URLSearchParams({
      url: trackUrl,
      color: 'ff5500',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'false',
      buying: 'false',
      sharing: 'false',
      download: 'false',
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  }, [trackUrl]);

  const embedUrl = getEmbedUrl();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [trackUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Unable to load SoundCloud player. The track may not be available.');
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '68px',
      left: '0',
      right: '0',
      backgroundColor: 'rgba(20, 20, 30, 0.98)',
      borderTop: '2px solid #ff5500', // SoundCloud orange
      zIndex: 1101,
      backdropFilter: 'blur(10px)',
    }}>
      {/* Header with SoundCloud branding */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        backgroundColor: 'rgba(255, 85, 0, 0.15)',
        borderBottom: '1px solid rgba(255, 85, 0, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff5500">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <span style={{ color: '#ff5500', fontSize: '13px', fontWeight: 'bold' }}>
            SoundCloud
          </span>
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Compact iframe player */}
      <div style={{
        width: '100%',
        height: isLoading ? '120px' : 'auto',
        position: 'relative',
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{
              color: '#ff5500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ff5500',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              Loading player...
            </div>
          </div>
        )}
        
        <iframe
          key={iframeKey}
          src={embedUrl}
          width="100%"
          height="120"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            display: isLoading ? 'none' : 'block',
          }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          title="SoundCloud Player"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderTop: '1px solid rgba(239, 68, 68, 0.3)',
        }}>
          <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '4px' }}>
            {error}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px' }}>
            Try a different track from your collection
          </div>
        </div>
      )}

      {/* Track name footer */}
      <div style={{
        padding: '6px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      }}>
        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
          🎵 {trackName}
        </span>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
