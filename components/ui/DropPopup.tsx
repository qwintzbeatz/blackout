'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Drop } from '@/lib/types/blackout';
import { User } from 'firebase/auth';
import { likeDrop, unlikeDrop } from '@/lib/firebase/drops';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import {
  getTimeAgo,
  formatGPS,
  getCardinalDirection,
  getMapLink,
  getTrackNameFromUrl,
  getDropType,
  getDropColor,
  getTrackPlatform,
} from '@/lib/utils/dropHelpers';

interface DropPopupProps {
  drop: Drop;
  user: User | null;
  onLikeUpdate?: (dropId: string, newLikes: string[]) => void;
  onClose?: () => void;
}

const DropPopup: React.FC<DropPopupProps> = ({ drop, user, onLikeUpdate, onClose }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const dropType = getDropType(drop);
  const dropColor = getDropColor(drop);
  const firestoreId = drop.firestoreId || drop.id || '';

  useEffect(() => {
    setIsLiked(drop.likes?.includes(user?.uid || '') || false);
    setLikeCount(drop.likes?.length || 0);
  }, [drop.likes, user]);

  const handleLike = useCallback(async () => {
    if (!user || !firestoreId || isLiking) return;

    setIsLiking(true);
    try {
      const success = isLiked
        ? await unlikeDrop(firestoreId, user.uid)
        : await likeDrop(firestoreId, user.uid);

      if (success) {
        const newLikes = isLiked
          ? drop.likes?.filter((id) => id !== user.uid) || []
          : [...(drop.likes || []), user.uid];

        setIsLiked(!isLiked);
        setLikeCount(newLikes.length);
        onLikeUpdate?.(firestoreId, newLikes);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  }, [user, firestoreId, isLiking, isLiked, drop.likes, onLikeUpdate]);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (drop.trackUrl) {
      window.open(drop.trackUrl, '_blank');
    }
  };

  return (
    <div
      style={{
        width: '300px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.15)',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={drop.userProfilePic || generateAvatarUrl(drop.createdBy, drop.username)}
            alt={drop.username}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: `2px solid ${dropColor}`,
              objectFit: 'cover',
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{drop.username || 'Anonymous'}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{getTimeAgo(drop.timestamp)}</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Type-specific content */}
      {dropType === 'photo' && drop.photoUrl && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${dropColor} 0%, #059669 100%)`,
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '8px',
              fontWeight: 'bold',
            }}
          >
            📸 Photo Drop
          </div>
          {!imageError ? (
            <img
              src={drop.photoUrl}
              alt="Drop photo"
              style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div style={{ padding: '40px', backgroundColor: '#333', borderRadius: '8px', textAlign: 'center' }}>
              Failed to load image
            </div>
          )}
        </div>
      )}

      {dropType === 'music' && (
        <div
          style={{
            background: 'linear-gradient(135deg, #8a2be2, #6a1bb2)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px',
            color: 'white',
          }}
        >
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
            {getTrackPlatform(drop.trackUrl || '')} Track
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
            {getTrackNameFromUrl(drop.trackUrl || '')}
          </div>
          <button
            onClick={handlePlay}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: isPlaying ? '#ff5500' : 'white',
              color: isPlaying ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play Track'}
          </button>
        </div>
      )}

      {dropType === 'marker' && (
        <div
          style={{
            background: `linear-gradient(135deg, ${dropColor}, #059669)`,
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px', marginBottom: '4px' }}>📍</div>
          <div style={{ fontWeight: 'bold' }}>Location Tag</div>
          {drop.repEarned && (
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>{drop.repEarned} REP</div>
          )}
        </div>
      )}

      {/* Location info */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>📍 Coordinates</div>
        <div
          style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '6px 8px',
            borderRadius: '6px',
            textAlign: 'center',
          }}
        >
          {formatGPS(drop.lat, drop.lng)}
        </div>
        <a
          href={getMapLink(drop.lat, drop.lng)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '6px',
            fontSize: '11px',
            color: dropColor,
            textDecoration: 'none',
          }}
        >
          Open in Maps →
        </a>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleLike}
          disabled={!user || isLiking}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: isLiked ? '#ef4444' : 'rgba(255,255,255,0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: user && !isLiking ? 'pointer' : 'not-allowed',
            opacity: !user || isLiking ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {isLiked ? '❤️' : '🤍'} {isLiked ? 'Liked' : 'Like'} ({likeCount})
        </button>
      </div>

      {/* Ownership indicator */}
      {drop.createdBy === user?.uid && (
        <div
          style={{
            marginTop: '12px',
            padding: '6px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#4dabf7',
            textAlign: 'center',
          }}
        >
          ✨ Your Drop
        </div>
      )}
    </div>
  );
};

export default DropPopup;
