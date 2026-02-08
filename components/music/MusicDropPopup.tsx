'use client';

import React, { useState, useEffect } from 'react';
import { Drop, Comment } from '@/lib/types/blackout';
import { User as FirebaseUser } from 'firebase/auth';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { getTrackNameFromUrl, getTrackPlatform, getTimeAgo } from '@/lib/utils/dropHelpers';

interface MusicDropPopupProps {
  drop: Drop;
  user: FirebaseUser | null;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
}

interface SoundCloudWaveformProps {
  isActive: boolean;
}

const SoundCloudWaveform: React.FC<SoundCloudWaveformProps> = ({ isActive }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      height: '60px',
      padding: '0 8px'
    }}>
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: Math.random() * (isActive ? 40 : 20) + 10,
            backgroundColor: isActive ? '#ff5500' : '#e0e0e0',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            opacity: isActive ? 0.8 : 0.3,
            transform: `scaleY(${isActive ? 1 : 0.5})`,
            transformOrigin: 'bottom'
          }}
        />
      ))}
    </div>
  );
};

const MusicDropPopup: React.FC<MusicDropPopupProps> = ({
  drop,
  user,
  onLikeUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (drop.likes && user) {
      setIsLiked(drop.likes.includes(user.uid));
      setLikeCount(drop.likes.length);
    }
  }, [drop.likes, user]);

  const handleLike = async () => {
    if (!user) return;

    const newLikes = isLiked 
      ? drop.likes?.filter(id => id !== user.uid) || []
      : [...(drop.likes || []), user.uid];

    await onLikeUpdate(drop.firestoreId || drop.id || '', newLikes);
    setIsLiked(!isLiked);
    setLikeCount(newLikes.length);
  };

  const handleComment = async () => {
    if (!user || !comment.trim()) return;

    // Add comment logic here (implementation needed)
    // TODO: Implement comment system when backend supports it
    console.log('Adding comment:', comment);
    setComment('');
    setShowComments(false);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10000,
        pointerEvents: 'auto',
        minWidth: '280px',
        maxWidth: '280px'
      }}
    >
      {/* Main Card */}
      <div
        style={{
          width: '280px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            {/* Creator Avatar */}
            {drop.userProfilePic ? (
              <img
                src={drop.userProfilePic}
                alt={drop.username}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid #ff5500'
                }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ff5500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'white'
                }}
              >
                {(drop.username || 'anonymous')[0]?.toUpperCase()}
              </div>
            )}

            {/* Track Info */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '11px',
                  color: '#999',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                MUSIC DROP
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  lineHeight: '1.2'
                }}
              >
                {getTrackNameFromUrl(drop.trackUrl || '')}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '2px'
                }}
              >
                by {drop.username}
              </div>
            </div>
          </div>
        </div>

        {/* Album Art/Media */}
        {drop.photoUrl && (
          <div
            style={{
              height: '180px',
              background: `url(${drop.photoUrl}) center/cover`,
              backgroundSize: 'cover',
              position: 'relative'
            }}
          >
            {/* Overlay Gradient */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
              }}
            />
          </div>
        )}

        {/* Track URL Preview */}
        {drop.trackUrl && (
          <div style={{ padding: '16px 20px' }}>
            <div
              style={{
                backgroundColor: '#ff5500',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px'
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}
              >
                🎵 {getTrackPlatform(drop.trackUrl || '')} Track
              </div>
              <div
                style={{
                  color: '#ffcc00',
                  fontSize: '11px',
                  wordBreak: 'break-all'
                }}
              >
                {drop.trackUrl || ''}
              </div>
            </div>

            {/* SoundCloud Waveform */}
            <div style={{ marginBottom: '12px' }}>
              <SoundCloudWaveform isActive={isPlaying} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Play Button */}
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (drop.trackUrl) {
                window.open(drop.trackUrl, '_blank');
              }
            }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: isPlaying ? '#ff5500' : '#fff',
              color: isPlaying ? '#fff' : '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isPlaying ? '⏸' : '▶'}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={!user}
            style={{
              padding: '12px 16px',
              backgroundColor: isLiked ? '#ff5500' : 'transparent',
              color: isLiked ? '#fff' : '#999',
              border: isLiked ? 'none' : '1px solid #333',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: user ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isLiked ? '❤️' : '🤍'}
            {likeCount}
          </button>
        </div>

        {/* Timestamp */}
        <div
          style={{
            padding: '0 20px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#999'
            }}
          >
            <span>Dropped {formatTimeAgo(drop.timestamp)}</span>
            {drop.lat && drop.lng && (
              <span>• 📍 {drop.lat.toFixed(4)}, {drop.lng.toFixed(4)}</span>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>
                Comments ({drop.comments?.length || 0})
              </div>
              
              {/* Comment Input */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleComment}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#ff5500',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Post
                </button>
              </div>

              {/* Existing Comments */}
              {drop.comments?.map((comment: Comment, index: number) => (
                <div
                  key={comment.id || index}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#fff'
                      }}
                    >
                      {comment.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#999', fontSize: '10px', marginBottom: '2px' }}>
                        {comment.username}
                      </div>
                      <div style={{ color: '#fff', lineHeight: '1.4' }}>
                        {comment.text}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#999', fontSize: '10px' }}>
                    {formatTimeAgo(comment.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          height: '4px',
          background: 'linear-gradient(90deg, #ff5500 0%, #ff6b00 50%, #ff8800 100%)',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.2)'
          }}
        />
      </div>
    </div>
  );
};

export default MusicDropPopup;