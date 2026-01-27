// components/story/StoryPanel.tsx
'use client';

import { useState } from 'react';
import { useStoryManager } from './StoryManager';
import { CrewId } from '@/lib/types/story';

const StoryPanel: React.FC = () => {
  const {
    storyProgress,
    activeMission,
    availableMissions,
    completedMissions,
    crewTrust,
    getMissionStatus,
    getCrewTrustLevel,
    getStoryCompletion,
    startMission,
    completeMission,
    abandonMission
  } = useStoryManager();

  const [selectedTab, setSelectedTab] = useState<'story' | 'missions' | 'crew' | 'clues'>('story');

  if (!storyProgress) {
    return (
      <div style={panelStyle}>
        <h3>📖 STORY</h3>
        {storyProgress.isLoading ? (
          <p>Loading story progress...</p>
        ) : (
          <p>{storyProgress.progress}</p>
        )}
      </div>
    );
  }

  const crewColors: Record<CrewId, string> = {
    bqc: '#000000', // Black/White
    sps: '#10b981', // Green
    lzt: '#4dabf7', // Light Blue
    dgc: '#f97316'  // Orange
  };

  const crewNames: Record<CrewId, string> = {
    bqc: 'BLAQWT',
    sps: 'SPONTANEOUS',
    lzt: 'LUZUNT',
    dgc: 'DON\'T GET CAPPED'
  };

  const renderStoryProgress = () => (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#4dabf7' }}>ACT {storyProgress.currentAct}</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Chapter {storyProgress.currentChapter}
          </p>
        </div>
        <div style={{
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          {getStoryCompletion()}% Complete
        </div>
      </div>

      {/* Crew Trust Bars */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#e0e0e0', marginBottom: '10px' }}>Crew Trust</h4>
        {Object.entries(crewTrust).map(([crewId, trust]) => (
          <div key={crewId} style={{ marginBottom: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              <span style={{ color: crewColors[crewId as CrewId] }}>
                {crewNames[crewId as CrewId]}
              </span>
              <span style={{ color: '#cbd5e1' }}>{trust}</span>
            </div>
            <div style={{
              height: '6px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(trust, 100)}%`,
                backgroundColor: crewColors[crewId as CrewId],
                borderRadius: '3px',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Mission */}
      {activeMission && (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h4 style={{ margin: 0, color: '#4dabf7' }}>🎯 ACTIVE MISSION</h4>
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              color: '#bfdbfe'
            }}>
              {activeMission.difficulty.toUpperCase()}
            </span>
          </div>
          
          <h5 style={{ margin: '0 0 8px 0', color: 'white' }}>{activeMission.title}</h5>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '15px' }}>
            {activeMission.description}
          </p>

          {/* Objectives */}
          <div style={{ marginBottom: '15px' }}>
            {activeMission.objectives.map((objective) => (
              <div key={objective.id} style={{ marginBottom: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  marginBottom: '4px'
                }}>
                  <span style={{ color: objective.completed ? '#10b981' : '#cbd5e1' }}>
                    {objective.completed ? '✅' : '○'} {objective.description}
                  </span>
                  <span style={{ color: '#94a3b8' }}>
                    {objective.progress}/{objective.maxProgress}
                  </span>
                </div>
                <div style={{
                  height: '4px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(objective.progress / objective.maxProgress) * 100}%`,
                    backgroundColor: objective.completed ? '#10b981' : '#4dabf7',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => completeMission(activeMission.id)}
              disabled={!activeMission.objectives.every(obj => obj.completed)}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: activeMission.objectives.every(obj => obj.completed) 
                  ? '#10b981' 
                  : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: activeMission.objectives.every(obj => obj.completed) 
                  ? 'pointer' 
                  : 'not-allowed',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              {activeMission.objectives.every(obj => obj.completed)
                ? 'Complete Mission'
                : 'Complete Objectives First'}
            </button>
            
            <button
              onClick={() => abandonMission(activeMission.id)}
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Abandon
            </button>
          </div>
        </div>
      )}

      {/* Available Missions */}
      {availableMissions.length > 0 && (
        <div>
          <h4 style={{ color: '#e0e0e0', marginBottom: '10px' }}>Available Missions</h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {availableMissions.map((mission) => (
              <div
                key={mission.id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => startMission(mission.id)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px'
                    }}>
                      {mission.isMainStory ? (
                        <span style={{ color: '#8b5cf6', fontSize: '12px' }}>📖</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '12px' }}>⚡</span>
                      )}
                      <h6 style={{ 
                        margin: 0, 
                        color: mission.isMainStory ? '#8b5cf6' : '#f59e0b',
                        fontSize: '13px'
                      }}>
                        {mission.title}
                      </h6>
                    </div>
                    <p style={{ 
                      fontSize: '11px', 
                      color: '#94a3b8',
                      margin: 0
                    }}>
                      {mission.subtitle}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: getDifficultyColor(mission.difficulty),
                    borderRadius: '8px',
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}>
                    {mission.difficulty.toUpperCase()}
                  </span>
                </div>
                <p style={{ 
                  fontSize: '11px', 
                  color: '#cbd5e1',
                  marginBottom: '10px'
                }}>
                  {mission.description}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: '#94a3b8'
                }}>
                  <span>Reward: +{mission.rewards.rep} REP</span>
                  <span>Act {mission.act} • Ch {mission.chapter}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'epic': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const panelStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#e0e0e0',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    width: '400px',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(4px)',
    zIndex: 1200
  };

  return (
    <div style={panelStyle}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setSelectedTab('story')}
          style={{
            background: selectedTab === 'story' 
              ? 'rgba(77, 171, 247, 0.2)' 
              : 'transparent',
            color: selectedTab === 'story' ? '#4dabf7' : '#94a3b8',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          📖 Story
        </button>
        <button
          onClick={() => setSelectedTab('missions')}
          style={{
            background: selectedTab === 'missions' 
              ? 'rgba(139, 92, 246, 0.2)' 
              : 'transparent',
            color: selectedTab === 'missions' ? '#8b5cf6' : '#94a3b8',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          🎯 Missions
        </button>
        <button
          onClick={() => setSelectedTab('crew')}
          style={{
            background: selectedTab === 'crew' 
              ? 'rgba(16, 185, 129, 0.2)' 
              : 'transparent',
            color: selectedTab === 'crew' ? '#10b981' : '#94a3b8',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          👥 Crew
        </button>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'story' && renderStoryProgress()}
      
      {selectedTab === 'missions' && (
        <div>
          <h4 style={{ color: '#e0e0e0', marginBottom: '15px' }}>All Missions</h4>
          
          {/* Completed Missions */}
          {completedMissions.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ color: '#10b981', fontSize: '13px', marginBottom: '10px' }}>
                ✅ Completed ({completedMissions.length})
              </h5>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {completedMissions.map((mission) => (
                  <div
                    key={mission.id}
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#10b981',
                        fontWeight: 'bold'
                      }}>
                        {mission.title}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#86efac',
                        backgroundColor: 'rgba(16, 185, 129, 0.3)',
                        padding: '2px 6px',
                        borderRadius: '8px'
                      }}>
                        +{mission.rewards.rep} REP
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '10px', 
                      color: '#86efac',
                      margin: 0
                    }}>
                      {mission.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {selectedTab === 'crew' && (
        <div>
          <h4 style={{ color: '#e0e0e0', marginBottom: '15px' }}>Crew Details</h4>
          
          {/* Player's Crew */}
          {storyProgress.decisions.crewJoined && (
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: crewColors[storyProgress.decisions.crewJoined],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}>
                  {crewNames[storyProgress.decisions.crewJoined].charAt(0)}
                </div>
                <div>
                  <h5 style={{ margin: 0, color: 'white' }}>
                    {crewNames[storyProgress.decisions.crewJoined]}
                  </h5>
                  <p style={{ 
                    fontSize: '11px', 
                    color: '#cbd5e1',
                    margin: 0
                  }}>
                    Your Crew • Trust: {getCrewTrustLevel(storyProgress.decisions.crewJoined)}
                  </p>
                </div>
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                lineHeight: '1.4'
              }}>
                {storyProgress.decisions.crewJoined === 'bqc' && 
                  "Tech-savvy resistance fighters with corporate backing. They seem most organized."}
                {storyProgress.decisions.crewJoined === 'sps' && 
                  "Chaotic frequency-obsessed artists. They see what others don't."}
                {storyProgress.decisions.crewJoined === 'lzt' && 
                  "Healing-focused community builders. They understand emotional resonance."}
                {storyProgress.decisions.crewJoined === 'dgc' && 
                  "Old-school preservationists. They've seen this all before."}
              </div>
            </div>
          )}
          
          {/* All Crews */}
          <div>
            <h5 style={{ color: '#e0e0e0', fontSize: '13px', marginBottom: '10px' }}>
              All Crews
            </h5>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {(Object.keys(crewTrust) as CrewId[]).map((crewId) => (
                <div
                  key={crewId}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${crewColors[crewId]}40`,
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: crewColors[crewId],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    margin: '0 auto 8px'
                  }}>
                    {crewNames[crewId].charAt(0)}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: crewColors[crewId],
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    {crewNames[crewId]}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#94a3b8'
                  }}>
                    Trust: {getCrewTrustLevel(crewId)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryPanel;