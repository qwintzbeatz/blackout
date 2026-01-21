'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Drop } from '@/lib/utils/types';
import { likeDrop, unlikeDrop } from '@/lib/firebase/drops';
import { User } from 'firebase/auth';

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface DropPopupProps {
  drop: Drop;
  user: User | null;
  onLikeUpdate?: (dropId: string, newLikes: string[]) => void;
}

export default function DropPopup({ drop, user, onLikeUpdate }: DropPopupProps) {
  const [likes, setLikes] = useState<string[]>(drop.likes || []);
  const [isLiking, setIsLiking] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setLikes(drop.likes || []);
  }, [drop.likes]);

  const hasLiked = user && likes.includes(user.uid);

  const handleLike = async () => {
    if (!user || !drop.firestoreId || isLiking) return;

    setIsLiking(true);
    try {
      if (hasLiked) {
        const success = await unlikeDrop(drop.firestoreId, user.uid);
        if (success) {
          const newLikes = likes.filter((uid) => uid !== user.uid);
          setLikes(newLikes);
          if (onLikeUpdate) {
            onLikeUpdate(drop.firestoreId, newLikes);
          }
        }
      } else {
        const success = await likeDrop(drop.firestoreId, user.uid);
        if (success) {
          const newLikes = [...likes, user.uid];
          setLikes(newLikes);
          if (onLikeUpdate) {
            onLikeUpdate(drop.firestoreId, newLikes);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Popup maxWidth={400} className="drop-popup">
      <div style={{ textAlign: 'center', minWidth: '300px' }}>
        {/* Photo or Marker Icon */}
        {drop.photoUrl ? (
          !imageError ? (
            <div
              style={{
                marginBottom: '12px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
              }}
            >
              <img
                src={drop.photoUrl}
                alt="Drop photo"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '400px',
                  objectFit: 'cover',
                }}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '12px',
                color: '#6b7280',
              }}
            >
              Failed to load image
            </div>
          )
        ) : (
          // Marker drop (no photo)
          <div
            style={{
              padding: '40px',
              backgroundColor: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '8px',
              marginBottom: '12px',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '48px' }}>📍</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Marker Drop</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Quick tag placed here
            </div>
          </div>
        )}

        {/* User info */}
        {drop.username && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              justifyContent: 'center',
            }}
          >
            {drop.userProfilePic && (
              <img
                src={drop.userProfilePic}
                alt={drop.username}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            )}
            <span style={{ fontWeight: '500', fontSize: '14px' }}>
              {drop.username}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px',
          }}
        >
          {formatDate(drop.timestamp)}
        </div>

        {/* Location */}
        <div
          style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '16px',
          }}
        >
          📍 {drop.lat.toFixed(6)}, {drop.lng.toFixed(6)}
        </div>

        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={!user || isLiking}
          style={{
            width: '100%',
            padding: '10px 16px',
            backgroundColor: hasLiked ? '#ef4444' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: user && !isLiking ? 'pointer' : 'not-allowed',
            opacity: !user || isLiking ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            if (user && !isLiking) {
              e.currentTarget.style.opacity = '0.9';
            }
          }}
          onMouseOut={(e) => {
            if (user && !isLiking) {
              e.currentTarget.style.opacity = '1';
            }
          }}
        >
          {isLiking ? (
            <>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '18px' }}>
                {hasLiked ? '❤️' : '🤍'}
              </span>
              <span>
                {hasLiked ? 'Liked' : 'Like'} ({likes.length})
              </span>
            </>
          )}
        </button>

        {!user && (
          <div
            style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '8px',
            }}
          >
            Sign in to like drops
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Popup>
  );
}
