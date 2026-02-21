'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/lib/types/blackout';
import type { User as FirebaseUser } from 'firebase/auth';
import { uploadImageToImgBB } from '@/lib/services/imgbb';

// Only show cheat menu in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

interface ProfileStatsProps {
  userProfile: UserProfile | null;
  user: FirebaseUser | null;
  userMarkersCount: number;
  myMarkersCount: number;
  onProfileUpdate?: (profile: UserProfile) => void;
  onLogout?: () => void;
  onResetProfile?: () => void;
  // Cheat menu callbacks
  onUnlockRandomSpotify?: () => void;
  onUnlockRandomSoundCloud?: () => void;
  onResetSongs?: () => void;
  onUnlockAllColors?: () => void;
  onResetColors?: () => void;
  onUnlockAllGraffiti?: () => void;
  onResetGraffiti?: () => void;
  onAddRep?: (amount: number) => void;
  onMaxRep?: () => void;
  onMaxEverything?: () => void;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  userProfile,
  user,
  userMarkersCount,
  myMarkersCount,
  onProfileUpdate,
  onLogout,
  onResetProfile,
  onUnlockRandomSpotify,
  onUnlockRandomSoundCloud,
  onResetSongs,
  onUnlockAllColors,
  onResetColors,
  onUnlockAllGraffiti,
  onResetGraffiti,
  onAddRep,
  onMaxRep,
  onMaxEverything
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Determine crew color for styling
  const getCrewColor = () => {
    if (userProfile?.isSolo) return '#f59e0b'; // Amber for solo
    switch (userProfile?.crewId) {
      case 'bqc': return '#ef4444'; // Red
      case 'sps': return '#4dabf7'; // Blue
      case 'lzt': return '#10b981'; // Green
      case 'dgc': return '#8b5cf6'; // Purple
      default: return '#9ca3af'; // Gray
    }
  };

  const crewColor = getCrewColor();
  const displayName = userProfile?.isSolo ? 'ONE' : (userProfile?.crewId?.toUpperCase() || 'SOLO');

  // Handle profile picture upload
  const handleProfilePicUpload = async (file: File) => {
    if (!user || !userProfile) return;
    
    setIsUploading(true);
    try {
      const profilePicUrl = await uploadImageToImgBB(file);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePicUrl: profilePicUrl,
        lastActive: new Date()
      });
      
      if (onProfileUpdate) {
        onProfileUpdate({
          ...userProfile,
          profilePicUrl
        });
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  // Cheat button style
  const cheatButtonStyle: React.CSSProperties = {
    padding: '8px 10px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    color: '#e0e0e0',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    flex: 1
  };

  // Section header style
  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: '8px',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  if (!userProfile) return null;

  return (
    <>
      {/* Main Profile Card - Clickable */}
      <div 
        onClick={() => setShowSettings(!showSettings)}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(0,0,0,0.85)',
          color: '#e0e0e0',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: showSettings 
            ? '0 4px 20px rgba(138, 43, 226, 0.4)'
            : '0 4px 12px rgba(0,0,0,0.4)',
          border: showSettings 
            ? '1px solid rgba(138, 43, 226, 0.5)'
            : '1px solid rgba(255,255,255,0.1)',
          zIndex: 1001,
          minWidth: '200px',
          backdropFilter: 'blur(4px)',
          paddingTop: '18px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {/* License Plate */}
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '15px',
          width: '55px',
          height: '24px',
          zIndex: 1002
        }}>
          <svg 
            width="55" 
            height="24" 
            viewBox="0 0 55 24"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
          >
            <rect 
              x="2" y="2" 
              width="51" height="20" 
              rx="3" ry="3"
              fill="#1e293b"
              stroke={crewColor}
              strokeWidth="1.5"
            />
            <rect 
              x="4" y="4" 
              width="47" height="16" 
              rx="2" ry="2"
              fill="url(#plateGradient)"
              opacity="0.8"
            />
            <text
              x="27.5"
              y="16"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
              fontFamily="monospace"
              style={{ 
                textTransform: 'uppercase',
                letterSpacing: userProfile.isSolo ? '0.5px' : 'normal'
              }}
            >
              {displayName}
            </text>
            <rect 
              x="3" y="3" 
              width="49" height="18" 
              rx="2.5" ry="2.5"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
            />
            <defs>
              <linearGradient id="plateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Environment indicator - Green = Production, Red = Development */}
          <div style={{
            position: 'absolute',
            top: '26px',
            right: '5px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: showSettings ? '#8b5cf6' : (isDevelopment ? '#ef4444' : '#10b981'),
            boxShadow: `0 0 4px ${isDevelopment ? '#ef4444' : '#10b981'}`,
            animation: showSettings ? 'pulse 1s infinite' : 'none'
          }} />
        </div>
        
