import React, { useState, useEffect } from 'react';
import { calculateDistance } from '@/lib/utils/dropHelpers';
import { useMusicDrops } from '@/hooks/useMusicDrops';
import { useGPSTracker } from '@/hooks/useGPSTracker';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';

interface RadarScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscoverTrack: (track: {
    trackUrl: string;
    trackName: string;
    source: string;
    position: [number, number];
  }) => void;
}

const RadarScanner: React.FC<RadarScannerProps> = ({
  isOpen,
  onClose,
  onDiscoverTrack
}) => {
  const { hasRecentErrors } = useErrorHandler();
  const { position: gpsPosition } = useGPSTracker();
  const { musicDrops, discoverMusicDrop, musicScan } = useMusicDrops(null, gpsPosition);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [discoveredTracks, setDiscoveredTracks] = useState<Array<{
    trackUrl: string;
    trackName: string;
    source: string;
    position: [number, number];
    distance: number;
  }>>([]);
  const [scanResults, setScanResults] = useState<{
    totalScanned: number;
    tracksFound: number;
    scanTime: number;
  } | null>(null);

  const SCAN_RADIUS = 300; // 300 meters
  const SCAN_DURATION = 3000; // 3 seconds

  const handleStartScan = async () => {
    if (!gpsPosition) {
      alert('GPS location not available. Please enable location services.');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setDiscoveredTracks([]);
    setScanResults(null);

    // Simulate scanning animation
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SCAN_DURATION, 1);
      setScanProgress(progress);

      if (progress === 1) {
        clearInterval(interval);
        performScan();
      }
    }, 50);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  };

  const performScan = async () => {
    if (!gpsPosition || !musicScan) return;

    const startTime = Date.now();
    let tracksFound = 0;

    // Use the musicScan function to scan for drops within 300m radius
    const discoveredDrops = musicScan(gpsPosition, SCAN_RADIUS);

    console.log(`📡 Radar Scanner: Discovered ${discoveredDrops.length} drops within ${SCAN_RADIUS}m`);

    // Process discovered drops
    const discoveredTrackData = discoveredDrops.map(drop => ({
      trackUrl: drop.trackUrl,
      trackName: drop.trackName,
      source: drop.source,
      position: drop.position,
      distance: calculateDistance(
        gpsPosition[0],
        gpsPosition[1],
        drop.position[0],
        drop.position[1]
      )
    }));

    // Add to discovered tracks
    setDiscoveredTracks(discoveredTrackData);
    
    // Call onDiscoverTrack for each discovered track
    discoveredTrackData.forEach(track => onDiscoverTrack(track));
    
    tracksFound = discoveredTrackData.length;

    const scanTime = Date.now() - startTime;
    setScanResults({
      totalScanned: discoveredDrops.length,
      tracksFound,
      scanTime
    });

    setIsScanning(false);
  };

  const handleClose = () => {
    setIsScanning(false);
    setScanProgress(0);
    setDiscoveredTracks([]);
    setScanResults(null);
    onClose();
  };

  if (!isOpen) return null;

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
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid #374151',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Radar Background Animation */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%, transparent 50%, rgba(59, 130, 246, 0.05) 50%, rgba(59, 130, 246, 0.05) 75%, transparent 75%, transparent)
          `,
          backgroundSize: '40px 40px',
          animation: 'radarGrid 2s linear infinite',
          pointerEvents: 'none'
        }} />

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#93c5fd',
            marginBottom: '8px',
            textShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
          }}>
            📡 Radar Scanner
          </div>
          <div style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginBottom: '16px'
          }}>
            Scanning {SCAN_RADIUS}m radius for music drops
          </div>
        </div>

        {/* Scan Controls */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: '24px'
        }}>
          {!isScanning && scanResults === null ? (
            <button
              onClick={handleStartScan}
              disabled={isScanning || !gpsPosition}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: isScanning || !gpsPosition ? '#374151' : '#2563eb',
                border: '1px solid #3b82f6',
                color: 'white',
                borderRadius: '12px',
                cursor: isScanning || !gpsPosition ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: isScanning || !gpsPosition ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isScanning && gpsPosition) {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isScanning && gpsPosition) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {gpsPosition ? '🔍 START SCAN' : '📍 GPS REQUIRED'}
            </button>
          ) : null}

          {/* Scan Progress Bar */}
          {isScanning && (
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#374151',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px'
            }}>
              <div
                style={{
                  width: `${scanProgress * 100}%`,
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.1s linear',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              />
            </div>
          )}

          {/* GPS Status */}
          <div style={{
            fontSize: '12px',
            color: gpsPosition ? '#10b981' : '#ef4444',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {gpsPosition 
              ? `📍 GPS Active: ${gpsPosition[0].toFixed(6)}, ${gpsPosition[1].toFixed(6)}`
              : '📍 GPS Required - Enable Location Services'
            }
          </div>
        </div>

        {/* Scan Results */}
        {scanResults && (
          <div style={{
            position: 'relative',
            zIndex: 2,
            padding: '16px',
            backgroundColor: '#374151',
            borderRadius: '12px',
            border: '1px solid #475569',
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#cbd5e1',
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              📊 SCAN RESULTS
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <div>📡 Drops Scanned:</div>
              <div style={{ textAlign: 'right', color: '#93c5fd' }}>
                {scanResults.totalScanned}
              </div>
              <div>🎵 Tracks Found:</div>
              <div style={{ textAlign: 'right', color: '#10b981' }}>
                {scanResults.tracksFound}
              </div>
              <div>⏱️ Scan Time:</div>
              <div style={{ textAlign: 'right', color: '#f59e0b' }}>
                {scanResults.scanTime}ms
              </div>
            </div>
          </div>
        )}

        {/* Discovered Tracks List */}
        {discoveredTracks.length > 0 && (
          <div style={{
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
              fontSize: '14px',
              color: '#cbd5e1',
              marginBottom: '12px',
              fontWeight: 'bold'
            }}>
              🎵 DISCOVERED TRACKS
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {discoveredTracks.map((track, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#374151',
                    borderRadius: '8px',
                    border: '1px solid #475569'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                  }}>
                    🎵
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#e5e7eb',
                      marginBottom: '4px'
                    }}>
                      {track.trackName}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      {track.source} • {track.distance.toFixed(0)}m away
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#10b981',
                    fontWeight: 'bold'
                  }}>
                    ✓ DISCOVERED
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: '1.4',
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#374151',
          borderRadius: '8px',
          border: '1px solid #475569'
        }}>
          <div style={{ fontWeight: 'bold', color: '#9ca3af', marginBottom: '4px' }}>
            📡 HOW TO USE
          </div>
          <div>
            1. Ensure GPS is active and accurate<br/>
            2. Click "START SCAN" to scan 300m radius<br/>
            3. Discovered tracks appear in your collection<br/>
            4. Tracks are randomly distributed across the map
          </div>
        </div>
      </div>

      <style>{`
        @keyframes radarGrid {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RadarScanner;