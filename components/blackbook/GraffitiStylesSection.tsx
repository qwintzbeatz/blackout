'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { GRAFFITI_TYPES, GRAFFITI_LIST, GraffitiType } from '@/constants/graffitiTypes';
import { UserProfile } from '@/lib/types/blackout';
import { StyleVariantSelector } from '@/components/ui/StyleVariantSelector';
import { getCrewTheme } from '@/utils/crewTheme';
import { CrewId } from '@/constants/crewGraffitiStyles';
import { getStyleById, getFontStyle, getSVGStyles } from '@/constants/graffitiFonts';

interface GraffitiStylesSectionProps {
  userProfile: UserProfile | null;
  onSetActiveStyle: (styleId: string) => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

// Unlock messages for each style
const UNLOCK_MESSAGES: Record<string, string> = {
  sticker: 'Your journey begins with a simple slap!',
  tag: 'Every writer starts with their signature.',
  mops: 'Quick and dirty, the mop is your friend.',
  stencil: 'Precision meets creativity.',
  pasteup: 'Taking it to the streets with style.',
  throwup: 'Quick and clean, the bomber\'s choice.',
  roller: 'Big walls, bigger statements.',
  etch: 'Permanent marks on the city\'s skin.',
  piece: 'Masterpieces in motion.',
  extinguisher: 'The fire within unleashed.',
  burner: 'Heat that can\'t be contained!',
  mural: 'The city is your canvas now.',
  rapel: 'The heavens are calling. Risk it all!'
};

// Difficulty colors
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
  expert: '#8b5cf6'
};

// Type unlock thresholds
const TYPE_UNLOCK_THRESHOLDS: Record<GraffitiType, number> = {
  sticker: 0,
  tag: 0,
  mops: 0,
  stencil: 25,
  pasteup: 50,
  throwup: 75,
  roller: 100,
  etch: 125,
  piece: 150,
  extinguisher: 200,
  burner: 250,
  mural: 300,
  rapel: 400
};

