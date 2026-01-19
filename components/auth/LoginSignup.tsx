'use client';

import { useState } from 'react';

interface LoginSignupProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (email: string, password: string) => Promise<boolean>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
}

const LoginSignup: React.FC<LoginSignupProps> = ({
  onLogin,
  onSignup,
  authError,
  setAuthError
}) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onLogin(email, password);
    if (success) {
      setShowLogin(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSignup(email, password);
    if (success) {
      setShowSignup(false);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: '0px',
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
        <div style={{ marginBottom: '30px' }}>
          {/* License Plate SVG */}
          <div style={{ 
            width: '200px', 
            height: '90px', 
            margin: '0 auto 15px auto',
            position: 'relative'
          }}>
            <svg 
              width="200" 
              height="90" 
              viewBox="0 0 200 90" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block' }}
            >
              <rect x="0" y="0" width="200" height="90" rx="10" fill="black"/>
              <rect x="5" y="5" width="190" height="80" rx="8" fill="black" stroke="white" strokeWidth="2"/>
              <rect x="10" y="10" width="180" height="20" rx="4" fill="white"/>
              <text x="100" y="25" textAnchor="middle" fill="black" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="12">
                GPS TRACKING
              </text>
              <text x="100" y="60" textAnchor="middle" fill="white" fontFamily="'Courier New', monospace" fontWeight="800" fontSize="36" letterSpacing="4">
                BLAQWT
              </text>
            </svg>
          </div>
          
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '10px' }}>
            Sign in to access the interactive map with GPS tracking
          </p>
        </div>

        {/* Login Form */}
        {showLogin ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ fontSize: '20px', color: '#374151', marginBottom: '5px' }}>Sign In</h2>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            
            {authError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                backgroundColor: '#4dabf7',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Sign In
            </button>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowLogin(false);
                  setShowSignup(true);
                  setAuthError(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Create Account
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowLogin(false);
                  setEmail('');
                  setPassword('');
                  setAuthError(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  padding: '10px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : showSignup ? (
          // Signup Form
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h2 style={{ fontSize: '20px', color: '#374151', marginBottom: '5px' }}>Create Account</h2>
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                padding: '12px 15px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            
            {authError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Create Account
            </button>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSignup(false);
                  setShowLogin(true);
                  setAuthError(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Already have account?
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowSignup(false);
                  setEmail('');
                  setPassword('');
                  setAuthError(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  padding: '10px',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          // Welcome screen
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              backgroundColor: '#e0f2fe',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0369a1',
              marginBottom: '10px'
            }}>
              <strong>📱 Features:</strong>
              <ul style={{ textAlign: 'left', margin: '10px 0 0 0', paddingLeft: '20px' }}>
                <li>Live GPS tracking with accuracy circle</li>
                <li>Place custom markers on the map</li>
                <li>50-meter radius visualization</li>
                <li>East Auckland location presets</li>
              </ul>
            </div>
            
            <button
              onClick={() => setShowLogin(true)}
              style={{
                backgroundColor: '#4dabf7',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            
            <button
              onClick={() => setShowSignup(true)}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
            
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>
              Ver. 1.0 Alpha
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;