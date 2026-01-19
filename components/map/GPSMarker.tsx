'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

interface GPSMarkerProps {
  position: [number, number];
  accuracy: number | null;
  isTracking: boolean;
  show50mRadius: boolean;
}

const GPSMarker: React.FC<GPSMarkerProps> = ({
  position,
  accuracy,
  isTracking,
  show50mRadius
}) => {
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const customIcon = new L.Icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        setIcon(customIcon);
      });
    }
  }, []);

  if (!icon) return null;

  return (
    <>
      <Marker position={position} icon={icon}>
        <Popup>
          <div style={{ textAlign: 'center', minWidth: '200px' }}>
            <strong>📍 Your Location</strong>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              <div>Lat: {position[0].toFixed(6)}</div>
              <div>Lng: {position[1].toFixed(6)}</div>
              {accuracy && <div>GPS Accuracy: ~{Math.round(accuracy)}m</div>}
              <div>50m Radius: {show50mRadius ? 'Visible' : 'Hidden'}</div>
              <div style={{ 
                color: isTracking ? '#10b981' : '#f59e0b', 
                marginTop: '5px',
                fontWeight: 'bold'
              }}>
                {isTracking ? '✅ Live GPS Tracking Active' : '⚠️ GPS not actively tracking'}
              </div>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* 50-meter radius circle - Keep interactive but with custom click handling */}
      {show50mRadius && (
        <Circle
          center={position}
          radius={50}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.5,
          }}
          eventHandlers={{
            // Allow right-click for popup, but pass through left-click
            click: (e) => {
              // Only show popup on right-click or long press
              if (e.originalEvent.button === 2 || e.originalEvent.ctrlKey) {
                // Right click or ctrl+click opens popup
                return;
              }
              // For left-click, let it pass through to the map
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();
            },
            contextmenu: (e) => {
              // Allow right-click context menu for the popup
              e.originalEvent.stopPropagation();
            }
          }}
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong>📏 50-Meter Radius</strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Click anywhere on the map to place markers<br />
                Right-click on circle for info
              </div>
            </div>
          </Popup>
        </Circle>
      )}

      {/* GPS Accuracy Circle */}
      {accuracy && accuracy > 50 && (
        <Circle
          center={position}
          radius={accuracy}
          pathOptions={{
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.05,
            weight: 1,
            opacity: 0.3,
            dashArray: '5, 5'
          }}
          eventHandlers={{
            click: (e) => {
              if (e.originalEvent.button === 2 || e.originalEvent.ctrlKey) {
                return;
              }
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();
            },
            contextmenu: (e) => {
              e.originalEvent.stopPropagation();
            }
          }}
        >
          <Popup>
            <div style={{ textAlign: 'center' }}>
              <strong>🎯 GPS Accuracy</strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Your location is accurate to ~{Math.round(accuracy)} meters
              </div>
            </div>
          </Popup>
        </Circle>
      )}
    </>
  );
};

export default GPSMarker;