'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { UserMarker } from '@/lib/utils/types';

// Dynamically import Leaflet components
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
  const [editedTitle, setEditedTitle] = useState(marker.title || '');
  const [editedDescription, setEditedDescription] = useState(marker.description || '');
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Initialize Leaflet only on client side
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
        setLeafletLoaded(true);
      });
    }
  }, []);

  // Calculate distance to GPS if available
  const distanceToGPS = gpsPosition ? calculateDistance(
    marker.position[0],
    marker.position[1],
    gpsPosition[0],
    gpsPosition[1]
  ) : null;

  // Format date
  const formattedDate = marker.createdAt
    ? new Date(marker.createdAt).toLocaleDateString()
    : 'Unknown date';

  const formattedTime = marker.createdAt
    ? new Date(marker.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Unknown time';

  const handleSave = () => {
    onUpdate(marker.id, {
      title: editedTitle,
      description: editedDescription,
      updatedAt: new Date(),
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

  // Don't render until Leaflet is loaded
  if (!leafletLoaded) {
    return null;
  }

  return (
    <Marker 
      position={marker.position}
      eventHandlers={{
        click: () => {
          console.log('Marker clicked:', marker.id);
        }
      }}
    >
      <Popup>
        <div style={{ minWidth: '200px' }}>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Marker title"
                style={{ width: '100%', marginBottom: '8px', padding: '4px' }}
              />
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Description"
                style={{ width: '100%', marginBottom: '8px', padding: '4px', minHeight: '60px' }}
              />
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={handleSave} style={{ flex: 1, padding: '5px' }}>
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '5px' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 10px 0' }}>
                {marker.title || 'Untitled Marker'}
              </h3>
              
              {marker.description && (
                <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                  {marker.description}
                </p>
              )}
              
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                <div>Placed on: {formattedDate} at {formattedTime}</div>
                {marker.username && (
                  <div>By: {marker.username}</div>
                )}
                {distanceToGPS !== null && gpsPosition && (
                  <div>Distance: {distanceToGPS.toFixed(2)} km</div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setIsEditing(true)}
                  style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                >
                  Edit
                </button>
                <button 
                  onClick={handleGoTo}
                  style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                >
                  Go To
                </button>
                <button 
                  onClick={handleDelete}
                  style={{ 
                    flex: 1, 
                    padding: '6px', 
                    fontSize: '12px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

// Helper function to calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default UserMarkerComponent;