'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface PhotosPanelProps {
  isOpen?: boolean;
  onClose: () => void;
  userProfile?: {
    username?: string;
    profilePicUrl?: string;
    favoriteColor?: string;
    level?: number;
    rep?: number;
  } | null;
}

const PhotosPanel: React.FC<PhotosPanelProps> = ({
  isOpen = false,
  onClose,
  userProfile
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock photos data (in real app, this would come from camera or storage)
  const mockPhotos = useMemo(() => [
    { id: 1, url: 'https://picsum.photos/seed/graffiti1/200/200.jpg', caption: 'Street Art', date: new Date('2024-01-15'), location: 'Auckland CBD' },
    { id: 2, url: 'https://picsum.photos/seed/graffiti2/200/200.jpg', caption: 'Wall Piece', date: new Date('2024-01-14'), location: 'Wellington' },
    { id: 3, url: 'https://picsum.photos/seed/graffiti3/200/200.jpg', caption: 'Tag Design', date: new Date('2024-01-13'), location: 'Christchurch' },
    { id: 4, url: 'https://picsum.photos/seed/graffiti4/200/200.jpg', caption: 'Stencil Work', date: new Date('2024-01-12'), location: 'Queenstown' },
    { id: 5, url: 'https://picsum.photos/seed/graffiti5/200/200.jpg', caption: 'Mural Project', date: new Date('2024-01-11'), location: 'Dunedin' }
  ], []);

  const handlePhotoSelect = useCallback((photoId: number) => {
    setSelectedPhoto(photoId);
  }, []);

  const handlePhotoDelete = useCallback((photoId: number) => {
    // In real app, this would delete from storage
    console.log('Delete photo:', photoId);
    if (selectedPhoto === photoId) {
      setSelectedPhoto(null);
    }
  }, []);

  const handlePhotoUpload = useCallback(() => {
    // In real app, this would trigger camera or file picker
    const newPhotoCount = Math.floor(Math.random() * 3) + 1;
    console.log('Simulating photo upload:', newPhotoCount);
    
    // Update notification count
    if (userProfile && selectedPhoto === null) {
      setSelectedPhoto(null);
      return;
    }
    
    setSelectedPhoto(Math.floor(Math.random() * 5) + 1);
  }, [userProfile, selectedPhoto]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  const panelStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#e0e0e0',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    width: 'min(110vw, 500px)',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    border: '1px solid rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    zIndex: 1500,
    position: 'relative' as const
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1500
    }}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid rgba(255,255,255,0.1)',
          paddingBottom: '15px'
        }}>
          <div>
            <h2 style={{ color: '#9c27b0', margin: 0, fontSize: '24px' }}>📸 Photos</h2>
            <p style={{ color: '#b0b0b0', margin: '5px 0 0', fontSize: '14px' }}>
              Your photo collection and camera interface
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '5px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'grid' ? '#9c27b0' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'list' ? '#9c27b0' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            List View
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button
            onClick={handlePhotoUpload}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#4dabf7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📷 Take Photo
          </button>
          <button
            onClick={() => {
              // Simulate selecting from gallery
              const availablePhotos = mockPhotos.filter(p => selectedPhoto === null || p.id === selectedPhoto);
              if (availablePhotos.length > 0) {
                const randomPhoto = availablePhotos[Math.floor(Math.random() * availablePhotos.length)];
                setSelectedPhoto(randomPhoto.id);
              }
            }}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🖼️ Select from Gallery
          </button>
          <button
            onClick={() => {
              if (selectedPhoto !== null) {
                // In real app, this would delete from storage
                console.log('Delete photo:', selectedPhoto);
                setSelectedPhoto(null);
              }
            }}
            disabled={selectedPhoto === null}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: selectedPhoto !== null ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: selectedPhoto !== null ? 1 : 0.5
            }}
          >
            🗑️ Delete Selected
          </button>
        </div>

        {/* Photo Gallery/List */}
        {viewMode === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '15px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '10px'
          }}>
            {mockPhotos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: selectedPhoto === photo.id ? 'rgba(156, 39, 176, 0.2)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handlePhotoSelect(photo.id)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '6px'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                  color: 'white',
                  padding: '5px',
                  fontSize: '10px'
                }}>
                  {photo.caption}
                </div>
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePhotoDelete(photo.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    border: 'none',
                    color: 'white',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {mockPhotos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  backgroundColor: selectedPhoto === photo.id ? 'rgba(156, 39, 176, 0.2)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handlePhotoSelect(photo.id)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '6px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {photo.caption}
                  </div>
                  <div style={{
                    color: '#b0b0b0',
                    fontSize: '12px',
                    marginBottom: '2px'
                  }}>
                    {formatDate(photo.date)} • {photo.location}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '10px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhotoDelete(photo.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                    <button
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#4dabf7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Photo Detail Modal */}
        {selectedPhoto && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '20px',
            borderRadius: '12px',
            zIndex: 1600,
            minWidth: '300px'
          }}>
            <h3 style={{ color: '#9c27b0', margin: '0 0 15px' }}>Photo Details</h3>
            <div style={{ fontSize: '16px', lineHeight: '1.5' }}>
              <div><strong>Caption:</strong> {mockPhotos.find(p => p.id === selectedPhoto)!.caption}</div>
              <div><strong>Date:</strong> {formatDate(mockPhotos.find(p => p.id === selectedPhoto)!.date)}</div>
              <div><strong>Location:</strong> {mockPhotos.find(p => p.id === selectedPhoto)!.location}</div>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotosPanel;