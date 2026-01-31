'use client';

import React, { useState, useCallback, useMemo } from 'react';
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

// Panel styling
const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#e0e0e0',
  padding: '16px',
  borderRadius: '12px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  width: 'min(110vw, 400px)',
  maxHeight: '75vh',
  overflowY: 'auto' as const,
  border: '1px solid rgba(255,255,255,0.15)',
  backdropFilter: 'blur(8px)',
  zIndex: 1200,
  position: 'relative' as 'relative'
};

// Marker colors
const MARKER_COLORS = [
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#4dabf7' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Gray', value: '#6b7280' }
] as const;

export const ProfilePanel: React.FC<ProfilePanelProps> = React.memo(({
  userProfile,
  user,
  onClose,
  onProfileUpdate
}) => {
  const [profileUsername, setProfileUsername] = useState('');
  const [profileGender, setProfileGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');
  const [selectedMarkerColor, setSelectedMarkerColor] = useState('#10b981');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with current profile data
  React.useEffect(() => {
    if (userProfile) {
      setProfileUsername(userProfile.username);
      setProfileGender(userProfile.gender);
      setSelectedMarkerColor(userProfile.favoriteColor || '#10b981');
    }
  }, [userProfile]);

  // Save favorite color
  const saveFavoriteColor = useCallback(async (color: string): Promise<void> => {
    if (!user || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favoriteColor: color
      });
      
      onProfileUpdate({
        ...userProfile,
        favoriteColor: color
      });
    } catch (error) {
      console.error('Error saving favorite color:', error);
    }
  }, [user, userProfile, onProfileUpdate]);

  // Calculate level progress
  const levelProgress = useMemo(() => {
    if (!userProfile) return 0;
    const currentRep = userProfile.rep;
    const nextLevelRep = Math.ceil(currentRep / 100) * 100;
    return ((currentRep % 100) / 100) * 100;
  }, [userProfile]);

  // Stats calculations
  const stats = useMemo(() => {
    if (!userProfile) return null;
    
    return {
      rankColor: userProfile.rank === 'WRITER' ? '#10b981' : 
                userProfile.rank === 'VANDAL' ? '#f59e0b' : '#6b7280',
      nextRankRep: userProfile.rank === 'WRITER' ? 300 : 
                    userProfile.rank === 'VANDAL' ? 100 : 100,
      repToNextRank: userProfile.rank === 'TOY' ? 100 - userProfile.rep :
                      userProfile.rank === 'VANDAL' ? 300 - userProfile.rep :
                      999999 // Already highest rank
    };
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div style={{
        ...panelStyle,
        position: 'fixed' as 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>👤</div>
          <div style={{ color: '#666' }}>Profile not loaded</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...panelStyle,
      position: 'fixed' as 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '450px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
        paddingBottom: '10px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#10b981', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>👤</span>
          Profile Settings
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Profile Picture */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <img
          src={userProfile.profilePicUrl}
          alt={userProfile.username}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: `3px solid ${userProfile.favoriteColor || '#10b981'}`,
            objectFit: 'cover',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = generateAvatarUrl(userProfile.uid, userProfile.username, userProfile.gender, 80);
          }}
        />
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
          {userProfile.username}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {userProfile.rep}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            REP
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4dabf7' }}>
            {userProfile.level}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            LVL
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {userProfile.totalMarkers}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            TAGS
          </div>
        </div>
      </div>

      {/* Rank and Progress */}
      <div style={{
        marginBottom: '25px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div>
            <span style={{ fontSize: '14px', color: '#666' }}>Current Rank: </span>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: stats?.rankColor || '#6b7280',
              marginLeft: '8px'
            }}>
              {userProfile.rank}
            </span>
          </div>
          
          {stats && stats.repToNextRank < 999999 && (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {stats.repToNextRank} REP to {userProfile.rank === 'TOY' ? 'VANDAL' : 'WRITER'}
            </div>
          )}
        </div>
        
        {/* Level Progress Bar */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '6px',
          height: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            width: `${levelProgress}%`,
            height: '100%',
            backgroundColor: '#10b981',
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>

      {/* Crew Info */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h4 style={{ 
          margin: '0 0 10px 0', 
          color: '#e0e0e0', 
          fontSize: '14px' 
        }}>
          Crew Status
        </h4>
        <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>Status: </span>
            <span style={{ 
              color: userProfile.isSolo ? '#f59e0b' : '#10b981',
              fontWeight: 'bold'
            }}>
              {userProfile.isSolo ? '🔥 Solo Writer' : `👥 ${userProfile.crewName || 'No Crew'}`}
            </span>
          </div>
          {userProfile.crewRank && (
            <div>
              <span style={{ color: '#666' }}>Crew Rank: </span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                {userProfile.crewRank}
              </span>
            </div>
          )}
          {userProfile.crewRep !== undefined && (
            <div>
              <span style={{ color: '#666' }}>Crew REP: </span>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                {userProfile.crewRep}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Favorite Color */}
      <div style={{
        marginBottom: '25px'
      }}>
        <h4 style={{ 
          margin: '0 0 15px 0', 
          color: '#e0e0e0', 
          fontSize: '14px' 
        }}>
          Favorite Marker Color
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px'
        }}>
          {MARKER_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => {
                setSelectedMarkerColor(color.value);
                saveFavoriteColor(color.value);
              }}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: selectedMarkerColor === color.value ? 
                  '3px solid #ff6b6b' : '2px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: selectedMarkerColor === color.value ? 
                  `${color.value}20` : 'rgba(255,255,255,0.05)'
              }}
              onMouseEnter={(e) => {
                if (selectedMarkerColor !== color.value) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedMarkerColor !== color.value) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                }
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: color.value,
                border: '2px solid rgba(255,255,255,0.3)',
                marginBottom: '4px'
              }}></div>
              <span style={{ fontSize: '10px', color: '#e0e0e0' }}>
                {color.name}
              </span>
              {selectedMarkerColor === color.value && (
                <div style={{
                  fontSize: '10px',
                  color: '#ff6b6b',
                  fontWeight: 'bold'
                }}>
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div style={{
        fontSize: '12px',
        color: '#666',
        textAlign: 'center',
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '6px'
      }}>
        <div style={{ marginBottom: '5px' }}>
          Member since: {new Date(userProfile.createdAt).toLocaleDateString()}
        </div>
        <div style={{ marginBottom: '5px' }}>
          Last active: {new Date(userProfile.lastActive).toLocaleDateString()}
        </div>
        <div>
          Unlocked tracks: {userProfile.unlockedTracks?.length || 0}
        </div>
      </div>
    </div>
  );
});

ProfilePanel.displayName = 'ProfilePanel';