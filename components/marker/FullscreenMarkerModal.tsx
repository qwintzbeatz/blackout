'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Drop } from '@/lib/types/blackout';
import { User as FirebaseUser } from 'firebase/auth';
import { likeDrop, unlikeDrop, addCommentToDrop, getCommentsForDrop, DropComment, updateDrop, deleteDrop } from '@/lib/firebase/drops';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { getTimeAgo } from '@/lib/utils/dropHelpers';
import { SurfaceGraffitiSelector } from '@/components/ui/SurfaceGraffitiSelector';
import { SurfaceType, GraffitiType } from '@/types';
import { SURFACE_TO_MARKER_NAME, GRAFFITI_TO_MARKER_DESCRIPTION, getSurfaceDisplayName, getGraffitiDisplayName, getSurfaceOptions, getGraffitiTypeOptions } from '@/utils/typeMapping';
import { getStyleById } from '@/constants/graffitiFonts';
import { GRAFFITI_TYPES } from '@/constants/graffitiTypes';
import { fetchPlayerProfile, getPlayerCardData, formatLastActive } from '@/lib/utils/playerProfile';
import { getCrewTheme } from '@/utils/crewTheme';
import { getRankColor } from '@/utils/repCalculator';

interface FullscreenMarkerModalProps {
  drop: Drop;
  user: FirebaseUser | null;
  isOpen: boolean;
  onClose: () => void;
  onLikeUpdate: (dropId: string, newLikes: string[]) => void;
  onEditComplete?: () => void;
  userProfile?: {
    username?: string;
    profilePicUrl?: string;
  };
}

