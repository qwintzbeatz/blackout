'use client';

import React from 'react';
import { MarkerDescription } from '@/constants/markers';

interface DropTypeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onMarkerDrop: () => void;
  onPhotoDrop: () => void;
  onMusicDrop: () => void;
  
  selectedMarkerType: MarkerDescription;
  
  // Music drop options - simplified
  hasUnlockedTracks: boolean;
  
  // Loading state
  isLoading?: boolean;
}

const DropTypeModal: React.FC<DropTypeModalProps> = ({
  isVisible,
  onClose,
  onMarkerDrop,
  onPhotoDrop,
  onMusicDrop,
  selectedMarkerType,
  hasUnlockedTracks,
  isLoading = false
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={isLoading ? undefined : onClose}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          borderRadius: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
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
            Creating Drop...
          </div>
          <div style={{
            color: '#94a3b8',
            fontSize: '14px',
            marginTop: '8px'
          }}>
            Please wait
          </div>
        </div>
      )}

      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '400px',
          width: '90%',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          animation: 'popIn 0.3s ease-out',
          position: 'relative',
          opacity: isLoading ? 0.5 : 1,
          pointerEvents: isLoading ? 'none' : 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{
          color: '#f1f5f9',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🚀 Drop Type
        </h3>
        <p style={{
          color: '#94a3b8',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '14px'
        }}>
          Choose what type of drop you want to place
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Marker Option */}
          <button
            onClick={onMarkerDrop}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              padding: '18px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <span style={{ fontSize: '24px' }}>📍</span>
            <div style={{ textAlign: 'left' }}>
              <div>Place {selectedMarkerType} Marker</div>
              <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                Custom marker drop (+5 REP)
              </div>
            </div>
          </button>

          {/* Photo Option */}
          <button
            onClick={onPhotoDrop}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '12px',
              padding: '18px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <span style={{ fontSize: '24px' }}>📸</span>
            <div style={{ textAlign: 'left' }}>
              <div>Place Photo</div>
              <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                Upload a photo (+10 REP, +15 REP with GPS!)
              </div>
            </div>
          </button>

          {/* Music Drop Option - Simplified */}
          {hasUnlockedTracks ? (
            <button
              onClick={onMusicDrop}
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #8a2be2, #6a1bb2)',
                border: 'none',
                borderRadius: '12px',
                padding: '18px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              <span style={{ fontSize: '24px' }}>🎵</span>
              <div style={{ textAlign: 'left' }}>
                <div>Place Music Drop</div>
                <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                  Select a song to drop on the map
                </div>
              </div>
            </button>
          ) : (
            <div style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'rgba(138, 43, 226, 0.15)',
              border: '1px dashed rgba(138, 43, 226, 0.4)',
              color: '#a78bfa',
              fontSize: '14px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>🎵</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>Music Drop</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Unlock tracks first (place marker or photo drops)
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            marginTop: '20px',
            background: 'none',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px',
            padding: '10px 20px',
            color: '#94a3b8',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            width: '100%',
            fontSize: '14px',
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DropTypeModal;