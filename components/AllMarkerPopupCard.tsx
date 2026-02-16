// components/AllMarkerPopupCard.tsx (or update existing one)
import React, { useState, useCallback } from 'react';
import { LikeButton } from './LikeButton';
import { CommentSection } from './CommentSection';
import { likeDrop, unlikeDrop, getCommentsForDrop, addCommentToDrop } from '@/lib/firebase/drops';
import { getTimeAgo } from '@/lib/utils/dropHelpers';

interface AllMarkerPopupCardProps {
  marker: any;
  onClose: () => void;
  user: any;
  userProfile: any;
  mapRef: any;
}

export const AllMarkerPopupCard: React.FC<AllMarkerPopupCardProps> = ({
  marker,
  onClose,
  user,
  userProfile,
  mapRef
}) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<any[]>(marker.comments || []);
  
  // Get the actual firestore ID for the marker
  const getMarkerId = useCallback(() => {
    return marker.firestoreId || marker.id || marker.dropId;
  }, [marker]);

  // Handle like toggle with Firestore update
  const handleLikeToggle = useCallback(async (markerId: string, newLikes: string[]) => {
    if (!user) return;
    
    const id = markerId || getMarkerId();
    if (!id) return;

    try {
      const isLiked = newLikes.includes(user.uid);
      
      if (isLiked) {
        await likeDrop(id, user.uid);
      } else {
        await unlikeDrop(id, user.uid);
      }
      
      console.log('Like updated successfully');
    } catch (error) {
      console.error('Error updating like:', error);
    }
  }, [user, getMarkerId]);

  // Handle adding a new comment
  const handleCommentAdded = useCallback(async (comment: any) => {
    if (!user || !userProfile) return;
    
    const id = getMarkerId();
    if (!id) return;

    try {
      const commentId = await addCommentToDrop(
        id,
        user.uid,
        userProfile.username || user.displayName || 'Anonymous',
        comment.text,
        userProfile.profilePicUrl || user.photoURL || undefined
      );

      if (commentId) {
        const newComment = {
          id: commentId,
          userId: user.uid,
          username: userProfile.username || user.displayName || 'Anonymous',
          userProfilePic: userProfile.profilePicUrl || user.photoURL,
          text: comment.text,
          timestamp: new Date()
        };
        
        setComments(prev => [...prev, newComment]);
        console.log('Comment added successfully');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [user, userProfile, getMarkerId]);

  // Load comments when opening comment section
  const loadComments = useCallback(async () => {
    const id = getMarkerId();
    if (!id || comments.length > 0) return;

    try {
      const fetchedComments = await getCommentsForDrop(id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, [getMarkerId, comments.length]);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '300px',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '16px',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(12px)',
      zIndex: 2000,
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
            src={marker.userProfilePic || '/default-avatar.png'}
            alt={marker.username}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `2px solid ${marker.color || '#4dabf7'}`,
              objectFit: 'cover'
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {marker.username || 'Anonymous'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {getTimeAgo(new Date(marker.timestamp))}
            </div>
          </div>
        </div>
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
      </div>

      {/* Marker Info */}
      <div style={{
        padding: '12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
            🎨 Type: <span style={{ color: marker.color || '#4dabf7', fontWeight: 'bold' }}>
              {marker.description || marker.name}
            </span>
          </div>
          <div style={{
            fontSize: '12px',
            padding: '2px 8px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            borderRadius: '12px'
          }}>
            {marker.repEarned || 5} REP
          </div>
        </div>
        
        {marker.distanceFromCenter && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
            📏 {Math.round(marker.distanceFromCenter)}m from center
          </div>
        )}
      </div>

      {/* Location */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
          📍 Location
        </div>
        <div style={{
          fontSize: '11px',
          color: '#94a3b8',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(255,255,255,0.03)',
          padding: '6px 8px',
          borderRadius: '6px'
        }}>
          {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
        </div>
      </div>

      {/* Interactive Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <LikeButton
          markerId={getMarkerId()}
          initialLikes={marker.likes || []}
          onLikeToggle={handleLikeToggle}
          user={user}
        />
        
        <button
          onClick={() => {
            setIsCommenting(!isCommenting);
            if (!isCommenting) loadComments();
          }}
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
        
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.setView(marker.position, 18);
              onClose();
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
      </div>

      {/* Comments Section */}
      {isCommenting && (
        <CommentSection
          markerId={getMarkerId()}
          initialComments={comments}
          onCommentAdded={handleCommentAdded}
          user={user}
          userProfile={userProfile}
        />
      )}

      <style>{`
        @keyframes popUp {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          70% { transform: translate(-50%, -50%) scale(1.05); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};