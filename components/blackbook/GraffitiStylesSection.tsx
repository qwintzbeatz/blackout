'use client';

import React, { useMemo, useCallback } from 'react';
import { GRAFFITI_TYPES, GRAFFITI_LIST } from '@/constants/graffitiTypes';
import { UserProfile } from '@/lib/types/blackout';

interface GraffitiStylesSectionProps {
  userProfile: UserProfile | null;
  onSetActiveStyle: (styleId: string) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

// Unlock thresholds based on REP
const UNLOCK_THRESHOLDS: Record<string, number> = {
  sticker: 0,
  tag: 0,
  stencil: 25,
  pasteup: 50,
  throwup: 100,
  roller: 150,
  etch: 200,
  piece: 300,
  extinguisher: 400,
  burner: 500,
  mural: 750
};

// Unlock messages for each style
const UNLOCK_MESSAGES: Record<string, string> = {
  sticker: 'Your journey begins with a simple slap!',
  tag: 'Every writer starts with their signature.',
  stencil: 'Precision meets creativity.',
  pasteup: 'Taking it to the streets with style.',
  throwup: 'Quick and clean, the bomber\'s choice.',
  roller: 'Big walls, bigger statements.',
  etch: 'Permanent marks on the city\'s skin.',
  piece: 'Masterpieces in motion.',
  extinguisher: 'The fire within unleashed.',
  burner: 'Heat that can\'t be contained!',
  mural: 'The city is your canvas now.'
};

// Difficulty colors
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
  expert: '#8b5cf6'
};

export const GraffitiStylesSection: React.FC<GraffitiStylesSectionProps> = ({
  userProfile,
  onSetActiveStyle,
  onProfileUpdate
}) => {
  // Get unlocked styles from profile
  const unlockedStyles = userProfile?.unlockedGraffitiTypes || ['sticker', 'tag'];
  const activeStyle = userProfile?.activeGraffitiStyle || 'tag';
  const currentRep = userProfile?.rep || 0;

  // Calculate unlock progress for each style
  const getStyleProgress = useCallback((styleId: string): { 
    isUnlocked: boolean; 
    progress: number; 
    repNeeded: number;
    threshold: number;
  } => {
    const threshold = UNLOCK_THRESHOLDS[styleId] ?? 0;
    const isUnlocked = unlockedStyles.includes(styleId) || currentRep >= threshold;
    
    if (threshold === 0) {
      return { isUnlocked: true, progress: 100, repNeeded: 0, threshold: 0 };
    }
    
    const progress = Math.min((currentRep / threshold) * 100, 100);
    const repNeeded = Math.max(threshold - currentRep, 0);
    
    return { isUnlocked, progress, repNeeded, threshold };
  }, [unlockedStyles, currentRep]);

  // Sort styles: unlocked first, then locked by closest to unlock
  const sortedStyles = useMemo(() => {
    const stylesWithProgress = GRAFFITI_LIST.map(styleId => ({
      styleId,
      config: GRAFFITI_TYPES[styleId],
      ...getStyleProgress(styleId)
    }));

    const unlocked = stylesWithProgress
      .filter(s => s.isUnlocked)
      .sort((a, b) => UNLOCK_THRESHOLDS[a.styleId] - UNLOCK_THRESHOLDS[b.styleId]);
    
    const locked = stylesWithProgress
      .filter(s => !s.isUnlocked)
      .sort((a, b) => a.repNeeded - b.repNeeded);

    return [...unlocked, ...locked];
  }, [getStyleProgress]);

  // Stats
  const totalStyles = GRAFFITI_LIST.length;
  const unlockedCount = sortedStyles.filter(s => s.isUnlocked).length;

  // Handle setting active style
  const handleSetActive = useCallback((styleId: string) => {
    if (!unlockedStyles.includes(styleId) && currentRep < (UNLOCK_THRESHOLDS[styleId] ?? 0)) {
      return;
    }
    onSetActiveStyle(styleId);
  }, [unlockedStyles, currentRep, onSetActiveStyle]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Progress Summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff6b6b, #4dabf7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🎨
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Style Collection</div>
            <div style={{ color: '#10b981', fontSize: '12px' }}>
              {unlockedCount}/{totalStyles} unlocked
            </div>
          </div>
        </div>
        <div style={{ color: '#4dabf7', fontSize: '13px' }}>
          REP: {currentRep}
        </div>
      </div>

      {/* Style Feed */}
      {sortedStyles.map(({ styleId, config, isUnlocked, progress, repNeeded, threshold }) => {
        const isActive = activeStyle === styleId;
        const difficultyColor = DIFFICULTY_COLORS[config.difficulty];

        return (
          <div
            key={styleId}
            style={{
              background: isUnlocked 
                ? isActive 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))'
                  : 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              border: isActive 
                ? '2px solid #10b981'
                : isUnlocked 
                  ? '1px solid rgba(255, 255, 255, 0.15)'
                  : '1px solid rgba(255, 255, 255, 0.05)',
              padding: '14px',
              opacity: isUnlocked ? 1 : 0.7
            }}
          >
            {/* Style Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: isUnlocked 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))'
                    : 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  filter: isUnlocked ? 'none' : 'grayscale(100%)'
                }}>
                  {config.icon}
                </div>
                <div>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: isUnlocked ? '#e0e0e0' : '#666'
                  }}>
                    {config.label}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px'
                  }}>
                    <span style={{
                      fontSize: '9px',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      background: `${difficultyColor}20`,
                      color: difficultyColor,
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {config.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: '#ff6b6b' }}>
                      +{config.baseRep} REP
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              <div style={{
                padding: '4px 8px',
                borderRadius: '4px',
                background: isUnlocked 
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
                border: isUnlocked 
                  ? '1px solid rgba(16, 185, 129, 0.3)'
                  : '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: isUnlocked ? '#10b981' : '#ef4444'
                }}>
                  {isUnlocked ? '✓' : '🔒'}
                </span>
              </div>
            </div>

            {/* Unlock Message / Progress */}
            {isUnlocked ? (
              <div style={{
                fontSize: '11px',
                color: '#94a3b8',
                fontStyle: 'italic',
                marginBottom: '10px',
                padding: '6px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px'
              }}>
                "{UNLOCK_MESSAGES[styleId]}"
              </div>
            ) : (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                  Reach {threshold} REP • {repNeeded} needed
                </div>
                <div style={{
                  height: '5px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4dabf7, #10b981)',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            )}

            {/* Action Button */}
            {isUnlocked && (
              <button
                onClick={() => handleSetActive(styleId)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: isActive ? '#10b981' : 'rgba(255, 107, 107, 0.2)',
                  border: isActive ? 'none' : '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '6px',
                  color: isActive ? 'white' : '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                {isActive ? '✓ ACTIVE' : 'SET ACTIVE'}
              </button>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div style={{
        padding: '10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', color: '#666' }}>
          💡 Place drops to earn REP and unlock new styles!
        </div>
      </div>
    </div>
  );
};

GraffitiStylesSection.displayName = 'GraffitiStylesSection';