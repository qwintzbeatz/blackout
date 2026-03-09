'use client';

import React from 'react';
import { MusicDrop } from '@/hooks/useMusicDrops';
import { calculateDistance } from '@/lib/utils';

interface MusicDropMarkerProps {
  drop: MusicDrop;
  onClick: (drop: MusicDrop) => void;
  isDiscovered: boolean;
  gpsPosition: [number, number] | null;
  scanRadius?: number; // Default 100m
}

const MusicDropMarker: React.FC<MusicDropMarkerProps> = ({ 
  drop, 
  onClick, 
  isDiscovered, 
  gpsPosition, 
  scanRadius = 100 
}) => {
  // Check if user is within scan radius
  const isWithinRadius = gpsPosition ? calculateDistance(
    gpsPosition[0],
    gpsPosition[1],
    drop.position[0],
    drop.position[1]
  ) <= scanRadius : false;

  // Allow clicking discovered drops regardless of distance (for testing/demo purposes)
  // In production, you might want to keep the radius restriction
  const canClick = isDiscovered; // Removed radius check to allow clicking from anywhere

  return (
    <div
      style={{
        position: 'relative',
        width: '36px',
        height: '36px',
        background: isDiscovered 
          ? 'radial-gradient(circle, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)'
          : 'radial-gradient(circle, #64748b 0%, #475569 50%, #334155 100%)',
        border: '3px solid white',
        borderRadius: '50%',
        boxShadow: isDiscovered
          ? '0 4px 15px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.3)'
          : '0 4px 15px rgba(100, 116, 139, 0.6), 0 0 20px rgba(100, 116, 139, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: isDiscovered ? 'pulseGlow 2s ease-in-out infinite' : 'none',
        cursor: canClick ? 'pointer' : 'not-allowed',
        filter: isDiscovered ? 'grayscale(0%)' : 'grayscale(100%) brightness(0.5)',
        transition: 'all 0.3s ease',
        opacity: isDiscovered ? 1 : 0.4,
        transform: 'scale(1)'
      }}
      onClick={() => {
        if (canClick) {
          onClick(drop);
        } else {
          alert('🎵 Discover this music drop first to interact with it!');
        }
      }}
    >
      {/* Status indicator */}
      <div style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        width: '16px',
        height: '16px',
        background: isDiscovered ? '#10b981' : '#ef4444',
        border: '2px solid white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: 'white',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        {isDiscovered ? '✓' : '?'}
      </div>

      {/* Music note icon */}
      <span style={{
        fontSize: '18px',
        filter: 'brightness(0) invert(1)',
        zIndex: 2
      }}>
        🎵
      </span>

      {/* REP reward badge */}
      {isDiscovered && (
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(16, 185, 129, 0.9)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          border: '1px solid #10b981',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          +{drop.repReward} REP
        </div>
      )}

      {/* Scan animation effect */}
      {isDiscovered && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          border: '2px solid rgba(139, 92, 246, 0.8)',
          borderRadius: '50%',
          animation: 'scanPulse 1.5s ease-out infinite',
          pointerEvents: 'none'
        }} />
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { 
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 6px 25px rgba(139, 92, 246, 0.8), 0 0 35px rgba(139, 92, 246, 0.5);
            transform: scale(1.05);
          }
        }
        
        @keyframes scanPulse {
          0% { 
            transform: scale(0.8);
            opacity: 1;
            border-color: rgba(139, 92, 246, 0.8);
          }
          100% { 
            transform: scale(1.2);
            opacity: 0;
            border-color: rgba(139, 92, 246, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default MusicDropMarker;
