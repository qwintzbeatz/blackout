'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

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
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
  const panelRef = useRef<HTMLDivElement>(null);

  // Default tracks that should always be available
  const defaultTracks = useMemo(() => [
    'https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'
  ], []);

  // Combine default and unlocked tracks, removing duplicates
  const allTracks = useMemo(() => {
    const combined = [...defaultTracks, ...unlockedTracks];
    // Remove duplicates by URL
    const uniqueTracks = combined.filter((track, index, self) => 
      self.findIndex(t => t === track) === index
    );
    return uniqueTracks;
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
    const trackUrl = allTracks[Math.min(currentTrackIndex, allTracks.length - 1)];
    return {
      url: trackUrl,
      name: getTrackName(trackUrl),
      index: Math.min(currentTrackIndex, allTracks.length - 1)
    };
  }, [allTracks, currentTrackIndex, getTrackName]);

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  }, [onVolumeChange]);

  // Handle track selection
  const handleTrackSelect = useCallback((index: number) => {
    console.log('Selected track:', index, allTracks[index]); // Debug log
    setActiveTab('player');
    onTrackSelect(index);
  }, [onTrackSelect, allTracks]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if panel is visible
      if (!panelRef.current) return;
      
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        onPlayPause();
      } else if (e.code === 'ArrowRight' && !e.ctrlKey) {
        e.preventDefault();
        onNextTrack();
      } else if (e.code === 'ArrowLeft' && !e.ctrlKey) {
        e.preventDefault();
        onPreviousTrack();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onPlayPause, onNextTrack, onPreviousTrack]);

  // Log track data for debugging
  useEffect(() => {
    console.log('Music Panel - Current state:', {
      isPlaying,
      currentTrackIndex,
      unlockedTracks: unlockedTracks.length,
      allTracks: allTracks.length,
      currentTrack
    });
  }, [isPlaying, currentTrackIndex, unlockedTracks, allTracks, currentTrack]);

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
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>🎵</span>
          Music Collections
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
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
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {tab === 'player' ? '🎵 Player' : '📋 Playlist'}
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
              minHeight: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {currentTrack?.name || 'No Track Selected'}
              {isPlaying && (
                <span style={{
                  fontSize: '10px',
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  animation: 'pulse 1.5s infinite'
                }}>
                  ● LIVE
                </span>
              )}
            </div>
            
            <div style={{
              fontSize: '12px',
              color: '#b0b0b0',
              marginBottom: '12px'
            }}>
              Track {currentTrack ? currentTrack.index + 1 : 0} of {allTracks.length}
            </div>

            {/* Playback Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <button
                onClick={onPreviousTrack}
                disabled={allTracks.length <= 1}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  cursor: allTracks.length > 1 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  opacity: allTracks.length > 1 ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (allTracks.length > 1) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (allTracks.length > 1) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title="Previous Track"
              >
                ⏮️
              </button>

              <button
                onClick={onPlayPause}
                disabled={allTracks.length === 0}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: allTracks.length > 0 ? '#ff6b35' : '#666',
                  color: '#ffffff',
                  cursor: allTracks.length > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                  opacity: allTracks.length > 0 ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (allTracks.length > 0) {
                    e.currentTarget.style.backgroundColor = '#ff5722';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (allTracks.length > 0) {
                    e.currentTarget.style.backgroundColor = '#ff6b35';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title={allTracks.length > 0 ? (isPlaying ? 'Pause' : 'Play') : 'No tracks available'}
              >
                {allTracks.length > 0 ? (isPlaying ? '⏸️' : '▶️') : '🎵'}
              </button>

              <button
                onClick={onNextTrack}
                disabled={allTracks.length <= 1}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  cursor: allTracks.length > 1 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  opacity: allTracks.length > 1 ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (allTracks.length > 1) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (allTracks.length > 1) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
                title="Next Track"
              >
                ⏭️
              </button>
            </div>

            {/* Status Indicators */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#b0b0b0',
              marginTop: '8px'
            }}>
              <div>
                🔈 Volume: {Math.round(volume * 100)}%
              </div>
              <div>
                🎵 {allTracks.length} track{allTracks.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '16px', color: '#b0b0b0', minWidth: '24px' }}>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  flex: 1,
                  height: '6px',
                  borderRadius: '3px',
                  background: `linear-gradient(to right, #ff6b35 0%, #ff6b35 ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitAppearance: 'none'
                }}
              />
              <span style={{
                fontSize: '12px',
                color: '#ffffff',
                minWidth: '35px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Tab */}
      {activeTab === 'playlist' && (
        <div>
          <div style={{
            marginBottom: '12px',
            fontSize: '12px',
            color: '#b0b0b0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Your Collection</span>
            <span style={{ 
              backgroundColor: 'rgba(255, 107, 53, 0.2)', 
              color: '#ff6b35',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {allTracks.length} track{allTracks.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {allTracks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#b0b0b0'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎵</div>
                <div style={{ marginBottom: '6px' }}>No tracks found</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  Default track should be available
                </div>
              </div>
            ) : (
              allTracks.map((track, index) => {
                const isCurrentTrack = index === currentTrack?.index;
                const isPlayingCurrent = isCurrentTrack && isPlaying;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleTrackSelect(index)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: isCurrentTrack 
                        ? 'rgba(255, 107, 53, 0.2)' 
                        : 'transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentTrack) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentTrack) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ 
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: isCurrentTrack ? 'rgba(255, 107, 53, 0.3)' : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: isCurrentTrack ? '#ff6b35' : '#b0b0b0'
                      }}>
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          color: isCurrentTrack ? '#ffffff' : '#e0e0e0',
                          fontWeight: isCurrentTrack ? 'bold' : 'normal',
                          marginBottom: '2px'
                        }}>
                          {getTrackName(track)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#b0b0b0' }}>
                          {track.includes('soundcloud.com') ? 'SoundCloud' : 'Local Audio'}
                        </div>
                      </div>
                    </div>
                    
                    {isCurrentTrack && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {isPlayingCurrent && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            animation: 'pulse 1.5s infinite'
                          }} />
                        )}
                        <span style={{
                          fontSize: '12px',
                          color: isPlayingCurrent ? '#10b981' : '#ff6b35',
                          fontWeight: 'bold'
                        }}>
                          {isPlayingCurrent ? 'NOW PLAYING' : 'SELECTED'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div style={{
            marginTop: '12px',
            fontSize: '11px',
            color: '#b0b0b0',
            textAlign: 'center',
            padding: '8px',
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: '6px'
          }}>
            Click any track to play it
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #ff6b35;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #ff6b35;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
        }

        /* Custom scrollbar for playlist */
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

export default MusicPanelOptimized;