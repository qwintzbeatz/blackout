'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { UserProfile, UserMarker, Drop, TopPlayer, NearbyCrewMember } from '@/lib/types/blackout';
import { getCrewTheme } from '@/utils/crewTheme';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  ALL_GRAFFITI_STYLES, 
  GraffitiStyle, 
  getDefaultStyleForCrew,
  isStyleUnlocked,
  FONT_SIZES
} from '@/constants/graffitiFonts';
import { GRAFFITI_TYPES } from '@/constants/graffitiTypes';
import { CrewId } from '@/constants/crewGraffitiStyles';

interface BlackbookPanelProps {
  userProfile: UserProfile | null;
  userMarkers: UserMarker[];
  drops: Drop[];
  topPlayers: TopPlayer[];
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
  onCenterMap: (coords: [number, number], zoom?: number) => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  showTopPlayers: boolean;
  onToggleTopPlayers: () => void;
  showOnlyMyDrops: boolean;
  onToggleFilter: () => void;
  onLogout: () => void;
  nearbyCrewMembers: NearbyCrewMember[];
  expandedRadius: number;
  onOpenCrewChat: () => void;
}

// Available font files (checked in public/fonts/)
const AVAILABLE_FONTS: Record<string, { crewId: string; type: string; hasFont: boolean }> = {
  'bqc-tag': { crewId: 'bqc', type: 'tag', hasFont: true },
  'bqc-mops': { crewId: 'bqc', type: 'mops', hasFont: true },
  'bqc-stencil': { crewId: 'bqc', type: 'stencil', hasFont: true },
  'bqc-piece': { crewId: 'bqc', type: 'piece', hasFont: true },
  'bqc-roller': { crewId: 'bqc', type: 'roller', hasFont: true },
  'bqc-throwup': { crewId: 'bqc', type: 'throwup', hasFont: true },
  'bqc-etch': { crewId: 'bqc', type: 'etch', hasFont: true },
};

