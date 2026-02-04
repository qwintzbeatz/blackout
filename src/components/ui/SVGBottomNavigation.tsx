'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { useSVGPreloader, useDebounce, useAccessibility } from '../hooks';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  isActive: boolean;
  position: { left: string };
  badge?: number;
}

interface SVGBottomNavigationProps {
  activePanel: string | null;
  onPanelToggle: (panel: string) => void;
  userProfile: {
    rep: number;
    level: number;
    rank: string;
    username: string;
    profilePicUrl: string;
    favoriteColor?: string;
    crewId?: string;
  } | null;
  unreadCounts?: {
    messages?: number;
    crew?: number;
    photos?: number;
    blackbook?: number;
  };
  notificationCount?: number;
}

const SVGBottomNavigation: React.FC<SVGBottomNavigationProps> = memo(({
  activePanel,
  onPanelToggle,
  userProfile,
  unreadCounts = {},
  notificationCount = 0
}) => {
  const [svgLoaded, setSvgLoaded] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);

  // Preload SVG on mount
  const { preloadSVG } = useSVGPreloader('/bobottomnav.svg');

  // Use debounced callbacks
  const debouncedPanelToggle = useDebounce(onPanelToggle, 200);
  const debouncedHandleKeyDown = useAccessibility();

  // Crew color mapping
  const CREW_COLORS = useMemo(() => ({
    bqc: '#ffffff',      // White (as requested)
    sps: '#4dabf7',      // Blue
    lzt: '#10b981',      // Green  
    dgc: '#8b5cf6',      // Purple
    solo: '#f59e0b'      // Gold
  }), []);

  // Get crew color for glow effect
  const getCrewColor = useCallback(() => {
    if (!userProfile) return '#f59e0b'; // Default to solo gold
    return CREW_COLORS[userProfile.crewId || 'solo'];
  }, [userProfile, CREW_COLORS]);

  // Navigation items with enhanced accessibility
  const navItems = useMemo(() => [
    {
      id: 'map',
      icon: '🗺️',
      label: 'Map',
      color: '#2196F3',
      isActive: activePanel === 'map',
      position: { left: '15%' },
      'aria-label': 'Map view - View map controls and layers',
      'aria-expanded': activePanel === 'map' ? 'true' : 'false',
      'aria-selected': activePanel === 'map' ? 'true' : 'false'
    },
    {
      id: 'blackbook',
      icon: '📓',
      label: 'Blackbook',
      color: userProfile?.favoriteColor || '#10b981',
      isActive: activePanel === 'blackbook',
      position: { left: '35%' },
      badge: unreadCounts.blackbook || 0,
      'aria-label': 'Blackbook - View your marker collection and statistics',
      'aria-expanded': activePanel === 'blackbook' ? 'true' : 'false'
    },
    {
      id: 'photos',
      icon: '📸',
      label: 'Photos',
      color: '#9c27b0',
      isActive: activePanel === 'photos',
      position: { left: '65%' },
      badge: unreadCounts.photos || 0,
      'aria-label': 'Photos - View your photo collection and camera',
      'aria-expanded': activePanel === 'photos' ? 'true' : 'false'
    },
    {
      id: 'crew',
      icon: '👥',
      label: 'Crewchat',
      color: '#FF9800',
      isActive: activePanel === 'crew',
      position: { left: '85%' },
      badge: unreadCounts.crew || 0,
      'aria-label': 'Crewchat - Open crew chat with unread messages',
      'aria-expanded': activePanel === 'crew' ? 'true' : 'false'
    }
  ], [activePanel, userProfile, unreadCounts]);

  // Handle SVG errors with logging
  const handleSvgError = useCallback(() => {
    setSvgLoaded(false);
    console.warn('SVG navigation background failed to load, using fallback');
  }, []);

  // Render button with enhanced accessibility
  const renderButton = useCallback((item: NavItem) => {
    return (
      <button
        key={item.id}
        onClick={() => debouncedPanelToggle(item.id)}
        onKeyDown={debouncedHandleKeyDown}
        style={{
          position: 'absolute',
          bottom: '5px',
          left: item.position.left,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          padding: '10px 12px',
          backgroundColor: item.isActive ? item.color : 'rgba(255,255,255,0.1)',
          border: item.isActive ? `2px solid ${item.color}` : '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '70px',
          height: '50px',
          touchAction: 'manipulation',
          role: 'button',
          'aria-label': `${item.label} - ${item.isActive ? 'Open' : 'Closed'}`,
          'aria-expanded': item.isActive ? 'true' : 'false',
          'aria-selected': item.isActive ? 'true' : 'false'
        }}
        onMouseEnter={(e) => {
          if (!item.isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,255,255,0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!item.isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
          }
        }}
      >
        {/* Notification Badge */}
        {item.badge && item.badge > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '2px',
              right: '4px',
              backgroundColor: '#ff4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '2px 5px',
              minWidth: '14px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              zIndex: 10,
              animation: 'pulse 2s infinite',
              ariaLive: 'polite',
              aria-label: `${item.badge} unread ${item.label === 'Crewchat' ? 'messages' : 'items'}`
            }}
          >
            {item.badge > 99 ? '99+' : item.badge}
          </div>
        )}
        
        {/* Icon with enhanced colors */}
        <div style={{
          fontSize: '18px',
          filter: item.isActive ? 'none' : 'grayscale(0.3)',
          opacity: item.isActive ? 1 : 0.8,
          transition: 'all 0.2s ease',
          transform: item.isActive ? 'scale(1.1)' : 'scale(1)',
          textShadow: item.isActive ? `0 0 10px ${item.color}` : 'none'
        }}>
          {item.icon}
        </div>
        
        {/* Label */}
        <div style={{
          fontSize: '10px',
          color: item.isActive ? '#ffffff' : '#b0b0b0',
          fontWeight: item.isActive ? 'bold' : 'normal',
          textShadow: item.isActive ? `0 0 8px ${item.color}` : 'none',
          textAlign: 'center'
        }}>
          {item.label}
        </div>
      </button>
    );
  }, [debouncedPanelToggle]);

  // User profile with enhanced accessibility
  const renderUserProfile = useCallback(() => {
    if (!userProfile) return null;

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '65px',
          left: '5%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: `1px solid ${userProfile.favoriteColor || '#10b981'}`,
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: isExpanded ? 'translateY(0)' : 'translateY(-5px)',
          opacity: isExpanded ? 1 : 0.9,
          role: 'button',
          tabIndex: 0,
          'aria-label': `User profile - ${userProfile.username} - Level ${userProfile.level} - ${userProfile.rep} REP`,
          'aria-expanded': isExpanded ? 'true' : 'false',
          onKeyDown: debouncedHandleKeyDown
        }}
        onClick={() => debouncedPanelToggle('profile')}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          e.currentTarget.style.transform = 'translateY(-5px)';
        }}
      >
        <div style={{ position: 'relative' }}>
          <img
            src={userProfile.profilePicUrl}
            alt={userProfile.username}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: `2px solid ${userProfile.favoriteColor || '#10b981'}`,
              objectFit: 'cover'
            }}
          />
          {/* Level Badge */}
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            backgroundColor: userProfile.favoriteColor || '#10b981',
            color: '#ffffff',
            fontSize: '8px',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {userProfile.level}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#ffffff',
              fontSize: '11px'
            }}>
              <span>{userProfile.username}</span>
              <span style={{ margin: '0 4px', color: '#b0b0b0' }}>•</span>
              <span style={{ margin: '0 4px', color: '#e0e0e0' }}>Level {userProfile.level}</span>
            </div>
          </div>
          {/* REP Progress Bar */}
          <div style={{
            width: '40px',
            height: '3px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginLeft: '4px'
          }}>
            <div
              style={{
                width: `${Math.min((userProfile.rep % 100) / 3)}%`, // Calculate progress (333 for next level)
                height: '100%',
                backgroundColor: userProfile.favoriteColor || '#10b981',
                transition: 'width 0.3s ease',
                borderRadius: '1px'
              }}
            />
          </div>
        </div>
        
        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '8px',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
          aria-label={isExpanded ? 'Collapse user profile' : 'Expand user profile'}
          aria-expanded={isExpanded ? 'false' : 'true'}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>
    );
  }, [userProfile, isExpanded, debouncedPanelToggle]);

  // Main container with proper semantic structure
  return (
    <nav
      className="navigation-container"
      role="navigation"
      aria-label="Main navigation"
      ref={navigationRef}
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        height: isExpanded ? '120px' : '80px',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        zIndex: 1600,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        // Crew-colored glow effect
        boxShadow: `
          0 0 30px rgba(255, 255, 255, 0.6),
          0 0 60px rgba(255, 255, 255, 0.3),
          inset 0 0 40px rgba(255, 255, 255, 0.4)
        `,
        filter: `drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))`,
        animation: 'glowPulse 4s ease-in-out infinite'
      }}
      onKeyDown={debouncedHandleKeyDown}
    >
      {/* SVG Background with Preloading */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '60px',
          width: '100%'
        }}
      >
        {svgLoaded ? (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              height: '60px',
              backgroundImage: `url(${preloadSVG('bobottomnav1.svg')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
              filter: 'drop-shadow(0 -2px 10px rgba(0,0,0,0.3))',
              animation: 'fadeIn 0.3s ease',
              zIndex: 1
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              height: '60px',
              background: 'linear-gradient(to top, #1a1a1a, #2d2d2d)',
              borderTop: '2px solid #333',
              zIndex: 1
            }}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '5px',
          left: '0',
          right: '0',
          height: '50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {navItems.map(renderButton)}
      </div>

      {/* User Profile Preview */}
      {renderUserProfile()}
    </nav>
  );
});

SVGBottomNavigation.displayName = 'SVGBottomNavigation';

export default SVGBottomNavigation;