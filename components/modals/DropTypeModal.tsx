'use client';

import React from 'react';
import { SurfaceType, GraffitiType } from '@/types';
import { MarkerDescription } from '@/constants/markers';
import { SurfaceGraffitiSelector } from '@/components/ui/SurfaceGraffitiSelector';

interface DropTypeModalProps {
  isVisible: boolean;
  onClose: () => void;
  onMarkerDrop: () => void;
  onPhotoDrop: () => void;
  onMusicDrop: () => void;
  
  // Surface and graffiti type selection
  selectedSurface: SurfaceType;
  selectedGraffitiType: GraffitiType;
  onSurfaceChange: (surface: SurfaceType) => void;
  onGraffitiTypeChange: (type: GraffitiType) => void;
  selectedMarkerType: MarkerDescription;
  
  // Music drop options
  unlockedTracks: string[];
  selectedTrackForMusicDrop: string | null;
  onTrackSelect: (track: string | null) => void;
  getTrackNameFromUrl: (url: string) => string;
}

const DropTypeModal: React.FC<DropTypeModalProps> = ({
  isVisible,
  onClose,
  onMarkerDrop,
  onPhotoDrop,
  onMusicDrop,
  selectedSurface,
  selectedGraffitiType,
  onSurfaceChange,
  onGraffitiTypeChange,
  selectedMarkerType,
  unlockedTracks,
  selectedTrackForMusicDrop,
  onTrackSelect,
  getTrackNameFromUrl
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '400px',
          width: '90%',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          animation: 'popIn 0.3s ease-out'
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
          {/* Surface and Graffiti Type Selection */}
          <div style={{ marginBottom: '10px' }}>
            <SurfaceGraffitiSelector
              selectedSurface={selectedSurface}
              selectedGraffitiType={selectedGraffitiType}
              onSurfaceChange={onSurfaceChange}
              onGraffitiTypeChange={onGraffitiTypeChange}
            />
          </div>

          {/* Marker Option */}
          <button
            onClick={onMarkerDrop}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              padding: '18px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
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
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '12px',
              padding: '18px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
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

          {/* Music Drop Option */}
          {unlockedTracks.length > 0 ? (
            <>
              <label style={{
                color: '#f1f5f9',
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px',
                display: 'block'
              }}>
                MUSIC Drop (you lose this song):
              </label>
              <select
                value={selectedTrackForMusicDrop ?? unlockedTracks[0]}
                onChange={(e) => onTrackSelect(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid rgba(138, 43, 226, 0.4)',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '4px'
                }}
              >
                {unlockedTracks.map((url) => (
                  <option key={url} value={url} style={{ backgroundColor: '#1e293b' }}>
                    {getTrackNameFromUrl(url)}
                  </option>
                ))}
              </select>
              <button
                onClick={onMusicDrop}
                style={{
                  background: 'linear-gradient(135deg, #8a2be2, #6a1bb2)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '18px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)'
                }}
              >
                <span style={{ fontSize: '24px' }}>🎵</span>
                <div style={{ textAlign: 'left' }}>
                  <div>Place Music Drop</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                    Save song on map – you lose it from your collection
                  </div>
                </div>
              </button>
            </>
          ) : (
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(138, 43, 226, 0.15)',
              border: '1px dashed rgba(138, 43, 226, 0.4)',
              color: '#a78bfa',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              MUSIC Drop – unlock tracks first (place marker or photo drops)
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            background: 'none',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '8px',
            padding: '10px 20px',
            color: '#94a3b8',
            cursor: 'pointer',
            width: '100%',
            fontSize: '14px',
            transition: 'all 0.2s ease'
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
      `}</style>
    </div>
  );
};

export default DropTypeModal;