export const GraffitiStylesSection: React.FC<GraffitiStylesSectionProps> = ({
  userProfile,
  onSetActiveStyle,
  onProfileUpdate
}) => {
  // Track selected type for the StyleVariantSelector
  const [selectedType, setSelectedType] = useState<GraffitiType>('tag');

  // Get unlocked styles from profile
  const unlockedStyles = userProfile?.unlockedGraffitiTypes || ['sticker', 'tag', 'mops'];
  const activeStyle = userProfile?.selectedGraffitiStyle || userProfile?.selectedStyleVariant || `${userProfile?.crewId || 'bqc'}-tag-svg-1`;
  const currentRep = userProfile?.rep || 0;
  const crewId = userProfile?.crewId as CrewId | null;
  const selectedColor = userProfile?.selectedColor;
  const playerTagName = userProfile?.username || 'TAG';

  // Get crew theme for styling
  const crewTheme = getCrewTheme(crewId);
  const crewDisplayColor = crewTheme.primary === '#000000' ? '#808080' : crewTheme.primary;

  // Calculate unlock progress for each type
  const getStyleProgress = useCallback((styleId: GraffitiType): { 
    isUnlocked: boolean; 
    progress: number; 
    repNeeded: number;
    threshold: number;
  } => {
    const threshold = TYPE_UNLOCK_THRESHOLDS[styleId] ?? 0;
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
      .sort((a, b) => TYPE_UNLOCK_THRESHOLDS[a.styleId] - TYPE_UNLOCK_THRESHOLDS[b.styleId]);
    
    const locked = stylesWithProgress
      .filter(s => !s.isUnlocked)
      .sort((a, b) => a.repNeeded - b.repNeeded);

    return [...unlocked, ...locked];
  }, [getStyleProgress]);

  // Stats
  const totalStyles = GRAFFITI_LIST.length;
  const unlockedCount = sortedStyles.filter(s => s.isUnlocked).length;

  // Handle setting active style from StyleVariantSelector
  const handleStyleSelect = useCallback((styleId: string) => {
    const style = getStyleById(styleId);
    if (!style) return;

    onProfileUpdate({
      ...userProfile!,
      selectedGraffitiStyle: styleId,
      selectedStyleVariant: styleId,
      selectedStyleType: style.styleType,
      activeGraffitiStyle: style.graffitiType
    });
    onSetActiveStyle(styleId);
  }, [userProfile, onProfileUpdate, onSetActiveStyle]);

  // Get current style info for display
  const currentStyle = getStyleById(activeStyle);
  const currentType = currentStyle?.graffitiType || 'tag';

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
            background: `linear-gradient(135deg, ${crewDisplayColor}, ${crewTheme.secondary || '#333'})`,
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
        <div style={{ color: crewDisplayColor, fontSize: '13px' }}>
          REP: {currentRep}
        </div>
      </div>

      {/* Current Active Style */}
      {crewId && currentStyle && (
        <div style={{
          padding: '10px',
          background: `${crewDisplayColor}15`,
          borderRadius: '8px',
          border: `1px solid ${crewDisplayColor}30`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: `${crewDisplayColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            {GRAFFITI_TYPES[currentType]?.icon || '🎨'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Active Style</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: crewDisplayColor }}>
              {currentStyle.name}
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {currentStyle.styleType === 'font' ? '🔤 Font Style' : '📐 SVG Icon'} • {currentStyle.tier}
            </div>
          </div>
          {/* Style Type Badge */}
          <div style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: currentStyle.styleType === 'font' ? '#8b5cf620' : `${crewDisplayColor}20`,
            border: currentStyle.styleType === 'font' ? '1px solid #8b5cf640' : `1px solid ${crewDisplayColor}40`
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: currentStyle.styleType === 'font' ? '#8b5cf6' : crewDisplayColor
            }}>
              {currentStyle.styleType === 'font' ? 'Aa' : `V${currentStyle.variant}`}
            </span>
          </div>
        </div>
      )}

      {/* Type Selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '8px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: '8px'
      }}>
        {sortedStyles.map(({ styleId, config, isUnlocked }) => {
          const isActive = currentType === styleId;
          const difficultyColor = DIFFICULTY_COLORS[config.difficulty];

          return (
            <button
              key={styleId}
              onClick={() => isUnlocked && setSelectedType(styleId)}
              style={{
                padding: '8px 12px',
                background: isActive 
                  ? `${crewDisplayColor}30`
                  : isUnlocked 
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.3)',
                border: isActive 
                  ? `2px solid ${crewDisplayColor}`
                  : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{config.icon}</span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold',
                color: isUnlocked ? (isActive ? crewDisplayColor : '#e0e0e0') : '#666'
              }}>
                {config.label}
              </span>
              {!isUnlocked && (
                <span style={{ fontSize: '10px' }}>🔒</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Style Variant Selector (SVG + Font tabs) */}
      {crewId && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <StyleVariantSelector
            userProfile={userProfile}
            selectedType={selectedType}
            selectedStyle={activeStyle}
            onStyleSelect={handleStyleSelect}
            selectedColor={selectedColor}
            userTagName={playerTagName}
          />
        </div>
      )}

      {/* No Crew Message */}
      {!crewId && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#94a3b8',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Join a Crew First</div>
          <div style={{ fontSize: '12px' }}>Styles are only available to crew members</div>
        </div>
      )}

      {/* Type Info */}
      {selectedType && (
        <div style={{
          padding: '10px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '20px' }}>{GRAFFITI_TYPES[selectedType]?.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {GRAFFITI_TYPES[selectedType]?.label}
            </span>
            <span style={{
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '3px',
              background: `${DIFFICULTY_COLORS[GRAFFITI_TYPES[selectedType]?.difficulty]}20`,
              color: DIFFICULTY_COLORS[GRAFFITI_TYPES[selectedType]?.difficulty],
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              {GRAFFITI_TYPES[selectedType]?.difficulty}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
            "{UNLOCK_MESSAGES[selectedType] || 'A new style awaits!'}"
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
            +{GRAFFITI_TYPES[selectedType]?.baseRep || 5} REP per drop
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '10px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', color: '#666' }}>
          💡 Select SVG icons or Font styles for your markers!
        </div>
        <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>
          Font styles display your tag name in graffiti letters
        </div>
      </div>
    </div>
  );
};

GraffitiStylesSection.displayName = 'GraffitiStylesSection';