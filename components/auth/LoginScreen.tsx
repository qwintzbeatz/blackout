'use client';

import React from 'react';
import { fullScreenStyle } from '@/app/pageStyles';

interface LoginScreenProps {
  // Auth form state (controlled by parent)
  showLogin: boolean;
  showSignup: boolean;
  email: string;
  password: string;
  authError: string | null;
  
  // Auth form handlers
  onLogin: (e: React.FormEvent) => void;
  onSignup: (e: React.FormEvent) => void;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSetShowLogin: (show: boolean) => void;
  onSetShowSignup: (show: boolean) => void;
  onClearAuthError: () => void;
  
  // Music player props for the mini player on login screen
  isPlaying: boolean;
  currentTrackIndex: number;
  unlockedTracks: string[];
  userProfileTracks?: string[];
  onTogglePlay: () => void;
  onPlayNext: () => void;
  getCurrentTrackName: () => string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  showLogin,
  showSignup,
  email,
  password,
  authError,
  onLogin,
  onSignup,
  onEmailChange,
  onPasswordChange,
  onSetShowLogin,
  onSetShowSignup,
  onClearAuthError,
  isPlaying,
  currentTrackIndex,
  unlockedTracks,
  userProfileTracks,
  onTogglePlay,
  onPlayNext,
  getCurrentTrackName
}) => {
  const trackCount = (userProfileTracks?.length || unlockedTracks.length);

  return (
    <div style={{
      ...fullScreenStyle,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0f172a',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(78, 205, 196, 0.1) 0%, transparent 20%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3)',
        backgroundSize: '400% 400%',
        animation: 'gradientBG 15s ease infinite',
        opacity: 0.08,
        zIndex: 1
      }}></div>
      
      {/* Mini Music Player - Top Right */}
      <div style={{
        position: 'absolute',
        top: 220,
        right: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: '15px 20px',
        borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        zIndex: 2,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: '280px',
        maxWidth: '400px',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <button
            onClick={onTogglePlay}
            style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              backgroundColor: isPlaying ? '#ef4444' : '#10b981',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
              🎵 {getCurrentTrackName()}
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
              Track {currentTrackIndex + 1} of {trackCount} unlocked
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              {isPlaying ? '● Now Playing' : 'Paused'}
            </div>
          </div>
          <button
            onClick={onPlayNext}
            style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#4dabf7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
            title="Next Track"
          >
            ⏭️
          </button>
        </div>
        
        {/* Local audio player info */}
        <div style={{ 
          marginTop: '15px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          gap: '15px'
        }}>
          <div style={{ fontSize: '32px' }}>🎵</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold' }}>
              Blackout Classic
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Local Audio • Looping
            </div>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px',
        textAlign: 'center',
        zIndex: 2,
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        margin: '20px'
      }}>
        {/* Background Image Section */}
        <div style={{
          height: '30vh',
          width: '80vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url(/BOBackground.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <p style={{ 
            color: '#cbd5e1', 
            fontSize: '15px', 
            marginTop: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Sign in</span> to access the ultimate graffiti GPS tracking experience with live music vibe
          </p>
        </div>

        {/* Login Form */}
        {showLogin ? (
          <form onSubmit={onLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h2 style={{ fontSize: '22px', color: 'white', marginBottom: '5px', textAlign: 'left' }}>Sign In</h2>
            
            <input
              type="email"
              placeholder="📧 Email Address"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              style={{
                padding: '14px 18px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                outline: 'none'
              }}
            />
            
            <input
              type="password"
              placeholder="🔒 Password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
              style={{
                padding: '14px 18px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                outline: 'none'
              }}
            />
            
            {authError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                ⚠️ {authError}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              🚀 Sign In & Start Tagging
            </button>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
              <button
                type="button"
                onClick={() => {
                  onSetShowLogin(false);
                  onSetShowSignup(true);
                  onClearAuthError();
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Create Account
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onSetShowLogin(false);
                  onEmailChange('');
                  onPasswordChange('');
                  onClearAuthError();
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : showSignup ? (
          <form onSubmit={onSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h2 style={{ fontSize: '22px', color: 'white', marginBottom: '5px', textAlign: 'left' }}>Create Account</h2>
            
            <input
              type="email"
              placeholder="📧 Email Address"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              style={{
                padding: '14px 18px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                outline: 'none'
              }}
            />
            
            <input
              type="password"
              placeholder="🔒 Password (min 6 characters)"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
              minLength={6}
              style={{
                padding: '14px 18px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                fontSize: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                outline: 'none'
              }}
            />
            
            {authError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                ⚠️ {authError}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              🎨 Create Graffiti Profile
            </button>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
              <button
                type="button"
                onClick={() => {
                  onSetShowSignup(false);
                  onSetShowLogin(true);
                  onClearAuthError();
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Already have account?
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onSetShowSignup(false);
                  onEmailChange('');
                  onPasswordChange('');
                  onClearAuthError();
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Features List */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
              padding: '20px',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#cbd5e1',
              marginBottom: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'left'
            }}>
              <strong style={{ color: '#f59e0b', fontSize: '16px', display: 'block', marginBottom: '10px' }}>🎯 Features:</strong>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>📍 <strong>Live GPS tracking</strong> with accuracy circle</li>
                <li style={{ marginBottom: '8px' }}>🎨 <strong>Place custom markers</strong> with different colors</li>
                <li style={{ marginBottom: '8px' }}>📏 <strong>50-meter radius visualization</strong></li>
                <li style={{ marginBottom: '8px' }}>🏙️ <strong>East Auckland location presets</strong></li>
                <li>👤 <strong>See ALL players' drops</strong> in real-time</li>
                <li>🎵 <strong>SoundCloud music player</strong> built into app</li>
              </ul>
            </div>
            
            <button
              onClick={() => onSetShowLogin(true)}
              style={{
                background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
              }}
            >
              🚀 Sign In
            </button>
            
            <button
              onClick={() => onSetShowSignup(true)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Create Account
            </button>
            
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                <div style={{ marginBottom: '5px' }}>🎵 Music: <strong>Blackout - Classic</strong></div>
                <div>SoundCloud tracks play directly in app! 🎧</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;