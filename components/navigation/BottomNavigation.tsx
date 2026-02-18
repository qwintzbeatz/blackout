'use client';

import React from 'react';

interface BottomNavigationProps {
  // Panel visibility states
  showMapPanel: boolean;
  showProfilePanel: boolean;
  showPhotosPanel: boolean;
  showCrewChat: boolean;
  
  // Panel toggle functions
  onToggleMapPanel: () => void;
  onToggleProfilePanel: () => void;
  onTogglePhotosPanel: () => void;
  onToggleCrewChat: () => void;
  
  // For closing other panels
  onCloseAllPanels: () => void;
  
  // Unread notifications
  hasUnreadMessages: boolean;
  unreadCount: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  showMapPanel,
  showProfilePanel,
  showPhotosPanel,
  showCrewChat,
  onToggleMapPanel,
  onToggleProfilePanel,
  onTogglePhotosPanel,
  onToggleCrewChat,
  onCloseAllPanels,
  hasUnreadMessages,
  unreadCount
}) => {
  const handleButtonClick = (toggleFn: () => void) => {
    onCloseAllPanels();
    toggleFn();
  };

  return (
    <>
      {/* Blur Effect Layer Behind SVG */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        zIndex: 1099,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }} />

      {/* Bottom Navigation Container */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        zIndex: 1100,
        overflow: 'hidden',
      }}>
        {/* White Glow Layer */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          boxShadow: `
            0 0 40px rgba(255, 255, 255, 0.8),
            0 0 80px rgba(255, 255, 255, 0.6),
            0 0 120px rgba(255, 255, 255, 0.4),
            inset 0 0 60px rgba(255, 255, 255, 0.7)
          `,
          filter: 'drop-shadow(0 0 25px rgba(255, 255, 255, 1))',
          animation: 'whiteGlowPulse 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        
        {/* Active Button Glow Layer */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          {/* Map Button Glow */}
          <div style={{
            opacity: showMapPanel ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
          
          {/* Blackbook Button Glow */}
          <div style={{
            opacity: showProfilePanel ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
          
          {/* Camera Button Glow */}
          <div style={{
            opacity: showPhotosPanel ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
          
          {/* Crew Chat Glow */}
          <div style={{
            opacity: showCrewChat ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
        </div>

        {/* SVG Background */}
        <img 
          src="bobottomnav1.svg" 
          alt="Bottom Navigation"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        
        {/* Interactive Buttons Layer */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          alignItems: 'center',
          zIndex: 3,
        }}>
          {/* Map Button */}
          <button
            onClick={() => handleButtonClick(onToggleMapPanel)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Map"
          />

          {/* Blackbook Button */}
          <button
            onClick={() => handleButtonClick(onToggleProfilePanel)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Blackbook"
          />

          {/* Camera Button */}
          <button
            onClick={() => handleButtonClick(onTogglePhotosPanel)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Camera"
          />

          {/* Crew Chat Button */}
          <button
            onClick={() => handleButtonClick(onToggleCrewChat)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Crew Chat"
          >
            {/* Unread Message Badge */}
            {hasUnreadMessages && !showCrewChat && unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
                zIndex: 4,
                boxShadow: '0 0 5px rgba(239, 68, 68, 0.7)'
              }}>
                {unreadCount}
              </div>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes whiteGlowPulse {
          0%, 100% { 
            opacity: 1;
            box-shadow: 
              0 0 40px rgba(255, 255, 255, 0.8),
              0 0 80px rgba(255, 255, 255, 0.6),
              0 0 120px rgba(255, 255, 255, 0.4),
              inset 0 0 60px rgba(255, 255, 255, 0.7);
          }
          50% { 
            opacity: 0.9;
            box-shadow: 
              0 0 45px rgba(255, 255, 255, 0.9),
              0 0 90px rgba(255, 255, 255, 0.7),
              0 0 140px rgba(255, 255, 255, 0.5),
              inset 0 0 65px rgba(255, 255, 255, 0.8);
          }
        }
      `}</style>
    </>
  );
};

export default BottomNavigation;