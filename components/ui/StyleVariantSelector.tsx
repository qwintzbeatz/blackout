'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { GRAFFITI_TYPES, GraffitiType } from '@/constants/graffitiTypes';
import { UserProfile } from '@/lib/types/blackout';
import {
  SVG_UNLOCK_THRESHOLDS,
  getSVGStyles,
  getFontStyle,
  getStyleById,
  isStyleUnlocked,
  getNextSVGUnlock,
  StyleTier
} from '@/constants/graffitiFonts';
import { CrewId } from '@/constants/crewGraffitiStyles';
import { getCrewTheme } from '@/utils/crewTheme';

interface StyleVariantSelectorProps {
  userProfile: UserProfile | null;
  selectedType: GraffitiType;
  selectedStyle: string | null;
  onStyleSelect: (styleId: string) => void;
  selectedColor?: string;
  userTagName?: string; // For font preview
}

// Tier colors for SVG unlocks
const TIER_COLORS: Record<StyleTier, string> = {
  starter: '#10b981',    // Green (FREE)
  common: '#3b82f6',     // Blue
  rare: '#8b5cf6',       // Purple
  epic: '#f59e0b',       // Orange
  legendary: '#ef4444',  // Red
  master: '#ec4899'      // Pink
};

export const StyleVariantSelector: React.FC<StyleVariantSelectorProps> = ({
  userProfile,
  selectedType,
  selectedStyle,
  onStyleSelect,
  selectedColor,
  userTagName = 'TAG'
}) => {
  // Default to Font tab since fonts are free
  const [activeTab, setActiveTab] = useState<'font' | 'svg'>('font');
  
  const unlockedStyles = userProfile?.unlockedGraffitiStyles || [];
  const currentRep = userProfile?.rep || 0;
  const crewId = userProfile?.crewId as CrewId | null;

  // Get crew theme for styling
  const crewTheme = getCrewTheme(crewId);
  const crewDisplayColor = crewTheme.primary === '#000000' ? '#808080' : crewTheme.primary;
  const markerColor = selectedColor || crewDisplayColor;

  // Get SVG and Font styles for this type
  const svgStyles = useMemo(() => {
    if (!crewId) return [];
    return getSVGStyles(crewId, selectedType);
  }, [crewId, selectedType]);

  const fontStyle = useMemo(() => {
    if (!crewId) return null;
    return getFontStyle(crewId, selectedType);
  }, [crewId, selectedType]);

  // Get next SVG unlock info
  const nextUnlock = useMemo(() => {
    if (!crewId) return null;
    return getNextSVGUnlock(currentRep, crewId, selectedType);
  }, [crewId, currentRep, selectedType]);

  // If no crew, show message
  if (!crewId) {
    return (
      <div style={{
        padding: '16px',
        textAlign: 'center',
        color: '#94a3b8',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: '1px dashed rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Join a Crew First</div>
        <div style={{ fontSize: '11px' }}>Styles are only available to crew members</div>
      </div>
    );
  }

  // Render SVG grid
  const renderSVGGrid = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '8px',
      padding: '12px 0'
    }}>
      {svgStyles.map((style) => {
        const isUnlocked = isStyleUnlocked(style.id, currentRep, unlockedStyles);
        const isActive = selectedStyle === style.id;
        const tierColor = TIER_COLORS[style.tier];

        return (
          <div
            key={style.id}
            onClick={() => isUnlocked && onStyleSelect(style.id)}
            style={{
              aspectRatio: '1',
              background: isActive 
                ? `${markerColor}25`
                : isUnlocked 
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.4)',
              borderRadius: '10px',
              border: isActive 
                ? `2px solid ${markerColor}`
                : isUnlocked 
                  ? `1px solid ${tierColor}40`
                  : '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isUnlocked ? 'pointer' : 'not-allowed',
              opacity: isUnlocked ? 1 : 0.5,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              padding: '6px'
            }}
            title={isUnlocked ? style.name : `Unlock at ${style.unlockRep} REP`}
          >
            {/* Lock overlay */}
            {!isUnlocked && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px'
              }}>
                <span style={{ fontSize: '12px' }}>🔒</span>
                <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                  {style.unlockRep}
                </span>
              </div>
            )}

            {/* Icon preview */}
            <div style={{
              fontSize: '18px',
              color: markerColor,
              filter: isUnlocked ? 'none' : 'grayscale(100%)'
            }}>
              {GRAFFITI_TYPES[selectedType]?.icon || '🎨'}
            </div>

            {/* Tier indicator */}
            <div style={{
              position: 'absolute',
              bottom: '2px',
              left: '2px',
              width: '6px',
              height: '6px',
              background: tierColor,
              borderRadius: '50%'
            }} />

            {/* Active check */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                background: markerColor,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                color: 'white'
              }}>
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Font card (FREE)
  const renderFontCard = () => {
    if (!fontStyle) return null;
    
    const isActive = selectedStyle === fontStyle.id;
    
    return (
      <div style={{ padding: '12px 0' }}>
        <div
          onClick={() => onStyleSelect(fontStyle.id)}
          style={{
            background: isActive 
              ? `${markerColor}25`
              : 'rgba(16, 185, 129, 0.1)',
            borderRadius: '12px',
            border: isActive 
              ? `2px solid ${markerColor}`
              : '1px solid rgba(16, 185, 129, 0.3)',
            padding: '16px',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {/* FREE Badge */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            padding: '4px 8px',
            background: '#10b981',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            FREE
          </div>

          {/* Font Preview */}
          <div style={{
            fontFamily: fontStyle.fontFamily || 'sans-serif',
            fontSize: '28px',
            fontWeight: 'bold',
            color: markerColor,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            WebkitTextStroke: '1px rgba(0,0,0,0.3)',
            letterSpacing: '2px'
          }}>
            {userTagName.toUpperCase()}
          </div>

          {/* Font Name */}
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#10b981'
          }}>
            {fontStyle.name}
          </div>

          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            textAlign: 'center'
          }}>
            Your tag name in graffiti style
          </div>

          {/* Active indicator */}
          {isActive && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 10px',
              background: markerColor,
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              ✓ ACTIVE
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: `1px solid ${markerColor}30`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>
            {GRAFFITI_TYPES[selectedType]?.icon || '🎨'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e0e0e0' }}>
            {GRAFFITI_TYPES[selectedType]?.label || selectedType}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          REP: {currentRep}
        </span>
      </div>

      {/* Tab Navigation - Font first (default) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        background: 'rgba(255,255,255,0.03)',
        padding: '4px',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => setActiveTab('font')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'font' ? '#10b98120' : 'transparent',
            border: activeTab === 'font' ? '1px solid #10b98140' : '1px solid transparent',
            borderRadius: '6px',
            color: activeTab === 'font' ? '#10b981' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          🔤 Font
          <span style={{ 
            fontSize: '9px', 
            padding: '2px 4px', 
            background: '#10b981', 
            borderRadius: '4px',
            color: 'white'
          }}>
            FREE
          </span>
        </button>
        <button
          onClick={() => setActiveTab('svg')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'svg' ? `${markerColor}20` : 'transparent',
            border: activeTab === 'svg' ? `1px solid ${markerColor}40` : '1px solid transparent',
            borderRadius: '6px',
            color: activeTab === 'svg' ? markerColor : '#94a3b8',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          🎨 Icons
          <span style={{ fontSize: '10px', color: '#666' }}>
            {svgStyles.filter(s => isStyleUnlocked(s.id, currentRep, unlockedStyles)).length}/{svgStyles.length}
          </span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'font' ? renderFontCard() : renderSVGGrid()}

      {/* Next Unlock Info (only in SVG tab) */}
      {activeTab === 'svg' && nextUnlock && (
        <div style={{
          padding: '10px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>
            🔜 Next Unlock: {nextUnlock.name}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
            {nextUnlock.unlockRep - currentRep} REP needed
          </div>
        </div>
      )}

      {/* Selected Style Info */}
      {selectedStyle && (
        <div style={{
          padding: '10px',
          background: `${markerColor}10`,
          borderRadius: '8px',
          border: `1px solid ${markerColor}30`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: `${markerColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            {GRAFFITI_TYPES[selectedType]?.icon || '🎨'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: markerColor }}>
              {getStyleById(selectedStyle)?.name || 'Selected Style'}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              {getStyleById(selectedStyle)?.tier === 'starter' ? 'FREE Font' : `${getStyleById(selectedStyle)?.tier} Icon`}
            </div>
          </div>
          <div style={{
            padding: '4px 8px',
            background: '#10b98120',
            borderRadius: '4px',
            color: '#10b981',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            +{GRAFFITI_TYPES[selectedType]?.baseRep || 5} REP
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleVariantSelector;