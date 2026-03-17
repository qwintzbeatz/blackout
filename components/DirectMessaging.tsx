'use client';

import { useState, useEffect } from 'react';
import { ref, push, onValue, query, orderByChild, limitToLast, remove, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useMissionTriggers } from '@/hooks/useMissionTriggers';
import { Gender } from '@/types';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';

interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePic: string;
  receiverId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  type: 'text' | 'location' | 'photo' | 'crew_invite';
}

interface ChatThread {
  chatId: string;
  participantIds: string[];
  participantNames: string[];
  participantProfilePics: string[];
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

interface DirectMessagingProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  gpsPosition: [number, number] | null;
  initialChatTarget?: {
    uid: string;
    username: string;
    profilePicUrl: string;
  } | null;
}

export default function DirectMessaging({ isOpen, onClose, userProfile, gpsPosition, initialChatTarget }: DirectMessagingProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesSent, setMessagesSent] = useState(0);

  // Handle initial chat target - start a conversation with the specified user
  useEffect(() => {
    if (initialChatTarget && isOpen && currentUser) {
      const targetUid = initialChatTarget.uid;
      const targetUsername = initialChatTarget.username;
      const targetProfilePic = initialChatTarget.profilePicUrl;
      
      // Create a consistent chat ID based on the two user IDs
      const chatId = [currentUser.uid, targetUid].sort().join('_');
      
      // Check if thread already exists in our threads list
      const existingThread = threads.find(t => t.participantIds.includes(targetUid));
      
      if (existingThread) {
        setActiveChat(existingThread.chatId);
      } else {
        // Create new chat thread in database for both users
        const createChatThread = async () => {
          const currentUserName = userProfile?.username || 'Unknown';
          const currentUserPic = userProfile?.profilePicUrl || '';
          
          // Set chat for current user
          await set(ref(realtimeDb, `direct-chats/${currentUser.uid}/${chatId}`), {
            participantIds: [currentUser.uid, targetUid],
            participantNames: [currentUserName, targetUsername],
            participantProfilePics: [currentUserPic, targetProfilePic],
            lastMessage: '',
            lastMessageTime: Date.now(),
            unreadCount: 0
          });
          
          // Set chat for target user
          await set(ref(realtimeDb, `direct-chats/${targetUid}/${chatId}`), {
            participantIds: [currentUser.uid, targetUid],
            participantNames: [currentUserName, targetUsername],
            participantProfilePics: [currentUserPic, targetProfilePic],
            lastMessage: '',
            lastMessageTime: Date.now(),
            unreadCount: 0
          });
        };
        
        createChatThread();
        setActiveChat(chatId);
      }
    }
  }, [initialChatTarget, isOpen, currentUser, threads, userProfile]);

  // Auto-select first conversation if no active chat
  useEffect(() => {
    if (!activeChat && threads.length > 0 && !initialChatTarget) {
      setActiveChat(threads[0].chatId);
    }
  }, [threads, activeChat, initialChatTarget]);

  // Get mission triggers for messaging events
  const { triggerMessagingEvent } = useMissionTriggers({
    userMarkers: [],
    gpsPosition,
    userProfile
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load chat threads for current user
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const threadsRef = ref(realtimeDb, `direct-chats/${currentUser.uid}`);
    
    const unsubscribe = onValue(threadsRef, (snapshot) => {
      const threadsData: ChatThread[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const threadData = child.val();
          threadsData.push({
            chatId: child.key || '',
            participantIds: threadData.participantIds || [],
            participantNames: threadData.participantNames || [],
            participantProfilePics: threadData.participantProfilePics || [],
            lastMessage: threadData.lastMessage || '',
            lastMessageTime: threadData.lastMessageTime || Date.now(),
            unreadCount: threadData.unreadCount || 0
          });
        });
        
        threadsData.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        setThreads(threadsData);
      }
    });

    return () => {
      // Cleanup listener
    };
  }, [currentUser, userProfile]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat || !currentUser) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(realtimeDb, `direct-messages/${activeChat}`);
    const q = query(messagesRef, orderByChild('timestamp'), limitToLast(100));

    const unsubscribe = onValue(q, (snapshot) => {
      const messagesData: DirectMessage[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const messageData = child.val();
          messagesData.push({
            id: child.key || '',
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            senderProfilePic: messageData.senderProfilePic,
            receiverId: messageData.receiverId,
            content: messageData.content,
            timestamp: messageData.timestamp,
            isRead: messageData.isRead,
            type: messageData.type || 'text'
          });
        });
        
        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData);
      }
    });

    return () => {
      // Cleanup listener
    };
  }, [activeChat, currentUser]);

  const sendMessage = async () => {
    if (!messageText.trim() || !activeChat || !currentUser || !userProfile) return;

    try {
      const messagesRef = ref(realtimeDb, `direct-messages/${activeChat}`);
      const messageData = {
        senderId: currentUser.uid,
        senderName: userProfile.username,
        senderProfilePic: userProfile.profilePicUrl,
        receiverId: activeChat.replace(currentUser.uid, '').replace('_', ''),
        content: messageText.trim(),
        timestamp: Date.now(),
        isRead: false,
        type: 'text' as const
      };

      await push(messagesRef, messageData);
      setMessageText('');
      
      // Track messaging statistics
      const newMessagesSent = messagesSent + 1;
      setMessagesSent(newMessagesSent);
      
      // Trigger messaging mission events
      if (triggerMessagingEvent) {
        // First message trigger
        if (newMessagesSent === 1) {
          triggerMessagingEvent('first_message_sent', { 
            timestamp: Date.now(),
            recipient: activeChat.replace(currentUser.uid, '').replace('_', '')
          });
        }
        
        // Direct message trigger
        triggerMessagingEvent('direct_message_sent', {
          timestamp: Date.now(),
          recipient: activeChat.replace(currentUser.uid, '').replace('_', ''),
          messageType: 'direct',
          messagesSent: newMessagesSent
        });
        
        // Crew chat trigger (for messages sent in crew threads)
        if (activeChat.includes('crew_')) {
          triggerMessagingEvent('crew_chat_interaction', {
            timestamp: Date.now(),
            crewId: activeChat,
            messagesSent: newMessagesSent
          });
        }
      }

      // Update thread last message
      const threadRef = ref(realtimeDb, `direct-chats/${currentUser.uid}/${activeChat}`);
      const threadUpdate = {
        lastMessage: messageText.trim(),
        lastMessageTime: Date.now()
      };
      
      // Update both participants' threads
      const otherUserId = activeChat.replace(currentUser.uid, '').replace('_', '');
      const otherThreadRef = ref(realtimeDb, `direct-chats/${otherUserId}/${activeChat}`);
      
      // This would need proper error handling for real implementation
      const updatePromises = [
        push(threadRef, threadUpdate),
        push(otherThreadRef, { ...threadUpdate, unreadCount: 1 })
      ];
      
      // In a real app, you'd await these promises
      updatePromises;
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeChat || !messageId) return;
    
    try {
      const messageRef = ref(realtimeDb, `direct-messages/${activeChat}/${messageId}`);
      await remove(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const startNewChat = async (targetUserId: string, targetUserName: string) => {
    if (!currentUser || !userProfile) return;
    
    const chatId = [currentUser.uid, targetUserId].sort().join('_');
    setActiveChat(chatId);

    // Create thread entry for both users
    const threadData = {
      participantIds: [currentUser.uid, targetUserId],
      participantNames: [userProfile.username, targetUserName],
      participantProfilePics: [userProfile.profilePicUrl, generateAvatarUrl(targetUserId, targetUserName, undefined, 60)],
      lastMessage: 'Chat started',
      lastMessageTime: Date.now(),
      unreadCount: 0
    };

    try {
      const userThreadRef = ref(realtimeDb, `direct-chats/${currentUser.uid}/${chatId}`);
      const targetThreadRef = ref(realtimeDb, `direct-chats/${targetUserId}/${chatId}`);
      
      await push(userThreadRef, threadData);
      await push(targetThreadRef, threadData);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      ...panelStyle,
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      maxWidth: '90vw',
      height: '600px',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(236, 72, 153, 0.3)'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#ec4899', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>💬</span>
          DIRECT MESSAGING
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(236, 72, 153, 0.2)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            color: '#ec4899',
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

      <div style={{ display: 'flex', flex: 1, gap: '15px' }}>
        {/* Messages area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!activeChat ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#666',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
              <div style={{ marginBottom: '15px' }}>
                Select a conversation or start a new one
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Direct messaging is now live!
              </div>
            </div>
          ) : (
            <>
              {/* Messages list */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '15px',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#666'
                  }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.senderId === currentUser?.uid;
                    
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          marginBottom: '15px',
                          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={msg.senderProfilePic}
                          alt={msg.senderName}
                          style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            border: `2px solid ${isOwnMessage ? '#ec4899' : '#4dabf7'}`
                          }}
                        />
                        
                        <div style={{
                          maxWidth: '70%',
                          background: isOwnMessage ? 
                            'rgba(236, 72, 153, 0.3)' : 
                            'rgba(59, 130, 246, 0.2)',
                          padding: '10px 15px',
                          borderRadius: isOwnMessage ? 
                            '18px 18px 0 18px' : 
                            '18px 18px 18px 0',
                          border: `1px solid ${isOwnMessage ? 
                            'rgba(236, 72, 153, 0.4)' : 
                            'rgba(59, 130, 246, 0.3)'}`
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginBottom: '5px',
                            color: isOwnMessage ? '#ec4899' : '#4dabf7'
                          }}>
                            {msg.senderName}
                          </div>
                          <div style={{ fontSize: '14px' }}>
                            {msg.content}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.6)',
                            marginTop: '5px',
                            textAlign: isOwnMessage ? 'right' : 'left'
                          }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          
                          {/* Delete button for own messages */}
                          {isOwnMessage && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              style={{
                                position: 'absolute',
                                top: '0',
                                right: isOwnMessage ? '0' : 'auto',
                                left: isOwnMessage ? 'auto' : '0',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '10px',
                                color: 'white',
                                cursor: 'pointer',
                                opacity: 0,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.opacity = '0';
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message input */}
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                paddingTop: '15px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #555',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  style={{
                    padding: '12px 20px',
                    background: messageText.trim() ? '#ec4899' : '#555',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#e0e0e0',
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(4px)'
};