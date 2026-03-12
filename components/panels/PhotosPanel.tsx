import React from 'react';
import { UserMarker, Drop, UserProfile } from '@/lib/types/blackout';

interface PhotosPanelProps {
  user: any;
  userProfile: UserProfile | null;
  drops: Drop[];
  gpsPosition: [number, number] | null;
  mapRef: React.RefObject<any>;
  panelStyle: React.CSSProperties;
  togglePanel: (panel: 'profile' | 'photos' | 'messages' | 'map' | 'music' | 'story' | 'crewchat' | 'none') => void;
  handleProfilePicUpload: (file: File) => Promise<void>;
  setPendingDropPosition: (position: { lat: number; lng: number } | null) => void;
  setShowPhotoModal: (show: boolean) => void;
  setSelectedPhotoDrop: (drop: Drop | null) => void;
  handleRefreshAll: () => void;
}

const PhotosPanel: React.FC<PhotosPanelProps> = ({
  user,
  userProfile,
  drops,
  gpsPosition,
  mapRef,
  panelStyle,
  togglePanel,
  handleProfilePicUpload,
  setPendingDropPosition,
  setShowPhotoModal,
  setSelectedPhotoDrop,
  handleRefreshAll
}) => {
  // Get user's photo drops
  const myPhotoDrops = drops.filter(drop => drop.photoUrl && drop.createdBy === user?.uid);
  const totalPhotosTaken = userProfile?.photosTaken || myPhotoDrops.length;

  return (
    <div style={{
      ...panelStyle,
      border: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.3s ease-out',
      position: 'relative' as const,
      maxWidth: '350px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(59,130,246,0.3)'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#4dabf7', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📸</span>
          PHOTO GALLERY
        </h3>
        <button
          onClick={() => togglePanel('none')}
          style={{
            background: 'rgba(59,130,246,0.2)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#4dabf7',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Upload Section - Profile Picture */}
      <div style={{
        marginBottom: '15px',
        padding: '12px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ fontSize: '14px', color: '#4dabf7', fontWeight: 'bold', marginBottom: '8px' }}>
          📤 Upload Profile Picture
        </div>
        <input
          type="file"
          accept="image/*"
          id="profilepic-upload"
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px dashed #4dabf7',
            borderRadius: '6px',
            color: '#e0e0e0',
            marginBottom: '8px',
            fontSize: '12px'
          }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleProfilePicUpload(file);
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.getElementById('profilepic-upload') as HTMLInputElement;
            if (input?.files?.[0]) {
              handleProfilePicUpload(input.files[0]);
            } else {
              alert('Please select an image first!');
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 'bold',
            fontSize: '12px'
          }}
        >
          📲 Update Profile Pic
        </button>
      </div>

      {/* Photo Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        marginBottom: '15px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #444'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7' }}>{totalPhotosTaken}</div>
          <div style={{ fontSize: '10px', color: '#aaa' }}>Photos Taken</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid #444'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{myPhotoDrops.length}</div>
          <div style={{ fontSize: '10px', color: '#aaa' }}>Photo Drops</div>
        </div>
      </div>

      {/* Gallery Section */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          fontSize: '14px',
          color: '#10b981',
          fontWeight: 'bold',
          marginBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>🖼️ Your Photos</span>
          <span style={{ fontSize: '11px', color: '#aaa' }}>
            {myPhotoDrops.length} total
          </span>
        </div>
        
        {myPhotoDrops.length === 0 ? (
          /* Empty State */
          <div style={{
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px',
            border: '1px dashed #444'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📸</div>
            <div style={{ color: '#aaa', marginBottom: '10px', fontSize: '13px' }}>
              No photos yet
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Tap on the map to place a photo drop!
            </div>
          </div>
        ) : (
          /* Photo Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {myPhotoDrops.slice(0, 12).map((drop, index) => (
              <div
                key={drop.id || drop.firestoreId || index}
                onClick={() => {
                  setSelectedPhotoDrop(drop);
                  togglePanel('none');
                  if (mapRef.current) {
                    mapRef.current.setView([drop.lat, drop.lng], 17);
                  }
                }}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid #444'
                }}
              >
                <img
                  src={drop.photoUrl}
                  alt={`Photo ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                {drop.likes && drop.likes.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#ef4444',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: 'bold'
                  }}>
                    ❤️ {drop.likes.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          fontSize: '14px',
          color: '#fbbf24',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          📱 Camera
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              // Open photo selection modal for dropping
              if (!gpsPosition) {
                alert('GPS location not available. Please enable location services.');
                return;
              }
              setPendingDropPosition({ lat: gpsPosition[0], lng: gpsPosition[1] });
              setShowPhotoModal(true);
              togglePanel('none');
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              border: '1px solid #10b981',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 'bold'
            }}
          >
            <span style={{ fontSize: '18px' }}>📸</span>
            Take / Upload Photo
          </button>
          
          <button
            onClick={() => {
              // Browse all photo drops on map
              const allPhotoDrops = drops.filter(d => d.photoUrl);
              if (allPhotoDrops.length === 0) {
                alert('No photo drops found on the map yet!');
                return;
              }
              if (mapRef.current && allPhotoDrops.length > 0) {
                const bounds = allPhotoDrops.map(d => [d.lat, d.lng] as [number, number]);
                const minLat = Math.min(...bounds.map(b => b[0]));
                const maxLat = Math.max(...bounds.map(b => b[0]));
                const minLng = Math.min(...bounds.map(b => b[1]));
                const maxLng = Math.max(...bounds.map(b => b[1]));
                mapRef.current.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [50, 50] });
              }
              togglePanel('none');
            }}
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              border: '1px solid #8b5cf6',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '18px' }}>🗺️</span>
            View All Photo Drops
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ paddingTop: '10px', borderTop: '1px solid #444' }}>
        <div style={{
          fontSize: '12px',
          color: '#ec4899',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          ⚡ Quick Actions
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <button
            onClick={() => {
              const photoCount = myPhotoDrops.length;
              if (photoCount === 0) {
                alert('You have no photos to share yet!');
                return;
              }
              // Copy shareable text to clipboard
              const shareText = `Check out my ${photoCount} photo${photoCount > 1 ? 's' : ''} on Blackout NZ! 📸`;
              navigator.clipboard?.writeText(shareText);
              alert('Share link copied to clipboard!');
            }}
            style={{
              background: 'rgba(236, 72, 153, 0.1)',
              color: '#ec4899',
              border: '1px solid #ec4899',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            🔗 Share
          </button>
          
          <button
            onClick={handleRefreshAll}
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              border: '1px solid #10b981',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotosPanel;