'use client';

import React from 'react';
import { MusicDrop } from '@/hooks/useMusicDrops';

interface MusicDropPopupProps {
  drop: MusicDrop;
  onClose: () => void;
  onUnlockTrack: (drop: MusicDrop) => Promise<boolean>;
}

const MusicDropPopup: React.FC<MusicDropPopupProps> = ({ drop, onClose, onUnlockTrack }) => {
  const [isUnlocking, setIsUnlocking] = React.useState(false);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      const success = await onUnlockTrack(drop);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error unlocking track:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          border: '2px solid #8b5cf6',
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.2) inset',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated background */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          animation: 'rotate 20s linear infinite',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)'
            }}>
              <span style={{ fontSize: '20px' }}>🎵</span>
            </div>
            <div>
              <h3 style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                Music Drop Found!
              </h3>
              <p style={{
                margin: 0,
                color: '#a0a0a0',
                fontSize: '12px'
              }}>
                {drop.source} Track
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b5cf6',
              fontSize: '20px',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Track Info */}
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #444',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}>
              <span style={{ fontSize: '24px' }}>🎶</span>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{
                margin: 0,
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {drop.trackName}
              </h4>
              <p style={{
                margin: 0,
                color: '#8b5cf6',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {drop.source} • {drop.repReward} REP Reward
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '8px'
          }}>
            <span style={{
              fontSize: '10px',
              color: '#666',
              backgroundColor: '#333',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #444'
            }}>
              🎵 Music Drop
            </span>
            <span style={{
              fontSize: '10px',
              color: '#666',
              backgroundColor: '#333',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #444'
            }}>
              📍 {Math.round(drop.position[0] * 1000) / 1000}, {Math.round(drop.position[1] * 1000) / 1000}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          position: 'relative',
          zIndex: 2
        }}>
          <button
            onClick={handleUnlock}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
            }}
          >
            🎵 Unlock Track
          </button>
          
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              color: '#8b5cf6',
              border: '2px solid #8b5cf6',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#8b5cf6';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#8b5cf6';
            }}
          >
            🚶 Keep Walking
          </button>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          Track will expire in {Math.ceil((drop.expiresAt.getTime() - Date.now()) / 60000)} minutes
        </div>

        <style>{`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MusicDropPopup;