'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSoundCloud } from '@/lib/soundcloud';

interface Track {
  url: string;
  title: string;
  isLoaded: boolean;
  iframeId?: string;
}

interface MusicPanelProps {
  isPlaying: boolean;
  currentTrackIndex: number;
  volume: number;
  unlockedTracks: string[];
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  onVolumeChange: (volume: number) => void;
  onTrackSelect: (index: number) => void;
  onClose: () => void;
}

// Optimized panel styling
const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: '#e0e0e0',
  padding: '20px',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  width: 'min(90vw, 380px)',
  maxHeight: '70vh',
  overflowY: 'auto' as const,
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(12px)',
  zIndex: 1400,
  position: 'relative' as const
};

const MusicPanelOptimized: React.FC<MusicPanelProps> = ({
  isPlaying,
  currentTrackIndex,
  volume,
  unlockedTracks,
  onPlayPause,
  onNextTrack,
  onPreviousTrack,
  onVolumeChange,
  onTrackSelect,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'playlist'>('player');
  const soundCloudManager = useSoundCloud();
  const panelRef = useRef<HTMLDivElement>(null);

  // Default tracks that should always be available
  const defaultTracks = useMemo(() => [
    'https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'
  ], []);

  // Combine default and unlocked tracks, removing duplicates
  const allTracks = useMemo(() => {
    const combined = [...defaultTracks, ...unlockedTracks];
    return Array.from(new Set(combined)); // Remove duplicates
  }, [unlockedTracks]);

  // Get track name from URL
  const getTrackName = useCallback((url: string): string => {
    if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
    if (url.includes('soundcloud.com')) {
      const segments = url.split('/');
      const trackSegment = segments[segments.length - 1];
      return trackSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/_/g, ' ')
        .substring(0, 30);
    }
    return 'Unknown Track';
  }, []);

  // Current track info
  const currentTrack = useMemo(() => {
    if (allTracks.length === 0) return null;
    return {
      url: allTracks[currentTrackIndex] || allTracks[0],
      name: getTrackName(allTracks[currentTrackIndex] || allTracks[0]),
      index: currentTrackIndex
    };
  }, [allTracks, currentTrackIndex, getTrackName]);

  // Format time (placeholder for future duration tracking)
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle volume change with debouncing
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  }, [onVolumeChange]);

  // Handle track selection
  const handleTrackSelect = useCallback((index: number) => {
    setActiveTab('player');
    onTrackSelect(index);
  }, [onTrackSelect]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        onPlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNextTrack();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPreviousTrack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPlayPause, onNextTrack, onPreviousTrack]);

  // Cleanup SoundCloud widgets on unmount
  useEffect(() => {
    return () => {
      soundCloudManager.destroyAll();
    };
  }, [soundCloudManager]);

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          🎵 Music
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '8px'
      }}>
        {(['player', 'playlist'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === tab ? '#ff6b35' : 'transparent',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Player Tab */}
      {activeTab === 'player' && (
        <div>
          {/* Current Track Info */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '8px',
              minHeight: '20px'
            }}>
              {currentTrack?.name || 'No Track Selected'}
            </div>
            
            <div style={{
              fontSize: '12px',
              color: '#b0b0b0',
              marginBottom: '12px'
            }}>
              Track {currentTrack ? currentTrack.index + 1 : 0} of {allTracks.length}
            </div>

            {/* Visual indicator */}
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              marginBottom: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: isPlaying ? '60%' : '0%',
                height: '100%',
                backgroundColor: '#ff6b35',
                transition: isPlaying ? 'width 0.3s ease' : 'none',
                borderRadius: '2px'
              }} />
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px'
            }}>
              <button
                onClick={onPreviousTrack}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              >
                ⏮️
              </button>

              <button
                onClick={onPlayPause}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#ff6b35',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff5722'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>

              <button
                onClick={onNextTrack}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              >
                ⏭️
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '14px', color: '#b0b0b0' }}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: `linear-gradient(to right, #ff6b35 0%, #ff6b35 ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <span style={{
                fontSize: '12px',
                color: '#ffffff',
                minWidth: '35px',
                textAlign: 'right'
              }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#b0b0b0'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ffffff' }}>
              ⌨️ Shortcuts
            </div>
            <div>Space: Play/Pause</div>
            <div>← →: Previous/Next</div>
          </div>
        </div>
      )}

      {/* Playlist Tab */}
      {activeTab === 'playlist' && (
        <div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {allTracks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#b0b0b0'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎵</div>
                <div>No tracks unlocked yet</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  Place markers to unlock more music
                </div>
              </div>
            ) : (
              allTracks.map((track, index) => (
                <div
                  key={track}
                  onClick={() => handleTrackSelect(index)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    backgroundColor: index === currentTrackIndex 
                      ? 'rgba(255, 107, 53, 0.2)' 
                      : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (index !== currentTrackIndex) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index !== currentTrackIndex) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      color: index === currentTrackIndex ? '#ffffff' : '#e0e0e0',
                      fontWeight: index === currentTrackIndex ? 'bold' : 'normal'
                    }}>
                      {getTrackName(track)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#b0b0b0' }}>
                      Track {index + 1}
                    </div>
                  </div>
                  
                  {index === currentTrackIndex && isPlaying && (
                    <div style={{
                      fontSize: '12px',
                      color: '#ff6b35',
                      animation: 'pulse 1.5s infinite'
                    }}>
                      🎵
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#b0b0b0',
            textAlign: 'center'
          }}>
            {allTracks.length} track{allTracks.length !== 1 ? 's' : ''} unlocked
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ff6b35;
          cursor: pointer;
          border: 2px solid #ffffff;
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ff6b35;
          cursor: pointer;
          border: 2px solid #ffffff;
        }
      `}</style>
    </div>
  );
};

export default MusicPanelOptimized;