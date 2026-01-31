'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface MarkerData {
  id: string;
  position: [number, number];
  name: string;
  description: string;
  color: string;
  timestamp: Date;
  userId?: string;
  username?: string;
  userProfilePic?: string;
  repEarned?: number;
  distanceFromUser?: number;
  likes?: string[];
  comments?: Array<{
    id: string;
    userId: string;
    username: string;
    text: string;
    timestamp: Date;
  }>;
}

interface MarkerPopupCardProps {
  marker: MarkerData;
  currentUserId?: string;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<MarkerData>) => void;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
  onComment?: (id: string, comment: string) => void;
}

const MarkerPopupCardOptimized: React.FC<MarkerPopupCardProps> = ({
  marker,
  currentUserId,
  onClose,
  onUpdate,
  onDelete,
  onLike,
  onComment
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(marker.name);
  const [editDescription, setEditDescription] = useState(marker.description);
  const [editColor, setEditColor] = useState(marker.color);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isOwner = currentUserId === marker.userId;
  const isLiked = marker.likes?.includes(currentUserId || '');

  // Calculate time ago
  const timeAgo = useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - marker.timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  }, [marker.timestamp]);

  // Color options
  const colorOptions = [
    '#10b981', '#ef4444', '#4dabf7', '#8b5cf6',
    '#f97316', '#ec4899', '#000000', '#fbbf24'
  ];

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (onUpdate) {
      onUpdate(marker.id, {
        name: editName,
        description: editDescription,
        color: editColor
      });
      setIsEditing(false);
    }
  }, [marker.id, editName, editDescription, editColor, onUpdate]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (onDelete && window.confirm('Delete this marker?')) {
      onDelete(marker.id);
    }
  }, [marker.id, onDelete]);

  // Handle like
  const handleLike = useCallback(() => {
    if (onLike) {
      onLike(marker.id);
    }
  }, [marker.id, onLike]);

  // Handle comment
  const handleComment = useCallback(() => {
    if (onComment && commentText.trim()) {
      onComment(marker.id, commentText.trim());
      setCommentText('');
    }
  }, [marker.id, commentText, onComment]);

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '16px',
      width: 'min(90vw, 320px)',
      maxWidth: '320px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px'
          }}>
            {marker.userProfilePic && (
              <img
                src={marker.userProfilePic}
                alt={marker.username}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#ffffff'
              }}>
                {marker.username || 'Anonymous'}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#b0b0b0'
              }}>
                {timeAgo}
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '2px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      {isEditing ? (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: '#b0b0b0',
              marginBottom: '2px'
            }}>
              Name
            </label>
            <select
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#ffffff'
              }}
            >
              <option value="Pole">Pole</option>
              <option value="Sign">Sign</option>
              <option value="E.Box">E.Box</option>
              <option value="Fence">Fence</option>
              <option value="Wall">Wall</option>
              <option value="Shutter">Shutter</option>
              <option value="Sewer">Sewer</option>
              <option value="Rooftop">Rooftop</option>
              <option value="Ground">Ground</option>
              <option value="Train">Train</option>
              <option value="Bridge">Bridge</option>
              <option value="Traffic Light">Traffic Light</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Post Box">Post Box</option>
              <option value="Speed Camera">Speed Camera</option>
              <option value="ATM Machine">ATM Machine</option>
              <option value="Bus Stop">Bus Stop</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: '#b0b0b0',
              marginBottom: '2px'
            }}>
              Type
            </label>
            <select
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#ffffff'
              }}
            >
              <option value="Sticker/Slap">Sticker/Slap</option>
              <option value="Stencil/Brand/Stamp">Stencil/Brand/Stamp</option>
              <option value="Tag/Signature">Tag/Signature</option>
              <option value="Etch/Scribe/Scratch">Etch/Scribe/Scratch</option>
              <option value="Throw-Up">Throw-Up</option>
              <option value="Paste-Up/Poster">Paste-Up/Poster</option>
              <option value="Piece/Bombing">Piece/Bombing</option>
              <option value="Burner/Heater">Burner/Heater</option>
              <option value="Roller/Blockbuster">Roller/Blockbuster</option>
              <option value="Extinguisher">Extinguisher</option>
              <option value="Mural">Mural</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{
              display: 'block',
              fontSize: '10px',
              color: '#b0b0b0',
              marginBottom: '2px'
            }}>
              Color
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '4px'
            }}>
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => setEditColor(color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: color,
                    border: editColor === color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ff6b35',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '11px',
            color: '#ffffff',
            marginBottom: '2px'
          }}>
            {marker.name}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#b0b0b0'
          }}>
            {marker.description}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#b0b0b0',
        marginBottom: '8px'
      }}>
        <div>
          {marker.distanceFromUser && `Distance: ${Math.round(marker.distanceFromUser)}m`}
        </div>
        <div>
          {marker.repEarned && `+${marker.repEarned} REP`}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleLike}
            style={{
              padding: '4px 8px',
              backgroundColor: isLiked ? '#ff6b35' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isLiked ? '❤️' : '🤍'} {marker.likes?.length || 0}
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              padding: '4px 8px',
              backgroundColor: showComments ? '#ff6b35' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            💬 {marker.comments?.length || 0}
          </button>
        </div>
        
        {isOwner && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ff6b6b',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '8px'
        }}>
          {/* Comment Input */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '8px'
          }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              style={{
                flex: 1,
                padding: '6px 8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              style={{
                padding: '6px 12px',
                backgroundColor: commentText.trim() ? '#ff6b35' : 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: commentText.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Post
            </button>
          </div>
          
          {/* Comments List */}
          {marker.comments && marker.comments.length > 0 && (
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {marker.comments.map(comment => (
                <div key={comment.id} style={{
                  marginBottom: '6px',
                  padding: '6px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#ffffff'
                    }}>
                      {comment.username}
                    </span>
                    <span style={{
                      fontSize: '8px',
                      color: '#b0b0b0'
                    }}>
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: '#e0e0e0'
                  }}>
                    {comment.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkerPopupCardOptimized;