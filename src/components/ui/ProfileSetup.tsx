'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';

interface Crew {
  id: string;
  name: string;
  description: string;
  color: string;
  accentColor: string;
  bonus: string;
}

interface ProfileSetupProps {
  isVisible: boolean;
  user: {
    uid: string;
    email: string;
  } | null;
  onComplete: (profileData: any) => void;
  onClose: () => void;
}

const CREWS: Crew[] = [
  {
    id: 'bqc',
    name: 'Blackout Queens',
    description: 'Creative street artists',
    color: '#ff6b9d',
    accentColor: '#c9184a',
    bonus: '+15% Style REP'
  },
  {
    id: 'sps',
    name: 'Southside Poets',
    description: 'Verbal graffiti masters',
    color: '#4ecdc4',
    accentColor: '#44a5a0',
    bonus: '+15% Word REP'
  },
  {
    id: 'lzt',
    name: 'Lazarus Tribe',
    description: 'Underground legends',
    color: '#f7b731',
    accentColor: '#f5a623',
    bonus: '+15% Mystery REP'
  },
  {
    id: 'dgc',
    name: 'Dead Grass Crew',
    description: 'Rural bombing experts',
    color: '#5f27cd',
    accentColor: '#341f97',
    bonus: '+15% Nature REP'
  }
];

const MARKER_COLORS = [
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#4dabf7' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Gray', value: '#6b7280' }
];

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
  width: 'min(95vw, 500px)',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto' as const,
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  position: 'relative' as const,
  color: '#ffffff'
};

