'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
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
  onMapCreated
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
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setMapReady(true);
      });
    }
  }, []);

  // Handle map creation
  const handleMapCreated = useCallback((map: any) => {
    setMapInstance(map);
    if (onMapCreated) {
      onMapCreated(map);
    }
  }, [onMapCreated]);

  // Add click event listener to map
  useEffect(() => {
    if (mapInstance && mapReady) {
      const handleClick = (e: any) => {
        onMapClick(e.latlng);
      };
      
      mapInstance.on('click', handleClick);
      
      return () => {
        if (mapInstance) {
          mapInstance.off('click', handleClick);
        }
      };
    }
  }, [mapInstance, mapReady, onMapClick]);

  if (!mapReady) return null;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      whenCreated={handleMapCreated}
      // Remove the eventHandlers prop since we're using addEventListener
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
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
          onUpdate={() => {}}
          onDelete={() => {}}
          onGoTo={() => {}}
          gpsPosition={gpsPosition}
        />
      ))}
    </MapContainer>
  );
};

export default MapComponent;