'use client';

import { UserProfile } from '@/lib/utils/types';

interface UserProfileButtonProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({ userProfile, onLogout }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: 'white',
      padding: '10px 15px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer'
    }} onClick={() => {
      alert(`Profile: ${userProfile?.username || 'Not set'}\nRank: ${userProfile?.rank || 'TOY'}\nXP: ${userProfile?.xp || 0}`);
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6'
      }}>
        {userProfile?.profilePicUrl ? (
          <img 
            src={userProfile.profilePicUrl} 
            alt={userProfile.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            fontSize: '16px',
            color: '#6b7280'
          }}>
            {userProfile?.gender === 'male' ? '👨' : 
             userProfile?.gender === 'female' ? '👩' : '👤'}
          </div>
        )}
      </div>
      <div style={{ fontSize: '12px', color: '#374151' }}>
        <div style={{ fontWeight: 'bold' }}>{userProfile?.username || 'Setting up...'}</div>
        <div style={{ 
          fontSize: '10px', 
          color: userProfile?.rank === 'TOY' ? '#808080' : 
                 userProfile?.rank === 'VANDAL' ? '#FF6B6B' : '#4ECDC4'
        }}>
          {userProfile?.rank || 'TOY'}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLogout();
        }}
        style={{
          backgroundColor: '#f3f4f6',
          color: '#ef4444',
          border: '1px solid #ef4444',
          padding: '4px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default UserProfileButton;