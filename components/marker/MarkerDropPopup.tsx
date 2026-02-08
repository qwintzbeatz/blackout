'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Drop } from '@/lib/types/blackout';
import { User as FirebaseUser } from 'firebase/auth';
import { likeDrop, unlikeDrop, addCommentToDrop, getCommentsForDrop, DropComment } from '@/lib/firebase/drops';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { getTimeAgo } from '@/lib/utils/dropHelpers';

interface MarkerDropPopupProps {
  drop: Drop;
  user: FirebaseUser | null;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
  onClose?: () => void;
  mapRef?: any;
  userProfile?: {
    username?: string;
    profilePicUrl?: string;
  };
}

const MarkerDropPopup: React.FC<MarkerDropPopupProps> = ({
  drop,
  user,
  onLikeUpdate,
  onClose,
  mapRef,
  userProfile
}) => {
  const [isLiked, setIsLiked] = useState(drop.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<DropComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Load comments when opening comment section
  useEffect(() => {
    if (isCommenting && comments.length === 0) {
      loadComments();
    }
  }, [isCommenting]);

  const loadComments = async () => {
    const firestoreId = drop.firestoreId || drop.id;
    if (!firestoreId) return;
    
    setIsLoadingComments(true);
    try {
      const fetchedComments = await getCommentsForDrop(firestoreId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

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

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !userProfile) return;
    
    const firestoreId = drop.firestoreId || drop.id;
    if (!firestoreId) return;

    setIsPostingComment(true);
    
    try {
      const commentId = await addCommentToDrop(
        firestoreId,
        user.uid,
        userProfile.username || user.displayName || 'Anonymous',
        newComment.trim(),
        userProfile.profilePicUrl || user.photoURL || undefined
      );

      if (commentId) {
        // Add the new comment to the local state
        const newCommentObj: DropComment = {
          id: commentId,
          dropId: firestoreId,
          userId: user.uid,
          username: userProfile.username || user.displayName || 'Anonymous',
          userProfilePic: userProfile.profilePicUrl || user.photoURL || undefined,
          text: newComment.trim(),
          timestamp: new Date()
        };
        
        setComments(prev => [...prev, newCommentObj]);
        setNewComment('');
        setIsCommenting(false);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Comment section component
  const CommentSection = () => (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Comments header */}
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#cbd5e1',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        💬 Comments ({comments.length})
      </div>

      {/* Comment form */}
      <form onSubmit={handlePostComment} style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <img
            src={user?.photoURL || generateAvatarUrl(user?.uid || 'default', user?.displayName || 'User')}
            alt="You"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: '2px solid #4dabf7',
              objectFit: 'cover'
            }}
          />
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Write your comment..." : "Log in to comment"}
              disabled={!user || isPostingComment}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #555',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={!user || !newComment.trim() || isPostingComment}
                style={{
                  padding: '6px 12px',
                  backgroundColor: (!user || !newComment.trim() || isPostingComment) ? '#555' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!user || !newComment.trim() || isPostingComment) ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  opacity: (!user || !newComment.trim() || isPostingComment) ? 0.7 : 1
                }}
              >
                {isPostingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {isLoadingComments ? (
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '8px' }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>
            No comments yet. Be the first!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                display: 'flex',
                gap: '8px',
                padding: '6px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '6px'
              }}
            >
              <img
                src={comment.userProfilePic || generateAvatarUrl(comment.userId, comment.username)}
                alt={comment.username}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid #444',
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e0e0e0', marginBottom: '2px' }}>
                  {comment.username}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.3' }}>
                  {comment.text}
                </div>
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                  {comment.timestamp.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
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
            src={drop.userProfilePic || generateAvatarUrl(drop.userId || 'anonymous', drop.username || 'User')}
            alt={drop.username || 'User'}
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