'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SongSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectTrack: (trackUrl: string) => void;
  tracks: string[];
  getTrackNameFromUrl: (url: string) => string;
  isLoading?: boolean;
}

const SongSelectionModal: React.FC<SongSelectionModalProps> = ({
  isVisible,
  onClose,
  onSelectTrack,
  tracks,
  getTrackNameFromUrl,
  isLoading = false
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset selection when modal opens
  useEffect(() => {
    if (isVisible && tracks.length > 0) {
      setSelectedTrack(tracks[0]);
    }
  }, [isVisible, tracks]);

  // Stop playing when modal closes
  useEffect(() => {
    if (!isVisible) {
      setPlayingTrack(null);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handlePlayTrack = (trackUrl: string) => {
    if (playingTrack === trackUrl) {
      // Stop playing
      setPlayingTrack(null);
    } else {
      // Start playing this track
      setPlayingTrack(trackUrl);
    }
  };

  const handleConfirm = () => {
    if (selectedTrack) {
      onSelectTrack(selectedTrack);
    }
  };

  const isSpotify = (url: string) => url.includes('open.spotify.com');
  
  const getSpotifyEmbedUrl = (url: string) => {
    // Convert Spotify URL to embed URL
    const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=oauth&autoplay=true`;
    }
    return url;
  };

  const getSoundCloudEmbedUrl = (url: string) => {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        backdropFilter: 'blur(8px)'
      }}
      onClick={isLoading ? undefined : onClose}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10002,
          borderRadius: '24px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(138, 43, 226, 0.3)',
            borderTop: '4px solid #8a2be2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }} />
          <div style={{
            color: '#f1f5f9',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            Placing Music Drop...
          </div>
          <div style={{
            color: '#94a3b8',
            fontSize: '14px',
            marginTop: '8px'
          }}>
            This song will be removed from your collection
          </div>
        </div>
      )}

      <div
        style={{
          background: 'linear-gradient(135deg, #1e1e2e, #0f0f23)',
          borderRadius: '24px',
          padding: '24px',
          maxWidth: '450px',
          width: '90%',
          maxHeight: '85vh',
          overflow: 'hidden',
          border: '2px solid rgba(138, 43, 226, 0.4)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(138, 43, 226, 0.2)',
          animation: 'popIn 0.3s ease-out',
          position: 'relative',
          opacity: isLoading ? 0.5 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(138, 43, 226, 0.3)'
        }}>
          <div>
            <h3 style={{
              color: '#f1f5f9',
              fontSize: '22px',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '28px' }}>🎵</span>
              Select a Song to Drop
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '13px',
              margin: '8px 0 0 0'
            }}>
              This song will be removed from your collection
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'rgba(138, 43, 226, 0.2)',
              border: '1px solid rgba(138, 43, 226, 0.3)',
              color: '#a78bfa',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Track List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '8px'
        }}>
          {tracks.map((track, index) => {
            const trackName = getTrackNameFromUrl(track);
            const isSelected = selectedTrack === track;
            const isPlaying = playingTrack === track;
            const isSpotifyTrack = isSpotify(track);

            return (
              <div
                key={index}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(138, 43, 226, 0.1))'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected 
                    ? '2px solid rgba(138, 43, 226, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.6 : 1
                }}
                onClick={() => !isLoading && setSelectedTrack(track)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Play/Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoading) handlePlayTrack(track);
                    }}
                    style={{
                      width: '44px',
                      height: '44px',
                      minWidth: '44px',
                      borderRadius: '50%',
                      background: isPlaying 
                        ? (isSpotifyTrack ? '#1DB954' : '#ff5500')
                        : 'rgba(255, 255, 255, 0.1)',
                      border: isPlaying 
                        ? `2px solid ${isSpotifyTrack ? '#1DB954' : '#ff5500'}`
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>

                  {/* Track Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: isSelected ? '#a78bfa' : '#f1f5f9',
                      fontSize: '15px',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {trackName}
                    </div>
                    <div style={{
                      color: isSpotifyTrack ? '#1DB954' : '#ff5500',
                      fontSize: '12px',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {isSpotifyTrack ? '🟢 Spotify' : '🟠 SoundCloud'}
                      {isPlaying && (
                        <span style={{
                          marginLeft: '8px',
                          color: '#10b981',
                          animation: 'pulse 1s infinite'
                        }}>
                          ● PLAYING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: isSelected 
                      ? '6px solid #8a2be2'
                      : '2px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }} />
                </div>

                {/* Embedded Player (shown when playing) */}
                {isPlaying && (
                  <div style={{
                    marginTop: '12px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#000'
                  }}>
                    <iframe
                      ref={iframeRef}
                      src={isSpotifyTrack ? getSpotifyEmbedUrl(track) : getSoundCloudEmbedUrl(track)}
                      width="100%"
                      height={isSpotifyTrack ? "80" : "100"}
                      style={{ border: 'none' }}
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(138, 43, 226, 0.3)'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '12px',
              padding: '14px',
              color: '#94a3b8',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedTrack}
            style={{
              flex: 2,
              background: selectedTrack 
                ? 'linear-gradient(135deg, #8a2be2, #6a1bb2)'
                : 'rgba(138, 43, 226, 0.3)',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: 'white',
              cursor: isLoading || !selectedTrack ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease',
              opacity: isLoading || !selectedTrack ? 0.6 : 1,
              boxShadow: selectedTrack ? '0 4px 15px rgba(138, 43, 226, 0.4)' : 'none'
            }}
          >
            {isLoading ? 'Placing Drop...' : '🎵 Drop This Song'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SongSelectionModal;