'use client';

import { useState, useEffect, useMemo } from 'react';
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
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface GPSMarkerProps {
  position: [number, number];
  accuracy: number | null;
  isTracking: boolean;
  show50mRadius: boolean;
}

// Helper function to calculate distance in meters between two lat/lng points
const getDestinationPoint = (lat: number, lng: number, distanceMeters: number, bearing: number): [number, number] => {
  const R = 6371000; // Earth's radius in meters
  const bearingRad = (bearing * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  
  const angularDist = distanceMeters / R;
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDist) +
    Math.cos(latRad) * Math.sin(angularDist) * Math.cos(bearingRad)
  );
  const newLngRad = lngRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDist) * Math.cos(latRad),
    Math.cos(angularDist) - Math.sin(latRad) * Math.sin(newLatRad)
  );
  
  return [(newLatRad * 180) / Math.PI, (newLngRad * 180) / Math.PI];
};

// Helper to create a circle as a polygon (for grid pattern)
const getCirclePoints = (center: [number, number], radiusMeters: number, numPoints: number = 64): [number, number][] => {
  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const bearing = (i * 360) / numPoints;
    points.push(getDestinationPoint(center[0], center[1], radiusMeters, bearing));
  }
  return points;
};

const GPSMarker: React.FC<GPSMarkerProps> = ({
  position,
  accuracy,
  isTracking,
  show50mRadius
}) => {
  const [icon, setIcon] = useState<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Colors based on online/offline status
  const gridColor = isTracking ? '#10b981' : '#ef4444'; // green when online, red when offline
  const gridFillOpacity = isTracking ? 0.08 : 0.12;
  const gridOpacity = isTracking ? 0.6 : 0.7;

  // Generate grid concentric circles (every 10m)
  const concentricRadii = useMemo(() => [10, 20, 30, 40, 50], []);
  
  // Generate radial lines (every 30 degrees = 12 lines)
  const radialLines = useMemo(() => {
    const lines: [number, number][][] = [];
    for (let angle = 0; angle < 360; angle += 30) {
      const endPoint = getDestinationPoint(position[0], position[1], 50, angle);
      lines.push([position, endPoint]);
    }
    return lines;
  }, [position]);

  // Generate grid points for square pattern
  const gridLines = useMemo(() => {
    const lines: [number, number][][] = [];
    const gridSize = 10; // 10m grid spacing
    const numLines = Math.ceil(50 / gridSize);
    
    // Generate vertical and horizontal grid lines within the circle
    for (let i = -numLines; i <= numLines; i++) {
      // Vertical lines
      const offset = i * gridSize;
      const halfWidth = Math.sqrt(Math.max(0, 50 * 50 - offset * offset));
      if (halfWidth > 0) {
        const topPoint = getDestinationPoint(position[0], position[1], offset, 0);
        const actualTop = getDestinationPoint(topPoint[0], topPoint[1], halfWidth, 90);
        const actualBottom = getDestinationPoint(topPoint[0], topPoint[1], halfWidth, 270);
        
        // Recalculate properly - offset is east-west
        const centerOfLine = getDestinationPoint(position[0], position[1], Math.abs(offset), offset >= 0 ? 90 : 270);
        const top = getDestinationPoint(centerOfLine[0], centerOfLine[1], halfWidth, 0);
        const bottom = getDestinationPoint(centerOfLine[0], centerOfLine[1], halfWidth, 180);
        lines.push([top, bottom]);
      }
      
      // Horizontal lines
      const centerOfHLine = getDestinationPoint(position[0], position[1], Math.abs(offset), offset >= 0 ? 0 : 180);
      const halfWidthH = Math.sqrt(Math.max(0, 50 * 50 - offset * offset));
      if (halfWidthH > 0) {
        const left = getDestinationPoint(centerOfHLine[0], centerOfHLine[1], halfWidthH, 270);
        const right = getDestinationPoint(centerOfHLine[0], centerOfHLine[1], halfWidthH, 90);
        lines.push([left, right]);
      }
    }
    
    return lines;
  }, [position]);

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
        setLeafletLoaded(true);
      });
    }
  }, []);

  if (!icon || !leafletLoaded) return null;

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

      {/* 50-meter radius GRID pattern - Green when online, Red when offline */}
      {show50mRadius && (
        <>
          {/* Background circle with fill */}
          <Circle
            center={position}
            radius={50}
            pathOptions={{
              color: gridColor,
              fillColor: gridColor,
              fillOpacity: gridFillOpacity,
              weight: 2,
              opacity: gridOpacity,
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
                <strong style={{ color: gridColor }}>
                  {isTracking ? '🟢 50m Radius (Online)' : '🔴 50m Radius (Offline)'}
                </strong>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {isTracking ? 'GPS tracking active' : 'GPS tracking paused'}
                  <br />
                  Click map to place markers
                </div>
              </div>
            </Popup>
          </Circle>

          {/* Concentric circles for grid effect */}
          {concentricRadii.map((radius, index) => (
            <Circle
              key={`concentric-${index}`}
              center={position}
              radius={radius}
              pathOptions={{
                color: gridColor,
                fillColor: 'transparent',
                fillOpacity: 0,
                weight: 1,
                opacity: gridOpacity * 0.6,
              }}
              interactive={false}
            />
          ))}

          {/* Radial lines for grid effect */}
          {radialLines.map((line, index) => (
            <Polyline
              key={`radial-${index}`}
              positions={line}
              pathOptions={{
                color: gridColor,
                weight: 1,
                opacity: gridOpacity * 0.5,
              }}
              interactive={false}
            />
          ))}
        </>
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