'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, realtimeDb, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, remove } from 'firebase/database';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { UserProfile, CrewChatMessage, UserMarker, Drop, TopPlayer } from '@/lib/types/blackout';
import { panelStyle } from '@/lib/constants';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { User as FirebaseUser } from 'firebase/auth';
import { getCrewTheme } from '@/utils/crewTheme';

import { CrewId } from '@/lib/types/story';

interface CrewMember {
  uid: string;
  username: string;
  profilePicUrl: string;
  rank: string;
  crewRank: string;
  crewRep: number;
  lastActive: Date | null;
  isOnline: boolean;
  unreadMessages: number;
}

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
  onToggleTopPlayers?: () => void,
  onStartDirectMessage?: (targetUserId: string, targetUsername: string, targetProfilePic: string) => void
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
  onToggleTopPlayers,
  onStartDirectMessage
}: CrewChatPanelProps) {
  const [messages, setMessages] = useState<CrewChatMessage[]>([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  // Load crew members from Firestore
  const loadCrewMembers = async () => {
    if (!crewId) return;
    
    setLoadingMembers(true);
    try {
      // Query crew by 'id' field (not document ID)
      const crewsRef = collection(db, 'crews');
      const crewQuery = query(crewsRef, where('id', '==', crewId));
      const crewSnapshot = await getDocs(crewQuery);
      
      if (!crewSnapshot.empty) {
        const crewDoc = crewSnapshot.docs[0];
        const crewData = crewDoc.data();
        const memberIds = crewData.members || [];
        
        console.log('Found crew:', crewData.name, 'with members:', memberIds);
        
        const membersData: CrewMember[] = [];
        
        for (const memberId of memberIds) {
          try {
            const userRef = doc(db, 'users', memberId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              let lastActiveDate: Date | null = null;
              if (userData.lastActive) {
                if (typeof userData.lastActive.toDate === 'function') {
                  lastActiveDate = userData.lastActive.toDate();
                } else if (userData.lastActive instanceof Date) {
                  lastActiveDate = userData.lastActive;
                } else {
                  lastActiveDate = new Date(userData.lastActive);
                }
              }
              membersData.push({
                uid: userData.uid || memberId,
                username: userData.username || 'Unknown',
                profilePicUrl: userData.profilePicUrl || generateAvatarUrl(memberId, userData.username || 'User'),
                rank: userData.rank || 'TOY',
                crewRank: userData.crewRank || 'RECRUIT',
                crewRep: userData.crewRep || 0,
                lastActive: lastActiveDate,
                isOnline: false,
                unreadMessages: 0
              });
            } else {
              console.log('User not found:', memberId);
            }
          } catch (err) {
            console.error('Error loading member:', memberId, err);
          }
        }
        
        console.log('Loaded crew members:', membersData);
        setCrewMembers(membersData);
      } else {
        console.log('No crew found with id:', crewId);
      }
    } catch (error) {
      console.error('Error loading crew members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Track online users based on lastActive in Firestore (last 5 mins = online)
  useEffect(() => {
    if (!crewId || crewMembers.length === 0) return;

    const checkOnlineStatus = () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      
      setCrewMembers(prev => prev.map(member => {
        const lastActiveMs = member.lastActive ? new Date(member.lastActive).getTime() : 0;
        const isOnline = lastActiveMs > fiveMinutesAgo;
        console.log('Member:', member.username, 'lastActive:', member.lastActive, 'isOnline:', isOnline);
        return {
          ...member,
          isOnline
        };
      }));
    };

    // Check immediately
    setTimeout(checkOnlineStatus, 1000);

    // Then check every 30 seconds
    const interval = setInterval(checkOnlineStatus, 30000);
    return () => clearInterval(interval);
  }, [crewId, crewMembers.length]);

  // Track unread DM messages for each crew member
  useEffect(() => {
    if (!crewId || crewMembers.length === 0 || !currentUser) return;

    const unsubscribes: (() => void)[] = [];

    crewMembers.forEach(member => {
      // Look for direct chat threads with this member
      const chatRef = ref(realtimeDb, `direct-chats/${currentUser.uid}`);
      
      const unsubscribe = onValue(chatRef, (snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            const chatData = child.val();
            const participantIds = chatData.participantIds || [];
            
            // Check if this chat is with the current member
            if (participantIds.includes(member.uid) && member.uid !== currentUser.uid) {
              const unreadCount = chatData.unreadCount || 0;
              
              // Update the member's unread count
              setCrewMembers(prev => prev.map(m => 
                m.uid === member.uid 
                  ? { ...m, unreadMessages: unreadCount }
                  : m
              ));
            }
          });
        }
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [crewId, crewMembers.length, currentUser]);

  // Load members when panel opens or when switching to members tab
  useEffect(() => {
    if (crewId && crewMembers.length === 0) {
      loadCrewMembers();
    }
  }, [crewId]);

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
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isAtBottom);
      setAutoScroll(isAtBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
    setShowScrollButton(false);
  };

  // Render Chat Tab
  const renderChatTab = () => (
    <>
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '15px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: '6px',
          marginBottom: '15px',
          maxHeight: '300px',
          position: 'relative'
        }}
      >
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

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '70px',
            right: '20px',
            background: crewDisplayColor,
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 5
          }}
        >
          <span style={{ color: 'white', fontSize: '18px' }}>↓</span>
        </button>
      )}

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

  // Render Members Tab
  const renderMembersTab = () => {
    const formatLastActive = (lastActive: Date | null) => {
      if (!lastActive) return 'Unknown';
      const now = new Date();
      const lastActiveDate = new Date(lastActive);
      const diffMs = now.getTime() - lastActiveDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Online now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return lastActiveDate.toLocaleDateString();
    };

    // Sort: unread messages first, then by lastActive
    const sortedMembers = [...crewMembers].sort((a, b) => {
      // First sort by unread messages (more unread = higher)
      if (b.unreadMessages !== a.unreadMessages) {
        return b.unreadMessages - a.unreadMessages;
      }
      // Then sort by lastActive
      const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
      const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
      return bTime - aTime;
    });

    const handleMemberClick = (member: CrewMember) => {
      setSelectedMember(member);
    };

    const handleSendMessage = () => {
      if (selectedMember && onStartDirectMessage) {
        onStartDirectMessage(selectedMember.uid, selectedMember.username, selectedMember.profilePicUrl);
        setSelectedMember(null);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
        {loadingMembers ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            Loading members...
          </div>
        ) : crewMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>👥</div>
            No members found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sortedMembers.map(member => {
              const lastSeenText = formatLastActive(member.lastActive);
              const isRecentlyActive = member.lastActive && (Date.now() - new Date(member.lastActive).getTime() < 5 * 60 * 1000);
              
              return (
                <div
                  key={member.uid}
                  onClick={() => handleMemberClick(member)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px',
                    background: selectedMember?.uid === member.uid ? `${crewDisplayColor}20` : 'rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedMember?.uid === member.uid ? `1px solid ${crewDisplayColor}40` : '1px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={member.profilePicUrl}
                      alt={member.username}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        border: isRecentlyActive ? `2px solid ${crewDisplayColor}` : '2px solid #444',
                        objectFit: 'cover'
                      }}
                    />
                    {isRecentlyActive && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '12px',
                        height: '12px',
                        background: '#10b981',
                        borderRadius: '50%',
                        border: '2px solid #1a1a1a'
                      }}></div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {member.username}
                      {member.unreadMessages > 0 && (
                        <div style={{
                          background: '#0084ff',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          minWidth: '18px',
                          height: '18px',
                          borderRadius: '9px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 5px'
                        }}>
                          {member.unreadMessages}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: isRecentlyActive ? crewDisplayColor : '#888' }}>
                      {member.crewRank} • {isRecentlyActive ? 'Active now' : `Last seen ${lastSeenText}`}
                    </div>
                  </div>
                  <div style={{ fontSize: '18px' }}>💬</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Member Profile Modal */}
        {selectedMember && (() => {
          const isRecentlyActive = selectedMember.lastActive && (Date.now() - new Date(selectedMember.lastActive).getTime() < 5 * 60 * 1000);
          return (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '12px'
            }}>
              <div style={{
                background: '#1a1a1a',
                borderRadius: '16px',
                padding: '24px',
                width: '90%',
                maxWidth: '320px',
                border: `1px solid ${crewDisplayColor}40`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={selectedMember.profilePicUrl}
                        alt={selectedMember.username}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          border: `3px solid ${isRecentlyActive ? crewDisplayColor : '#444'}`,
                          objectFit: 'cover'
                        }}
                      />
                      {isRecentlyActive && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '14px',
                          height: '14px',
                          background: '#10b981',
                          borderRadius: '50%',
                          border: '2px solid #1a1a1a'
                        }}></div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedMember.username}
                        {selectedMember.unreadMessages > 0 && (
                          <div style={{
                            background: '#0084ff',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            minWidth: '18px',
                            height: '18px',
                            borderRadius: '9px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 5px'
                          }}>
                            {selectedMember.unreadMessages} new
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: crewDisplayColor, fontWeight: 'bold' }}>
                        {selectedMember.crewRank}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        {selectedMember.rank} • {selectedMember.crewRep} Crew REP
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMember(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#888',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '16px'
                }}>
                  <button
                    onClick={handleSendMessage}
                    disabled={selectedMember.uid === userProfile?.uid}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: selectedMember.uid === userProfile?.uid ? '#444' : crewDisplayColor,
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: selectedMember.uid === userProfile?.uid ? 'not-allowed' : 'pointer',
                      opacity: selectedMember.uid === userProfile?.uid ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>💬</span>
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div style={{
      ...panelStyle,
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(95vw, 400px)',
      maxHeight: 'calc(100vh - 180px)',
      zIndex: 1400,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      {/* Header - WhatsApp Style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: `1px solid ${crewDisplayColor}30`,
        paddingBottom: '10px',
        gap: '12px'
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: crewDisplayColor,
            cursor: 'pointer',
            fontSize: '20px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ←
        </button>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: crewDisplayColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          boxShadow: `0 2px 8px ${crewDisplayColor}40`
        }}>
          👥
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            color: '#fff', 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {crewId?.toUpperCase()} CREW
          </div>
          <div style={{ 
            color: '#888', 
            fontSize: '12px'
          }}>
            {crewMembers.length > 0 ? `${crewMembers.length} members` : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '12px'
      }}>
        {[
          { id: 'chat', label: `💬 Chat`, icon: '💬' },
          { id: 'members', label: `👥 Members${crewMembers.length > 0 ? ` (${crewMembers.length})` : ''}`, icon: '👥' }
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
      {activeTab === 'members' && renderMembersTab()}

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
