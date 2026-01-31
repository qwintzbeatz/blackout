'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { CrewId } from '@/lib/types/story';

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  profilePicUrl: string;
  rep: number;
  level: number;
  rank: string;
  totalMarkers: number;
  favoriteColor?: string;
  createdAt: Date;
  lastActive: Date;
  isSolo?: boolean;
  crewName?: string | null;
  crewId?: CrewId | null;
  isLeader?: boolean;
  unlockedTracks?: string[];
  crewJoinedAt?: Date | null;
  crewRank?: string;
  crewRep?: number;
  markersPlaced?: number;
  photosTaken?: number;
  collaborations?: number;
}

interface FirebaseUser {
  uid: string;
  email: string;
}

interface ProfilePanelProps {
  userProfile: UserProfile | null;
  user: FirebaseUser | null;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

// Optimized panel styling
const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: '#e0e0e0',
  padding: '20px',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  width: 'min(90vw, 420px)',
  maxHeight: '85vh',
  overflowY: 'auto' as const,
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(12px)',
  zIndex: 1400,
  position: 'relative' as const
};

const ProfilePanelOptimized: React.FC<ProfilePanelProps> = ({
  userProfile,
  user,
  onClose,
  onProfileUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'crew'>('stats');

  // Initialize edit profile when user profile changes
  useEffect(() => {
    if (userProfile) {
      setEditProfile({
        username: userProfile.username,
        gender: userProfile.gender,
        favoriteColor: userProfile.favoriteColor || '#10b981'
      });
    }
  }, [userProfile]);

  // Calculate rank progress
  const rankProgress = useMemo(() => {
    if (!userProfile) return { current: 0, next: 100, progress: 0 };
    
    const rep = userProfile.rep;
    let currentRank = 0;
    let nextRank = 100;
    
    if (rep >= 300) {
      currentRank = 300;
      nextRank = 500; // Next rank threshold
    } else if (rep >= 100) {
      currentRank = 100;
      nextRank = 300;
    } else {
      currentRank = 0;
      nextRank = 100;
    }
    
    const progress = ((rep - currentRank) / (nextRank - currentRank)) * 100;
    
    return { current: currentRank, next: nextRank, progress: Math.min(100, progress) };
  }, [userProfile]);

  // Save profile changes
  const handleSaveProfile = useCallback(async () => {
    if (!user || !userProfile || !auth.currentUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const updates: Partial<UserProfile> = {
        ...editProfile,
        lastActive: new Date()
      };
      
      await updateDoc(userRef, updates);
      
      // Update local state
      const updatedProfile = { ...userProfile, ...updates };
      onProfileUpdate(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, editProfile, onProfileUpdate]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    if (userProfile) {
      setEditProfile({
        username: userProfile.username,
        gender: userProfile.gender,
        favoriteColor: userProfile.favoriteColor || '#10b981'
      });
    }
  }, [userProfile]);

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: any) => {
    setEditProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  if (!userProfile || !user) {
    return (
      <div style={panelStyle}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '16px', marginBottom: '10px' }}>Profile Loading...</div>
          <div style={{ fontSize: '12px', color: '#999' }}>Please wait</div>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          🎨 Profile
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ✕
        </button>
      </div>

      {/* Profile Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '12px'
      }}>
        <img
          src={userProfile.profilePicUrl}
          alt={userProfile.username}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: `3px solid ${userProfile.favoriteColor || '#10b981'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        />
        
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              value={editProfile.username || ''}
              onChange={(e) => handleInputChange('username', e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '14px',
                width: '100%',
                marginBottom: '4px'
              }}
              maxLength={20}
            />
          ) : (
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '4px',
              color: '#ffffff'
            }}>
              {userProfile.username}
            </div>
          )}
          
          <div style={{
            fontSize: '12px',
            color: '#b0b0b0',
            marginBottom: '4px'
          }}>
            {userProfile.rank} • Level {userProfile.level}
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            color: '#b0b0b0'
          }}>
            <span>📧 {userProfile.email}</span>
            {userProfile.isSolo && <span>🎯 Solo</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '8px'
      }}>
        {(['stats', 'achievements', 'crew'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === tab 
                ? userProfile.favoriteColor || '#10b981' 
                : 'transparent',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginBottom: '20px' }}>
        {activeTab === 'stats' && (
          <div>
            {/* REP Progress */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '4px'
              }}>
                <span>🏆 Reputation</span>
                <span>{userProfile.rep} / {rankProgress.next}</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${rankProgress.progress}%`,
                  height: '100%',
                  backgroundColor: userProfile.favoriteColor || '#10b981',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {userProfile.totalMarkers || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Markers</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {userProfile.photosTaken || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Photos</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {userProfile.collaborations || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Collabs</div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {userProfile.unlockedTracks?.length || 1}
                </div>
                <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Tracks</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏅</div>
            <div style={{ fontSize: '14px', color: '#b0b0b0' }}>Achievements coming soon...</div>
          </div>
        )}

        {activeTab === 'crew' && (
          <div>
            {userProfile.isSolo ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎯</div>
                <div style={{ fontSize: '14px', color: '#b0b0b0', marginBottom: '8px' }}>
                  Playing Solo Mode
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Join a crew to unlock team features
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#ffffff'
                }}>
                  🏴 {userProfile.crewName || 'Unknown Crew'}
                </div>
                <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                  {userProfile.crewRank} • {userProfile.crewRep || 0} Crew REP
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        {isEditing ? (
          <>
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: userProfile.favoriteColor || '#10b981',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: userProfile.favoriteColor || '#10b981',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePanelOptimized;