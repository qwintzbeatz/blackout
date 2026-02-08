'use client';

import React, { useState } from 'react';
import { Drop } from '@/lib/types/blackout';
import { User as FirebaseUser } from 'firebase/auth';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';

interface PhotoDropPopupProps {
  drop: Drop;
  user: FirebaseUser | null;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
}

const PhotoDropPopup: React.FC<PhotoDropPopupProps> = ({
  drop,
  user,
  onLikeUpdate
}) => {
  const [isLiked, setIsLiked] = useState(drop.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  
  // Check if this photo has GPS location data
  const hasGPSLocation = drop.photoMetadata?.hasLocation;
  const originalLat = drop.photoMetadata?.originalLat;
  const originalLng = drop.photoMetadata?.originalLng;
  
  // Check if photo was placed manually vs auto-placed from GPS
  const isAutoPlaced = hasGPSLocation && originalLat && originalLng;

  const handleLike = async () => {
    if (!user) return;
    
    try {
      const newLikes = isLiked 
        ? drop.likes.filter(id => id !== user.uid)
        : [...drop.likes, user.uid];
      
      setIsLiked(!isLiked);
      setLikeCount(newLikes.length);
      onLikeUpdate(drop.firestoreId || drop.id || 'unknown', newLikes);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const formatGPS = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getCardinalDirection = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  };

  const getMapLink = (lat: number, lng: number) => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
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
      minWidth: '280px',
      maxWidth: '350px',
      fontSize: '12px',
      lineHeight: '1.4',
      color: '#333',
      textAlign: 'left',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      overflow: 'hidden'
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
        marginBottom: '10px',
        padding: '12px 12px 8px 12px'
      }}>
        <div style={{ position: 'relative' }}>
          <img
            src={drop.userProfilePic || generateAvatarUrl(drop.createdBy, drop.username)}
            alt={drop.username}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `2px solid ${hasGPSLocation ? '#10b981' : '#ef4444'}`,
              objectFit: 'cover'
            }}
          />
          {hasGPSLocation && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              border: '2px solid white'
            }}>
              📍
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            marginBottom: '2px'
          }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '13px',
              color: hasGPSLocation ? '#10b981' : '#1f2937'
            }}>
              {drop.username}
            </div>
            {hasGPSLocation && (
              <span style={{
                fontSize: '10px',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}>
                GPS PHOTOGRAPHER
              </span>
            )}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{getTimeAgo(drop.timestamp)}</span>
            {drop.photoMetadata?.timestamp && (
              <span style={{ 
                fontSize: '10px',
                color: '#9ca3af',
                fontStyle: 'italic'
              }}>
                📅 {getPhotoTakenDate()}
              </span>
            )}
          </div>
        </div>
      </div>

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
              color: hasGPSLocation ? '#047857' : '#6b7280',
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
          onMouseEnter={(e) => {
            if (user) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
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

        {/* Drop ownership indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {drop.createdBy === user?.uid && (
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
    </div>
  );
};

export default PhotoDropPopup;