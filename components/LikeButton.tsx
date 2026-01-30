'use client';

import React, { useState } from 'react';

interface LikeButtonProps {
  markerId: string;
  initialLikes: string[];
  onLikeToggle: (markerId: string, newLikes: string[]) => void;
  user: any;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  markerId,
  initialLikes,
  onLikeToggle,
  user
}) => {
  const [likes, setLikes] = useState<string[]>(initialLikes || []);
  const [isLiking, setIsLiking] = useState(false);
  const isLiked = user && likes.includes(user.uid);

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    const newLikes = isLiked 
      ? likes.filter(id => id !== user.uid)
      : [...likes, user.uid];

    try {
      setLikes(newLikes);
      onLikeToggle(markerId, newLikes);
    } catch (error) {
      console.error('Error toggling like:', error);
      setLikes(likes); // Revert on error
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLiking}
      style={{
        background: isLiked ? '#10b981' : 'rgba(255,255,255,0.1)',
        color: isLiked ? 'white' : '#cbd5e1',
        border: '1px solid rgba(255,255,255,0.2)',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: isLiking ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        width: '100%',
        opacity: isLiking ? 0.7 : 1,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      {isLiking ? (
        <>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Processing...
        </>
      ) : (
        <>
          <span style={{ fontSize: '16px' }}>❤️</span>
          {isLiked ? 'Liked' : 'Like'} ({likes.length})
        </>
      )}
    </button>
  );
};