export const BlackbookPanel: React.FC<BlackbookPanelProps> = ({
  userProfile,
  onClose,
  onProfileUpdate,
  onRefreshAll,
  isRefreshing,
  onLogout
}) => {
  // Get crew theme
  const crewTheme = getCrewTheme(userProfile?.crewId);
  const crewColor = crewTheme.primary;
  const crewDisplayColor = crewColor === '#000000' ? '#808080' : crewColor;
  const markerColor = userProfile?.selectedColor || userProfile?.favoriteColor || crewDisplayColor;
  const playerTagName = userProfile?.username || 'TAG';
  const currentRep = userProfile?.rep || 0;
  const crewId = (userProfile?.crewId || 'bqc') as CrewId;
  
  // Current selected style
  const selectedStyleId = userProfile?.selectedGraffitiStyle || getDefaultStyleForCrew(crewId);
  
  // State for tabs
  const [activeTab, setActiveTab] = useState<'fonts' | 'icons' | 'locked'>('fonts');
  
  // Get all available styles for this crew
  const crewStyles = useMemo(() => {
    return ALL_GRAFFITI_STYLES.filter(s => s.crewId === crewId);
  }, [crewId]);
  
  // Get unlocked styles (fonts are free, SVGs need REP)
  const unlockedStyles = useMemo(() => {
    return crewStyles.filter(style => 
      isStyleUnlocked(style.id, currentRep, userProfile?.unlockedGraffitiTypes || [])
    );
  }, [crewStyles, currentRep, userProfile?.unlockedGraffitiTypes]);
  
  // Get locked styles
  const lockedStyles = useMemo(() => {
    return crewStyles.filter(style => 
      !isStyleUnlocked(style.id, currentRep, userProfile?.unlockedGraffitiTypes || [])
    );
  }, [crewStyles, currentRep, userProfile?.unlockedGraffitiTypes]);
  
  // Separate fonts and icons
  const unlockedFonts = unlockedStyles.filter(s => s.styleType === 'font');
  const unlockedIcons = unlockedStyles.filter(s => s.styleType === 'svg');
  const lockedFonts = lockedStyles.filter(s => s.styleType === 'font');
  const lockedIcons = lockedStyles.filter(s => s.styleType === 'svg');
  
  // Handle style selection
  const handleSelectStyle = useCallback(async (styleId: string) => {
    if (!userProfile) return;
    
    // Update local state immediately for instant feedback
    onProfileUpdate({
      ...userProfile,
      selectedGraffitiStyle: styleId,
      selectedStyleVariant: styleId,
      activeGraffitiStyle: styleId.split('-')[1]
    });
    
    // Persist to Firestore
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        selectedGraffitiStyle: styleId,
        selectedStyleVariant: styleId,
        activeGraffitiStyle: styleId.split('-')[1],
        lastActive: Timestamp.now()
      });
      console.log('✅ Style saved to Firestore:', styleId);
    } catch (error) {
      console.error('Error saving style to Firestore:', error);
    }
  }, [userProfile, onProfileUpdate]);

  // Render a style card
  const renderStyleCard = (style: GraffitiStyle, isUnlocked: boolean) => {
    const isSelected = selectedStyleId === style.id;
    const fontSize = FONT_SIZES[style.graffitiType] || 16;
    const config = GRAFFITI_TYPES[style.graffitiType];
    
    // Check if font file actually exists
    const fontKey = `${style.crewId}-${style.graffitiType}`;
    const hasRealFont = AVAILABLE_FONTS[fontKey]?.hasFont;
    const fontFamily = hasRealFont 
      ? `${style.crewId.toUpperCase()}_${style.graffitiType}` 
      : 'var(--font-permanent-marker), "Permanent Marker", cursive';
    
    if (style.styleType === 'font') {
      // FONT STYLE CARD - Full width with horizontal layout, no emojis
      return (
        <div
          key={style.id}
          onClick={() => isUnlocked && handleSelectStyle(style.id)}
          style={{
            background: isSelected 
              ? `linear-gradient(135deg, ${crewDisplayColor}30, ${crewDisplayColor}10)`
              : isUnlocked 
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '8px 12px',
            cursor: isUnlocked ? 'pointer' : 'not-allowed',
            border: isSelected 
              ? `2px solid ${crewDisplayColor}`
              : '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            position: 'relative',
            opacity: isUnlocked ? 1 : 0.5,
            transition: 'all 0.2s ease',
            width: '100%',
            height: '70px',
            boxSizing: 'border-box'
          }}
        >
          {/* Type name - Left side (no emoji) */}
          <div style={{
            minWidth: '60px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}>
              {style.graffitiType}
            </div>
          </div>
          
          {/* Tag preview - Center (takes remaining space) */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            padding: '0 4px'
          }}>
            <div style={{
              fontFamily: fontFamily,
              fontSize: `${fontSize}px`,
              fontWeight: 'bold',
              color: isUnlocked ? markerColor : '#666',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              letterSpacing: '1px',
              textAlign: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {playerTagName.toUpperCase()}
            </div>
          </div>
          
          {/* Right side - Badges (text only, no emoji) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: '50px',
            justifyContent: 'flex-end'
          }}>
            {/* Free badge */}
            {isUnlocked && (
              <div style={{
                background: '#10b981',
                borderRadius: '12px',
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                color: 'white',
                whiteSpace: 'nowrap'
              }}>
                FREE
              </div>
            )}
            
            {/* Selected check (text only) */}
            {isSelected && (
              <div style={{
                width: '22px',
                height: '22px',
                background: crewDisplayColor,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                ✓
              </div>
            )}
          </div>
          
          {/* Locked overlay - text only, no emoji */}
          {!isUnlocked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              <span style={{ color: '#94a3b8' }}>LOCKED</span>
              <span style={{ color: crewDisplayColor }}>{style.unlockRep} REP</span>
            </div>
          )}
        </div>
      );
    } else {
      // ICON STYLE CARD - Fixed square dimensions, text only
      return (
        <div
          key={style.id}
          onClick={() => isUnlocked && handleSelectStyle(style.id)}
          style={{
            background: isSelected 
              ? `${crewDisplayColor}30`
              : isUnlocked 
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '8px',
            cursor: isUnlocked ? 'pointer' : 'not-allowed',
            border: isSelected 
              ? `2px solid ${crewDisplayColor}`
              : '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            position: 'relative',
            opacity: isUnlocked ? 1 : 0.5,
            width: '100%',
            aspectRatio: '1',
            boxSizing: 'border-box'
          }}
        >
          {/* Icon type text instead of emoji */}
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#e0e0e0',
            textTransform: 'uppercase'
          }}>
            {style.graffitiType}
          </div>
          
          {/* Variant number */}
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.1)',
            padding: '2px 6px',
            borderRadius: '10px'
          }}>
            V{style.variant}
          </div>
          
          {/* Selected check (text only) */}
          {isSelected && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '16px',
              height: '16px',
              background: crewDisplayColor,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
          )}
          
          {/* Locked overlay - text only, no emoji */}
          {!isUnlocked && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              <span style={{ color: '#94a3b8' }}>LOCKED</span>
              <span style={{ color: crewDisplayColor }}>{style.unlockRep} REP</span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: '#e0e0e0',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      width: 'min(90vw, 380px)',
      maxHeight: '70vh',
      overflowY: 'auto',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 1400,
      position: 'relative'
    }}>
      {/* Header - removed emoji */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: crewDisplayColor, 
          fontSize: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}>
          BLACKBOOK
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>

      {/* CURRENT STYLE PREVIEW - text only */}
      <div style={{
        background: `linear-gradient(135deg, ${crewDisplayColor}20, ${crewDisplayColor}05)`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        border: `1px solid ${crewDisplayColor}30`,
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '10px',
          color: '#94a3b8',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          YOUR TAG
        </div>
        <div style={{
          fontFamily: 'var(--font-permanent-marker), "Permanent Marker", cursive',
          fontSize: '32px',
          fontWeight: 'bold',
          color: markerColor,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          letterSpacing: '2px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {playerTagName.toUpperCase()}
        </div>
      </div>

      {/* Tabs - text only */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '8px'
      }}>
        {(['fonts', 'icons', 'locked'] as const).map(tab => {
          const count = tab === 'fonts' ? unlockedFonts.length : 
                       tab === 'icons' ? unlockedIcons.length : 
                       lockedIcons.length + lockedFonts.length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: activeTab === tab ? crewDisplayColor : 'transparent',
                border: 'none',
                color: activeTab === tab ? '#ffffff' : '#b0b0b0',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {tab}
              <span style={{ 
                marginLeft: '6px',
                fontSize: '10px',
                opacity: 0.8,
                backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FONTS TAB - 1 column, text only */}
      {activeTab === 'fonts' && unlockedFonts.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '0 4px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Font Styles
            </span>
            <span style={{ fontSize: '11px', color: '#10b981' }}>
              {unlockedFonts.length} unlocked
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {unlockedFonts.map(style => renderStyleCard(style, true))}
          </div>
        </div>
      )}

      {/* ICONS TAB - 4 columns, text only */}
      {activeTab === 'icons' && unlockedIcons.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '0 4px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Icon Styles
            </span>
            <span style={{ fontSize: '11px', color: '#10b981' }}>
              {unlockedIcons.length} unlocked
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            {unlockedIcons.map(style => renderStyleCard(style, true))}
          </div>
        </div>
      )}

      {/* LOCKED TAB - 4 columns, text only */}
      {activeTab === 'locked' && (lockedFonts.length > 0 || lockedIcons.length > 0) && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '0 4px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Locked Styles
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              unlock with REP
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            {/* Show both locked icons and fonts, but prioritize icons for display */}
            {[...lockedIcons, ...lockedFonts].slice(0, 8).map(style => renderStyleCard(style, false))}
          </div>
        </div>
      )}

      {/* REP INFO - text only */}
      <div style={{
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          YOUR REP: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{currentRep}</span>
        </span>
      </div>

      {/* Actions - text only */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          style={{
            flex: 1,
            background: '#4dabf7',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            opacity: isRefreshing ? 0.7 : 1,
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(77, 171, 247, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRefreshing) {
              e.currentTarget.style.backgroundColor = '#4dabf7';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        <button
          onClick={onLogout}
          style={{
            flex: 1,
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Sign Out
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }

        @keyframes popUp {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Custom scrollbar for panel */
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
};

BlackbookPanel.displayName = 'BlackbookPanel';