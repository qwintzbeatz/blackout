'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';

// Dynamic imports for performance
const MarkerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const PopupComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface MarkerData {
  id: string;
  position: [number, number];
  name: string;
  description: string;
  color: string;
  timestamp: Date;
  userId?: string;
  username?: string;
  userProfilePic?: string;
  repEarned?: number;
  distanceFromUser?: number;
}

interface MarkerLayerProps {
  markers: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
  onUpdate?: (id: string, updates: Partial<MarkerData>) => void;
  onDelete?: (id: string) => void;
  userRank?: string;
  gpsPosition?: [number, number] | null;
  markerQuality?: 'low' | 'medium' | 'high';
}

const MarkerLayerOptimized: React.FC<MarkerLayerProps> = ({
  markers,
  onMarkerClick,
  onUpdate,
  onDelete,
  userRank = 'TOY',
  gpsPosition,
  markerQuality = 'medium'
}) => {
  const [customIcon, setCustomIcon] = useState<L.Icon | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  // Create custom marker icon with performance optimization
  useEffect(() => {
    const createIcon = () => {
      if (typeof window === 'undefined') return;

      try {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: #10b981;
              border: 2px solid #ffffff;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                background-color: #ffffff;
                border-radius: 50%;
                width: 8px;
                height: 8px;
              "></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10]
        });
        setCustomIcon(icon as any);
      } catch (error) {
        console.error('Error creating custom icon:', error);
      }
    };

    createIcon();
  }, []);

  // Calculate distance from user for sorting
  const markersWithDistance = useCallback(() => {
    if (!gpsPosition) return markers;

    return markers.map(marker => ({
      ...marker,
      distanceFromUser: calculateDistance(gpsPosition, marker.position)
    })).sort((a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0));
  }, [markers, gpsPosition]);

  // Distance calculation helper
  const calculateDistance = (pos1: [number, number], pos2: [number, number]): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1[0] * Math.PI / 180;
    const φ2 = pos2[0] * Math.PI / 180;
    const Δφ = (pos2[0] - pos1[0]) * Math.PI / 180;
    const Δλ = (pos2[1] - pos1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Handle marker click with performance optimization
  const handleMarkerClick = useCallback((marker: MarkerData) => {
    setActiveMarkerId(marker.id);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  }, [onMarkerClick]);

  // Create dynamic icon based on marker properties
  const createMarkerIcon = useCallback((marker: MarkerData): L.DivIcon => {
    const isOwnMarker = marker.userId === getCurrentUserId();
    const isRecent = Date.now() - marker.timestamp.getTime() < 24 * 60 * 60 * 1000; // Last 24 hours
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${marker.color};
          border: ${isOwnMarker ? '3px' : '2px'} solid ${isRecent ? '#ff6b6b' : '#ffffff'};
          border-radius: 50%;
          width: ${isOwnMarker ? '24px' : '20px'};
          height: ${isOwnMarker ? '24px' : '20px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: ${isRecent ? 'markerPulse 2s infinite' : 'none'};
        ">
          <div style="
            background-color: rgba(255,255,255,0.8);
            border-radius: 50%;
            width: ${isOwnMarker ? '10px' : '8px'};
            height: ${isOwnMarker ? '10px' : '8px'};
          "></div>
          ${isRecent ? '<div style="position: absolute; top: -8px; right: -8px; background: #ff6b6b; color: white; border-radius: 50%; width: 12px; height: 12px; font-size: 8px; display: flex; align-items: center; justify-content: center;">N</div>' : ''}
        </div>
      `,
      iconSize: [isOwnMarker ? 24 : 20, isOwnMarker ? 24 : 20],
      iconAnchor: [isOwnMarker ? 12 : 10, isOwnMarker ? 12 : 10],
      popupAnchor: [0, -20]
    });
  }, []);

  // Get current user ID (this would come from context/auth)
  const getCurrentUserId = (): string => {
    // This should come from auth context
    return '';
  };

  // Performance optimization: Only render visible markers
  const visibleMarkers = markersWithDistance().slice(0, markerQuality === 'low' ? 10 : markerQuality === 'medium' ? 25 : 50);

  if (!customIcon) {
    return null;
  }

  return (
    <>
      {visibleMarkers.map((marker) => (
        <MarkerComponent
          key={marker.id}
          position={marker.position}
          icon={createMarkerIcon(marker)}
          eventHandlers={{
            click: () => handleMarkerClick(marker),
            popupopen: () => setActiveMarkerId(marker.id),
            popupclose: () => setActiveMarkerId(null)
          }}
        >
          <PopupComponent
            maxWidth={200}
            minWidth={150}
            autoPan={true}
            keepInView={true}
          >
            <div style={{
              fontSize: '12px',
              lineHeight: '1.4',
              color: '#333',
              textAlign: 'left'
            }}>
              <div style={{
                fontWeight: 'bold',
                marginBottom: '4px',
                borderBottom: '1px solid #eee',
                paddingBottom: '4px'
              }}>
                {marker.name}
              </div>
              
              <div style={{
                color: '#666',
                marginBottom: '4px'
              }}>
                {marker.description}
              </div>

              {marker.username && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  {marker.userProfilePic && (
                    <img
                      src={marker.userProfilePic}
                      alt={marker.username}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%'
                      }}
                    />
                  )}
                  <span style={{ fontSize: '11px' }}>{marker.username}</span>
                </div>
              )}

              <div style={{
                fontSize: '10px',
                color: '#999',
                marginTop: '6px',
                paddingTop: '4px',
                borderTop: '1px solid #eee'
              }}>
                {marker.distanceFromUser && (
                  <div>Distance: {Math.round(marker.distanceFromUser)}m</div>
                )}
                <div>Placed: {marker.timestamp.toLocaleDateString()}</div>
                {marker.repEarned && (
                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                    +{marker.repEarned} REP
                  </div>
                )}
              </div>

              {marker.userId === getCurrentUserId() && (onUpdate || onDelete) && (
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginTop: '8px'
                }}>
                  {onUpdate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(marker.id, marker);
                      }}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this marker?')) {
                          onDelete(marker.id);
                        }
                      }}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </PopupComponent>
        </MarkerComponent>
      ))}

      <style jsx>{`
        @keyframes markerPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
        }
      `}</style>
    </>
  );
};

export default MarkerLayerOptimized;