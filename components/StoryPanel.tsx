// components/StoryPanel.tsx
import { useState } from 'react';
import { UserProfile } from '@/lib/types/blackout';

interface StoryPanelProps {
  userId: string;
  userProfile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  storyManager: any; // You'll type this properly
}

const StoryPanel: React.FC<StoryPanelProps> = ({ 
  userId, 
  userProfile, 
  isOpen, 
  onClose,
  storyManager 
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'missions' | 'blackout' | 'crew'>('overview');

  if (!isOpen) return null;

  const getActTitle = (act: number) => {
    const titles = [
      'ACT I: THE VANISHING',
      'ACT II: THE PATTERNS', 
      'ACT III: THE BETRAYAL',
      'ACT IV: THE RESISTANCE',
      'ACT V: THE FINAL GALLERY',
      'ACT VI: THE NEW DAWN'
    ];
    return titles[act - 1] || `ACT ${act}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(10px)'
    }} onClick={onClose}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        height: '90vh',
        backgroundColor: '#0f172a',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ color: '#f1f5f9', margin: 0 }}>📖 BLACKOUT NZ STORY</h2>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              {getActTitle(storyManager.currentAct)} • {storyManager.storyProgress}% Complete
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ color: '#f1f5f9' }}>Welcome to Blackout NZ</h3>
          <p style={{ color: '#cbd5e1' }}>
            Street art is vanishing overnight. Join a crew, investigate the disappearances,
            and uncover the truth behind The Blackout.
          </p>
          
          {/* Add more story content here */}
        </div>
      </div>
    </div>
  );
};

export default StoryPanel;