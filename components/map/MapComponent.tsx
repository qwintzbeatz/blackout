'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { UserMarker } from '@/lib/utils/types';
import GPSMarker from './GPSMarker';
import UserMarkerComponent from './UserMarkerComponent';

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
  onAddMarkerAtPosition?: (position: { lat: number; lng: number }) => void; // Add this prop
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
  onAddMarkerAtPosition // Use this prop
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);

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

  const handleMapCreated = (map: any) => {
    setMapInstance(map);
    if (onMapCreated) {
      onMapCreated(map);
    }
  };

  // Button 5: Place marker at current GPS location
  const handleButton5Click = () => {
    console.log('Button 5 clicked - Place marker at current location');
    
    if (gpsPosition) {
      console.log('GPS Position available:', gpsPosition);
      
      // If we have onAddMarkerAtPosition callback, use it
      if (onAddMarkerAtPosition) {
        onAddMarkerAtPosition({ lat: gpsPosition[0], lng: gpsPosition[1] });
      } 
      // Otherwise, trigger the onMapClick with GPS position
      else if (onMapClick) {
        onMapClick({ lat: gpsPosition[0], lng: gpsPosition[1] });
        console.log('Marker placed at:', gpsPosition[0], gpsPosition[1]);
      }
      
      // Optionally, show a visual feedback on the map
      if (mapInstance) {
        // Add a temporary visual feedback
        const { CircleMarker } = require('leaflet');
        const circle = new CircleMarker(gpsPosition, {
          radius: 8,
          color: '#FF0000',
          fillColor: '#FF0000',
          fillOpacity: 0.5,
          weight: 2
        }).addTo(mapInstance);
        
        // Remove after 1 second
        setTimeout(() => {
          circle.remove();
        }, 1000);
      }
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

  const handleButton6Click = () => {
    console.log('Button 6 clicked');
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
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenCreated={handleMapCreated}
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
        {/* Button 5 - Place marker at current location */}
        <button
          onClick={handleButton5Click}
          style={{
            width: '50px',
            height: '50px',
            padding: '0',
            border: `2px solid ${gpsPosition ? '#2196F3' : '#999'}`,
            borderRadius: '8px',
            backgroundColor: gpsPosition ? 'rgba(33, 150, 243, 0.9)' : 'rgba(200, 200, 200, 0.9)',
            cursor: gpsPosition ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px', // Slightly smaller for icon
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (gpsPosition) {
              e.currentTarget.style.backgroundColor = 'rgba(30, 136, 229, 0.95)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (gpsPosition) {
              e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          title={gpsPosition ? "Place marker at current location" : "GPS not available"}
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
              fontSize: '20px',
              color: gpsPosition ? 'white' : '#666',
              position: 'relative'
            }}>
              📍
            </div>
          </div>
        </button>

        <button
          onClick={handleButton6Click}
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
          <span style={{ color: '#666' }}>6</span>
        </button>

        <button
          onClick={handleButton7Click}
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
          <span style={{ color: '#666' }}>7</span>
        </button>

        <button
          onClick={handleButton8Click}
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
          <span style={{ color: '#666' }}>8</span>
        </button>
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MapComponent;