'use client';

import React, { useState } from 'react';
import { Drop } from '@/lib/types/blackout';
import { User as FirebaseUser } from 'firebase/auth';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { getTimeAgo, formatGPS, getCardinalDirection, getMapLink } from '@/lib/utils/dropHelpers';
import { updateDrop, deleteDrop, likeDrop, unlikeDrop } from '@/lib/firebase/drops';
import { SurfaceGraffitiSelector } from '@/components/ui/SurfaceGraffitiSelector';
import { SurfaceType, GraffitiType } from '@/types';

interface PhotoDropPopupProps {
  drop: Drop;
  user: FirebaseUser | null;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
  onDelete?: (dropId: string) => void;
  onClose?: () => void;
}

const PhotoDropPopup: React.FC<PhotoDropPopupProps> = ({
  drop,
  user,
  onLikeUpdate,
  onDelete,
  onClose
}) => {
  const [isLiked, setIsLiked] = useState(drop.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>(drop.surface || 'wall');
  const [selectedGraffitiType, setSelectedGraffitiType] = useState<GraffitiType>(drop.graffitiType || 'tag');
  const [isSaving, setIsSaving] = useState(false);
  
  const isOwner = user?.uid === drop.createdBy;
  
  // Check if this photo has GPS location data
  const hasGPSLocation = drop.photoMetadata?.hasLocation;
  const originalLat = drop.photoMetadata?.originalLat;
  const originalLng = drop.photoMetadata?.originalLng;
  
  // Check if photo was placed manually vs auto-placed from GPS
  const isAutoPlaced = hasGPSLocation && originalLat && originalLng;

  const handleLike = async () => {
    if (!user) return;
    
    const firestoreId = drop.firestoreId || drop.id;
    if (!firestoreId) return;

    try {
      let success: boolean;
      
      if (isLiked) {
        success = await unlikeDrop(firestoreId, user.uid);
      } else {
        success = await likeDrop(firestoreId, user.uid);
      }
      
      if (success) {
        const newLikes = isLiked 
          ? drop.likes.filter(id => id !== user.uid)
          : [...(drop.likes || []), user.uid];
        
        setIsLiked(!isLiked);
        setLikeCount(newLikes.length);
        onLikeUpdate(firestoreId, newLikes);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    
    const firestoreId = drop.firestoreId || drop.id;
    if (!firestoreId) return;

    setIsSaving(true);
    try {
      await updateDrop(firestoreId, {
        surface: selectedSurface as any,
        graffitiType: selectedGraffitiType as any,
      });
      
      setIsEditing(false);
      alert('✅ Photo drop updated successfully!');
    } catch (error) {
      console.error('Error updating photo drop:', error);
      alert('Failed to update photo drop. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;
    
    const firestoreId = drop.firestoreId || drop.id;
    if (!firestoreId) return;

    if (!window.confirm('Are you sure you want to delete this photo drop? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDrop(firestoreId);
      // Call onDelete callback to update parent state (removes from map immediately, decrements photosTaken)
      if (onDelete) onDelete(firestoreId);
      if (onClose) onClose();
    } catch (error) {
      console.error('Error deleting photo drop:', error);
      alert('Failed to delete photo drop. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPhotoTakenDate = () => {
    if (drop.photoMetadata?.timestamp) {
      return new Date(drop.photoMetadata.timestamp).toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    return null;
  };

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      minWidth: '300px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflowY: 'auto',
      border: '2px solid #ef4444'
    }}>
      {/* GPS Location Badge - Top of Card */}
      {hasGPSLocation && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          padding: '6px 10px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderBottom: '2px solid #047857'
        }}>
          <span style={{ fontSize: '14px' }}>📍</span>
          <span>AUTO-PLACED FROM PHOTO GPS</span>
          <span style={{ 
            fontSize: '10px', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: '2px 6px',
            borderRadius: '10px'
          }}>
            +15 REP
          </span>
        </div>
      )}

      {/* Header with user info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '15px'
      }}>
        <img
          src={drop.userProfilePic || generateAvatarUrl(drop.createdBy, drop.username)}
          alt={drop.username}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: `2px solid ${hasGPSLocation ? '#10b981' : '#ef4444'}`,
            objectFit: 'cover'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '14px',
            color: 'white'
          }}>
            {drop.username}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#cbd5e1'
          }}>
            {getTimeAgo(drop.timestamp)}
          </div>
        </div>
        {isOwner && (
          <div style={{ 
            fontSize: '11px', 
            color: '#3b82f6', 
            fontWeight: 'bold',
            backgroundColor: '#dbeafe',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #93c5fd'
          }}>
            👤 Your Drop
          </div>
        )}
      </div>

      {/* Edit Mode */}
      {isEditing ? (
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#4dabf7', fontSize: '16px' }}>
              ✏️ Edit Photo Drop
            </h4>
            <SurfaceGraffitiSelector
              selectedSurface={selectedSurface}
              selectedGraffitiType={selectedGraffitiType}
              onSurfaceChange={setSelectedSurface}
              onGraffitiTypeChange={setSelectedGraffitiType}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? '💾 Saving...' : '✅ Save Changes'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                flex: 1,
                background: 'rgba(107, 114, 128, 0.3)',
                border: '1px solid #6b7280',
                padding: '12px',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Photo content header */}
          <div style={{
            background: hasGPSLocation 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            padding: '10px 12px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {hasGPSLocation ? '📍 GPS-TAGGED PHOTO' : '📸 PHOTO DROP'}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              {hasGPSLocation 
                ? 'Photo taken and auto-placed at exact location' 
                : 'Photo uploaded and manually placed'}
            </div>
          </div>

          {/* Photo preview */}
          {drop.photoUrl && (
            <div style={{ 
              marginBottom: '10px',
              position: 'relative',
              backgroundColor: '#f9fafb'
            }}>
              <img
                src={drop.photoUrl}
                alt="Drop photo"
                style={{
                  width: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  borderBottom: '1px solid #e5e7eb'
                }}
                onClick={() => window.open(drop.photoUrl, '_blank')}
              />
              
              {/* GPS overlay on photo */}
              {hasGPSLocation && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.9)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}>
                  📍 GPS
                </div>
              )}
            </div>
          )}

          {/* Location Information Section */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {/* Current Location */}
            <div style={{ marginBottom: hasGPSLocation ? '12px' : '0' }}>
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: '#6b7280',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {hasGPSLocation ? '📍 GPS COORDINATES' : '📍 DROP LOCATION'}
              </div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: 'bold',
                color: hasGPSLocation ? '#10b981' : '#1f2937',
                fontFamily: 'monospace',
                backgroundColor: hasGPSLocation ? '#ecfdf5' : '#f3f4f6',
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${hasGPSLocation ? '#a7f3d0' : '#d1d5db'}`,
                wordBreak: 'break-all'
              }}>
                {formatGPS(drop.lat, drop.lng)}
                <div style={{ 
                  fontSize: '11px', 
                  color: hasGPSLocation ? '#047857' : '#64748b',
                  marginTop: '4px',
                  fontWeight: 'normal'
                }}>
                  {getCardinalDirection(drop.lat, drop.lng)}
                </div>
              </div>
            </div>

            {/* Original Photo Location (if different) */}
            {hasGPSLocation && originalLat && originalLng && (
              <div style={{ 
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #dbeafe'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  color: '#1e40af',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>📷 ORIGINAL PHOTO LOCATION</span>
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontFamily: 'monospace',
                  color: '#1e40af',
                  marginBottom: '4px'
                }}>
                  {formatGPS(originalLat, originalLng)}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚡ Exact location where photo was taken</span>
                </div>
              </div>
            )}

            {/* Location actions */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginTop: '12px'
            }}>
              <a
                href={getMapLink(drop.lat, drop.lng)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  fontSize: '11px',
                  padding: '6px 10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🗺️</span>
                Open in Maps
              </a>
              
              {hasGPSLocation && (
                <button
                  onClick={() => {
                    alert(`📸 GPS Photo Information:\n\n• Photo was taken at exact coordinates\n• Auto-placed from EXIF metadata\n• GPS accuracy: High\n• Photo date: ${getPhotoTakenDate() || 'Unknown'}`);
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '6px 10px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>ℹ️</span>
                  GPS Info
                </button>
              )}
            </div>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div style={{ 
              padding: '12px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  flex: 1,
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#4dabf7',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontWeight: 'bold',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                🗑️ Delete
              </button>
            </div>
          )}

          {/* Actions and Stats */}
          <div style={{
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!user}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                backgroundColor: isLiked ? '#ef4444' : '#f3f4f6',
                color: isLiked ? 'white' : '#374151',
                border: `1px solid ${isLiked ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '6px',
                cursor: user ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              {isLiked ? '❤️ Liked' : '🤍 Like'}
              <span style={{
                fontSize: '11px',
                backgroundColor: isLiked ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                {likeCount}
              </span>
            </button>

            {/* GPS indicator */}
            {hasGPSLocation && (
              <div style={{ 
                fontSize: '10px', 
                color: '#10b981',
                fontWeight: 'bold',
                backgroundColor: '#d1fae5',
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                📍 GPS
              </div>
            )}
          </div>

          {/* GPS Information Footer */}
          {hasGPSLocation && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#ecfdf5',
              borderTop: '1px solid #a7f3d0',
              fontSize: '10px',
              color: '#047857',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span>✅</span>
              <span>This photo was auto-placed using embedded GPS coordinates</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhotoDropPopup;