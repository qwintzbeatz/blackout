'use client';

import React from 'react';
import { UserProfile } from '@/lib/types/blackout';
import type { User as FirebaseUser } from 'firebase/auth';

interface ProfileStatsProps {
  userProfile: UserProfile | null;
  user: FirebaseUser | null;
  userMarkersCount: number;
  myMarkersCount: number;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  userProfile,
  user,
  userMarkersCount,
  myMarkersCount
}) => {
  if (!userProfile) return null;

  // Determine crew color for styling
  const getCrewColor = () => {
    if (userProfile.isSolo) return '#f59e0b'; // Amber for solo
    switch (userProfile.crewId) {
      case 'bqc': return '#ef4444'; // Red
      case 'sps': return '#4dabf7'; // Blue
      case 'lzt': return '#10b981'; // Green
      case 'dgc': return '#8b5cf6'; // Purple
      default: return '#9ca3af'; // Gray
    }
  };

  const crewColor = getCrewColor();
  const displayName = userProfile.isSolo ? 'ONE' : (userProfile.crewId?.toUpperCase() || 'SOLO');

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0,0,0,0.85)',
      color: '#e0e0e0',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 1001,
      minWidth: '200px',
      backdropFilter: 'blur(4px)',
      paddingTop: '18px'
    }}>
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
        
        {/* Status dot */}
        <div style={{
          position: 'absolute',
          top: '26px',
          right: '5px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: crewColor,
          boxShadow: '0 0 4px currentColor'
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
        <div>
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
    </div>
  );
};

export default ProfileStats;