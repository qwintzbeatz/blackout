'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { UserMarker, MARKER_NAMES, MARKER_DESCRIPTIONS } from '@/lib/utils/types';
import { createSprayCanIcon } from './SprayCanIcon';

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface UserMarkerComponentProps {
  marker: UserMarker;
  onUpdate: (id: string, updates: Partial<UserMarker>) => void;
  onDelete: (id: string) => void;
  onGoTo: (marker: UserMarker) => void;
  gpsPosition: [number, number] | null;
  userRank: string;
}

const UserMarkerComponent: React.FC<UserMarkerComponentProps> = ({
  marker,
  onUpdate,
  onDelete,
  onGoTo,
  gpsPosition,
  userRank,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(marker.name);
  const [editedDescription, setEditedDescription] = useState(marker.description);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const markerColor = marker.color || '#ff6b6b';

  const sprayIcon = useMemo(() => {
    return createSprayCanIcon(markerColor, 45);
  }, [markerColor]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then(() => {
        const style = document.createElement('style');
        style.textContent = `
          .spray-can-icon {
            background: transparent !important;
          }
          .spray-can-icon svg {
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
        `;
        document.head.appendChild(style);
        setLeafletLoaded(true);
      });
    }
  }, []);

  const distanceToGPS = gpsPosition ? calculateDistance(
    marker.position[0],
    marker.position[1],
    gpsPosition[0],
    gpsPosition[1]
  ) : null;

  const formattedDate = marker.timestamp
    ? new Date(marker.timestamp).toLocaleDateString()
    : 'Unknown date';

  const formattedTime = marker.timestamp
    ? new Date(marker.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Unknown time';

  const handleSave = () => {
    onUpdate(marker.id, {
      name: editedName,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this marker?')) {
      onDelete(marker.id);
    }
  };

  const handleGoTo = () => {
    onGoTo(marker);
  };

  if (!leafletLoaded) {
    return null;
  }

  return (
    <Marker position={marker.position} icon={sprayIcon}>
      <Popup>
        <div style={{ minWidth: '200px' }}>
          {isEditing ? (
            <div>
              <select
                value={editedName}
                onChange={(e) => setEditedName(e.target.value as any)}
                style={{ width: '100%', marginBottom: '8px', padding: '4px' }}
              >
                {MARKER_NAMES.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value as any)}
                style={{ width: '100%', marginBottom: '8px', padding: '4px' }}
              >
                {MARKER_DESCRIPTIONS.map(desc => (
                  <option key={desc} value={desc}>{desc}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={handleSave} style={{ flex: 1, padding: '5px' }}>Save</button>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '5px' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: markerColor }}>{marker.name}</h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{marker.description}</p>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                <div>Placed: {formattedDate} at {formattedTime}</div>
                {marker.username && <div>By: {marker.username}</div>}
                {distanceToGPS !== null && gpsPosition && (
                  <div>Distance: {distanceToGPS.toFixed(2)} km</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button onClick={() => setIsEditing(true)} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>Edit</button>
                <button onClick={handleGoTo} style={{ flex: 1, padding: '6px', fontSize: '12px' }}>Go To</button>
                <button onClick={handleDelete} style={{ flex: 1, padding: '6px', fontSize: '12px', backgroundColor: '#ff4444', color: 'white', border: 'none' }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default UserMarkerComponent;
