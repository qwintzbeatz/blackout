import React from 'react';
import { UserProfile } from '@/lib/types/blackout';
import { FACEBOOK_VIDEOS, getVideoName } from '@/constants/videos';
import { getTrackNameFromUrl as getTrackNameFromUrlHelper } from '@/lib/utils/dropHelpers';

interface MusicPanelProps {
  showMusicPanel: boolean;
  isMobile: boolean;
  userProfile: UserProfile | null;
  unlockedTracks: string[];
  currentTrackIndex: number;
  isPlaying: boolean;
  panelStyle: React.CSSProperties;
  togglePanel: (panel: 'profile' | 'photos' | 'messages' | 'map' | 'music' | 'story' | 'crewchat' | 'none') => void;
  setVideoUnlockModal: (modal: { isOpen: boolean; videoUrl: string; source: string } | null) => void;
  setCurrentTrackIndex: (index: number) => void;
  setShowSpotifyWidget: (show: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
}

const MusicPanel: React.FC<MusicPanelProps> = ({
  showMusicPanel,
  isMobile,
  userProfile,
  unlockedTracks,
  currentTrackIndex,
  isPlaying,
  panelStyle,
  togglePanel,
  setVideoUnlockModal,
  setCurrentTrackIndex,
  setShowSpotifyWidget,
  setIsPlaying,
  togglePlay
}) => {
  const getCurrentTrackName = () => {
    if (unlockedTracks.length === 0) return 'No tracks unlocked';
    return getTrackNameFromUrlHelper(unlockedTracks[currentTrackIndex]);
  };

  return (
    <div
      style={{
        ...panelStyle,
        border: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        animation: showMusicPanel ? 'slideInRight 0.3s ease-out' : 'none',
        minWidth: isMobile ? '280px' : '350px',
        maxWidth: isMobile ? '95vw' : '400px',
        position: 'absolute' as const,
        zIndex: showMusicPanel ? 1500 : 900,
        opacity: showMusicPanel ? 1 : 0,
        pointerEvents: showMusicPanel ? 'auto' : 'none',
        transition: 'opacity 0.3s ease, z-index 0s',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'auto'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(138, 43, 226, 0.3)'
      }}>
        <h3 style={{
          margin: 0,
          color: '#8a2be2',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>🎵</span>
          MUSIC COLLECTION
        </h3>
        <button
          onClick={() => togglePanel('none')}
          style={{
            background: 'rgba(138, 43, 226, 0.2)',
            border: '1px solid rgba(138, 43, 226, 0.3)',
            color: '#8a2be2',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Music Player Section */}
      <div style={{
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
      </div>

      {/* Unlocked Videos Section */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '14px', color: '#ec4899', marginBottom: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎬</span>
          VIDEO COLLECTION
          <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
            ({userProfile?.unlockedVideos?.length || 0}/{FACEBOOK_VIDEOS.length})
          </span>
        </div>

        {(userProfile?.unlockedVideos?.length || 0) === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px dashed #444'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎬</div>
            <div style={{ color: '#aaa', fontSize: '12px' }}>
              No videos unlocked yet
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Use cheat menu to unlock videos!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(userProfile?.unlockedVideos || []).map((videoUrl, index) => {
              const videoName = getVideoName(videoUrl);
              return (
                <div
                  key={index}
                  onClick={() => {
                    setVideoUnlockModal({
                      isOpen: true,
                      videoUrl: videoUrl,
                      source: 'COLLECTION'
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: 'rgba(236, 72, 153, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    fontSize: '18px',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    🎬
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#ec4899'
                    }}>
                      {videoName}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#1877f2',
                      marginTop: '2px'
                    }}>
                      Facebook Video
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#ec4899'
                  }}>
                    ▶️
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unlocked Tracks List */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
        <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '10px', fontWeight: 'bold' }}>
          🎵 Your Collection
        </div>

        {unlockedTracks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '30px 20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px dashed #444'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎵</div>
            <div style={{ color: '#aaa' }}>
              No tracks unlocked yet
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Place drops to unlock music!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unlockedTracks.map((track, index) => {
              const trackName = getTrackNameFromUrlHelper(track);
              const isCurrentlyPlaying = index === currentTrackIndex;

              return (
                <div
                  key={index}
                  onClick={() => {
                    if (isCurrentlyPlaying) {
                      togglePlay();
                    } else {
                      setCurrentTrackIndex(index);
                      setShowSpotifyWidget(true);
                      setIsPlaying(true);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: isCurrentlyPlaying ? 'rgba(138, 43, 226, 0.2)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    border: isCurrentlyPlaying ? '1px solid rgba(138, 43, 226, 0.4)' : '1px solid #333',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    fontSize: '18px',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    🎵
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: isCurrentlyPlaying ? 'bold' : 'normal',
                      color: isCurrentlyPlaying ? '#8a2be2' : 'white'
                    }}>
                      {trackName}
                      {isCurrentlyPlaying && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '11px',
                          color: '#10b981',
                          animation: 'pulse 1s infinite'
                        }}>
                          ● NOW PLAYING
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: track.includes('soundcloud.com') ? '#ff6b6b' : '#1DB954',
                      marginTop: '2px'
                    }}>
                      {track.includes('soundcloud.com') ? 'SoundCloud' : 'Spotify'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#ff6b6b'
                  }}>
                    🎧
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicPanel;