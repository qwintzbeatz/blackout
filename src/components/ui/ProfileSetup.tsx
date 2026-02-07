'use client';

import React, { useState, useEffect } from 'react';
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

// Hello My Name Is Sticker Styles
const stickerContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#2d2d2d',
  backgroundImage: `
    repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px),
    radial-gradient(circle at 50% 50%, #3d3d3d 0%, #2d2d2d 100%)
  `,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px'
};

const stickerStyle: React.CSSProperties = {
  backgroundColor: '#fcfcfc',
  width: '100%',
  maxWidth: '360px',
  transform: 'rotate(-1.5deg)',
  boxShadow: `
    0 1px 4px rgba(0,0,0,0.3),
    0 0 0 1px rgba(0,0,0,0.08),
    inset 0 0 30px rgba(0,0,0,0.02),
    0 15px 50px rgba(0,0,0,0.35)
  `,
  backgroundImage: `
    linear-gradient(to bottom, #fcfcfc 0%, #f8f8f8 100%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")
  `,
  borderRadius: '3px',
  overflow: 'hidden'
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  padding: '16px 20px 14px',
};

const headerTextStyle: React.CSSProperties = {
  color: '#ffffff',
  margin: 0,
  fontSize: '28px',
  fontWeight: 900,
  fontFamily: '"Impact", "Haettenschweiler", "Arial Black", sans-serif',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  lineHeight: '1',
  textShadow: '0 0 2px rgba(255,255,255,0.3)'
};

const dividerStyle: React.CSSProperties = {
  height: '3px',
  backgroundColor: '#1a1a1a',
  margin: 0
};

const polaroidStyle: React.CSSProperties = {
  margin: '25px auto 15px',
  padding: '10px 10px 30px 10px',
  backgroundColor: '#fefefe',
  boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
  width: '120px',
  transform: 'rotate(2deg)',
  border: '1px solid #e0e0e0'
};

const stampButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#cc0000',
  border: '4px solid #cc0000',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: 900,
  fontFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  transform: 'rotate(-3deg)',
  cursor: 'pointer',
  width: '100%',
  boxShadow: '0 4px 0 #990000',
  position: 'relative',
  top: '-2px',
  marginBottom: '15px'
};

const stickyNoteStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#1a1a1a',
  textAlign: 'left',
  backgroundColor: '#fffae6',
  padding: '12px',
  border: '1px solid #e6d79c',
  fontFamily: '"Courier New", Courier, monospace',
  transform: 'rotate(0.5deg)',
  lineHeight: '1.4'
};

const ProfileSetupOptimized: React.FC<ProfileSetupProps> = ({
  isVisible,
  user,
  onComplete,
  onClose
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [crewChoice, setCrewChoice] = useState<'crew' | 'solo'>('crew');
  const [selectedCrew, setSelectedCrew] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState('#10b981');

  // Avatar preview
  const avatarPreview = (() => {
    if (!user) return '';
    const crewColor = crewChoice === 'crew' && selectedCrew 
      ? CREWS.find(c => c.id === selectedCrew)?.color.replace('#', '')
      : undefined;
    return generateAvatarUrl(user.uid, username || 'Player', gender, undefined, crewColor);
  })();

  // Validate username
  const validateUsername = (name: string): boolean => {
    if (!name || name.length < 3 || name.length > 20) return false;
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(name);
  };

  // Form validation
  const isStepValid = (() => {
    switch (step) {
      case 1:
        return validateUsername(username) && gender !== undefined;
      case 2:
        return crewChoice === 'solo' || (crewChoice === 'crew' && selectedCrew !== '');
      case 3:
        return true;
      default:
        return false;
    }
  })();

  // Handle next step
  const handleNext = () => {
    if (isStepValid && step < 3) {
      setStep(step + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle complete setup
  const handleComplete = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    
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
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, profileData);
      
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
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isVisible) {
      setStep(1);
      setUsername('');
      setGender('male');
      setCrewChoice('crew');
      setSelectedCrew('');
      setSelectedColor('#10b981');
      setLoading(false);
    }
  }, [isVisible]);

  if (!isVisible || !user) return null;

  return (
    <div style={stickerContainerStyle}>
      <div style={stickerStyle} onClick={(e) => e.stopPropagation()}>
        {/* Sticker Header */}
        <div style={headerStyle}>
          <h2 style={headerTextStyle}>HELLO</h2>
          <h2 style={{...headerTextStyle, marginTop: '4px'}}>MY NAME IS</h2>
        </div>

        {/* Divider */}
        <div style={dividerStyle} />

        {/* Avatar Polaroid */}
        <div style={polaroidStyle}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '4px',
            backgroundColor: '#f0f0f0',
            overflow: 'hidden',
            border: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {username ? (
              <img 
                src={avatarPreview}
                alt="Avatar preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ fontSize: '32px' }}>👤</div>
            )}
          </div>
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            color: '#666',
            fontFamily: '"Courier New", Courier, monospace'
          }}>
            YOUR AVATAR
          </div>
        </div>

        {/* Step Content */}
        <div style={{ padding: '0 25px' }}>
          {/* Step 1: Username */}
          {step === 1 && (
            <div>
              <div style={{
                fontSize: '11px',
                color: '#666',
                fontFamily: '"Courier New", Courier, monospace',
                fontWeight: 'bold',
                textAlign: 'left',
                marginBottom: '8px'
              }}>
                (WRITE YOUR NAME)
              </div>
              <input
                type="text"
                placeholder="__________"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  borderBottom: '3px solid #1a1a1a',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive',
                  textAlign: 'center',
                  backgroundColor: 'transparent',
                  color: '#1a1a1a',
                  letterSpacing: '2px',
                  outline: 'none',
                  textTransform: 'uppercase'
                }}
              />
              
              {/* Gender Checkboxes */}
              <div style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#fafafa',
                border: '2px dashed #ccc',
                borderRadius: '4px'
              }}>
                <div style={{ 
                  fontSize: '10px', 
                  color: '#888',
                  fontFamily: '"Courier New", Courier, monospace',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}>
                  Gender:
                </div>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[
                    { value: 'male', label: '👨' },
                    { value: 'female', label: '👩' },
                    { value: 'other', label: '👽' }
                  ].map((option) => (
                    <label 
                      key={option.value}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid #1a1a1a',
                        marginRight: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: gender === option.value ? '#1a1a1a' : '#fefefe',
                        transition: 'all 0.15s ease'
                      }}>
                        {gender === option.value && (
                          <span style={{ color: '#fefefe', fontSize: '9px', lineHeight: '9px' }}>✓</span>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={gender === option.value}
                        onChange={() => setGender(option.value as any)}
                        style={{ display: 'none' }}
                      />
                      <span style={{ 
                        color: '#1a1a1a',
                        fontWeight: 'bold'
                      }}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Crew Selection */}
          {step === 2 && (
            <div>
              <div style={{
                fontSize: '11px',
                color: '#666',
                fontFamily: '"Courier New", Courier, monospace',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                CHOOSE YOUR CREW:
              </div>
              
              {/* Solo/Crew Toggle */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '15px'
              }}>
                {['solo', 'crew'].map((choice) => (
                  <label
                    key={choice}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: crewChoice === choice ? '#f0f0f0' : '#faf