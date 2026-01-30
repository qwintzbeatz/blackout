'use client';

import React, { useState, useEffect } from 'react';
import { Comment } from '@/lib/types/blackout';

interface CommentSectionProps {
  markerId: string;
  initialComments: Comment[];
  onCommentAdded: (comment: Comment) => void;
  user: any;
  userProfile: any;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  markerId,
  initialComments,
  onCommentAdded,
  user,
  userProfile
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !userProfile) return;

    setIsSubmitting(true);
    
    const comment: Comment = {
      id: Date.now().toString(),
      userId: user.uid,
      username: userProfile.username,
      text: newComment.trim(),
      timestamp: new Date(),
      userProfilePic: userProfile.profilePicUrl
    };

    try {
      // Add comment to state
      setComments(prev => [...prev, comment]);
      setNewComment('');
      onCommentAdded(comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      setComments(prev => prev.filter(c => c.id !== comment.id));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      marginTop: '15px',
      padding: '12px',
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#cbd5e1',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💬 Comments ({comments.length})
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <img
            src={userProfile?.profilePicUrl}
            alt="You"
            style={{
              width: '32px',
              height: '32px',
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
              placeholder="Add a comment..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #555',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '14px'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '6px',
              gap: '8px'
            }}>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                style={{
                  backgroundColor: !newComment.trim() || isSubmitting ? '#555' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: !newComment.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  opacity: !newComment.trim() || isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {comments.length === 0 ? (
          <div style={{
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
            padding: '10px',
            fontStyle: 'italic'
          }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                display: 'flex',
                gap: '10px',
                padding: '8px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <img
                src={comment.userProfilePic}
                alt={comment.username}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid #444',
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#e0e0e0',
                  marginBottom: '2px'
                }}>
                  {comment.username}
                  {comment.userId === user?.uid && (
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '10px',
                      color: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      You
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#cbd5e1',
                  lineHeight: '1.4'
                }}>
                  {comment.text}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  marginTop: '4px'
                }}>
                  {comment.timestamp.toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};