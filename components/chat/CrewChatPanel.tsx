'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, realtimeDb } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, remove } from 'firebase/database';
import { UserProfile, CrewChatMessage, UserMarker, Drop, TopPlayer } from '@/lib/types/blackout';
import { panelStyle } from '@/lib/constants';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { User as FirebaseUser } from 'firebase/auth';
import { getCrewTheme } from '@/utils/crewTheme';

import { CrewId } from '@/lib/types/story';

interface CrewChatPanelProps { 
  crewId: CrewId | null, 
  onClose: () => void,
  userProfile: UserProfile | null,
  markMessagesAsRead: () => Promise<void>,
  userMarkers?: UserMarker[],
  drops?: Drop[],
  topPlayers?: TopPlayer[],
  onCenterMap?: (coords: [number, number], zoom?: number) => void,
  showOnlyMyDrops?: boolean,
  onToggleFilter?: () => void,
  showTopPlayers?: boolean,
  onToggleTopPlayers?: () => void
}

export default function CrewChatPanel({ 
  crewId, 
  onClose, 
  userProfile, 
  markMessagesAsRead,
  userMarkers = [],
  drops = [],
  topPlayers = [],
  onCenterMap,
  showOnlyMyDrops = false,
  onToggleFilter,
  showTopPlayers = false,
  onToggleTopPlayers
}: CrewChatPanelProps) {
  const [messages, setMessages] = useState<CrewChatMessage[]>([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'feed' | 'stats'>('chat');

  // Get crew theme
  const crewTheme = getCrewTheme(crewId);
  const crewDisplayColor = crewTheme.primary === '#000000' ? '#808080' : crewTheme.primary;

  // Get user's markers for stats
  const myMarkers = userMarkers.filter(m => m.userId === userProfile?.uid);
  const currentRep = userProfile?.rep || 0;

  // Calculate recent activity (last 7 days)
  const recentActivity = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return myMarkers.filter(m => new Date(m.timestamp).getTime() > sevenDaysAgo).length;
  }, [myMarkers]);

  // Call markMessagesAsRead when the chat is opened
  useEffect(() => {
    if (crewId && userProfile && markMessagesAsRead) {
      markMessagesAsRead();
    }
  }, [crewId, userProfile, markMessagesAsRead]);

  // Get current user from auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load messages in real-time
  useEffect(() => {
    if (!crewId) return;
    
    const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData: CrewChatMessage[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          messagesData.push({
            id: childSnapshot.key || Date.now().toString(),
            text: data.text || '',
            senderUid: data.senderUid || '',
            senderName: data.senderName || 'Anonymous',
            avatar: data.avatar || generateAvatarUrl(data.senderUid || 'unknown', data.senderName || 'User', undefined, 60, undefined, crewId),
            timestamp: data.timestamp || Date.now()
          });
        });
        
        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData);
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error('Error loading chat messages:', error);
    });
    
    return () => {};
  }, [crewId]);

  const sendMessage = () => {
    if (!text.trim() || !crewId || !currentUser || !userProfile) return;
    
    setIsSending(true);
    
    const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);
    const messageData = {
      text: text.trim(),
      senderUid: currentUser.uid,
      senderName: userProfile.username || 'Anonymous',
      avatar: userProfile.profilePicUrl || generateAvatarUrl(currentUser.uid, userProfile.username || 'User', userProfile.gender, 60, undefined, crewId),
      timestamp: Date.now()
    };
    
    push(messagesRef, messageData)
      .then(() => {
        setText('');
      })
      .catch((error) => {
        console.error('❌ Error sending message:', error);
        alert(`Failed to send message: ${error.message}`);
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  const deleteMessage = async (messageId: string) => {
    if (!crewId || !messageId || !currentUser) return;

    const messageToDelete = messages.find(msg => msg.id === messageId);
    if (!messageToDelete) return;

    if (messageToDelete.senderUid !== currentUser.uid) {
      alert('You can only delete your own messages.');
      return;
    }

    if (!confirm('Are you sure you want to delete this message?')) return;

    setDeletingMessageId(messageId);
    
    try {
      const messageRef = ref(realtimeDb, `crew-chat/${crewId}/${messageId}`);
      await remove(messageRef);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error: any) {
      console.error('❌ Error deleting message:', error);
      alert(`Failed to delete message: ${error.message}`);
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Scroll to bottom when messages update
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Render Chat Tab
  const renderChatTab = () => (
    <>
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '6px',
        marginBottom: '15px',
        maxHeight: '300px'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            padding: '40px 20px',
            fontStyle: 'italic'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map(msg => {
              const isOwnMessage = msg.senderUid === currentUser?.uid;
              const isDeleting = deletingMessageId === msg.id;
              const profilePicUrl = msg.avatar || generateAvatarUrl(msg.senderUid, msg.senderName, undefined, 60);
              
              return (
                <div 
                  key={msg.id} 
                  style={{ 
                    margin: '15px 0',
                    display: 'flex',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    gap: '12px',
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (isOwnMessage && !isDeleting) {
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                      if (deleteBtn) deleteBtn.style.display = 'block';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isOwnMessage) {
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                      if (deleteBtn) deleteBtn.style.display = 'none';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '50px'
                  }}>
                    <img
                      src={profilePicUrl}
                      alt={msg.senderName}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: isOwnMessage ? `2px solid ${crewDisplayColor}` : '2px solid #4dabf7',
                        objectFit: 'cover',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = generateAvatarUrl(msg.senderUid, msg.senderName, undefined, 60);
                      }}
                    />
                    <span style={{
                      fontSize: '9px',
                      color: isOwnMessage ? crewDisplayColor : '#94a3b8',
                      maxWidth: '50px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}>
                      {msg.senderName}
                    </span>
                  </div>
                  
                  <div style={{
                    maxWidth: 'calc(100% - 70px)',
                    background: isOwnMessage ? `${crewDisplayColor}30` : 'rgba(59, 130, 246, 0.2)',
                    color: 'white',
                    padding: '12px 15px',
                    borderRadius: isOwnMessage ? '18px 18px 0 18px' : '18px 18px 18px 0',
                    wordBreak: 'break-word',
                    position: 'relative',
                    opacity: isDeleting ? 0.6 : 1,
                    border: isOwnMessage ? `1px solid ${crewDisplayColor}40` : '1px solid rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {isOwnMessage && !isDeleting && (
                      <button
                        className="delete-btn"
                        onClick={() => deleteMessage(msg.id)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: isOwnMessage ? '-8px' : 'auto',
                          left: isOwnMessage ? 'auto' : '-8px',
                          background: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: 'white',
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '11px',
                          display: 'none',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}
                        title="Delete message"
                      >
                        ✕
                      </button>
                    )}
                    
                    <div style={{ 
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: isOwnMessage ? '#e0e0e0' : '#f1f5f9'
                    }}>
                      {msg.text}
                    </div>
                    
                    <div style={{ 
                      fontSize: '10px', 
                      color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.6)',
                      textAlign: isOwnMessage ? 'right' : 'left',
                      marginTop: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontSize: '9px', opacity: 0.6 }}>
                        {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        padding: '10px 0 0',
        borderTop: '1px solid #444',
        gap: '10px',
        alignItems: 'center'
      }}>
        {userProfile && (
          <img
            src={userProfile.profilePicUrl}
            alt="You"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: `2px solid ${crewDisplayColor}`,
              objectFit: 'cover',
              flexShrink: 0
            }}
          />
        )}
        
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your message..."
          style={{ 
            flex: 1, 
            padding: '12px 15px', 
            borderRadius: '8px', 
            border: '1px solid #555', 
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '14px'
          }}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={isSending}
        />
        <button 
          onClick={sendMessage} 
          disabled={!text.trim() || isSending}
          style={{ 
            padding: '12px 20px', 
            background: !text.trim() || isSending ? '#555' : crewDisplayColor, 
            border: 'none', 
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            cursor: !text.trim() || isSending ? 'not-allowed' : 'pointer',
            opacity: !text.trim() || isSending ? 0.7 : 1,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isSending ? (
            <>
              <div style={{ 
                width: '14px', 
                height: '14px', 
                border: '2px solid white', 
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Sending...
            </>
          ) : (
            <>
              <span>📤</span>
              Send
            </>
          )}
        </button>
      </div>
    </>
  );

  // Render Feed Tab
  const renderFeedTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Filter Toggle */}
      {onToggleFilter && (
        <button
          onClick={onToggleFilter}
          style={{
            background: showOnlyMyDrops ? crewDisplayColor : '#6b7280',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {showOnlyMyDrops ? '👤 Showing Only YOUR Drops' : '🌍 Showing ALL Drops'}
        </button>
      )}

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
            {onToggleTopPlayers && (
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
            )}
          </div>
          
          {showTopPlayers && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topPlayers.map((player, index) => (
                <div 
                  key={player.uid}
                  onClick={() => player.position && onCenterMap && onCenterMap(player.position, 15)}
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

      {/* Recent Activity */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#4dabf7', fontSize: '14px' }}>
          📰 Recent Activity
        </h4>
        {myMarkers.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
            No drops yet. Place your first marker!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myMarkers.slice(0, 5).map((marker, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '16px' }}>📍</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {marker.name || 'Location Drop'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {new Date(marker.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#10b981',
                  fontWeight: 'bold'
                }}>
                  +{marker.repEarned || 5} REP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Stats Tab
  const renderStatsTab = () => (
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
  );

  return (
    <div style={{
      ...panelStyle,
      position: 'absolute',
      top: '0px',
      left: '0px',
      width: 'min(400px, 110vw)',
      maxHeight: 'calc(100vh - 180px)',
      zIndex: 1400,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: `1px solid ${crewDisplayColor}30`,
        paddingBottom: '10px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: crewDisplayColor, 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>👥</span>
          {crewId?.toUpperCase()}
          <span style={{
            fontSize: '12px',
            backgroundColor: `${crewDisplayColor}20`,
            padding: '2px 8px',
            borderRadius: '10px'
          }}>
            {messages.length} msgs
          </span>
        </h3>
        <button
          onClick={onClose}
          style={{
            background: `${crewDisplayColor}20`,
            border: `1px solid ${crewDisplayColor}30`,
            color: crewDisplayColor,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
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
        marginBottom: '12px'
      }}>
        {[
          { id: 'chat', label: '💬 Chat', icon: '💬' },
          { id: 'feed', label: '📰 Feed', icon: '📰' },
          { id: 'stats', label: '📊 Stats', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === tab.id 
                ? `${crewDisplayColor}20` 
                : 'rgba(255,255,255,0.05)',
              border: activeTab === tab.id 
                ? `1px solid ${crewDisplayColor}40` 
                : '1px solid #333',
              borderRadius: '8px',
              color: activeTab === tab.id ? crewDisplayColor : '#aaa',
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

      {/* Tab Content */}
      {activeTab === 'chat' && renderChatTab()}
      {activeTab === 'feed' && renderFeedTab()}
      {activeTab === 'stats' && renderStatsTab()}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          0% { transform: translateX(20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}