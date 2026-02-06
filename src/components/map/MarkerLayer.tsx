'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import { createSprayCanIcon } from '@/components/map/SprayCanIcon';

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
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  // Add global styles for spray can icons
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const style = document.createElement('style');
    style.id = 'spray-can-icon-styles';
    style.textContent = `
      .spray-can-icon {
        background: transparent !important;
        border: none !important;
      }
      .spray-can-icon svg {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        display: block !important;
      }
      .leaflet-div-icon {
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      const existing = document.getElementById('spray-can-icon-styles');
      if (existing) existing.remove();
    };
  }, []);

  // Calculate distance from user for sorting
  const markersWithDistance = useCallback(() => {
    if (!gpsPosition) return markers;
    return markers.map(marker => ({
      ...marker,
      distanceFromUser: calculateDistance(gpsPosition, marker.position)
    })).sort((a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0));
  }, [markers, gpsPosition]);

  const calculateDistance = (pos1: [number, number], pos2: [number, number]): number => {
    const R = 6371e3;
    const φ1 = pos1[0] * Math.PI / 180;
    const φ2 = pos2[0] * Math.PI / 180;
    const Δφ = (pos2[0] - pos1[0]) * Math.PI / 180;
    const Δλ = (pos2[1] - pos1[1]) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleMarkerClick = useCallback((marker: MarkerData) => {
    setActiveMarkerId(marker.id);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  }, [onMarkerClick]);

  const getCurrentUserId = (): string => '';

  // Create spray can icon for each marker
  const createMarkerIcon = useCallback((marker: MarkerData): L.DivIcon => {
    const markerColor = marker.color || '#ff6b6b';
    return createSprayCanIcon(markerColor, 45);
  }, []);

  const visibleMarkers = markersWithDistance().slice(0, markerQuality === 'low' ? 10 : markerQuality === 'medium' ? 25 : 50);

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
          <PopupComponent maxWidth={300} minWidth={200} autoPan={true} keepInView={true}>
            <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#333', textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: `2px solid ${marker.color || '#10b981'}`, paddingBottom: '6px' }}>
                {marker.name}
              </div>
              <div style={{ color: '#666', marginBottom: '8px', fontSize: '13px' }}>{marker.description}</div>
              {marker.username && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {marker.userProfilePic && (
                    <img src={marker.userProfilePic} alt={marker.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  )}
                  <span style={{ fontSize: '12px', color: '#888' }}>by {marker.username}</span>
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#999', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                {marker.distanceFromUser && <div style={{ marginBottom: '4px' }}>📍 {Math.round(marker.distanceFromUser)}m away</div>}
                <div>📅 {marker.timestamp.toLocaleDateString()}</div>
                {marker.repEarned && <div style={{ color: '#10b981', fontWeight: 'bold', marginTop: '4px' }}>+{marker.repEarned} REP</div>}
              </div>
              {marker.userId === getCurrentUserId() && (onUpdate || onDelete) && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                  {onUpdate && (
                    <button onClick={(e) => { e.stopPropagation(); onUpdate(marker.id, marker); }} style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                  )}
                  {onDelete && (
                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this marker?')) onDelete(marker.id); }} style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  )}
                </div>
              )}
            </div>
          </PopupComponent>
        </MarkerComponent>
      ))}
    </>
  );
};

export default MarkerLayerOptimized;
