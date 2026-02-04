import React from 'react';

interface BottomNavigationProps {
  showMapPanel: boolean;
  setShowMapPanel: (show: boolean) => void;
  showProfilePanel: boolean;
  setShowProfilePanel: (show: boolean) => void;
  showPhotosPanel: boolean;
  setShowPhotosPanel: (show: boolean) => void;
  showStoryPanel: boolean;
  setShowStoryPanel: (show: boolean) => void;
  showMusicPanel: boolean;
  setShowMusicPanel: (show: boolean) => void;
  showCrewChat: boolean;
  setShowCrewChat: (show: boolean) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  showMapPanel,
  setShowMapPanel,
  showProfilePanel,
  setShowProfilePanel,
  showPhotosPanel,
  setShowPhotosPanel,
  showStoryPanel,
  setShowStoryPanel,
  showMusicPanel,
  setShowMusicPanel,
  showCrewChat,
  setShowCrewChat
}) => {
  return (
    <div className="BottomNavigation">
      <button
        onClick={() => setShowMapPanel(!showMapPanel)}
        style={{
          background: showMapPanel ? 'rgba(77, 171, 247, 0.2)' : 'none',
          border: showMapPanel ? '1px solid rgba(77, 171, 247, 0.3)' : 'none',
          color: showMapPanel ? '#4dabf7' : '#cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease'
        }}
      >
        🗺️ Map
      </button>

      <button
        onClick={() => setShowProfilePanel(!showProfilePanel)}
        style={{
          background: showProfilePanel ? 'rgba(255, 107, 107, 0.2)' : 'none',
          border: showProfilePanel ? '1px solid rgba(255, 107, 107, 0.3)' : 'none',
          color: showProfilePanel ? '#ff6b6b' : '#cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease'
        }}
      >
        📓 Blackbook
      </button>

      <button
        onClick={() => setShowPhotosPanel(!showPhotosPanel)}
        style={{
          background: showPhotosPanel ? 'rgba(77, 171, 247, 0.2)' : 'none',
          border: showPhotosPanel ? '1px solid rgba(77, 171, 247, 0.3)' : 'none',
          color: showPhotosPanel ? '#4dabf7' : '#cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease'
        }}
      >
        📸 Camera
      </button>

      <button
        onClick={() => setShowStoryPanel(!showStoryPanel)}
        style={{
          background: showStoryPanel ? 'rgba(139, 92, 246, 0.2)' : 'none',
          border: showStoryPanel ? '1px solid rgba(139, 92, 246, 0.3)' : 'none',
          color: showStoryPanel ? '#8b5cf6' : '#cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease'
        }}
      >
        📖 Story
      </button>

      <button
        onClick={() => setShowMusicPanel(!showMusicPanel)}
        style={{
          background: showMusicPanel ? 'rgba(138, 43, 226, 0.2)' : 'none',
          border: showMusicPanel ? '1px solid rgba(138, 43, 226, 0.3)' : 'none',
          color: showMusicPanel ? '#8a2be2' : '#cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease'
        }}
      >
        🎵 Music
      </button>

      <button
        onClick={() => setShowCrewChat(!showCrewChat)}
        style={{
          background: showCrewChat ? 'rgba(16, 185, 129, 0.2)' : 'none',
          border: showCrewChat ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
          color: showCrewChat ? '#10b981' : '#cbd5e1',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.3s ease'
        }}
      >
        👥 Crew Chat
      </button>
    </div>
  );
};