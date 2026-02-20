'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { GRAFFITI_TYPES, GRAFFITI_LIST } from '@/constants/graffitiTypes';
import { UserProfile, UserMarker, Drop, TopPlayer, NearbyCrewMember } from '@/lib/types/blackout';
import { GraffitiStylesSection } from './GraffitiStylesSection';

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

export const BlackbookPanel: React.FC<BlackbookPanelProps> = ({
  userProfile,
  userMarkers,
  drops,
  topPlayers,
  onClose,
  onProfileUpdate,
  onCenterMap,
  onRefreshAll,
  isRefreshing,
  showTopPlayers,
  onToggleTopPlayers,
  showOnlyMyDrops,
  onToggleFilter,
  onLogout,
  nearbyCrewMembers,
  expandedRadius,
  onOpenCrewChat
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'styles' | 'stats'>('feed');

  // Get user's markers
  const myMarkers = userMarkers.filter(m => m.userId === userProfile?.uid);
  const currentRep = userProfile?.rep || 0;

  // Calculate recent activity (last 7 days)
  const recentActivity = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return myMarkers.filter(m => new Date(m.timestamp).getTime() > sevenDaysAgo).length;
  }, [myMarkers]);

  // Handle setting active graffiti style
  const handleSetActiveStyle = useCallback((styleId: string) => {
    if (!userProfile) return;
    onProfileUpdate({
      ...userProfile,
      activeGraffitiStyle: styleId
    });
  }, [userProfile, onProfileUpdate]);

  return (
    <div style={{
      ...panelStyle,
      border: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInLeft 0.3s ease-out',
      position: 'relative' as const,
      width: 'min(100vw, 420px)',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,107,107,0.3)'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#ff6b6b', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📓</span>
          BLACKBOOK — {userProfile?.username?.toUpperCase() || 'PROFILE'}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,107,107,0.2)',
            border: '1px solid rgba(255,107,107,0.3)',
            color: '#ff6b6b',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px'
      }}>
        {[
          { id: 'feed', label: '📰 Feed', icon: '📰' },
          { id: 'styles', label: '🎨 Styles', icon: '🎨' },
          { id: 'stats', label: '📊 Stats', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === tab.id 
                ? 'rgba(255, 107, 107, 0.2)' 
                : 'rgba(255,255,255,0.05)',
              border: activeTab === tab.id 
                ? '1px solid rgba(255, 107, 107, 0.4)' 
                : '1px solid #333',
              borderRadius: '8px',
              color: activeTab === tab.id ? '#ff6b6b' : '#aaa',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Info Card - Always Visible */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px'
      }}>
        <img
          src={userProfile?.profilePicUrl}
          alt="Profile"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '2px solid #ff6b6b',
            objectFit: 'cover'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{userProfile?.username}</div>
          <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{userProfile?.rank} • Lv {userProfile?.level}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>REP: {currentRep}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#4dabf7' }}>{myMarkers.length} drops</div>
          <div style={{ fontSize: '10px', color: '#666' }}>{userMarkers.length} total visible</div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && (
        <>
          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #444',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b6b' }}>
                {myMarkers.length}
              </div>
              <div style={{ fontSize: '10px', color: '#aaa' }}>Your Tags</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #444',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4ecdc4' }}>
                {currentRep}
              </div>
              <div style={{ fontSize: '10px', color: '#aaa' }}>REP</div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #444',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>
                {recentActivity}
              </div>
              <div style={{ fontSize: '10px', color: '#aaa' }}>This Week</div>
            </div>
          </div>

          {/* Crew Status */}
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #444',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#4dabf7',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {userProfile?.isSolo ? '🎯 Solo Player' : userProfile?.crewName ? `👥 ${userProfile.crewName}` : '👥 No Crew'}
            </div>
            
            {nearbyCrewMembers.length > 0 && (
              <div style={{
                fontSize: '11px',
                color: '#10b981',
                marginBottom: '8px',
                padding: '6px',
                background: 'rgba(16,185,129,0.1)',
                borderRadius: '4px'
              }}>
                ✨ {nearbyCrewMembers.length} crew member{nearbyCrewMembers.length > 1 ? 's' : ''} nearby! Radius: {expandedRadius}m
              </div>
            )}

            {userProfile?.crewId && !userProfile.isSolo && (
              <button
                onClick={onOpenCrewChat}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginTop: '8px'
                }}
              >
                💬 Open Crew Chat
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={onToggleFilter}
            style={{
              background: showOnlyMyDrops ? '#10b981' : '#6b7280',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '12px',
              width: '100%',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {showOnlyMyDrops ? '👤 Showing Only YOUR Drops' : '🌍 Showing ALL Drops'}
          </button>

          {/* Top Players */}
          {topPlayers.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#fbbf24',
                marginBottom: '8px',
                borderBottom: '1px solid #444',
                paddingBottom: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>👑 TOP WRITERS</span>
                <button
                  onClick={onToggleTopPlayers}
                  style={{
                    background: showTopPlayers ? '#10b981' : '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  {showTopPlayers ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {showTopPlayers && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topPlayers.map((player, index) => (
                    <div 
                      key={player.uid}
                      onClick={() => player.position && onCenterMap(player.position, 15)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        cursor: player.position ? 'pointer' : 'default',
                        opacity: player.position ? 1 : 0.6
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{player.username}</div>
                        <div style={{ fontSize: '10px', color: '#aaa' }}>
                          {player.rank} • {player.rep} REP
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <button
              onClick={onRefreshAll}
              disabled={isRefreshing}
              style={{
                background: '#4dabf7',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: isRefreshing ? 0.7 : 1
              }}
            >
              {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh All'}
            </button>

            <button
              onClick={onLogout}
              style={{
                background: '#444',
                color: '#ff6b6b',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}

      {activeTab === 'styles' && (
        <GraffitiStylesSection
          userProfile={userProfile}
          onSetActiveStyle={handleSetActiveStyle}
          onProfileUpdate={onProfileUpdate}
        />
      )}

      {activeTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Detailed Stats */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #444'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#4dabf7', fontSize: '15px' }}>
              📊 Your Statistics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Total Markers</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff6b6b' }}>{myMarkers.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Photo Drops</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7' }}>
                  {drops.filter(d => d.photoUrl && d.createdBy === userProfile?.uid).length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Music Drops</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {drops.filter(d => d.trackUrl && d.createdBy === userProfile?.uid).length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>This Week</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{recentActivity}</div>
              </div>
            </div>
          </div>

          {/* Rank Progress */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #444'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24', fontSize: '15px' }}>
              🏆 Rank Progress
            </h4>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#aaa' }}>Current Rank</span>
                <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{userProfile?.rank}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#aaa' }}>Next Rank</span>
                <span style={{ color: '#10b981' }}>{100 - (currentRep % 100)} REP to go</span>
              </div>
            </div>
            <div style={{
              height: '8px',
              background: '#333',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(currentRep % 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #fbbf24, #10b981)',
                borderRadius: '4px'
              }} />
            </div>
          </div>

          {/* Unlocked Content */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #444'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#8b5cf6', fontSize: '15px' }}>
              🎵 Unlocked Music
            </h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {userProfile?.unlockedTracks?.length || 1}
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>tracks unlocked</div>
          </div>

          {/* Graffiti Styles Unlocked */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid #444'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#ff6b6b', fontSize: '15px' }}>
              🎨 Graffiti Styles
            </h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
              {(userProfile?.unlockedGraffitiTypes?.length || 2)}
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>styles unlocked</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Panel style constant
const panelStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.92)',
  color: '#e0e0e0',
  padding: '16px',
  borderRadius: '12px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(8px)',
  zIndex: 1200
};

BlackbookPanel.displayName = 'BlackbookPanel';