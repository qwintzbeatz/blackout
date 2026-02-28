// components/CrewBioPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { CREWS, Crew, CrewMember } from '@/data/crews';

interface CrewBioPanelProps {
  onClose: () => void;
  userCrewId?: string | null;
}

const CrewBioPanel: React.FC<CrewBioPanelProps> = ({ onClose, userCrewId }) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'members' | 'story'>('overview');

  // Get only the user's selected crew
  const selectedCrew = userCrewId 
    ? CREWS.find(c => c.id === userCrewId) || null 
    : null;

  // Animation and style matching music panel
  const panelStyle = {
    position: 'fixed' as const,
    top: '0px',
    left: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    color: '#e0e0e0',
    padding: '16px',
    borderRadius: '12px',
    minWidth: '280px',
    maxWidth: 'calc(100vw - 40px)',
    width: '350px',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    zIndex: 1500,
    border: '1px solid #333',
    boxShadow: `0 0 30px ${selectedCrew?.colors.primary || '#333'}20`,
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideInRight 0.3s ease-out'
  };

  const renderMemberCard = (member: CrewMember, index: number) => (
    <div 
      key={index} 
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '8px',
        borderLeft: `3px solid ${selectedCrew?.colors.primary}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: selectedCrew?.colors.primary, fontWeight: 'bold', fontSize: '14px' }}>
          {member.alias || member.name}
        </span>
        {member.role && (
          <span style={{
            fontSize: '10px',
            padding: '2px 8px',
            backgroundColor: `${selectedCrew?.colors.primary}20`,
            borderRadius: '10px',
            color: selectedCrew?.colors.primary
          }}>
            {member.role}
          </span>
        )}
      </div>
      {member.alias && member.alias !== member.name && (
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
          AKA {member.name}
        </div>
      )}
      <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
        {member.description}
      </p>
      {member.background && (
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0', fontStyle: 'italic' }}>
          {member.background}
        </p>
      )}
    </div>
  );

  const renderOverview = () => (
    <div>
      {/* Leader */}
      <div style={{
        background: `linear-gradient(135deg, ${selectedCrew?.colors.primary}15, transparent)`,
        padding: '16px',
        borderRadius: '10px',
        marginBottom: '16px',
        border: `1px solid ${selectedCrew?.colors.primary}30`
      }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>LEADER</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedCrew?.colors.primary, marginBottom: '4px' }}>
          {selectedCrew?.leader}
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          {selectedCrew?.leaderTitle}
        </div>
      </div>

      {/* Location & Tagline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>📍 LOCATION</div>
          <div style={{ fontSize: '13px', color: '#e0e0e0' }}>{selectedCrew?.location}</div>
        </div>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>💬 TAGLINE</div>
          <div style={{ fontSize: '12px', color: '#e0e0e0', fontStyle: 'italic' }}>"{selectedCrew?.tagline}"</div>
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>DESCRIPTION</div>
        <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
          {selectedCrew?.description}
        </p>
      </div>

      {/* Style & Strength */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>🎨 STYLE</div>
          <div style={{ fontSize: '12px', color: '#e0e0e0' }}>{selectedCrew?.style}</div>
        </div>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>💪 STRENGTH</div>
          <div style={{ fontSize: '12px', color: '#e0e0e0' }}>{selectedCrew?.strength}</div>
        </div>
      </div>

      {/* Bonus */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: `linear-gradient(135deg, ${selectedCrew?.colors.primary}10, transparent)`,
        borderRadius: '8px',
        border: `1px solid ${selectedCrew?.colors.primary}20`
      }}>
        <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>⭐ BONUS</div>
        <div style={{ fontSize: '12px', color: selectedCrew?.colors.primary }}>{selectedCrew?.bonus}</div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
        CREW MEMBERS ({selectedCrew?.members.length})
      </div>
      {selectedCrew?.members.map((member, index) => renderMemberCard(member, index))}
    </div>
  );

  const renderStory = () => (
    <div>
      {/* Personality */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '14px',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>🎭 PERSONALITY</div>
        <p style={{ fontSize: '13px', color: '#e0e0e0', margin: 0 }}>{selectedCrew?.personality}</p>
      </div>

      {/* Role in Story */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '14px',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>📚 ROLE IN STORY</div>
        <p style={{ fontSize: '13px', color: '#e0e0e0', margin: 0 }}>{selectedCrew?.roleInStory}</p>
      </div>

      {/* Motivation */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: '14px',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>🎯 MOTIVATION</div>
        <p style={{ fontSize: '13px', color: '#e0e0e0', margin: 0 }}>{selectedCrew?.motivation}</p>
      </div>

      {/* Front Description */}
      {selectedCrew?.frontDescription && (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          padding: '14px',
          borderRadius: '8px',
          marginBottom: '12px',
          borderLeft: '3px solid #3b82f6'
        }}>
          <div style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '6px' }}>🎭 FRONT</div>
          <p style={{ fontSize: '13px', color: '#93c5fd', margin: 0 }}>{selectedCrew.frontDescription}</p>
        </div>
      )}

      {/* Reality */}
      {selectedCrew?.reality && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          padding: '14px',
          borderRadius: '8px',
          marginBottom: '12px',
          borderLeft: '3px solid #ef4444'
        }}>
          <div style={{ fontSize: '11px', color: '#f87171', marginBottom: '6px' }}>⚡ REALITY</div>
          <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>{selectedCrew.reality}</p>
        </div>
      )}

      {/* Plot Twist */}
      {selectedCrew?.plotTwist && (
        <div style={{
          background: `linear-gradient(135deg, ${selectedCrew?.colors.primary}20, rgba(139, 92, 246, 0.1))`,
          padding: '14px',
          borderRadius: '8px',
          marginBottom: '12px',
          border: `1px solid ${selectedCrew?.colors.primary}40`
        }}>
          <div style={{ fontSize: '11px', color: selectedCrew?.colors.primary, marginBottom: '6px' }}>
            🔮 PLOT TWIST
          </div>
          <p style={{ fontSize: '13px', color: '#e0e0e0', margin: 0 }}>{selectedCrew.plotTwist}</p>
        </div>
      )}

      {/* Side Quest Character */}
      {selectedCrew?.sideQuestCharacter && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '14px',
          borderRadius: '8px',
          borderLeft: '3px solid #10b981'
        }}>
          <div style={{ fontSize: '11px', color: '#34d399', marginBottom: '6px' }}>
            🎁 SIDE QUEST CHARACTER
          </div>
          <div style={{ fontWeight: 'bold', color: '#6ee7b7', marginBottom: '4px' }}>
            {selectedCrew.sideQuestCharacter.name}
          </div>
          <p style={{ fontSize: '12px', color: '#a7f3d0', margin: '0 0 8px' }}>
            {selectedCrew.sideQuestCharacter.description}
          </p>
          <div style={{ fontSize: '11px', color: '#6ee7b7' }}>
            <strong>Unlock:</strong> {selectedCrew.sideQuestCharacter.howToUnlock}
          </div>
          <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '4px' }}>
            <strong>Role:</strong> {selectedCrew.sideQuestCharacter.roleIfJoined}
          </div>
        </div>
      )}
    </div>
  );

  // If no crew selected, show a message
  if (!selectedCrew) {
    return (
      <div style={{
        ...panelStyle,
        border: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
        }}>
          <h3 style={{
            margin: 0,
            color: '#8b5cf6',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>📖</span>
            YOUR CREW
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#8b5cf6',
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
        
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          border: '1px dashed #444'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏴</div>
          <div style={{ color: '#e0e0e0', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            No Crew Selected
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>
            You're currently a solo writer. Join a crew from your profile to see crew info here!
          </div>
        </div>

        <style>{`
          @keyframes slideInRight {
            0% { transform: translateX(20px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      ...panelStyle,
      border: `1px solid ${selectedCrew.colors.primary}30`
    }}>
      {/* Header - Matching music panel style */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '10px',
        borderBottom: `1px solid ${selectedCrew.colors.primary}30`
      }}>
        <h3 style={{
          margin: 0,
          color: selectedCrew.colors.primary,
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: selectedCrew.colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: selectedCrew.colors.secondary,
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {selectedCrew.name.charAt(0)}
          </div>
          <span>{selectedCrew.fullName || selectedCrew.name}</span>
        </h3>
        <button
          onClick={onClose}
          style={{
            background: `${selectedCrew.colors.primary}20`,
            border: `1px solid ${selectedCrew.colors.primary}30`,
            color: selectedCrew.colors.primary,
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

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={() => setSelectedTab('overview')}
          style={{
            flex: 1,
            background: selectedTab === 'overview' ? `${selectedCrew.colors.primary}20` : 'transparent',
            color: selectedTab === 'overview' ? selectedCrew.colors.primary : '#94a3b8',
            border: selectedTab === 'overview' ? `1px solid ${selectedCrew.colors.primary}` : '1px solid transparent',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: selectedTab === 'overview' ? 'bold' : 'normal',
            transition: 'all 0.2s ease'
          }}
        >
          📋 Overview
        </button>
        <button
          onClick={() => setSelectedTab('members')}
          style={{
            flex: 1,
            background: selectedTab === 'members' ? `${selectedCrew.colors.primary}20` : 'transparent',
            color: selectedTab === 'members' ? selectedCrew.colors.primary : '#94a3b8',
            border: selectedTab === 'members' ? `1px solid ${selectedCrew.colors.primary}` : '1px solid transparent',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: selectedTab === 'members' ? 'bold' : 'normal',
            transition: 'all 0.2s ease'
          }}
        >
          👥 Members
        </button>
        <button
          onClick={() => setSelectedTab('story')}
          style={{
            flex: 1,
            background: selectedTab === 'story' ? `${selectedCrew.colors.primary}20` : 'transparent',
            color: selectedTab === 'story' ? selectedCrew.colors.primary : '#94a3b8',
            border: selectedTab === 'story' ? `1px solid ${selectedCrew.colors.primary}` : '1px solid transparent',
            padding: '8px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: selectedTab === 'story' ? 'bold' : 'normal',
            transition: 'all 0.2s ease'
          }}
        >
          📖 Story
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'members' && renderMembers()}
      {selectedTab === 'story' && renderStory()}

      <style>{`
        @keyframes slideInRight {
          0% { transform: translateX(20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CrewBioPanel;