const FullscreenMarkerModal: React.FC<FullscreenMarkerModalProps> = ({
  drop,
  user,
  isOpen,
  onClose,
  onLikeUpdate,
  onEditComplete,
  userProfile
}) => {
  const [isLiked, setIsLiked] = useState(drop.likes?.includes(user?.uid || '') || false);
  const [likeCount, setLikeCount] = useState(drop.likes?.length || 0);
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<DropComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>((drop as any).surface || 'wall');
  const [selectedGraffitiType, setSelectedGraffitiType] = useState<GraffitiType>((drop as any).graffitiType || 'tag');
  const [isSaving, setIsSaving] = useState(false);
  
  // Dynamic display values that update when editing
  const [displaySurface, setDisplaySurface] = useState<SurfaceType>((drop as any).surface || 'wall');
  const [displayGraffitiType, setDisplayGraffitiType] = useState<GraffitiType>((drop as any).graffitiType || 'tag');
  
  // Player profile state for enhanced popup
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [isLoadingPlayerProfile, setIsLoadingPlayerProfile] = useState(false);

  const isOwner = user?.uid === drop.createdBy;

  // Update display values to always reflect current state
  useEffect(() => {
    if (isEditing) {
      setDisplaySurface(selectedSurface);
      setDisplayGraffitiType(selectedGraffitiType);
    } else {
      // Show current drop values when not editing
      setDisplaySurface((drop as any).surface || 'wall');
      setDisplayGraffitiType((drop as any).graffitiType || 'tag');
    }
  }, [isEditing, selectedSurface, selectedGraffitiType, drop.surface, drop.graffitiType]);

  // Load comments when opening comment section
  useEffect(() => {
    if (isCommenting && comments.length === 0) {
      loadComments();
    }
  }, [isCommenting]);

  // Fetch player profile when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchPlayerData = async () => {
        if (!drop.createdBy) return;
        
        setIsLoadingPlayerProfile(true);
        try {
          const profile = await fetchPlayerProfile(drop.createdBy);
          if (profile) {
            setPlayerProfile(profile);
          }
        } catch (error) {
          console.error('Error fetching player profile:', error);
        } finally {
          setIsLoadingPlayerProfile(false);
        }
      };

      fetchPlayerData();
    }
  }, [isOpen, drop.createdBy]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsCommenting(false);
      setComments([]);
      setIsEditing(false);
      setPlayerProfile(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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

  const handleSaveEdit = async () => {
    if (!user) return;
    
    const firestoreId = drop.firestoreId || drop.id;
    if (!firestoreId) return;

    setIsSaving(true);
    try {
      await updateDrop(firestoreId, {
        surface: selectedSurface as any,
        graffitiType: selectedGraffitiType as any,
      });
      
      setIsEditing(false);
      alert('✅ Drop updated successfully!');
      
      // Notify parent component that edit is complete so it can refresh
      if (onEditComplete) {
        onEditComplete();
      }
    } catch (error) {
      console.error('Error updating drop:', error);
      alert('Failed to update drop. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !isOwner) return;
    
    const firestoreId = drop.firestoreId || drop.id;
    if (!firestoreId) return;

    if (!window.confirm('Are you sure you want to delete this drop? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDrop(firestoreId);
      alert('✅ Drop deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting drop:', error);
      alert('Failed to delete drop. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Comment section component
  const CommentSection = () => (
    <div style={{
      marginTop: '24px',
      padding: '20px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Comments header */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#cbd5e1',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💬 Comments ({comments.length})
      </div>

      {/* Comment form */}
      <form onSubmit={handlePostComment} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <img
            src={user?.photoURL || generateAvatarUrl(user?.uid || 'default', user?.displayName || 'User')}
            alt="You"
            style={{
              width: '40px',
              height: '40px',
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
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #555',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                minHeight: '48px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="submit"
                disabled={!user || !newComment.trim() || isPostingComment}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (!user || !newComment.trim() || isPostingComment) ? '#555' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!user || !newComment.trim() || isPostingComment) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: (!user || !newComment.trim() || isPostingComment) ? 0.7 : 1
                }}
              >
                {isPostingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoadingComments ? (
          <div style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px', fontStyle: 'italic' }}>
            No comments yet. Be the first!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '8px'
              }}
            >
              <img
                src={comment.userProfilePic || generateAvatarUrl(comment.userId, comment.username)}
                alt={comment.username}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #444',
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e0e0e0', marginBottom: '4px' }}>
                  {comment.username}
                </div>
                <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {comment.text}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  {comment.timestamp.toLocaleDateString()} • {comment.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Enhanced Player Card Component
  const PlayerCard = () => {
    if (isLoadingPlayerProfile) {
      return (
        <div style={{
          padding: '20px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '16px', color: '#94a3b8' }}>
            Loading player info...
          </div>
        </div>
      );
    }

    if (!playerProfile) {
      return null;
    }

    const crewTheme = getCrewTheme(playerProfile.crewId);
    const rankColor = getRankColor(playerProfile.rank);
    
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        marginBottom: '24px',
        border: `2px solid ${crewTheme.primary}30`,
        backdropFilter: 'blur(10px)'
      }}>
        {/* Player Header with Crew Color */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={playerProfile.profilePicUrl || generateAvatarUrl(playerProfile.uid, playerProfile.username, playerProfile.gender)}
              alt={playerProfile.username}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: `3px solid ${crewTheme.primary}`,
                objectFit: 'cover',
                boxShadow: `0 0 0 4px rgba(${parseInt(crewTheme.primary.slice(1, 3), 16)}, ${parseInt(crewTheme.primary.slice(3, 5), 16)}, ${parseInt(crewTheme.primary.slice(5, 7), 16)}, 0.3)`
              }}
            />
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '24px',
                color: crewTheme.primary,
                textShadow: `0 2px 4px ${crewTheme.primary}50`
              }}>
                {playerProfile.username}
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>
                {getTimeAgo(drop.timestamp)}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(5px)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            ✕
          </button>
        </div>

        {/* Player Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #444',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              🏆 RANK
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: rankColor,
              textTransform: 'uppercase'
            }}>
              {playerProfile.rank}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #444',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              📊 LEVEL
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#e0e0e0'
            }}>
              {playerProfile.level}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #444',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              💰 REP
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {playerProfile.rep}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid #444',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              🎨 MARKERS
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#8b5cf6'
            }}>
              {playerProfile.totalMarkers}
            </div>
          </div>
        </div>

        {/* Crew Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: `${crewTheme.primary}10`,
          borderRadius: '12px',
          border: `1px solid ${crewTheme.primary}30`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: crewTheme.primary,
              boxShadow: `0 0 8px ${crewTheme.primary}`
            }}></div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>
              {playerProfile.crewName || (playerProfile.isSolo ? 'Solo Writer' : 'No Crew')}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            Last active: {formatLastActive(playerProfile.lastActive)}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'modalFadeIn 0.3s ease-out'
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        color: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'modalSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overflow: 'hidden'
      }}>
        
        {/* Header Section */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent)'
        }}>
          <PlayerCard />
        </div>

        {/* Main Content Section */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {isEditing ? (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#4dabf7', fontSize: '18px', fontWeight: 'bold' }}>
                  ✏️ Edit Drop
                </h4>
                <SurfaceGraffitiSelector
                  selectedSurface={selectedSurface}
                  selectedGraffitiType={selectedGraffitiType}
                  onSurfaceChange={(surface) => {
                    setSelectedSurface(surface);
                    setDisplaySurface(surface);
                  }}
                  onGraffitiTypeChange={(graffitiType) => {
                    setSelectedGraffitiType(graffitiType);
                    setDisplayGraffitiType(graffitiType);
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => !isSaving && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {isSaving ? '💾 Saving...' : '✅ Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(107, 114, 128, 0.3)',
                    border: '1px solid #6b7280',
                    padding: '14px',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Marker Info */}
              <div style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                marginBottom: '24px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    📍 Location Tag
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', color: '#cbd5e1' }}>
                    🎨 Type: <span style={{ color: drop.color || '#4dabf7', fontWeight: 'bold' }}>
                      {displayGraffitiType ? (() => {
                        const options = getGraffitiTypeOptions();
                        const option = options.find(opt => opt.value === displayGraffitiType);
                        return option ? `${option.icon} ${option.label}` : getGraffitiDisplayName(displayGraffitiType);
                      })() : 'Signature Tag'}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    padding: '6px 12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    borderRadius: '20px',
                    fontWeight: 'bold'
                  }}>
                    {drop.repEarned || 5} REP
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
                  Surface: <span style={{ color: '#e0e0e0' }}>{displaySurface ? (() => {
                    const options = getSurfaceOptions();
                    const option = options.find(opt => opt.value === displaySurface);
                    return option ? `${option.icon} ${option.label}` : getSurfaceDisplayName(displaySurface);
                  })() : 'Wall'}</span>
                </div>
                
                {/* Style Variant Display */}
                {(drop as any).styleVariantId && (() => {
                  const style = getStyleById((drop as any).styleVariantId);
                  if (!style) return null;
                  const graffitiConfig = GRAFFITI_TYPES[style.graffitiType];
                  return (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: `${drop.color || '#4dabf7'}10`,
                      borderRadius: '8px',
                      border: `1px solid ${drop.color || '#4dabf7'}30`
                    }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                        🎨 Style Variant
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>{graffitiConfig?.icon || '🎨'}</span>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: drop.color || '#4dabf7' }}>
                            {style.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {graffitiConfig?.label} • Variant {style.variant}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#4dabf7',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ✏️ Edit Drop
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      borderRadius: '8px',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      opacity: isDeleting ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    🗑️ Delete Drop
                  </button>
                </div>
              )}

              {/* Location */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '8px', fontWeight: 'bold' }}>
                  📍 Coordinates
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #444'
                }}>
                  {drop.lat?.toFixed(6)}, {drop.lng?.toFixed(6)}
                </div>
              </div>

              {/* Comments Section */}
              {isCommenting && <CommentSection />}

              {/* User ownership indicator */}
              {isOwner && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#4dabf7',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  ✨ Your Drop
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(0deg, rgba(255,255,255,0.05), transparent)'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleLike}
                disabled={!user}
                style={{
                  padding: '12px 20px',
                  background: isLiked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.07)',
                  border: isLiked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                  color: isLiked ? '#ef4444' : 'white',
                  borderRadius: '8px',
                  cursor: user ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  opacity: user ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => user && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {isLiked ? '❤️' : '🤍'} {likeCount}
              </button>
              
              <button
                onClick={() => setIsCommenting(!isCommenting)}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#4dabf7',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                💬 {isCommenting ? 'Hide' : 'Show'} Comments
              </button>
            </div>
            
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🚪 Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes modalFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        /* Custom scrollbar for the modal content */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

export default FullscreenMarkerModal;