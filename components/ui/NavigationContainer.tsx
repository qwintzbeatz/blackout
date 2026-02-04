import React from 'react';
import { BottomNavigation } from './BottomNavigation';

interface NavigationContainerProps {
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

export const NavigationContainer: React.FC<NavigationContainerProps> = ({
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
    <div className="NavigationContainer">
      {/* SVG Navigation Header */}
      <div className="SvgContainer">
        <svg
          width="375"
          height="80"
          viewBox="0 0 375 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="375" height="80" rx="0" fill="#0F172A" />
          <path
            d="M0 0L375 0L375 80L0 80L0 0Z"
            fill="url(#paint0_linear)"
          />
          <defs>
            <linearGradient
              id="paint0_linear"
              x1="0"
              y1="0"
              x2="375"
              y2="80"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#1E293B" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        showMapPanel={showMapPanel}
        setShowMapPanel={setShowMapPanel}
        showProfilePanel={showProfilePanel}
        setShowProfilePanel={setShowProfilePanel}
        showPhotosPanel={showPhotosPanel}
        setShowPhotosPanel={setShowPhotosPanel}
        showStoryPanel={showStoryPanel}
        setShowStoryPanel={setShowStoryPanel}
        showMusicPanel={showMusicPanel}
        setShowMusicPanel={setShowMusicPanel}
        showCrewChat={showCrewChat}
        setShowCrewChat={setShowCrewChat}
      />
    </div>
  );
};