const ProfileSetupOptimized: React.FC<ProfileSetupProps> = ({
  isVisible,
  user,
  onComplete,
  onClose
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');
  const [crewChoice, setCrewChoice] = useState<'crew' | 'solo'>('crew');
  const [selectedCrew, setSelectedCrew] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#10b981');

  // Avatar preview
  const avatarPreview = useMemo(() => {
    if (!user) return '';
    return generateAvatarUrl(user.uid, username || 'Player', gender);
  }, [user, username, gender]);

  // Validate username
  const validateUsername = useCallback((name: string): boolean => {
    if (!name || name.length < 3 || name.length > 20) return false;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(name);
  }, []);

  // Form validation
  const isStepValid = useMemo(() => {
    switch (step) {
      case 1:
        return validateUsername(username) && gender !== undefined;
      case 2:
        return crewChoice === 'solo' || (crewChoice === 'crew' && selectedCrew !== '');
      case 3:
        return true; // Color is always selected
      default:
        return false;
    }
  }, [step, username, gender, crewChoice, selectedCrew, validateUsername]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (isStepValid && step < 3) {
      setStep(step + 1);
      setError(null);
    }
  }, [isStepValid, step]);

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  }, [step]);

  // Handle complete setup
  const handleComplete = useCallback(async () => {
    if (!user || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const profileData = {
        uid: user.uid,
        email: user.email,
        username: username.trim(),
        gender: gender,
        profilePicUrl: avatarPreview,
        favoriteColor: selectedColor,
        rep: 0,
        level: 1,
        rank: 'TOY',
        totalMarkers: 0,
        isSolo: crewChoice === 'solo',
        crewId: crewChoice === 'crew' ? selectedCrew : null,
        crewName: crewChoice === 'crew' ? CREWS.find(c => c.id === selectedCrew)?.name || null : null,
        unlockedTracks: ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'],
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        crewJoinedAt: crewChoice === 'crew' ? serverTimestamp() : null,
        crewRank: 'RECRUIT',
        crewRep: 0,
        currentAct: 1,
        storyProgress: 0,
        markersPlaced: 0,
        photosTaken: 0,
        collaborations: 0,
        blackoutEventsInvestigated: 0,
        kaiTiakiEvaluationsReceived: 0
      };
      
      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, profileData);
      
      // Initialize story progress
      const storyRef = doc(db, 'story', user.uid);
      await setDoc(storyRef, {
        userId: user.uid,
        currentAct: 1,
        storyProgress: 0,
        completedMissions: [],
        activeMissions: ['act1_intro'],
        crewTrust: { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
        plotRevealed: false,
        lastUpdated: serverTimestamp()
      });
      
      onComplete(profileData);
      
    } catch (error: any) {
      console.error('Error creating profile:', error);
      setError(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  }, [user, username, gender, crewChoice, selectedCrew, selectedColor, avatarPreview, loading, onComplete]);

  // Handle overlay click to close
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      setStep(1);
      setUsername('');
      setGender('prefer-not-to-say');
      setCrewChoice('crew');
      setSelectedCrew('');
      setSelectedColor('#10b981');
      setError(null);
      setLoading(false);
    }
  }, [isVisible]);

  if (!isVisible || !user) return null;

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
            🎨 Set Up Your Profile
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

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '32px',
          position: 'relative'
        }}>
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: step >= num ? '#ff6b35' : 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: step >= num ? '#ffffff' : '#b0b0b0',
                marginBottom: '8px'
              }}>
                {num}
              </div>
              <div style={{
                fontSize: '11px',
                color: step >= num ? '#ffffff' : '#b0b0b0',
                textAlign: 'center'
              }}>
                {num === 1 ? 'Identity' : num === 2 ? 'Crew' : 'Style'}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #ff4444',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Step Content */}
        <div style={{ marginBottom: '24px' }}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                color: '#ffffff'
              }}>
                Who are you?
              </h3>
              
              {/* Avatar Preview */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <div style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px'
                }}>
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: `3px solid ${selectedColor}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    backgroundColor: '#ff6b35',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    🎨
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    color: '#b0b0b0'
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose your tag name"
                    maxLength={20}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: username && !validateUsername(username) ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                  {username && !validateUsername(username) && (
                    <div style={{
                      fontSize: '11px',
                      color: '#ff4444',
                      marginTop: '4px'
                    }}>
                      Username must be 3-20 characters, letters, numbers, _ and - only
                    </div>
                  )}
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '14px',
                    color: '#b0b0b0'
                  }}>
                    Gender
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px'
                  }}>
                    {[
                      { value: 'male', label: '👨 Male' },
                      { value: 'female', label: '👩 Female' },
                      { value: 'other', label: '👽 Other' },
                      { value: 'prefer-not-to-say', label: '❓ Prefer not to say' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: gender === option.value ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.1)',
                          border: gender === option.value ? '1px solid #ff6b35' : '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={gender === option.value}
                          onChange={(e) => setGender(e.target.value as any)}
                          style={{ display: 'none' }}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Crew Selection */}
          {step === 2 && (
            <div>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                color: '#ffffff'
              }}>
                Choose Your Path
              </h3>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <label style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: crewChoice === 'solo' ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.1)',
                  border: crewChoice === 'solo' ? '1px solid #ff6b35' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}>
                  <input
                    type="radio"
                    name="crewChoice"
                    value="solo"
                    checked={crewChoice === 'solo'}
                    onChange={() => setCrewChoice('solo')}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>Solo</div>
                  <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Go it alone</div>
                </label>
                
                <label style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: crewChoice === 'crew' ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.1)',
                  border: crewChoice === 'crew' ? '1px solid #ff6b35' : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}>
                  <input
                    type="radio"
                    name="crewChoice"
                    value="crew"
                    checked={crewChoice === 'crew'}
                    onChange={() => setCrewChoice('crew')}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>Join Crew</div>
                  <div style={{ fontSize: '11px', color: '#b0b0b0' }}>Team up</div>
                </label>
              </div>
              
              {crewChoice === 'crew' && (
                <div>
                  <div style={{
                    fontSize: '12px',
                    color: '#b0b0b0',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    Select your crew:
                  </div>
                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {CREWS.map((crew) => (
                      <label
                        key={crew.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: selectedCrew === crew.id ? `${crew.color}20` : 'rgba(255,255,255,0.1)',
                          border: selectedCrew === crew.id ? `2px solid ${crew.color}` : '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="crew"
                          value={crew.id}
                          checked={selectedCrew === crew.id}
                          onChange={() => setSelectedCrew(crew.id)}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: crew.color,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}>
                          🏴
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginBottom: '2px'
                          }}>
                            {crew.name}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#b0b0b0',
                            marginBottom: '2px'
                          }}>
                            {crew.description}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: crew.color,
                            fontWeight: 'bold'
                          }}>
                            {crew.bonus}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Color Selection */}
          {step === 3 && (
            <div>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '18px',
                color: '#ffffff'
              }}>
                Choose Your Style
              </h3>
              
              <div style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'inline-block',
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px'
                }}>
                  <img
                    src={avatarPreview}
                    alt="Final avatar"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      border: `3px solid ${selectedColor}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  />
                </div>
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#b0b0b0',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Choose your marker color:
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px'
              }}>
                {MARKER_COLORS.map((color) => (
                  <label
                    key={color.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px',
                      backgroundColor: selectedColor === color.value ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: selectedColor === color.value ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="color"
                      value={color.value}
                      checked={selectedColor === color.value}
                      onChange={() => setSelectedColor(color.value)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: color.value,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }} />
                    <div style={{
                      fontSize: '9px',
                      color: '#b0b0b0'
                    }}>
                      {color.name}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={step > 1 ? handlePrevious : onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          
          <div style={{
            fontSize: '11px',
            color: '#b0b0b0'
          }}>
            Step {step} of 3
          </div>
          
          <button
            onClick={step < 3 ? handleNext : handleComplete}
            disabled={!isStepValid || loading}
            style={{
              padding: '10px 20px',
              backgroundColor: isStepValid && !loading ? '#ff6b35' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: isStepValid && !loading ? 'pointer' : 'not-allowed',
              opacity: (isStepValid && !loading) ? 1 : 0.5
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Processing...
              </span>
            ) : (
              step < 3 ? 'Next' : 'Start Playing'
            )}
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

          label:active {
            transform: scale(0.98);
          }

          @media (max-width: 480px) {
            div[style] {
              padding: 20px;
              width: min(95vw, 400px);
            }
            
            h2 {
              font-size: 20px;
            }
            
            h3 {
              font-size: 16px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ProfileSetupOptimized;