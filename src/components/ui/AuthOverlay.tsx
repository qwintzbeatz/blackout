'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

// Optimized styling
const overlayStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000
};

const modalStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  padding: '32px',
  width: 'min(90vw, 400px)',
  maxWidth: '400px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  position: 'relative' as const,
  color: '#ffffff'
};

const AuthOverlayOptimized: React.FC<AuthOverlayProps> = ({
  isVisible,
  onClose,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when mode changes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
  }, [mode]);

  // Email validation
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Password validation
  const validatePassword = useCallback((password: string): boolean => {
    return password.length >= 6;
  }, []);

  // Form validation
  const isFormValid = useMemo(() => {
    if (!validateEmail(email) || !validatePassword(password)) {
      return false;
    }
    
    if (mode === 'signup') {
      return password === confirmPassword && password.length >= 6;
    }
    
    return true;
  }, [email, password, confirmPassword, mode, validateEmail, validatePassword]);

  // Handle authentication
  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 1000);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage('Account created! Please set up your profile.');
        setTimeout(() => {
          onAuthSuccess();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
        default:
          errorMessage = error.message || 'Authentication failed';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, confirmPassword, onAuthSuccess, onClose]);

  // Handle overlay click to close
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ffffff'
          }}>
            🎨 {mode === 'login' ? 'Welcome Back' : 'Join Blackout NZ'}
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: mode === 'login' ? '#ff6b35' : 'transparent',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: mode === 'login' ? 'bold' : 'normal'
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: mode === 'signup' ? '#ff6b35' : 'transparent',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: mode === 'signup' ? 'bold' : 'normal'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: '#b0b0b0'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: email && !validateEmail(email) ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              required
            />
            {email && !validateEmail(email) && (
              <div style={{
                fontSize: '11px',
                color: '#ff4444',
                marginTop: '4px'
              }}>
                Please enter a valid email address
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: '#b0b0b0'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: password && !validatePassword(password) ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              required
            />
            {password && !validatePassword(password) && (
              <div style={{
                fontSize: '11px',
                color: '#ff4444',
                marginTop: '4px'
              }}>
                Password must be at least 6 characters
              </div>
            )}
          </div>

          {/* Confirm Password (for signup) */}
          {mode === 'signup' && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                color: '#b0b0b0'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: confirmPassword && confirmPassword !== password ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <div style={{
                  fontSize: '11px',
                  color: '#ff4444',
                  marginTop: '4px'
                }}>
                  Passwords do not match
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid #ff4444',
              color: '#ff6b6b',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid #4CAF50',
              color: '#66bb6a',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'center'
            }}>
              {successMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            style={{
              padding: '14px 24px',
              backgroundColor: isFormValid && !loading ? '#ff6b35' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: (isFormValid && !loading) ? 1 : 0.5,
              marginTop: '8px'
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '11px',
          color: '#b0b0b0',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '8px' }}>
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
          </div>
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff6b35',
              fontSize: '11px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {mode === 'login' ? 'Sign up now' : 'Sign in instead'}
          </button>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          input:focus {
            border-color: #ff6b35 !important;
          }

          button:active {
            transform: scale(0.98);
          }

          input {
            box-sizing: border-box;
          }

          @media (max-width: 480px) {
            div[style] {
              padding: 24px 20px;
            }
            
            h2 {
              font-size: 20px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthOverlayOptimized;