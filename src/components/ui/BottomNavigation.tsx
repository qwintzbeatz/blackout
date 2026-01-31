'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface BottomNavigationProps {
  activePanel: string | null;
  onPanelToggle: (panel: string) => void;
  userProfile: {
    rep: number;
    level: number;
    rank: string;
    username: string;
    profilePicUrl: string;
    favoriteColor?: string;
  } | null;
  unreadCounts?: {
    messages?: number;
    crew?: number;
  };
  notificationCount?: number;
}

const BottomNavigationOptimized: React.FC<BottomNavigationProps> = ({
  activePanel,
  onPanelToggle,
  userProfile,
  unreadCounts = {},
  notificationCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Navigation items with memory-optimized configuration
  const navItems = useMemo(() => [
    {
      id: 'profile',
      icon: '👤',
      label: 'Profile',
      color: userProfile?.favoriteColor || '#10b981',
      isActive: activePanel === 'profile'
    },
    {
      id: 'music',
      icon: '🎵',
      label: 'Music',
      color: '#ff6b35',
      isActive: activePanel === 'music'
    },
    {
      id: 'map',
      icon: '🗺️',
      label: 'Map',
      color: '#2196F3',
      isActive: activePanel === 'map'
    },
    {
      id: 'photos',
      icon: '📸',
      label: 'Photos',
      color: '#9c27b0',
      isActive: activePanel === 'photos'
    },
    {
      id: 'messages',
      icon: '💬',
      label: 'Messages',
      color: '#4CAF50',
      isActive: activePanel === 'messages',
      badge: unreadCounts.messages || 0
    },
    {
      id: 'crew',
      icon: '👥',
      label: 'Crew',
      color: '#FF9800',
      isActive: activePanel === 'crew',
      badge: unreadCounts.crew || 0
    }
  ], [activePanel, userProfile, unreadCounts]);

  // Handle panel toggle with performance optimization
  const handlePanelToggle = useCallback((panelId: string) => {
    onPanelToggle(panelId);
    
    // Haptic feedback on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [onPanelToggle]);

  // Calculate REP progress to next level
  const repProgress = useMemo(() => {
    if (!userProfile) return 0;
    
    const rep = userProfile.rep;
    let progress = 0;
    
    if (rep >= 300) {
      progress = 100; // Max level
    } else if (rep >= 100) {
      progress = ((rep - 100) / 200) * 100; // Progress from 100 to 300
    } else {
      progress = (rep / 100) * 100; // Progress from 0 to 100
    }
    
    return Math.min(100, progress);
  }, [userProfile]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      zIndex: 1600,
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isExpanded ? 'translateY(0)' : 'translateY(0)'
    }}>
      {/* Main Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0',
        maxHeight: isExpanded ? '200px' : '60px',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease'
      }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handlePanelToggle(item.id)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              padding: '8px 12px',
              backgroundColor: item.isActive ? item.color : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '60px'
            }}
            onMouseEnter={(e) => {
              if (!item.isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!item.isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* Badge for notifications */}
            {item.badge && item.badge > 0 && (
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '8px',
                backgroundColor: '#ff4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: '10px',
                padding: '2px 6px',
                minWidth: '16px',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {item.badge > 99 ? '99+' : item.badge}
              </div>
            )}
            
            <div style={{
              fontSize: '20px',
              filter: item.isActive ? 'none' : 'grayscale(1)',
              opacity: item.isActive ? 1 : 0.7,
              transition: 'all 0.2s ease'
            }}>
              {item.icon}
            </div>
            
            <div style={{
              fontSize: '10px',
              color: item.isActive ? '#ffffff' : '#b0b0b0',
              fontWeight: item.isActive ? 'bold' : 'normal'
            }}>
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* Expand/Collapse Toggle */}
      {userProfile && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#b0b0b0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <img
              src={userProfile.profilePicUrl}
              alt={userProfile.username}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${userProfile.favoriteColor || '#10b981'}`
              }}
            />
            <div>
              <div style={{
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px'
              }}>
                {userProfile.username}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>{userProfile.rank}</span>
                <span>•</span>
                <span>Lv.{userProfile.level}</span>
                <span>•</span>
                <span>{userProfile.rep} REP</span>
              </div>
            </div>
          </div>
          
          {/* REP Progress Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            maxWidth: '120px'
          }}>
            <div style={{
              flex: 1,
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${repProgress}%`,
                height: '100%',
                backgroundColor: userProfile.favoriteColor || '#10b981',
                transition: 'width 0.3s ease'
              }} />
            </div>
            
            {/* Expand Toggle Icon */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            >
              ▲
            </button>
          </div>
        </div>
      )}

      {/* Notification Indicator */}
      {notificationCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff6b35',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
          animation: 'slideDown 0.3s ease',
          zIndex: 1601
        }}>
          {notificationCount} new notification{notificationCount !== 1 ? 's' : ''}
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translate(-50%, -20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        @media (max-width: 768px) {
          div {
            font-size: 10px;
          }
          
          button {
            padding: 6px 8px;
            min-width: 50px;
          }
          
          button div:first-child {
            font-size: 18px;
          }
          
          button div:last-child {
            font-size: 9px;
          }
        }
      `}</style>
    </div>
  );
};

export default BottomNavigationOptimized;