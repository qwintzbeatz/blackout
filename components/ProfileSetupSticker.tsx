'use client';

import React, { useState } from 'react';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { CrewId } from '@/constants/markers';

// Re-export the Crew interface from data/crews
export interface Crew {
  id: CrewId;
  name: string;
  fullName?: string;
  description: string;
  tagline?: string;
  location: string;
  leader: string;
  leaderTitle?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  bonus: string;
}

interface ProfileSetupStickerProps {
  user: { uid: string };
  onSubmit: (data: {
    username: string;
    gender: string;
    crewChoice: 'crew' | 'solo';
    selectedCrew?: string;
  }) => Promise<void>;
  loading: boolean;
  crews: Crew[];
  onCrewSelect: (crewId: CrewId | '') => void;
  selectedCrew: CrewId | '';
  crewChoice: 'crew' | 'solo';
  onCrewChoiceChange: (choice: 'crew' | 'solo') => void;
}

export const ProfileSetupSticker: React.FC<ProfileSetupStickerProps> = ({
  user,
  onSubmit,
  loading,
  crews,
  onCrewSelect,
  selectedCrew,
  crewChoice,
  onCrewChoiceChange,
}) => {
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');

  const avatarUrl = username 
    ? generateAvatarUrl(user.uid, username, gender)
    : '';

  const handleSubmit = async () => {
    if (username.trim()) {
      await onSubmit({ 
        username, 
        gender, 
        crewChoice, 
        selectedCrew: crewChoice === 'crew' && selectedCrew ? selectedCrew : undefined 
      });
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#2d2d2d',
      backgroundImage: 'radial-gradient(circle at 50% 50%, #3d3d3d 0%, #2d2d2d 100%)',
      padding: '20px',
    }}>
      {/* Sticker Container */}
      <div style={{
        background: '#fcfcfc',
        width: '100%',
        maxWidth: '360px',
        transform: 'rotate(-1.5deg)',
        boxShadow: `
          0 15px 50px rgba(0,0,0,0.35),
          0 0 0 1px rgba(0,0,0,0.08)
        `,
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        
        {/* Sticker Header */}
        <div style={{
          background: '#1a1a1a',
          padding: '16px 20px',
          textAlign: 'center',
        }}>
          <h2 style={{
            color: '#fff',
            margin: 0,
            fontSize: '28px',
            fontWeight: 900,
            fontFamily: 'Impact, Arial Black, sans-serif',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            HELLO
          </h2>
          <h2 style={{
            color: '#fff',
            margin: 0,
            fontSize: '28px',
            fontWeight: 900,
            fontFamily: 'Impact, Arial Black, sans-serif',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            MY NAME IS
          </h2>
        </div>
        
        {/* Divider */}
        <div style={{
          height: '3px',
          background: '#1a1a1a',
        }} />
        
        {/* Avatar Polaroid */}
        <div style={{
          margin: '25px auto 15px',
          padding: '10px 10px 30px',
          background: '#fefefe',
          boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
          width: '120px',
          transform: 'rotate(2deg)',
          border: '1px solid #e0e0e0',
          position: 'relative',
        }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '4px',
            background: '#f0f0f0',
            overflow: 'hidden',
            border: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {username ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <span style={{ fontSize: '32px' }}>👤</span>
            )}
          </div>
          <span style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            color: '#666',
            fontFamily: 'Courier New, monospace',
          }}>
            YOUR AVATAR
          </span>
        </div>

        {/* Username Input */}
        <div style={{
          padding: '0 25px',
        }}>
          <div style={{
            fontSize: '11px',
            color: '#666',
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            textAlign: 'left',
            marginBottom: '8px',
          }}>
            (WRITE YOUR NAME)
          </div>
          <input
            type="text"
            placeholder="__________"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: 'none',
              borderBottom: '3px solid #1a1a1a',
              fontSize: '22px',
              fontWeight: 'bold',
              fontFamily: 'Comic Sans MS, Chalkboard SE, Marker Felt, cursive',
              textAlign: 'center',
              background: 'transparent',
              color: '#1a1a1a',
              letterSpacing: '2px',
              outline: 'none',
              textTransform: 'uppercase',
            }}
            maxLength={20}
          />
          
          {/* Gender Selection */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#fafafa',
            border: '2px dashed #ccc',
            borderRadius: '4px',
          }}>
            <div style={{
              fontSize: '10px',
              color: '#888',
              fontFamily: 'Courier New, monospace',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '8px',
            }}>
              Gender:
            </div>
            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
            }}>
              {[
                { value: 'male', label: '👨' },
                { value: 'female', label: '👩' },
                { value: 'other', label: '👽' },
                { value: 'prefer-not-to-say', label: '🚫' }
              ].map((opt) => (
                <label 
                  key={opt.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontFamily: 'Comic Sans MS, cursive',
                    fontSize: '13px',
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === opt.value}
                    onChange={() => setGender(opt.value as any)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #1a1a1a',
                    marginRight: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: gender === opt.value ? '#1a1a1a' : '#fefefe',
                    color: '#fff',
                    fontSize: '9px',
                    transition: 'all 0.15s ease',
                  }}>
                    {gender === opt.value && '✓'}
                  </div>
                  <span style={{ color: '#1a1a1a', fontWeight: 'bold' }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Crew/Solo Selection */}
          <div style={{ marginTop: '20px' }}>
            <div style={{
              fontSize: '11px',
              color: '#666',
              fontFamily: 'Courier New, monospace',
              fontWeight: 'bold',
              textAlign: 'left',
              marginBottom: '10px',
            }}>
              YOUR CREW:
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '12px',
            }}>
              {['solo', 'crew'].map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => onCrewChoiceChange(choice as 'crew' | 'solo')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: crewChoice === choice ? '2px solid #1a1a1a' : '2px dashed #ccc',
                    background: crewChoice === choice ? '#1a1a1a' : '#fafafa',
                    fontFamily: 'Comic Sans MS, cursive',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'all 0.15s ease',
                    color: crewChoice === choice ? '#fff' : '#1a1a1a',
                  }}
                >
                  {choice === 'solo' ? '🎯 SOLO' : '👥 CREW'}
                </button>
              ))}
            </div>

            {crewChoice === 'crew' && (
              <div style={{
                display: 'grid',
                gap: '8px',
                marginBottom: '15px',
              }}>
                {crews.map((crew) => (
                  <button
                    key={crew.id}
                    type="button"
                    onClick={() => onCrewSelect(crew.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      background: '#fafafa',
                      border: selectedCrew === crew.id ? `2px solid ${crew.colors.primary}` : '2px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: crew.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}>
                      {crew.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: crew.colors.primary,
                        fontFamily: 'Impact, Arial Black, sans-serif',
                        textTransform: 'uppercase',
                      }}>
                        {crew.name}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#888',
                        fontFamily: 'Courier New, monospace',
                      }}>
                        {crew.bonus}
                      </div>
                    </div>
                    {selectedCrew === crew.id && (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: crew.colors.primary,
                        color: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 25px 25px',
        }}>
          <button
            onClick={handleSubmit}
            disabled={loading || !username.trim() || (crewChoice === 'crew' && !selectedCrew)}
            style={{
              background: 'transparent',
              color: '#cc0000',
              border: '4px solid #cc0000',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 900,
              fontFamily: 'Impact, Arial Narrow Bold, sans-serif',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              transform: 'rotate(-3deg)',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 4px 0 #990000',
              position: 'relative',
              top: '-2px',
              opacity: (loading || !username.trim() || (crewChoice === 'crew' && !selectedCrew)) ? 0.5 : 1,
            }}
          >
            {loading ? '...' : '✓ COMPLETE'}
          </button>
          
          <div style={{
            fontSize: '11px',
            color: '#1a1a1a',
            textAlign: 'left',
            background: '#fffae6',
            padding: '12px',
            border: '1px solid #e6d79c',
            fontFamily: 'Courier New, monospace',
            transform: 'rotate(0.5deg)',
            marginTop: '15px',
          }}>
            <strong>🎨 START AS A TOY</strong>
            <div style={{ marginTop: '5px' }}>Place markers to earn REP!</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupSticker;
