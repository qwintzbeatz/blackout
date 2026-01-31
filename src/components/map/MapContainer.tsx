'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import MarkerLayer from './MarkerLayer';
import DropLayer from './DropLayer';
import UserLocation from './UserLocation';

// Dynamic imports with memory optimization
const MapContainerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface MapContainerProps {
  center: [number, number];
  zoom: number;
  userMarkers: any[];
  drops: any[];
  gpsPosition: [number, number] | null;
  accuracy: number | null;
  isTracking: boolean;
  show50mRadius: boolean;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  onMapCreated?: (map: L.Map) => void;
  onMarkerClick?: (marker: any) => void;
  onDropClick?: (drop: any) => void;
  onUpdateMarker?: (id: string, updates: any) => void;
  onDeleteMarker?: (id: string) => void;
  userRank?: string;
  useDarkTiles?: boolean;
  markerQuality?: 'low' | 'medium' | 'high';
  showOnlyMyDrops?: boolean;
  userId?: string;
}

const MapContainerOptimized: React.FC<MapContainerProps> = ({
  center,
  zoom,
  userMarkers,
  drops,
  gpsPosition,
  accuracy,
  isTracking,
  show50mRadius,
  onMapClick,
  onMapCreated,
  onMarkerClick,
  onDropClick,
  onUpdateMarker,
  onDeleteMarker,
  userRank = 'TOY',
  useDarkTiles = false,
  markerQuality = 'medium',
  showOnlyMyDrops = false,
  userId
}) => {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const clickHandlersRef = useRef<Array<() => void>>([]);

  // Performance limits based on quality
  const markerLimit = markerQuality === 'low' ? 12 : markerQuality === 'medium' ? 25 : 50;
  const dropLimit = markerQuality === 'low' ? 30 : markerQuality === 'medium' ? 75 : 150;

  // Filter and limit markers for performance
  const filteredMarkers = useCallback(() => {
    let filtered = userMarkers.slice(0, markerLimit);
    if (showOnlyMyDrops && userId) {
      filtered = filtered.filter(marker => marker.userId === userId);
    }
    return filtered;
  }, [userMarkers, markerLimit, showOnlyMyDrops, userId]);

  const filteredDrops = useCallback(() => {
    let filtered = drops.slice(0, dropLimit);
    if (showOnlyMyDrops && userId) {
      filtered = filtered.filter(drop => drop.createdBy === userId);
    }
    return filtered;
  }, [drops, dropLimit, showOnlyMyDrops, userId]);

  // Initialize Leaflet with memory cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeLeaflet = async () => {
      try {
        const L = await import('leaflet');
        
        // Fix Leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        
        setMapReady(true);
      } catch (error) {
        console.error('Failed to initialize Leaflet:', error);
      }
    };

    initializeLeaflet();

    return () => {
      // Cleanup any lingering Leaflet instances
      clickHandlersRef.current.forEach(handler => handler());
      clickHandlersRef.current = [];
    };
  }, []);

  // Actually setup the map when ready
  const setupMap = useCallback((mapInstance: L.Map) => {
    mapRef.current = mapInstance;
    
    if (onMapCreated) {
      onMapCreated(mapInstance);
    }

    // Setup map click handler
    if (onMapClick) {
      const handleClick = (e: any) => {
        onMapClick(e.latlng);
      };
      
      mapInstance.on('click', handleClick);
      
      // Store cleanup function
      const cleanup = () => {
        mapInstance.off('click', handleClick);
      };
      clickHandlersRef.current.push(cleanup);
    }

    // Memory optimization: Set max bounds to NZ
    const NZ_BOUNDS: L.LatLngBounds = new L.LatLngBounds([
      [-47.5, 165.0], // Southwest
      [-34.0, 179.0]  // Northeast
    ]);
    
    mapInstance.setMaxBounds(NZ_BOUNDS);
    mapInstance.setMaxZoom(18);
    mapInstance.setMinZoom(4);
  }, [onMapClick, onMapCreated]);

  // Setup map when it becomes available
  useEffect(() => {
    // This effect will wait for the map to be mounted and then set it up
    const interval = setInterval(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      if (mapContainer && !mapRef.current) {
        // The map is ready, find the map instance
        const mapElement = mapContainer.parentElement;
        if (mapElement) {
          // React-leaflet creates a ref internally, we need to access it
          const leafletMap = (mapElement as any)?._leaflet_map;
          if (leafletMap) {
            setupMap(leafletMap);
            clearInterval(interval);
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      clickHandlersRef.current.forEach(handler => handler());
      clickHandlersRef.current = [];
    };
  }, [setupMap]);

  if (!mapReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        backgroundColor: '#1a1a1a',
        color: '#ffffff'
      }}>
        Loading Map...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainerComponent
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Optimized tile layer based on theme */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={useDarkTiles 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          maxZoom={18}
          minZoom={4}
          updateWhenIdle={true}
          updateWhenZooming={false}
          keepBuffer={2}
        />

        {/* User Location Component */}
        {gpsPosition && (
          <UserLocation
            position={gpsPosition}
            accuracy={accuracy}
            isTracking={isTracking}
            show50mRadius={show50mRadius}
          />
        )}

        {/* Marker Layer - Performance optimized */}
        <MarkerLayer
          markers={filteredMarkers()}
          onMarkerClick={onMarkerClick}
          onUpdate={onUpdateMarker}
          onDelete={onDeleteMarker}
          userRank={userRank}
          gpsPosition={gpsPosition}
        />

        {/* Drop Layer - Performance optimized */}
        <DropLayer
          drops={filteredDrops()}
          onDropClick={onDropClick}
          userId={userId}
        />
      </MapContainerComponent>

      {/* Performance indicator */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#ffffff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        zIndex: 1000
      }}>
        Quality: {markerQuality} | Markers: {filteredMarkers().length}/{markerLimit} | Drops: {filteredDrops().length}/{dropLimit}
      </div>

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
        }} />
        {gpsPosition ? 'GPS ACTIVE' : 'GPS INACTIVE'}
      </div>

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

export default MapContainerOptimized;