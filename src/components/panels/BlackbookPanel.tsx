'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { UserMarker, MarkerName, MarkerDescription } from '@/lib/utils/types';
import { getCrewTheme } from '@/utils/crewTheme';
import { getStyleById, getDefaultStyleForCrew, getFontStyle, getSVGStyles, isStyleUnlocked } from '@/constants/graffitiFonts';
import { GRAFFITI_TYPES, GRAFFITI_LIST, GraffitiType } from '@/constants/graffitiTypes';
import { CrewId } from '@/constants/crewGraffitiStyles';

interface BlackbookPanelProps {
  userMarkers: UserMarker[];
  onDeleteMarker: (markerId: string) => void;
  onDeleteAllMarkers: () => void;
  onClose: () => void;
  userProfile: {
    uid?: string;
    username: string;
    profilePicUrl: string;
    rank: string;
    level: number;
    rep: number;
    totalMarkers: number;
    crewId?: string | null;
    selectedColor?: string;
    selectedGraffitiStyle?: string;
  };
  onProfileUpdate?: (profile: any) => void;
}

const BlackbookPanel: React.FC<BlackbookPanelProps> = ({
  userMarkers,
  onDeleteMarker,
  onDeleteAllMarkers,
  onClose,
  userProfile,
  onProfileUpdate
}) => {
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | 'all' | null>(null);
  const [selectedType, setSelectedType] = useState<GraffitiType>('tag');
  
  // Get crew theme
  const crewTheme = getCrewTheme(userProfile?.crewId);
  const crewColor = crewTheme.primary;
  const crewDisplayColor = crewColor === '#000000' ? '#808080' : crewColor;
  const markerColor = userProfile?.selectedColor || crewDisplayColor;
  const playerTagName = userProfile?.username || 'TAG';
  const currentRep = userProfile?.rep || 0;
  const crewId = (userProfile?.crewId || 'bqc') as CrewId;
  
  // Get styles
  const fontStyle = getFontStyle(crewId, selectedType);
  const svgStyles = getSVGStyles(crewId, selectedType);
  
  // Current active style
  const activeStyleId = userProfile?.selectedGraffitiStyle || getDefaultStyleForCrew(crewId);
  const activeStyle = getStyleById(activeStyleId);
  
  // Handle style selection
  const handleSelectStyle = useCallback((styleId: string) => {
    if (!onProfileUpdate || !userProfile) return;
    onProfileUpdate({
      ...userProfile,
      selectedGraffitiStyle: styleId,
      selectedStyleVariant: styleId,
      activeGraffitiStyle: styleId.split('-')[1]
    });
  }, [userProfile, onProfileUpdate]);

  // Calculate marker statistics
  const markerStats = useMemo(() => {
    const stats = {
      totalMarkers: userMarkers.length,
      markerTypes: {} as Record<string, number>,
      markerDescriptions: {} as Record<string, number>,
      recentMarkers: userMarkers.slice(-5).reverse(),
      topLocations: [] as Array<{lat: number; lng: number; count: number}>
    };

    userMarkers.forEach(marker => {
      stats.markerTypes[marker.name] = (stats.markerTypes[marker.name] || 0) + 1;
      stats.markerDescriptions[marker.description] = (stats.markerDescriptions[marker.description] || 0) + 1;
    });

    const locationMap = new Map<string, number>();
    userMarkers.forEach(marker => {
      const latKey = Math.round(marker.position[0] * 100) / 100;
      const lngKey = Math.round(marker.position[1] * 100) / 100;
      const key = `${latKey},${lngKey}`;
      locationMap.set(key, (locationMap.get(key) || 0) + 1);
    });

    stats.topLocations = Array.from(locationMap.entries())
      .map(([key, count]) => {
        const [lat, lng] = key.split(',').map(Number);
        return { lat, lng, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return stats;
  }, [userMarkers]);

  const handleDeleteMarker = useCallback((markerId: string) => {
    onDeleteMarker(markerId);
    setShowDeleteConfirm(null);
    setSelectedMarker(null);
  }, [onDeleteMarker]);

  const handleDeleteAllMarkers = useCallback(() => {
    onDeleteAllMarkers();
    setShowDeleteConfirm(null);
  }, [onDeleteAllMarkers]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1500
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        color: '#e0e0e0',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        width: 'min(100vw, 400px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            margin: 0, 
            color: crewDisplayColor, 
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📓 BLACKBOOK
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
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>

        {/* CURRENT STYLE PREVIEW - BIG */}
        <div style={{
          background: `linear-gradient(135deg, ${crewDisplayColor}30, ${crewDisplayColor}10)`,
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
          border: `2px solid ${crewDisplayColor}50`
        }}>
          <div style={{
            fontSize: '10px',
            color: '#94a3b8',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            YOUR TAG
          </div>
          
          {/* TAG NAME IN FONT */}
          <div style={{
            fontFamily: activeStyle?.fontFamily || 'sans-serif',
            fontSize: '40px',
            fontWeight: 'bold',
            color: markerColor,
            textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
            letterSpacing: '4px',
            marginBottom: '12px'
          }}>
            {playerTagName.toUpperCase()}
          </div>

          {/* Current Style Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>
              {GRAFFITI_TYPES[activeStyle?.graffitiType || 'tag']?.icon}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {activeStyle?.name || 'Tag Font'}
            </span>
            {activeStyle?.styleType === 'font' && (
              <span style={{
                padding: '2px 8px',
                background: '#10b981',
                borderRadius: '4px',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                FREE
              </span>
            )}
          </div>
        </div>

        {/* SELECT GRAFFITI TYPE */}
        <div>
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Select Type
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>
            {GRAFFITI_LIST.map(type => {
              const config = GRAFFITI_TYPES[type];
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: '8px 12px',
                    background: isActive ? `${crewDisplayColor}30` : 'rgba(255,255,255,0.05)',
                    border: isActive ? `2px solid ${crewDisplayColor}` : '2px solid transparent',
                    borderRadius: '8px',
                    color: isActive ? crewDisplayColor : '#e0e0e0',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isActive ? 'bold' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FONT STYLE - FREE */}
        {fontStyle && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>🔤</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>FONT STYLE</span>
              <span style={{
                padding: '2px 6px',
                background: '#10b981',
                borderRadius: '4px',
                color: 'white',
                fontSize: '9px',
                fontWeight: 'bold'
              }}>
                FREE
              </span>
            </div>
            
            <div
              onClick={() => handleSelectStyle(fontStyle.id)}
              style={{
                background: activeStyleId === fontStyle.id 
                  ? `${crewDisplayColor}20`
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                border: activeStyleId === fontStyle.id 
                  ? `2px solid ${crewDisplayColor}`
                  : '2px solid transparent',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontFamily: fontStyle.fontFamily || 'sans-serif',
                fontSize: '28px',
                fontWeight: 'bold',
                color: markerColor,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '2px'
              }}>
                {playerTagName.toUpperCase()}
              </div>
              {activeStyleId === fontStyle.id && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: '#10b981',
                  fontWeight: 'bold'
                }}>
                  ✓ SELECTED
                </div>
              )}
            </div>
          </div>
        )}

        {/* ICON STYLES - UNLOCKABLE */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '14px' }}>🎨</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>ICON STYLES</span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              ({svgStyles.filter(s => isStyleUnlocked(s.id, currentRep, [])).length}/{svgStyles.length} unlocked)
            </span>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}>
            {svgStyles.map(style => {
              const isUnlocked = isStyleUnlocked(style.id, currentRep, []);
              const isActive = activeStyleId === style.id;
              
              return (
                <div
                  key={style.id}
                  onClick={() => isUnlocked && handleSelectStyle(style.id)}
                  style={{
                    aspectRatio: '1',
                    background: isActive 
                      ? `${crewDisplayColor}30`
                      : isUnlocked 
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.5)',
                    borderRadius: '10px',
                    border: isActive 
                      ? `2px solid ${crewDisplayColor}`
                      : '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    position: 'relative',
                    opacity: isUnlocked ? 1 : 0.5
                  }}
                >
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
                      gap: '2px'
                    }}>
                      <span style={{ fontSize: '12px' }}>🔒</span>
                      <span style={{ fontSize: '8px', color: '#94a3b8' }}>{style.unlockRep}</span>
                    </div>
                  )}
                  <span style={{ fontSize: '18px' }}>
                    {GRAFFITI_TYPES[selectedType]?.icon}
                  </span>
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      width: '12px',
                      height: '12px',
                      background: crewDisplayColor,
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
        </div>

        {/* REP INFO */}
        <div style={{
          padding: '10px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Your REP: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{currentRep}</span>
            {' • '}
            Unlock icons with REP!
          </span>
        </div>

        {/* MARKER STATS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px'
        }}>
          <div style={{
            background: 'rgba(79, 172, 254, 0.1)',
            border: '1px solid rgba(79, 172, 254, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4dabf7' }}>
              {markerStats.totalMarkers}
            </div>
            <div style={{ fontSize: '10px', color: '#b0b0b0' }}>Markers</div>
          </div>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {userProfile.level}
            </div>
            <div style={{ fontSize: '10px', color: '#b0b0b0' }}>Level</div>
          </div>
          <div style={{
            background: 'rgba(255, 107, 53, 0.1)',
            border: '1px solid rgba(255, 107, 53, 0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b35' }}>
              {userProfile.rank}
            </div>
            <div style={{ fontSize: '10px', color: '#b0b0b0' }}>Rank</div>
          </div>
        </div>

        {/* RECENT MARKERS */}
        {markerStats.recentMarkers.length > 0 && (
          <div>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Recent Markers
            </div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {markerStats.recentMarkers.map((marker, index) => (
                <div
                  key={marker.id || index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    fontSize: '12px'
                  }}
                >
                  <span>{marker.name}</span>
                  <span style={{ color: '#666' }}>{formatDate(marker.timestamp).split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DELETE ALL BUTTON */}
        {userMarkers.length > 0 && (
          <button
            onClick={() => setShowDeleteConfirm('all')}
            style={{
              padding: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            🗑️ Clear All Markers ({userMarkers.length})
          </button>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            zIndex: 1600,
            minWidth: '280px'
          }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 15px' }}>⚠️ Confirm Delete</h3>
            <p style={{ color: '#e0e0e0', marginBottom: '20px', fontSize: '14px' }}>
              {showDeleteConfirm === 'all' 
                ? `Delete ALL ${userMarkers.length} markers? This cannot be undone.`
                : 'Delete this marker? This cannot be undone.'
              }
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm === 'all') {
                    handleDeleteAllMarkers();
                  } else {
                    handleDeleteMarker(showDeleteConfirm);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackbookPanel;