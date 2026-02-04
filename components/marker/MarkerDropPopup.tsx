'use client';

import React, { useState } from 'react';
import { Drop } from '@/lib/types/blackout';
import { User as FirebaseUser } from 'firebase/auth';

interface MarkerDropPopupProps {
  drop: Drop;
  user: FirebaseUser | null;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
  onClose?: () => void;
  mapRef?: any;
  onCommentAdded?: (comment: any) => void;
}

const MarkerDropPopup: React.FC<MarkerDropPopupProps> = ({
  drop,
  user,
  onLikeUpdate,
  onClose,
  mapRef,
  onCommentAdded
}) => {
  const [isLiked, setIsLiked] = useState(drop.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  const [isCommenting, setIsCommenting] = useState(false);

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

  // Simple avatar generator for fallback
  const generateAvatarUrl = (userId: string, username: string) => {
    const seed = username || userId;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=4dabf7`;
  };

  // Simple comment section component
  const CommentSection = () => (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <img
          src={user?.photoURL || generateAvatarUrl(user?.uid || 'default', user?.displayName || 'User')}
          alt="Your avatar"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: '500' }}>
            {user?.displayName || 'Anonymous'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Add a comment...
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Write your comment..."
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
            outline: 'none'
          }}
        />
        <button
          onClick={() => {
            if (onCommentAdded) {
              onCommentAdded({
                text: "New comment",
                userId: user?.uid,
                timestamp: new Date()
              });
              setIsCommenting(false);
            }
          }}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Post
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'relative',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '16px',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(12px)',
      animation: 'popUp 0.3s ease-out',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={drop.userProfilePic || generateAvatarUrl(drop.userId, drop.username)}
            alt={drop.username}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `2px solid ${drop.color || '#4dabf7'}`,
              objectFit: 'cover'
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {drop.username || 'Anonymous'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {getTimeAgo(drop.timestamp)}
            </div>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Marker Info */}
      <div style={{
        padding: '12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
            📍 Location Tag
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
            🎨 Type: <span style={{ color: drop.color || '#4dabf7', fontWeight: 'bold' }}>
              Signature Tag
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            padding: '2px 8px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            borderRadius: '12px'
          }}>
            {drop.repEarned || 5} REP
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
          📍 Coordinates
        </div>
        <div style={{
          fontSize: '11px',
          color: '#94a3b8',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '6px 8px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          {drop.lat?.toFixed(6)}, {drop.lng?.toFixed(6)}
        </div>
      </div>

      {/* Interactive Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleLike}
          disabled={!user}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: isLiked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.07)',
            border: isLiked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: isLiked ? '#ef4444' : 'white',
            borderRadius: '8px',
            cursor: user ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            opacity: user ? 1 : 0.6
          }}
        >
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </button>
        
        <button
          onClick={() => setIsCommenting(!isCommenting)}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#4dabf7',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px'
          }}
        >
          💬 Comment
        </button>
        
        {mapRef && (
          <button
            onClick={() => {
              if (mapRef.current && drop.lat && drop.lng) {
                mapRef.current.setView([drop.lat, drop.lng], 18);
                if (onClose) onClose();
              }
            }}
            style={{
              padding: '8px 12px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px'
            }}
          >
            🚀 Go to
          </button>
        )}
      </div>

      {/* Comments Section */}
      {isCommenting && <CommentSection />}

      {/* User ownership indicator */}
      {drop.createdBy === user?.uid && (
        <div style={{
          marginTop: '12px',
          padding: '6px 12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#4dabf7',
          textAlign: 'center'
        }}>
          ✨ Your Drop
        </div>
      )}

      <style>{`
        @keyframes popUp {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .marker-popup {
          animation: popUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MarkerDropPopup;