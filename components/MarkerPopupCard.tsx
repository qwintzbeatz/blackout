'use client';

import { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserMarker, Comment } from '@/types';
import { User as FirebaseUser } from 'firebase/auth';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { getTimeAgo } from '@/lib/utils/dropHelpers';
import { SurfaceGraffitiSelector } from '@/components/ui/SurfaceGraffitiSelector';
import { SurfaceType, GraffitiType } from '@/types';
import { getSurfaceOptions, getGraffitiTypeOptions, getQuickRepPreview, SURFACE_TO_MARKER_NAME, GRAFFITI_TO_MARKER_DESCRIPTION } from '@/utils/typeMapping';

interface MarkerPopupCardProps {
  marker: UserMarker;
  onClose: () => void;
  user: FirebaseUser | null;
  userProfile: any;
  mapRef: React.RefObject<any>;
  expandedRadius: number;
}

export default function MarkerPopupCard({
  marker,
  onClose,
  user,
  userProfile,
  mapRef,
  expandedRadius
}: MarkerPopupCardProps) {
  const [comments, setComments] = useState<Comment[]>(marker.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(
    marker.likes?.includes(user?.uid || '') || false
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>(marker.surface || 'wall');
  const [selectedGraffitiType, setSelectedGraffitiType] = useState<GraffitiType>(marker.graffitiType || 'tag');
  const [isSaving, setIsSaving] = useState(false);
  
  const isOwner = user?.uid === marker.userId;
  
  const handleLike = async () => {
    if (!user || !marker.firestoreId) return;
    
    try {
      const markerRef = doc(db, 'markers', marker.firestoreId);
      const currentLikes = marker.likes || [];
      const updatedLikes = isLiked
        ? currentLikes.filter(id => id !== user.uid)
        : [...currentLikes, user.uid];
      
      await updateDoc(markerRef, {
        likes: updatedLikes
      });
      
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  const handleAddComment = async () => {
    if (!user || !userProfile || !newComment.trim() || !marker.firestoreId) return;
    
    try {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: user.uid,
        username: userProfile.username,
        text: newComment.trim(),
        timestamp: new Date(),
        userProfilePic: userProfile.profilePicUrl
      };
      
      const markerRef = doc(db, 'markers', marker.firestoreId);
      const currentComments = marker.comments || [];
      const updatedComments = [...currentComments, comment];
      
      await updateDoc(markerRef, {
        comments: updatedComments
      });
      
      setComments(updatedComments);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !marker.firestoreId) return;
    
    setIsSaving(true);
    try {
      const markerRef = doc(db, 'markers', marker.firestoreId);
      
      // Update marker with new surface and graffiti type
      await updateDoc(markerRef, {
        surface: selectedSurface,
        graffitiType: selectedGraffitiType,
        name: SURFACE_TO_MARKER_NAME[selectedSurface],
        description: GRAFFITI_TO_MARKER_DESCRIPTION[selectedGraffitiType],
        lastUpdated: new Date()
      });
      
      setIsEditing(false);
      // You might want to trigger a refresh of the marker data here
      // For now, just close and let the parent refresh
      alert('✅ Drop updated successfully!');
    } catch (error) {
      console.error('Error updating marker:', error);
      alert('Failed to update drop. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !marker.firestoreId || !isOwner) return;
    
    if (!window.confirm('Are you sure you want to delete this drop? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'markers', marker.firestoreId));
      alert('✅ Drop deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting marker:', error);
      alert('Failed to delete drop. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: 'white',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      zIndex: 2000,
      minWidth: '300px',
      maxWidth: '400px',
      maxHeight: '80vh',
      overflowY: 'auto',
      border: `2px solid ${marker.color}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h3 style={{ margin: 0, color: marker.color }}>
          {marker.name} by {marker.username}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#aaa',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          ×
        </button>
      </div>
      
      {/* Edit Mode */}
      {isEditing ? (
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            marginBottom: '15px'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#4dabf7', fontSize: '16px' }}>
              ✏️ Edit Drop
            </h4>
            <SurfaceGraffitiSelector
              selectedSurface={selectedSurface}
              selectedGraffitiType={selectedGraffitiType}
              onSurfaceChange={setSelectedSurface}
              onGraffitiTypeChange={setSelectedGraffitiType}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? '💾 Saving...' : '✅ Save Changes'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                flex: 1,
                background: 'rgba(107, 114, 128, 0.3)',
                border: '1px solid #6b7280',
                padding: '12px',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Marker details */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#aaa', marginBottom: '5px' }}>
              Type: <strong style={{ color: 'white' }}>{marker.description}</strong>
            </div>
            <div style={{ color: '#aaa', marginBottom: '5px' }}>
              Surface: <strong style={{ color: 'white' }}>{marker.surface || 'Wall'}</strong>
            </div>
            <div style={{ color: '#aaa', marginBottom: '5px' }}>
              Style: <strong style={{ color: 'white' }}>{marker.graffitiType || 'Tag'}</strong>
            </div>
            <div style={{ color: '#aaa', marginBottom: '5px' }}>
              Location: {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
            </div>
            <div style={{ color: '#aaa', marginBottom: '5px' }}>
              Placed: {marker.timestamp.toLocaleDateString()}
            </div>
            {marker.repEarned && (
              <div style={{ color: '#10b981', marginBottom: '5px' }}>
                REP Earned: +{marker.repEarned}
              </div>
            )}
          </div>
          
          {/* Owner Actions */}
          {isOwner && (
            <div style={{ 
              marginBottom: '15px',
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  flex: 1,
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#4dabf7',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '10px',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontWeight: 'bold',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isDeleting ? 0.7 : 1
                }}
              >
                🗑️ Delete
              </button>
            </div>
          )}
          
          {/* Like and comment section */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={handleLike}
                style={{
                  background: isLiked ? '#ef4444' : '#444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {isLiked ? '❤️' : '🤍'} {marker.likes?.length || 0}
              </button>
              
              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setView(marker.position, 18);
                    onClose();
                  }
                }}
                style={{
                  background: '#4dabf7',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Go to Marker
              </button>
            </div>
            
            {/* Comments section */}
            <div style={{ marginTop: '15px' }}>
              <div style={{ color: '#aaa', marginBottom: '10px' }}>Comments ({comments.length}):</div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '8px',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <img
                        src={comment.userProfilePic || generateAvatarUrl(comment.userId, comment.username, undefined)}
                        alt={comment.username}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%'
                        }}
                      />
                      <strong style={{ fontSize: '12px' }}>{comment.username}</strong>
                      <span style={{ fontSize: '10px', color: '#aaa', marginLeft: 'auto' }}>
                        {comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px' }}>{comment.text}</div>
                  </div>
                ))}
              </div>
              
              {user && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid #555',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      opacity: !newComment.trim() ? 0.5 : 1
                    }}
                  >
                    Post
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};