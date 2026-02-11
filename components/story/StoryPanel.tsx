// components/story/StoryPanel.tsx
'use client';
import { useState, useEffect } from 'react';
import { useStoryManager } from './StoryManager';
import { CrewId } from '@/lib/types/story';

const StoryPanel: React.FC<{ markStoryContentAsViewed: () => Promise<void> }> = ({ markStoryContentAsViewed }) => {
  const { storyProgress, activeMission, availableMissions, completedMissions, crewTrust, getCrewTrustLevel, getStoryCompletion, startMission, completeMission, abandonMission } = useStoryManager();
  const [selectedTab, setSelectedTab] = useState<'story' | 'missions' | 'crew'>('story');

  // Call markStoryContentAsViewed when the panel mounts
  useEffect(() => {
    markStoryContentAsViewed();
  }, [markStoryContentAsViewed]); 

  const panelStyle = { backgroundColor: 'rgba(0, 0, 0, 0.85)', color: '#e0e0e0', padding: '16px', borderRadius: '8px', width: '400px', maxHeight: '80vh', overflowY: 'auto' as const, zIndex: 1200 };
  const crewColors: Record<CrewId, string> = { bqc: '#000000', sps: '#10b981', lzt: '#4dabf7', dgc: '#f97316' };
  const crewNames: Record<CrewId, string> = { bqc: 'BLAQWT', sps: 'SPONTANEOUS', lzt: 'LUZUNT', dgc: 'DON\'T GET CAPPED' };

  if (!storyProgress) return <div style={panelStyle}><h3>📖 STORY</h3><p>Loading...</p></div>;

  const renderStory = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div><h3 style={{ margin: 0, color: '#4dabf7' }}>ACT {storyProgress.currentAct}</h3><p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Chapter {storyProgress.currentChapter}</p></div>
        <div style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #4dabf7, #3b82f6)', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{getStoryCompletion()}% Complete</div>
      </div>
      <h4 style={{ color: '#e0e0e0', marginBottom: '10px' }}>Crew Trust</h4>
      {Object.entries(crewTrust).map(([crewId, trust]) => (
        <div key={crewId} style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: crewColors[crewId as CrewId] }}>{crewNames[crewId as CrewId]}</span><span>{trust}</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
            <div style={{ height: '100%', width: `${Math.min(trust, 100)}%`, backgroundColor: crewColors[crewId as CrewId], borderRadius: '3px' }}></div>
          </div>
        </div>
      ))}
      {activeMission && (
        <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
          <h4 style={{ margin: 0, color: '#4dabf7' }}>🎯 {activeMission.title}</h4>
          <p style={{ fontSize: '12px', color: '#cbd5e1' }}>{activeMission.description}</p>
          {activeMission.objectives.map((obj) => (
            <div key={obj.id} style={{ marginBottom: '8px', fontSize: '11px' }}>
              <span style={{ color: obj.completed ? '#10b981' : '#cbd5e1' }}>{obj.completed ? '✅' : '○'} {obj.description}</span>
              <span style={{ marginLeft: '10px', color: '#94a3b8' }}>{obj.progress}/{obj.maxProgress}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => completeMission(activeMission.id)} disabled={!activeMission.objectives.every(o => o.completed)} style={{ flex: 1, padding: '8px', backgroundColor: activeMission.objectives.every(o => o.completed) ? '#10b981' : '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Complete Mission</button>
            <button onClick={() => abandonMission(activeMission.id)} style={{ padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer' }}>Abandon</button>
          </div>
        </div>
      )}
      {availableMissions.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ color: '#e0e0e0', marginBottom: '10px' }}>Available Missions</h4>
          {availableMissions.map((m) => (
            <div key={m.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '10px', cursor: 'pointer' }} onClick={() => startMission(m.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: m.isMainStory ? '#8b5cf6' : '#f59e0b', fontWeight: 'bold' }}>{m.title}</span>
                <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: m.difficulty === 'easy' ? '#10b981' : m.difficulty === 'medium' ? '#f59e0b' : m.difficulty === 'hard' ? '#ef4444' : '#8b5cf6', borderRadius: '8px', color: 'white' }}>{m.difficulty.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: 0 }}>{m.description}</p>
              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '5px 0 0' }}>+{m.rewards.rep} REP • Act {m.act} Ch {m.chapter}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCrew = () => (
    <div>
      <h4 style={{ color: '#e0e0e0', marginBottom: '15px' }}>All Crews</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {(Object.keys(crewTrust) as CrewId[]).map((crewId) => (
          <div key={crewId} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: `1px solid ${crewColors[crewId]}40`, textAlign: 'center' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: crewColors[crewId], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', margin: '0 auto 8px' }}>{crewNames[crewId].charAt(0)}</div>
            <div style={{ fontSize: '11px', color: crewColors[crewId], fontWeight: 'bold' }}>{crewNames[crewId]}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Trust: {getCrewTrustLevel(crewId)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMissions = () => (
    <div>
      <h4 style={{ color: '#e0e0e0', marginBottom: '15px' }}>All Missions</h4>
      {completedMissions.length > 0 ? (
        <div>
          <h5 style={{ color: '#10b981', fontSize: '13px', marginBottom: '10px' }}>✅ Completed ({completedMissions.length})</h5>
          {completedMissions.map((m) => (
            <div key={m.id} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>{m.title}</span>
              <span style={{ fontSize: '10px', color: '#86efac', marginLeft: '10px' }}>+{m.rewards.rep} REP</span>
            </div>
          ))}
        </div>
      ) : <p style={{ color: '#94a3b8' }}>No completed missions yet.</p>}
    </div>
  );

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <button onClick={() => setSelectedTab('story')} style={{ background: selectedTab === 'story' ? 'rgba(77, 171, 247, 0.2)' : 'transparent', color: selectedTab === 'story' ? '#4dabf7' : '#94a3b8', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>📖 Story</button>
        <button onClick={() => setSelectedTab('missions')} style={{ background: selectedTab === 'missions' ? 'rgba(139, 92, 246, 0.2)' : 'transparent', color: selectedTab === 'missions' ? '#8b5cf6' : '#94a3b8', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>🎯 Missions</button>
        <button onClick={() => setSelectedTab('crew')} style={{ background: selectedTab === 'crew' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: selectedTab === 'crew' ? '#10b981' : '#94a3b8', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>👥 Crew</button>
      </div>
      {selectedTab === 'story' && renderStory()}
      {selectedTab === 'missions' && renderMissions()}
      {selectedTab === 'crew' && renderCrew()}
    </div>
  );
};

export default StoryPanel;
