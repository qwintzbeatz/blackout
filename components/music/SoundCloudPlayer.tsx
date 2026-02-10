'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import useSoundCloudPlayer from '@/hooks/useSoundCloudPlayer';

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

const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>
);

const VolumeMutedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

interface SoundCloudPlayerProps {
  trackUrl: string;
  trackName?: string;
  initialVolume?: number;
  onClose?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function SoundCloudPlayer({
  trackUrl,
  trackName = 'SoundCloud Track',
  initialVolume = 0.7,
  onClose,
}: SoundCloudPlayerProps) {
  const { state, actions } = useSoundCloudPlayer();
  const [localVolume, setLocalVolume] = useState(initialVolume);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeRef = useRef(initialVolume);

  // Load track when URL changes
  useEffect(() => {
    if (trackUrl) {
      actions.loadTrack(trackUrl);
    }
  }, [trackUrl, actions]);

  // Update volume when it changes
  useEffect(() => {
    actions.setVolume(initialVolume);
    volumeRef.current = initialVolume;
    setLocalVolume(initialVolume);
  }, [initialVolume, actions]);

  const handlePlayPause = useCallback(async () => {
    if (state.error) {
      actions.clearError();
      await actions.loadTrack(trackUrl);
    }
    await actions.togglePlay();
  }, [actions, state.error, trackUrl]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setLocalVolume(volume);
    volumeRef.current = volume;
    actions.setVolume(volume);
  }, [actions]);

  const toggleMute = useCallback(() => {
    if (localVolume > 0) {
      handleVolumeChange({ target: { value: '0' } } as React.ChangeEvent<HTMLInputElement>);
    } else {
      handleVolumeChange({ target: { value: volumeRef.current.toString() } } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [localVolume, handleVolumeChange]);

  const handleClose = useCallback(() => {
    actions.pause();
    onClose?.();
  }, [actions, onClose]);

  const isMuted = localVolume === 0;

  // Error state with retry button
  if (state.error) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '68px',
        left: '0',
        right: '0',
        backgroundColor: 'rgba(20, 20, 30, 0.98)',
        borderTop: '1px solid rgba(138, 43, 226, 0.4)',
        zIndex: 1101,
        padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            flexShrink: 0,
          }}>
            <ErrorIcon />
          </div>
          
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444', marginBottom: '2px' }}>
              Playback Error
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {state.error}
            </div>
          </div>

          <button
            onClick={handlePlayPause}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(138, 43, 226, 0.3)',
              border: '1px solid rgba(138, 43, 226, 0.5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <PlayIcon />
          </button>

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
      borderTop: '1px solid rgba(138, 43, 226, 0.3)',
      zIndex: 1101,
      backdropFilter: 'blur(10px)',
    }}>
      {/* Progress bar */}
      <div style={{ height: '3px', backgroundColor: 'rgba(138, 43, 226, 0.2)' }}>
        <div style={{
          height: '100%',
          width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%`,
          backgroundColor: '#8a2be2',
          transition: 'width 0.1s linear',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: '12px' }}>
        {/* Album art */}
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          backgroundColor: 'rgba(138, 43, 226, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {state.track?.artwork ? (
            <img src={state.track.artwork} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '20px' }}>🎵</span>
          )}
        </div>

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {state.track?.title || trackName}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {state.track?.artist || 'Loading...'}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Volume button */}
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
          </button>

          {/* Play/Pause button */}
          <button
            onClick={handlePlayPause}
            disabled={state.isLoading && !state.error}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(138, 43, 226, 0.3)',
              border: '1px solid rgba(138, 43, 226, 0.5)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: state.isLoading ? 'not-allowed' : 'pointer',
              opacity: state.isLoading ? 0.6 : 1,
            }}
          >
            {state.isLoading ? (
              <div style={{
                width: '20px', height: '20px', border: '2px solid transparent',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            ) : state.isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {/* Close button */}
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

      {/* Volume slider */}
      {showVolumeSlider && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(20, 20, 30, 0.98)',
          border: '1px solid rgba(138, 43, 226, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '8px',
          width: '160px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={toggleMute} style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '4px',
            }}>
              {isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localVolume}
              onChange={handleVolumeChange}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                appearance: 'none',
                background: `linear-gradient(to right, #8a2be2 ${localVolume * 100}%, rgba(138, 43, 226, 0.3) ${localVolume * 100}%)`,
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      )}

      {/* Time display */}
      <div style={{
        position: 'absolute',
        right: '16px',
        bottom: '60px',
        fontSize: '10px',
        color: '#64748b',
      }}>
        {formatTime(state.currentTime)} / {formatTime(state.duration)}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #8a2be2; cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #8a2be2; cursor: pointer; border: none;
        }
      `}</style>
    </div>
  );
}
