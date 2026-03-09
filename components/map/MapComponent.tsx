'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { UserMarker } from '@/lib/utils/types';
import GPSMarker from './GPSMarker';
import UserMarkerComponent from './UserMarkerComponent';
import MusicDropMarker from './MusicDropMarker';
import MusicDropPopup from './MusicDropPopup';

// Dynamically import leaflet only on client side
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  userMarkers: UserMarker[];
  gpsPosition: [number, number] | null;
  accuracy: number | null;
  isTracking: boolean;
  show50mRadius: boolean;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  onMapCreated?: (map: any) => void;
  onUpdateMarker?: (id: string, updates: Partial<UserMarker>) => void;
  onDeleteMarker?: (id: string) => void;
  onGoToMarker?: (marker: UserMarker) => void;
  userRank?: string;
  useDarkTiles?: boolean;
  onAddMarkerAtPosition?: (position: { lat: number; lng: number }) => void;
  // Music drops props
  musicDrops?: any[];
  onMusicDropClick?: (drop: any) => void;
  musicScan?: () => void;
  isMusicScanning?: boolean;
  photoScan?: () => void;
  fullAreaScan?: (bounds: [[number, number], [number, number]]) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  userMarkers,
  gpsPosition,
  accuracy,
  isTracking,
  show50mRadius,
  onMapClick,
  onMapCreated,
  onUpdateMarker,
  onDeleteMarker,
  onGoToMarker,
  userRank = 'TOY',
  useDarkTiles = false,
  onAddMarkerAtPosition,
  // Music drops props
  musicDrops = [],
  onMusicDropClick,
  musicScan,
  isMusicScanning = false,
  photoScan,
  fullAreaScan
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const mapRef = useRef<any>(null);
  
  // GPS centering animation state
  const [isGPSCentering, setIsGPSCentering] = useState(false);
  
  // Music drop functionality - now passed as props
  // const {
  //   musicDrops,
  //   discoveredMusicDrops,
  //   scanForMusicDrops,
  //   unlockMusicTrack,
  //   isScanning,
  //   musicScan,
  //   photoScan,
  //   fullAreaScan
  // } = useMusicDrops(null, gpsPosition);

  // Initialize Leaflet icons only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // Fix Leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setMapReady(true);
      });
    }
  }, []);

  // Handle map click
  useEffect(() => {
    if (!mapInstance || !onMapClick) return;

    const handleClick = (e: any) => {
      onMapClick(e.latlng);
    };

    mapInstance.on('click', handleClick);

    return () => {
      if (mapInstance) {
        mapInstance.off('click', handleClick);
      }
    };
  }, [mapInstance, onMapClick]);

  const handleMapCreated = () => {
    if (mapRef.current) {
      setMapInstance(mapRef.current);
      if (onMapCreated) {
        onMapCreated(mapRef.current);
      }
    }
  };

  // Button 5: Unified Music Scanner - Center map and scan for music drops
  const handleButton5Click = () => {
    console.log('Button 5 clicked - Unified Music Scanner: Center map and scan for music');
    
    if (gpsPosition && mapInstance) {
      console.log('GPS Position available:', gpsPosition);
      
      // Set centering state for animation
      setIsGPSCentering(true);
      
      // Center the map on GPS position
      mapInstance.setView(gpsPosition, zoom);
      console.log('Map centered on GPS position');
      
      // Trigger music scan
      if (musicScan) {
        musicScan();
        console.log('Music scan triggered');
      }
      
      // Reset animation state after 1 second
      setTimeout(() => {
        setIsGPSCentering(false);
      }, 1000);
    } else {
      console.log('No GPS position available');
    }
  };

  const handleButton1Click = () => {
    console.log('Button 1 clicked');
  };

  const handleButton2Click = () => {
    console.log('Button 2 clicked');
  };

  const handleButton3Click = () => {
    console.log('Button 3 clicked');
  };

  const handleButton4Click = () => {
    console.log('Button 4 clicked');
  };

  const handleButton7Click = () => {
    console.log('Button 7 clicked');
  };

  const handleButton8Click = () => {
    console.log('Button 8 clicked');
  };

  if (!mapReady) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        whenReady={handleMapCreated}
      >
        {/* Dark Tile Options */}
        {useDarkTiles ? (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          </>
        ) : (
          // Default light tiles
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}
        
        {/* GPS Marker */}
        {gpsPosition && (
          <GPSMarker
            position={gpsPosition}
            accuracy={accuracy}
            isTracking={isTracking}
            show50mRadius={show50mRadius}
          />
        )}

        {/* User-placed markers */}
        {userMarkers.map((marker) => (
          <UserMarkerComponent
            key={marker.id}
            marker={marker}
            onUpdate={onUpdateMarker || (() => {})}
            onDelete={onDeleteMarker || (() => {})}
            onGoTo={onGoToMarker || (() => {})}
            gpsPosition={gpsPosition}
            userRank={userRank}
            currentUserId={undefined}
          />
        ))}

        {/* Music Drop Markers */}
        {musicDrops.map((drop) => (
          <MusicDropMarker
            key={drop.id}
            drop={drop}
            onClick={(clickedDrop) => {
              console.log('Music drop clicked:', clickedDrop);
              if (onMusicDropClick) {
                onMusicDropClick(clickedDrop);
              }
            }}
            isDiscovered={drop.discovered}
            gpsPosition={gpsPosition}
            scanRadius={100} // 100m scan radius
          />
        ))}
      </MapContainer>

      {/* GPS Status Indicator */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        padding: '8px 12px',
        backgroundColor: gpsPosition ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: gpsPosition ? '#4CAF50' : '#F44336',
          animation: gpsPosition ? 'pulse 2s infinite' : 'none'
        }}></div>
        {gpsPosition ? 'GPS ACTIVE' : 'GPS INACTIVE'}
      </div>

      {/* First row of 4 buttons - Bottom center */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        zIndex: 1000
      }}>
        <button
          onClick={handleButton1Click}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.95)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ color: '#666' }}>1</span>
        </button>

        <button
          onClick={handleButton2Click}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.95)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ color: '#666' }}>2</span>
        </button>

        <button
          onClick={handleButton3Click}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.95)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ color: '#666' }}>3</span>
        </button>

        <button
          onClick={handleButton4Click}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: '2px solid #333',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(245, 245, 245, 0.95)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span style={{ color: '#666' }}>4</span>
        </button>
      </div>

      {/* Second row of 4 buttons - Above the first row */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        zIndex: 1000
      }}>
        {/* Button 5 - Unified Music Scanner (GPS + Music) */}
        <button
          onClick={handleButton5Click}
          disabled={!gpsPosition || isGPSCentering}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            backgroundColor: gpsPosition ? 'rgba(15, 23, 42, 0.9)' : 'rgba(200, 200, 200, 0.9)',
            cursor: gpsPosition && !isGPSCentering ? 'pointer' : 'not-allowed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: 'rgb(245, 158, 11)',
            boxShadow: 'rgba(0, 0, 0, 0.3) 0px 4px 12px',
            transition: '0.3s',
            minWidth: '60px',
            gap: '2px',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (gpsPosition && !isGPSCentering) {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (gpsPosition && !isGPSCentering) {
              e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={gpsPosition ? "🎵 GPS Music Scanner: Center map and scan for music drops" : "GPS not available"}
        >
          {/* GPS icon with marker */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <div style={{
              fontSize: '16px',
              color: gpsPosition ? 'rgb(245, 158, 11)' : '#666',
              position: 'relative',
              marginBottom: '2px'
            }}>
              📍🎵
            </div>
            <div style={{
              fontSize: '9px',
              color: gpsPosition ? 'rgb(245, 158, 11)' : '#666',
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: '1'
            }}>
              SCAN
            </div>
            {isGPSCentering && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                border: '2px solid rgba(245, 158, 11, 0.8)',
                borderRadius: '50%',
                animation: 'scanPulse 1s ease-out infinite',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        </button>

        {/* Button 7 - Photo Scan */}
        <button
          onClick={() => {
            console.log('Button 7 clicked - Photo Scan');
            if (gpsPosition && photoScan) {
              photoScan();
            }
          }}
          disabled={!gpsPosition || isMusicScanning}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: `2px solid ${gpsPosition ? (isMusicScanning ? '#10b981' : '#10b981') : '#999'}`,
            borderRadius: '8px',
            backgroundColor: gpsPosition ? (isMusicScanning ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.9)') : 'rgba(200, 200, 200, 0.9)',
            cursor: gpsPosition && !isMusicScanning ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: gpsPosition ? '0 2px 5px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (gpsPosition && !isMusicScanning) {
              e.currentTarget.style.backgroundColor = 'rgba(5, 150, 105, 0.95)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (gpsPosition && !isMusicScanning) {
              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={gpsPosition ? "📸 Scan for Photo Drops (250m)" : "GPS not available"}
        >
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <div style={{
              fontSize: '20px',
              color: gpsPosition ? 'white' : '#666',
              position: 'relative'
            }}>
              📸
            </div>
            {isMusicScanning && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                border: '2px solid rgba(16, 185, 129, 0.8)',
                borderRadius: '50%',
                animation: 'scanPulse 1s ease-out infinite',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        </button>

        {/* Button 8 - Full Area Scan */}
        <button
          onClick={() => {
            console.log('Button 8 clicked - Full Area Scan');
            if (mapInstance && fullAreaScan) {
              const bounds = mapInstance.getBounds();
              const mapBounds: [[number, number], [number, number]] = [
                [bounds.getSouth(), bounds.getWest()],
                [bounds.getNorth(), bounds.getEast()]
              ];
              fullAreaScan(mapBounds);
            }
          }}
          disabled={isMusicScanning}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: `2px solid ${isMusicScanning ? '#f59e0b' : '#f59e0b'}`,
            borderRadius: '8px',
            backgroundColor: isMusicScanning ? 'rgba(245, 158, 11, 0.8)' : 'rgba(245, 158, 11, 0.9)',
            cursor: !isMusicScanning ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 2px 5px rgba(245, 158, 11, 0.4)',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!isMusicScanning) {
              e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.95)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMusicScanning) {
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title="🗺️ Scan entire map area"
        >
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <div style={{
              fontSize: '20px',
              color: 'white',
              position: 'relative'
            }}>
              🗺️
            </div>
            {isMusicScanning && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                border: '2px solid rgba(245, 158, 11, 0.8)',
                borderRadius: '50%',
                animation: 'scanPulse 1s ease-out infinite',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        </button>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @keyframes scanPulse {
          0% { 
            transform: scale(0.8);
            opacity: 1;
            border-color: rgba(245, 158, 11, 0.8);
          }
          100% { 
            transform: scale(1.2);
            opacity: 0;
            border-color: rgba(245, 158, 11, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default MapComponent;