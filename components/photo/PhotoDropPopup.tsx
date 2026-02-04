'use client';

import React, { useState } from 'react';
import { Drop } from '@/lib/types/blackout';
import { User as FirebaseUser } from 'firebase/auth';

interface PhotoDropPopupProps {
  drop: Drop;
  user: FirebaseUser | null;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
}

// Simple avatar generator for fallback
const generateAvatarUrl = (userId: string, username: string) => {
  const seed = username || userId;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=4dabf7`;
};

const PhotoDropPopup: React.FC<PhotoDropPopupProps> = ({
  drop,
  user,
  onLikeUpdate
}) => {
  const [isLiked, setIsLiked] = useState(drop.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);

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

  return (
    <div style={{
      minWidth: '250px',
      maxWidth: '300px',
      fontSize: '12px',
      lineHeight: '1.4',
      color: '#333',
      textAlign: 'left'
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
            {getTimeAgo(drop.timestamp)}
          </div>
        </div>
      </div>

      {/* Photo content header */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        padding: '8px 10px',
        borderRadius: '6px',
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px' }}>
          📸 Photo Drop
        </div>
      </div>

      {/* Photo preview */}
      {drop.photoUrl && (
        <div style={{ marginBottom: '8px' }}>
          <img
            src={drop.photoUrl}
            alt="Drop photo"
            style={{
              width: '100%',
              maxHeight: '150px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '1px solid #ddd',
              cursor: 'pointer'
            }}
            onClick={() => window.open(drop.photoUrl, '_blank')}
          />
        </div>
      )}

      {/* Location info */}
      <div style={{
        fontSize: '10px',
        color: '#666',
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        📍 {drop.lat?.toFixed(4)}, {drop.lng?.toFixed(4)}
      </div>

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
          onClick={handleLike}
          disabled={!user}
          style={{
            fontSize: '10px',
            padding: '4px 8px',
            backgroundColor: isLiked ? '#ef4444' : '#f3f4f6',
            color: isLiked ? 'white' : '#333',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: user ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </button>

        {drop.createdBy === user?.uid && (
          <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
            Your Drop
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoDropPopup;