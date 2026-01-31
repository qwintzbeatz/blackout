'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';

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

interface PhotosPanelProps {
  drops: Drop[];
  userId?: string;
  showOnlyMyDrops: boolean;
  onDropClick: (drop: Drop) => void;
  onClose: () => void;
}

// Optimized panel styling
const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: '#e0e0e0',
  padding: '20px',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  width: 'min(95vw, 500px)',
  maxHeight: '85vh',
  overflowY: 'auto' as const,
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(12px)',
  zIndex: 1400,
  position: 'relative' as const
};

const PhotosPanelOptimized: React.FC<PhotosPanelProps> = ({
  drops,
  userId,
  showOnlyMyDrops,
  onDropClick,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'grid'>('gallery');
  const [selectedPhoto, setSelectedPhoto] = useState<Drop | null>(null);
  const [likedDrops, setLikedDrops] = useState<Set<string>>(new Set());

  // Filter drops with photos
  const photoDrops = useMemo(() => {
    let filtered = drops.filter(drop => drop.photoUrl);
    
    if (showOnlyMyDrops && userId) {
      filtered = filtered.filter(drop => drop.createdBy === userId);
    }
    
    // Sort by most recent
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [drops, showOnlyMyDrops, userId]);

  // Statistics
  const stats = useMemo(() => {
    const totalPhotos = drops.filter(drop => drop.photoUrl).length;
    const myPhotos = userId ? drops.filter(drop => drop.photoUrl && drop.createdBy === userId).length : 0;
    const totalLikes = drops.filter(drop => drop.photoUrl).reduce((sum, drop) => sum + drop.likes.length, 0);
    
    return { totalPhotos, myPhotos, totalLikes };
  }, [drops, userId]);

  // Format time ago
  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  // Handle photo click
  const handlePhotoClick = useCallback((drop: Drop) => {
    setSelectedPhoto(drop);
    onDropClick(drop);
  }, [onDropClick]);

  // Handle like toggle
  const handleLikeToggle = useCallback((drop: Drop, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newLikedDrops = new Set(likedDrops);
    if (likedDrops.has(drop.id)) {
      newLikedDrops.delete(drop.id);
    } else {
      newLikedDrops.add(drop.id);
    }
    setLikedDrops(newLikedDrops);
  }, [likedDrops]);

  // Close selected photo
  const handleCloseSelectedPhoto = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) {
          handleCloseSelectedPhoto();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPhoto, onClose, handleCloseSelectedPhoto]);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          📸 Photos
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ✕
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {stats.totalPhotos}
          </div>
          <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Total Photos</div>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {stats.myPhotos}
          </div>
          <div style={{ fontSize: '11px', color: '#b0b0b0' }}>My Photos</div>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {stats.totalLikes}
          </div>
          <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Total Likes</div>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '8px'
      }}>
        {(['gallery', 'grid'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveTab(view)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === view ? '#ff6b35' : 'transparent',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: activeTab === view ? 'bold' : 'normal'
            }}
          >
            {view === 'gallery' ? '🖼️ Gallery' : '⚏️ Grid'}
          </button>
        ))}
      </div>

      {/* Content */}
      {photoDrops.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#b0b0b0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
          <div style={{ fontSize: '16px', marginBottom: '4px' }}>
            No photos yet
          </div>
          <div style={{ fontSize: '12px' }}>
            {showOnlyMyDrops ? 'You haven\'t posted any photos yet' : 'No photo drops found'}
          </div>
        </div>
      ) : (
        <>
          {/* Gallery View */}
          {activeTab === 'gallery' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {photoDrops.map((drop) => (
                <div
                  key={drop.id}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => handlePhotoClick(drop)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img
                    src={drop.photoUrl}
                    alt="Drop photo"
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  
                  <div style={{ padding: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <img
                        src={drop.userProfilePic}
                        alt={drop.username}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#ffffff'
                        }}>
                          {drop.username}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: '#b0b0b0'
                        }}>
                          {formatTimeAgo(drop.timestamp)}
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleLikeToggle(drop, e)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: likedDrops.has(drop.id) ? '#ff6b35' : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {likedDrops.has(drop.id) ? '❤️' : '🤍'} {drop.likes.length}
                      </button>
                    </div>
                    
                    {drop.trackUrl && (
                      <div style={{
                        backgroundColor: 'rgba(103, 126, 234, 0.2)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#677eea',
                        display: 'inline-block'
                      }}>
                        🎵 Music track included
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid View */}
          {activeTab === 'grid' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '8px'
            }}>
              {photoDrops.map((drop) => (
                <div
                  key={drop.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onClick={() => handlePhotoClick(drop)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <img
                    src={drop.photoUrl}
                    alt="Drop photo"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  
                  {/* Overlay with username */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    padding: '4px',
                    fontSize: '9px',
                    color: '#ffffff',
                    textAlign: 'center'
                  }}>
                    {drop.username}
                  </div>
                  
                  {/* Like indicator */}
                  {drop.likes.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#ffffff',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      ❤️ {drop.likes.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Selected Photo Modal */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <img
              src={selectedPhoto.photoUrl}
              alt="Selected photo"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
            
            <button
              onClick={handleCloseSelectedPhoto}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotosPanelOptimized;