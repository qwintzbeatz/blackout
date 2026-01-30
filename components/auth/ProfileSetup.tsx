'use client';

import { useState } from 'react';
import { generateAvatarUrl } from '@/lib/utils';

interface ProfileSetupProps {
  onSubmit: (data: {
    username: string;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  }) => Promise<void>;
  loading?: boolean;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onSubmit, loading = false }) => {
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await onSubmit({ username, gender });
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Create Your Profile</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>
          Customize your graffiti artist identity
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Avatar Preview */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              margin: '0 auto 10px',
              overflow: 'hidden',
              position: 'relative',
              border: '3px solid #4dabf7',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {username ? (
                <img 
                  src={generateAvatarUrl('preview', username, gender)}
                  alt="Avatar Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  color: '#6b7280',
                  fontSize: '24px'
                }}>
                  👤
                </div>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Custom avatar generated from your username
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Choose a username *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              maxLength={20}
            />
          </div>

          {/* Gender */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '14px', color: '#374151', marginBottom: '10px', textAlign: 'left' }}>
              Gender:
            </div>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(['male', 'female', 'other', 'prefer-not-to-say'] as const).map((option) => (
                <label 
                  key={option}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    padding: '8px 12px',
                    backgroundColor: gender === option ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '8px',
                    border: `1px solid ${gender === option ? '#4dabf7' : '#e5e7eb'}`
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={option}
                    checked={gender === option}
                    onChange={() => setGender(option)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                    {option === 'prefer-not-to-say' ? 'Prefer not to say' : 
                     option === 'male' ? '👨 Male' :
                     option === 'female' ? '👩 Female' : 'Other'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            style={{
              backgroundColor: '#4dabf7',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: '100%',
              opacity: (loading || !username.trim()) ? 0.7 : 1
            }}
          >
            {loading ? 'Creating Profile...' : 'Start Tagging! 🎯'}
          </button>
          
          <div style={{ 
            marginTop: '20px', 
            fontSize: '12px', 
            color: '#6b7280',
            textAlign: 'left',
            backgroundColor: '#f0f9ff',
            padding: '10px',
            borderRadius: '8px'
          }}>
            <strong>🎨 Your journey begins as a TOY</strong>
            <div style={{ marginTop: '5px' }}>
              Place markers to earn XP and rank up through the graffiti hierarchy!
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;