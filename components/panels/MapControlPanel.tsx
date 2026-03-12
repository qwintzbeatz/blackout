import React from 'react';
import { UserMarker, TopPlayer } from '@/lib/types/blackout';

interface MapControlPanelProps {
  userMarkers: any[];
  topPlayers: any[];
  gpsStatus: string;
  unlockedTracks: string[];
  isRefreshing: boolean;
  showLegend: boolean;
  show50mRadius: boolean;
  showTopPlayers: boolean;
  showSatelliteView: boolean;
  crewDetectionEnabled: boolean;
  markerQuality: 'low' | 'medium' | 'high';
  mapRef: React.RefObject<any>;
  panelStyle: React.CSSProperties;
  togglePanel: (panel: 'profile' | 'photos' | 'messages' | 'map' | 'music' | 'story' | 'crewchat' | 'none') => void;
  setShowLegend: (show: boolean) => void;
  setShow50mRadius: (show: boolean) => void;
  setShowTopPlayers: (show: boolean) => void;
  setShowSatelliteView: (show: boolean) => void;
  setCrewDetectionEnabled: (enabled: boolean) => void;
  setMarkerQuality: (quality: 'low' | 'medium' | 'high') => void;
  handleRefreshAll: () => void;
}

const MapControlPanel: React.FC<MapControlPanelProps> = ({
  userMarkers,
  topPlayers,
  gpsStatus,
  unlockedTracks,
  isRefreshing,
  showLegend,
  show50mRadius,
  showTopPlayers,
  showSatelliteView,
  crewDetectionEnabled,
  markerQuality,
  mapRef,
  panelStyle,
  togglePanel,
  setShowLegend,
  setShow50mRadius,
  setShowTopPlayers,
  setShowSatelliteView,
  setCrewDetectionEnabled,
  setMarkerQuality,
  handleRefreshAll
}) => {
  return (
    <div style={{
      ...panelStyle,
      animation: 'slideInLeft 0.3s ease-out',
      position: 'relative' as 'relative'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '12px'
      }}>
        <h3 style={{ margin: 0, color: '#4dabf7', fontSize: '18px' }}>🗺️ MAP CONTROL</h3>
        <button
          onClick={() => togglePanel('none')}
          style={{
            background: 'none',
            border: 'none',
            color: '#cbd5e1',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Legend Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowLegend(!showLegend)}
            style={{
              backgroundColor: showLegend ? 'rgba(77, 171, 247, 0.2)' : 'rgba(75, 85, 99, 0.5)',
              border: showLegend ? '1px solid #4dabf7' : '1px solid #6b7280',
              color: showLegend ? '#4dabf7' : '#cbd5e1',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
          >
            📋 Legend {showLegend ? 'ON' : 'OFF'}
          </button>
          <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
            Show/hide map legend
          </span>
        </div>

        {/* 50m Radius Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShow50mRadius(!show50mRadius)}
            style={{
              backgroundColor: show50mRadius ? 'rgba(77, 171, 247, 0.2)' : 'rgba(75, 85, 99, 0.5)',
              border: show50mRadius ? '1px solid #4dabf7' : '1px solid #6b7280',
              color: show50mRadius ? '#4dabf7' : '#cbd5e1',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
          >
            🎯 50m Radius {show50mRadius ? 'ON' : 'OFF'}
          </button>
          <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
            Show/hide 50m action radius
          </span>
        </div>

        {/* Top Players Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowTopPlayers(!showTopPlayers)}
            style={{
              backgroundColor: showTopPlayers ? 'rgba(77, 171, 247, 0.2)' : 'rgba(75, 85, 99, 0.5)',
              border: showTopPlayers ? '1px solid #4dabf7' : '1px solid #6b7280',
              color: showTopPlayers ? '#4dabf7' : '#cbd5e1',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
          >
            🏆 Top Players {showTopPlayers ? 'ON' : 'OFF'}
          </button>
          <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
            Show/hide leaderboard markers
          </span>
        </div>

        {/* Refresh Drops */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              color: '#10b981',
              padding: '12px',
              borderRadius: '8px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              width: '100%',
              transition: 'all 0.2s ease',
              opacity: isRefreshing ? 0.7 : 1
            }}
          >
            {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Drops'}
          </button>
          <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
            Reload all markers & players
          </span>
        </div>

        {/* Satellite View Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSatelliteView(!showSatelliteView)}
            style={{
              backgroundColor: showSatelliteView ? 'rgba(34, 197, 94, 0.2)' : 'rgba(75, 85, 99, 0.5)',
              border: showSatelliteView ? '1px solid #22c55e' : '1px solid #6b7280',
              color: showSatelliteView ? '#22c55e' : '#cbd5e1',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
          >
            🛰️ Satellite {showSatelliteView ? 'ON' : 'OFF'}
          </button>
          <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
            Toggle aerial imagery
          </span>
        </div>

        {/* Show All Drops */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              if (userMarkers.length > 0 && mapRef.current) {
                const bounds = userMarkers.map(marker => marker.position);
                if (bounds.length > 0) {
                  const minLat = Math.min(...bounds.map(b => b[0]));
                  const maxLat = Math.max(...bounds.map(b => b[0]));
                  const minLng = Math.min(...bounds.map(b => b[1]));
                  const maxLng = Math.max(...bounds.map(b => b[1]));
                  mapRef.current.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [20, 20] });
                }
              }
            }}
            style={{
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid #8b5cf6',
              color: '#8b5cf6',
              padding: '12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
          >
            👁️ Show All Drops
          </button>
          <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
            Fit map to all markers
          </span>
        </div>

      </div>

      {/* ⚙️ PERFORMANCE SETTINGS SECTION */}
      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#fbbf24',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚙️ PERFORMANCE
        </div>

        {/* Crew Detection Toggle */}
        <div style={{
          marginBottom: '15px',
          padding: '12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px solid #444'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <label style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👥 Crew Detection
              <input
                type="checkbox"
                checked={crewDetectionEnabled}
                onChange={(e) => setCrewDetectionEnabled(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
            </label>
            <span style={{
              fontSize: '11px',
              color: crewDetectionEnabled ? '#10b981' : '#ef4444'
            }}>
              {crewDetectionEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {crewDetectionEnabled 
              ? '✓ Scans crew members every 10s'
              : '✗ Disabled (faster, less CPU)'}
          </div>
        </div>

        {/* Marker Quality Selector */}
        <div style={{
          marginBottom: '15px',
          padding: '12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px solid #444'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#cbd5e1',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🎨 Marker Quality
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['low', 'medium', 'high'] as const).map((quality) => (
              <button
                key={quality}
                onClick={() => setMarkerQuality(quality)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: markerQuality === quality 
                    ? 'rgba(77, 171, 247, 0.3)' 
                    : 'rgba(255,255,255,0.05)',
                  border: markerQuality === quality 
                    ? '1px solid #4dabf7' 
                    : '1px solid #555',
                  color: markerQuality === quality ? '#4dabf7' : '#cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase'
                }}
              >
                {quality === 'low' ? '⚡ Low' : quality === 'medium' ? '⭐ Med' : '🔥 Max'}
              </button>
            ))}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #444'
          }}>
            {markerQuality === 'low' && '⚡ 25 markers (fastest)'}
            {markerQuality === 'medium' && '⭐ 50 markers (balanced)'}
            {markerQuality === 'high' && '🔥 100+ markers (slower)'}
          </div>
        </div>

        {/* Performance Status */}
        <div style={{
          padding: '10px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#10b981'
        }}>
          <strong>💚 Performance Status</strong>
          <div style={{ marginTop: '6px', fontSize: '10px', color: '#cbd5e1' }}>
            {crewDetectionEnabled ? '✓' : '✗'} Crew detection {crewDetectionEnabled ? 'ON' : 'OFF'}<br/>
            {markerQuality === 'low' ? '⚡' : markerQuality === 'medium' ? '⭐' : '🔥'} {markerQuality.charAt(0).toUpperCase() + markerQuality.slice(1)} quality mode
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#cbd5e1'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Drops visible:</span>
          <span style={{ color: '#4dabf7' }}>{userMarkers.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Top players:</span>
          <span style={{ color: '#f59e0b' }}>{topPlayers.length}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>GPS status:</span>
          <span style={{
            color: gpsStatus === 'tracking' ? '#10b981' :
                  gpsStatus === 'acquiring' ? '#f59e0b' : '#ef4444'
          }}>
            {gpsStatus === 'tracking' ? 'Active' :
            gpsStatus === 'acquiring' ? 'Acquiring...' :
            gpsStatus === 'error' ? 'Error' : 'Initializing'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>Music tracks:</span>
          <span style={{ color: '#8a2be2' }}>{unlockedTracks.length}</span>
        </div>
      </div>
    </div>
  );
};

export default MapControlPanel;