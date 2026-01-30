'use client';

import { UserProfile } from '@/lib/types/blackout';
import { getRankInfo } from '@/lib/utils';

interface UserProfileButtonProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
}

const UserProfileButton: React.FC<UserProfileButtonProps> = ({ userProfile, onLogout }) => {
  const rankInfo = userProfile ? getRankInfo(userProfile.rep) : null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      backgroundColor: 'white',
      padding: '12px 16px',
      borderRadius: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      minWidth: '220px'
    }} onClick={() => {
      if (userProfile) {
        alert(`Profile: ${userProfile.username}\nRank: ${userProfile.rank}\nLevel: ${userProfile.level}\nREP: ${userProfile.rep}\nNext: ${rankInfo?.nextRank || 'MAX RANK!'} (${rankInfo?.repToNext || 0} REP needed)`);
      }
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        border: '2px solid #e5e7eb'
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
            fontSize: '18px',
            color: '#6b7280'
          }}>
            {userProfile?.gender === 'male' ? '👨' : 
             userProfile?.gender === 'female' ? '👩' : '👤'}
          </div>
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '6px' 
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#111827' }}>
            {userProfile?.username || 'Setting up...'}
          </div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 'bold',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            padding: '2px 8px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            Lvl {userProfile?.level || 1}
          </div>
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{userProfile?.rank || 'TOY'}</span>
          <span style={{ 
            fontSize: '10px', 
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '1px 6px',
            borderRadius: '10px'
          }}>
            REP: {userProfile?.rep || 0}
          </span>
        </div>

        {/* Rank Progression Bar */}
        {rankInfo && rankInfo.nextRank && (
          <div style={{ marginTop: '6px' }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#6b7280',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px'
            }}>
              <span style={{ color: '#9ca3af' }}>Progress</span>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                {rankInfo.repToNext} REP to next
              </span>
            </div>
            <div style={{
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '4px'
            }}>
              <div style={{
                width: `${rankInfo.progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4dabf7, #8a2be2)',
                transition: 'width 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1) inset'
              }}></div>
            </div>
            <div style={{
              fontSize: '9px',
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              Next: {rankInfo.nextRank}
            </div>
          </div>
        )}
        
        {/* Max Rank Indicator */}
        {rankInfo && !rankInfo.nextRank && (
          <div style={{ 
            marginTop: '6px',
            padding: '4px 8px',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #f59e0b'
          }}>
            <div style={{ 
              fontSize: '10px', 
              color: '#92400e',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              🏆 MAX RANK ACHIEVED!
            </div>
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onLogout();
        }}
        style={{
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          border: '1px solid #fecaca',
          padding: '6px 10px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          minWidth: '70px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fee2e2';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default UserProfileButton;
