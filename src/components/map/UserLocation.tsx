'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';

// Dynamic imports for performance
const CircleComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);
const MarkerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const PopupComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface UserLocationProps {
  position: [number, number];
  accuracy: number | null;
  isTracking: boolean;
  show50mRadius: boolean;
  showExpandedRadius?: boolean;
  expandedRadius?: number;
  userSpeed?: number | null;
  userHeading?: number | null;
}

const UserLocationOptimized: React.FC<UserLocationProps> = ({
  position,
  accuracy,
  isTracking,
  show50mRadius,
  showExpandedRadius = false,
  expandedRadius = 50,
  userSpeed,
  userHeading
}) => {
  const [locationIcon, setLocationIcon] = useState<L.DivIcon | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Create custom GPS marker icon
  useEffect(() => {
    const createLocationIcon = () => {
      if (typeof window === 'undefined') return;

      try {
        const icon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <!-- Outer ring with animation -->
              <div style="
                position: absolute;
                width: 40px;
                height: 40px;
                border: 3px solid ${isTracking ? '#2196F3' : '#9E9E9E'};
                border-radius: 50%;
                animation: ${isTracking ? 'locationPulse 2s infinite' : 'none'};
                opacity: ${isTracking ? '0.6' : '0.3'};
              "></div>
              
              <!-- Inner solid circle -->
              <div style="
                width: 16px;
                height: 16px;
                background-color: ${isTracking ? '#2196F3' : '#9E9E9E'};
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                z-index: 2;
                position: relative;
              ">
                <!-- Direction indicator if moving -->
                ${userSpeed && userSpeed > 0 ? `
                  <div style="
                    position: absolute;
                    top: -6px;
                    left: 50%;
                    transform: translateX(-50%) rotate(${userHeading || 0}deg);
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-bottom: 8px solid ${isTracking ? '#2196F3' : '#9E9E9E'};
                  "></div>
                ` : ''}
              </div>
              
              <!-- Center dot -->
              <div style="
                position: absolute;
                width: 4px;
                height: 4px;
                background-color: #ffffff;
                border-radius: 50%;
                z-index: 3;
              "></div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });
        setLocationIcon(icon);
      } catch (error) {
        console.error('Error creating location icon:', error);
      }
    };

    createLocationIcon();
    setLastUpdate(new Date());
  }, [isTracking, userSpeed, userHeading]);

  // Update last update time
  useEffect(() => {
    if (position) {
      setLastUpdate(new Date());
    }
  }, [position]);

  // Get GPS status text
  const getGpsStatusText = useCallback(() => {
    if (!isTracking) return 'GPS Inactive';
    if (!accuracy) return 'GPS Active (Accuracy Unknown)';
    if (accuracy <= 10) return 'GPS Active (Excellent)';
    if (accuracy <= 25) return 'GPS Active (Good)';
    if (accuracy <= 50) return 'GPS Active (Fair)';
    return 'GPS Active (Poor)';
  }, [isTracking, accuracy]);

  // Format speed
  const formatSpeed = useCallback(() => {
    if (!userSpeed || userSpeed === 0) return null;
    return `${(userSpeed * 3.6).toFixed(1)} km/h`;
  }, [userSpeed]);

  // Format heading
  const formatHeading = useCallback(() => {
    if (userHeading === null || userHeading === undefined) return null;
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(userHeading / 45) % 8;
    return `${directions[index]} (${Math.round(userHeading)}°)`;
  }, [userHeading]);

  if (!locationIcon) {
    return null;
  }

  return (
    <>
      {/* User location marker */}
      <MarkerComponent
        position={position}
        icon={locationIcon}
        zIndexOffset={1000}
      >
        <PopupComponent
          maxWidth={200}
          minWidth={150}
          autoPan={true}
        >
          <div style={{
            fontSize: '11px',
            lineHeight: '1.4',
            color: '#333',
            textAlign: 'left'
          }}>
            <div style={{
              fontWeight: 'bold',
              marginBottom: '6px',
              paddingBottom: '4px',
              borderBottom: '1px solid #eee',
              color: isTracking ? '#2196F3' : '#666'
            }}>
              📍 Your Location
            </div>
            
            <div style={{ marginBottom: '4px' }}>
              <strong>Status:</strong> {getGpsStatusText()}
            </div>
            
            {accuracy && (
              <div style={{ marginBottom: '4px' }}>
                <strong>Accuracy:</strong> ±{Math.round(accuracy)}m
              </div>
            )}
            
            {formatSpeed() && (
              <div style={{ marginBottom: '4px' }}>
                <strong>Speed:</strong> {formatSpeed()}
              </div>
            )}
            
            {formatHeading() && (
              <div style={{ marginBottom: '4px' }}>
                <strong>Heading:</strong> {formatHeading()}
              </div>
            )}
            
            <div style={{
              fontSize: '10px',
              color: '#666',
              marginTop: '6px',
              paddingTop: '4px',
              borderTop: '1px solid #eee'
            }}>
              Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </PopupComponent>
      </MarkerComponent>

      {/* 50m radius circle */}
      {show50mRadius && (
        <CircleComponent
          center={position}
          radius={50}
          pathOptions={{
            color: '#2196F3',
            fillColor: '#2196F3',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.8,
            dashArray: '5, 5'
          }}
        />
      )}

      {/* Expanded radius circle for crew detection */}
      {showExpandedRadius && expandedRadius > 50 && (
        <CircleComponent
          center={position}
          radius={expandedRadius}
          pathOptions={{
            color: '#FF9800',
            fillColor: '#FF9800',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.6,
            dashArray: '10, 10'
          }}
        />
      )}

      {/* Accuracy circle */}
      {accuracy && accuracy > 10 && (
        <CircleComponent
          center={position}
          radius={accuracy}
          pathOptions={{
            color: '#FFC107',
            fillColor: '#FFC107',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.5,
            dashArray: '3, 3'
          }}
        />
      )}

      <style jsx>{`
        @keyframes locationPulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
        }

        .user-location-marker {
          background: transparent !important;
          border: none !important;
        }

        .leaflet-marker-icon {
          margin-left: 0 !important;
          margin-top: 0 !important;
        }
      `}</style>
    </>
  );
};

export default UserLocationOptimized;