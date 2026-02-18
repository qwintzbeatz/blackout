'use client';

import React from 'react';
import { UserProfile } from '@/lib/types/blackout';

interface LegendPanelProps {
  isVisible: boolean;
  isOfflineMode: boolean;
  showTopPlayers: boolean;
  selectedMarkerColor: string;
  userMarkersCount: number;
  unlockedTracksCount: number;
  gpsStatus: 'acquiring' | 'tracking' | 'error' | 'idle';
  gpsPosition: [number, number] | null;
  gpsError: string | null;
  userProfile: UserProfile | null;
}

const LegendPanel: React.FC<LegendPanelProps> = ({
  isVisible,
  isOfflineMode,
  showTopPlayers,
  selectedMarkerColor,
  userMarkersCount,
  unlockedTracksCount,
  gpsStatus,
  gpsPosition,
  gpsError,
  userProfile
}) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      background: 'rgba(0,0,0,0.65)',
      color: 'white',
      padding: '10px 14px',
      borderRadius: 8,
      fontSize: 13,
      zIndex: 900,
      backdropFilter: 'blur(4px)',
      maxWidth: '250px'
    }}>
      <div>📍 Your location {isOfflineMode ? '(Offline)' : '(NZ only)'}</div>
      <div style={{ color: selectedMarkerColor }}>● All drops (blue dot = yours)</div>
      <div>{isOfflineMode ? '🔴' : '🟢'} 50m radius {isOfflineMode ? '(Offline Mode)' : '(Online Mode)'}</div>
      <div>🎯 GPS accuracy {isOfflineMode ? '(Disabled)' : ''}</div>
      <div style={{ fontSize: '10px', color: isOfflineMode ? '#ef4444' : '#60a5fa', marginTop: '4px' }}>
        {isOfflineMode ? '🎮 Offline Mode' : '🗺️ Blackout NZ - Street art across Aotearoa'}
      </div>
      
      {/* GPS Status */}
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: gpsStatus === 'tracking' ? '#10b981' :
               gpsStatus === 'acquiring' ? '#f59e0b' :
               gpsStatus === 'error' ? '#ef4444' : '#6b7280'
      }}>
        📡 GPS: {
          isOfflineMode ? 'Offline Mode' :
          gpsStatus === 'tracking' ? 'Active' :
          gpsStatus === 'acquiring' ? 'Acquiring...' :
          gpsStatus === 'error' ? 'Error' : 'Initializing'
        }
        {gpsPosition && (
          <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.8 }}>
            {gpsPosition[0].toFixed(4)}, {gpsPosition[1].toFixed(4)}
          </div>
        )}
        {gpsError && (
          <div style={{
            fontSize: '9px',
            marginTop: '2px',
            color: '#ef4444',
            maxWidth: '200px',
            wordWrap: 'break-word'
          }}>
            {gpsError}
          </div>
        )}
      </div>
      
      {/* Top Players Legend */}
      {showTopPlayers && (
        <>
          <div style={{ marginTop: '8px', color: '#fbbf24' }}>🥇 Top Writer</div>
          <div style={{ color: '#cbd5e1' }}>🥈 Runner-up</div>
          <div style={{ color: '#d97706' }}>🥉 Contender</div>
        </>
      )}
      
      {/* Stats */}
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#4dabf7' }}>
        Total drops: {userMarkersCount}
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#8a2be2' }}>
        Music: {unlockedTracksCount} tracks unlocked
      </div>
      
      {/* Crew Status */}
      {userProfile?.crewId && !userProfile?.isSolo && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#10b981' }}>
          Crew: {userProfile.crewName} (Chat available)
        </div>
      )}
    </div>
  );
};

export default LegendPanel;