        {/* Profile Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <div style={{ position: 'relative' }}>
            <img
              src={userProfile.profilePicUrl}
              alt="Profile"
              style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${userProfile.isSolo ? '#f59e0b' : '#ff6b6b'}`,
                borderRadius: '0',
                objectFit: 'cover',
              }}
            />
            {/* Spray Can Drip */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              left: '-6px',
              fontSize: '16px',
              lineHeight: '1'
            }}>
              🎨
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 'bold', 
              fontSize: '14px',
              color: userProfile.isSolo ? '#f59e0b' : '#ff6b6b'
            }}>
              {userProfile.username}
            </div>
            <div style={{ 
              color: userProfile.isSolo ? '#f59e0b' : '#ff6b6b', 
              fontSize: '12px' 
            }}>
              {userProfile.rank} • Lv {userProfile.level}
            </div>
          </div>
          {/* Settings Icon */}
          <div style={{
            fontSize: '12px',
            color: showSettings ? '#8b5cf6' : '#666',
            transition: 'all 0.2s ease',
            transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ⚙️
          </div>
        </div>
        
        {/* Stats Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px'
        }}>
          <div style={{ color: '#4dabf7' }}>
            REP: {userProfile.rep || 0}
          </div>
          <div style={{ color: '#10b981' }}>
            {myMarkersCount} drops
          </div>
        </div>
        
        {/* Crew/Solo Status */}
        <div style={{
          marginTop: '8px',
          fontSize: '9px',
          color: userProfile.isSolo ? '#f59e0b' : '#10b981',
          textAlign: 'center',
          backgroundColor: userProfile.isSolo ? 
            'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          padding: '2px 4px',
          borderRadius: '3px',
          border: userProfile.isSolo ? 
            '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          {userProfile.isSolo ? '🎯 SOLO' : `👥 ${userProfile.crewName || 'CREW'}`}
        </div>

        {/* Tap hint */}
        <div style={{
          marginTop: '6px',
          fontSize: '9px',
          color: '#666',
          textAlign: 'center',
          opacity: showSettings ? 0 : 1,
          transition: 'opacity 0.2s ease'
        }}>
          {isDevelopment ? 'Tap for cheats' : 'Tap for settings'}
        </div>
      </div>

      {/* Cheat Menu Dropdown Panel */}
      {showSettings && (
        <div style={{
          position: 'absolute',
          top: '135px',
          right: '20px',
          background: 'rgba(15, 10, 30, 0.98)',
          color: '#e0e0e0',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 8px 30px rgba(138, 43, 226, 0.4)',
          border: '1px solid rgba(138, 43, 226, 0.4)',
          zIndex: 1000,
          minWidth: '280px',
          maxWidth: '320px',
          backdropFilter: 'blur(12px)',
          animation: 'slideIn 0.2s ease-out',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(138, 43, 226, 0.3)'
          }}>
            <h4 style={{ margin: 0, color: '#8b5cf6', fontSize: '18px', textAlign: 'center' }}>
              {isDevelopment ? '🎮 CHEAT MENU' : '⚙️ SETTINGS'}
            </h4>
          </div>

          {/* Profile Picture Upload */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#94a3b8', 
              marginBottom: '6px',
              fontWeight: 'bold'
            }}>
              📸 Profile Picture
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <img
                src={userProfile.profilePicUrl}
                alt="Profile"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  border: '2px solid #8b5cf6',
                  objectFit: 'cover'
                }}
              />
              <label style={{
                flex: 1,
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: '10px',
                color: '#94a3b8',
                transition: 'all 0.2s ease'
              }}>
                {isUploading ? 'Uploading...' : 'Click to upload'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProfilePicUpload(file);
                  }}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* 🎵 MUSIC CHEATS - Development Only */}
          {isDevelopment && (
            <>
              <div style={sectionHeaderStyle}>
                🎵 MUSIC CHEATS
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onUnlockRandomSpotify?.(); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(29, 185, 84, 0.4)', color: '#1DB954' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(29, 185, 84, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🎵 +Spotify
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onUnlockRandomSoundCloud?.(); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(255, 85, 0, 0.4)', color: '#ff5500' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 85, 0, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🔊 +SoundCloud
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onResetSongs?.(); }}
                  style={{ ...cheatButtonStyle, flex: 'none', padding: '6px 12px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🧹 Reset Songs
                </button>
              </div>
            </>
          )}

          {/* 🎨 COLOR CHEATS - Development Only */}
          {isDevelopment && (
            <>
              <div style={sectionHeaderStyle}>
                🎨 COLOR CHEATS
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onUnlockAllColors?.(); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🌈 Unlock All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onResetColors?.(); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🧹 Reset
                </button>
              </div>
            </>
          )}

          {/* 🖌️ GRAFFITI CHEATS - Development Only */}
          {isDevelopment && (
            <>
              <div style={sectionHeaderStyle}>
                🖌️ GRAFFITI CHEATS
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onUnlockAllGraffiti?.(); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(139, 92, 246, 0.4)', color: '#8b5cf6' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🔥 Unlock All
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onResetGraffiti?.(); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  🧹 Reset
                </button>
              </div>
            </>
          )}

          {/* ⭐ REP CHEATS - Development Only */}
          {isDevelopment && (
            <>
              <div style={sectionHeaderStyle}>
                ⭐ REP CHEATS
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddRep?.(100); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  +100 REP
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddRep?.(500); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(251, 191, 36, 0.4)', color: '#fbbf24' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  +500 REP
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMaxRep?.(); }}
                  style={{ ...cheatButtonStyle, borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  MAX
                </button>
              </div>
            </>
          )}

          {/* 🔧 OTHER - Development Only */}
          {isDevelopment && (
            <button
              onClick={(e) => { e.stopPropagation(); onMaxEverything?.(); }}
              style={{
                width: '100%',
                padding: '10px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '8px',
                color: '#ec4899',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))'}
              onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))'}
            >
              🚀 MAX EVERYTHING
            </button>
          )}

          {/* Account Actions */}
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {onLogout && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                🚪 Sign Out
              </button>
            )}
            
            {onResetProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(false);
                  onResetProfile();
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Reset Profile
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default ProfileStats;