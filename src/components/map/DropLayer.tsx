'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useMemo } from 'react';
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

interface Drop {
  id: string;
  firestoreId?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  trackUrl?: string;
  createdBy: string;
  timestamp: Date;
  likes: string[];
  username: string;
  userProfilePic: string;
}

interface DropLayerProps {
  drops: Drop[];
  onDropClick?: (drop: Drop) => void;
  userId?: string;
  markerQuality?: 'low' | 'medium' | 'high';
}

const DropLayerOptimized: React.FC<DropLayerProps> = ({
  drops,
  onDropClick,
  userId,
  markerQuality = 'medium'
}) => {
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [likedDrops, setLikedDrops] = useState<Set<string>>(new Set());

  // Performance limits based on quality
  const dropLimit = markerQuality === 'low' ? 15 : markerQuality === 'medium' ? 40 : 100;

  // Filter drops by performance and user preferences
  const filteredDrops = useMemo(() => {
    return drops.slice(0, dropLimit);
  }, [drops, dropLimit]);

  // Create drop icon based on content type
  const createDropIcon = useCallback((drop: Drop): L.DivIcon => {
    const hasPhoto = !!drop.photoUrl;
    const hasMusic = !!drop.trackUrl;
    const isLiked = likedDrops.has(drop.id);
    const isOwnDrop = drop.createdBy === userId;

    let iconContent = '';
    let bgColor = '#6366f1'; // Default indigo

    if (hasPhoto && hasMusic) {
      iconContent = '🎵📷';
      bgColor = '#8b5cf6'; // Purple
    } else if (hasPhoto) {
      iconContent = '📷';
      bgColor = '#10b981'; // Green
    } else if (hasMusic) {
      iconContent = '🎵';
      bgColor = '#f59e0b'; // Amber
    } else {
      iconContent = '💧';
      bgColor = '#6366f1'; // Indigo
    }

    if (isLiked) {
      bgColor = '#ef4444'; // Red if liked
    }

    return L.divIcon({
      className: 'custom-drop-marker',
      html: `
        <div style="
          background-color: ${bgColor};
          border: ${isOwnDrop ? '3px' : '2px'} solid #ffffff;
          border-radius: 50%;
          width: ${isOwnDrop ? '26px' : '22px'};
          height: ${isOwnDrop ? '26px' : '22px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: ${isOwnDrop ? '12px' : '10px'};
          animation: ${isLiked ? 'dropPulse 2s infinite' : 'none'};
        ">
          ${iconContent}
          ${isLiked ? '<div style="position: absolute; top: -6px; right: -6px; background: #ef4444; color: white; border-radius: 50%; width: 14px; height: 14px; font-size: 9px; display: flex; align-items: center; justify-content: center;">❤️</div>' : ''}
        </div>
      `,
      iconSize: [isOwnDrop ? 26 : 22, isOwnDrop ? 26 : 22],
      iconAnchor: [isOwnDrop ? 13 : 11, isOwnDrop ? 13 : 11],
      popupAnchor: [0, -25]
    });
  }, [likedDrops, userId]);

  // Handle drop interaction
  const handleDropClick = useCallback((drop: Drop) => {
    setActiveDropId(drop.id);
    if (onDropClick) {
      onDropClick(drop);
    }
  }, [onDropClick]);

  // Like/Unlike drop
  const toggleLike = useCallback(async (drop: Drop, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newLikedDrops = new Set(likedDrops);
    if (likedDrops.has(drop.id)) {
      newLikedDrops.delete(drop.id);
    } else {
      newLikedDrops.add(drop.id);
    }
    setLikedDrops(newLikedDrops);

    // Here you would also update the backend
    // await updateDropLikes(drop.id, newLikedDrops.has(drop.id));
  }, [likedDrops]);

  // Format timestamp
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (filteredDrops.length === 0) {
    return null;
  }

  return (
    <>
      {filteredDrops.map((drop) => (
        <MarkerComponent
          key={drop.id}
          position={[drop.lat, drop.lng]}
          icon={createDropIcon(drop)}
          eventHandlers={{
            click: () => handleDropClick(drop),
            popupopen: () => setActiveDropId(drop.id),
            popupclose: () => setActiveDropId(null)
          }}
        >
          <PopupComponent
            maxWidth={250}
            minWidth={200}
            autoPan={true}
            keepInView={true}
          >
            <div style={{
              fontSize: '12px',
              lineHeight: '1.4',
              color: '#333',
              textAlign: 'left',
              minWidth: '180px'
            }}>
              {/* Header with user info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                paddingBottom: '6px',
                borderBottom: '1px solid #eee'
              }}>
                {drop.userProfilePic && (
                  <img
                    src={drop.userProfilePic}
                    alt={drop.username}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: '1px solid #ddd'
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px' }}>
                    {drop.username}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    {formatTimeAgo(drop.timestamp)}
                  </div>
                </div>
              </div>

              {/* Media content */}
              {drop.photoUrl && (
                <div style={{ marginBottom: '8px' }}>
                  <img
                    src={drop.photoUrl}
                    alt="Drop photo"
                    style={{
                      width: '100%',
                      maxHeight: '120px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(drop.photoUrl, '_blank');
                    }}
                  />
                </div>
              )}

              {drop.trackUrl && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(drop.trackUrl, '_blank');
                  }}>
                    🎵 Listen to Track
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid #eee'
              }}>
                <button
                  onClick={(e) => toggleLike(drop, e)}
                  style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    backgroundColor: likedDrops.has(drop.id) ? '#ef4444' : '#f3f4f6',
                    color: likedDrops.has(drop.id) ? 'white' : '#333',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {likedDrops.has(drop.id) ? '❤️' : '🤍'} {drop.likes.length}
                </button>

                {drop.createdBy === userId && (
                  <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                    Your Drop
                  </div>
                )}
              </div>
            </div>
          </PopupComponent>
        </MarkerComponent>
      ))}

      <style jsx>{`
        @keyframes dropPulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .custom-drop-marker {
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

export default DropLayerOptimized;