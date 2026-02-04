'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth, realtimeDb } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, push, remove } from 'firebase/database';
import { UserProfile, CrewChatMessage } from '@/lib/types/blackout';
import { panelStyle } from '@/lib/constants';
import { generateAvatarUrl } from '@/lib/utils';
import { User as FirebaseUser } from 'firebase/auth';

import { CrewId } from '@/lib/types/story';

interface CrewChatPanelProps { 
  crewId: CrewId | null, 
  onClose: () => void,
  userProfile: UserProfile | null 
}

export default function CrewChatPanel({ crewId, onClose, userProfile }: CrewChatPanelProps) {
  const [messages, setMessages] = useState<CrewChatMessage[]>([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

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
    
    console.log('Setting up chat listener for crew:', crewId);
    
    const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData: CrewChatMessage[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          messagesData.push({
            id: childSnapshot.key || Date.now().toString(),
            text: data.text || '',
            uid: data.uid || '',
            username: data.username || 'Anonymous',
            avatar: data.avatar || generateAvatarUrl(data.uid || 'unknown', data.username || 'User', data.gender, 60),
            timestamp: data.timestamp || Date.now()
          });
        });
        
        // Sort by timestamp (oldest to newest)
        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData);
        console.log(`Loaded ${messagesData.length} messages`);
      } else {
        console.log('No messages yet for crew:', crewId);
        setMessages([]);
      }
    }, (error) => {
      console.error('Error loading chat messages:', error);
    });
    
    return () => {
      // Cleanup listener
    };
  }, [crewId]);

  const sendMessage = () => {
    if (!text.trim() || !crewId || !currentUser || !userProfile) {
      console.log('Cannot send message: missing required data');
      return;
    }
    
    console.log('Sending message to crew:', crewId);
    
    setIsSending(true);
    
    const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);
    const messageData = {
      text: text.trim(),
      uid: currentUser.uid,
      username: userProfile.username || 'Anonymous',
      avatar: userProfile.profilePicUrl || generateAvatarUrl(currentUser.uid, userProfile.username || 'User', userProfile.gender, 60),
      timestamp: Date.now()
    };
    
    // Use push which automatically generates a unique key
    push(messagesRef, messageData)
      .then(() => {
        console.log('✅ Message sent successfully');
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

  // Function to delete a message
  const deleteMessage = async (messageId: string) => {
    if (!crewId || !messageId || !currentUser) {
      console.log('Cannot delete message: missing required data');
      return;
    }

    // Find message to check ownership
    const messageToDelete = messages.find(msg => msg.id === messageId);
    if (!messageToDelete) {
      console.log('Message not found');
      return;
    }

    // Check if current user is message owner or has admin rights
    if (messageToDelete.uid !== currentUser.uid) {
      alert('You can only delete your own messages.');
      return;
    }

    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    setDeletingMessageId(messageId);
    
    try {
      const messageRef = ref(realtimeDb, `crew-chat/${crewId}/${messageId}`);
      await remove(messageRef);
      console.log('✅ Message deleted successfully');
      
      // Update local state immediately
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error: any) {
      console.error('❌ Error deleting message:', error);
      alert(`Failed to delete message: ${error.message}`);
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Debug log
  useEffect(() => {
    console.log('CrewChatPanel rendered with:', {
      crewId,
      userProfile,
      currentUser,
      messageCount: messages.length
    });
  }, [crewId, userProfile, currentUser, messages.length]);

  // Scroll to bottom when messages update
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      ...panelStyle,
      position: 'absolute',
      top: '80px',
      left: '0px',
      width: 'min(400px, 110vw)', // More responsive
      maxHeight: 'calc(100vh - 180px)', // Account for bottom nav
      zIndex: 1400,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
        paddingBottom: '10px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#10b981', 
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>👥</span>
          Crew Chat - {crewId?.toUpperCase()}
          <span style={{
            fontSize: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            padding: '2px 8px',
            borderRadius: '10px'
          }}>
            {messages.length} messages
          </span>
        </h3>
        <button
          onClick={onClose}
          onTouchStart={(e) => e.currentTarget.style.opacity = '0.7'}
          onTouchEnd={(e) => e.currentTarget.style.opacity = '1'}
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '15px',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '6px',
        marginBottom: '15px',
        maxHeight: '400px'
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
              const isOwnMessage = msg.uid === currentUser?.uid;
              const isDeleting = deletingMessageId === msg.id;
              const profilePicUrl = msg.avatar || generateAvatarUrl(msg.uid, msg.username, undefined, 60);
              
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
                    // Show delete button on hover for own messages
                    if (isOwnMessage && !isDeleting) {
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                      if (deleteBtn) deleteBtn.style.display = 'block';
                    }
                  }}
                  onMouseLeave={(e) => {
                    // Hide delete button when not hovering
                    if (isOwnMessage) {
                      const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                      if (deleteBtn) deleteBtn.style.display = 'none';
                    }
                  }}
                >
                  {/* Profile Picture - Always show for all messages */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '50px'
                  }}>
                    <img
                      src={profilePicUrl}
                      alt={msg.username}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: isOwnMessage ? '2px solid #10b981' : '2px solid #4dabf7',
                        objectFit: 'cover',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = generateAvatarUrl(msg.uid, msg.username, undefined, 60);
                      }}
                    />
                    <span style={{
                      fontSize: '9px',
                      color: isOwnMessage ? '#10b981' : '#94a3b8',
                      maxWidth: '50px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}>
                      {msg.username}
                    </span>
                  </div>
                  
                  {/* Message Bubble */}
                  <div style={{
                    maxWidth: 'calc(100% - 70px)',
                    background: isOwnMessage ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                    color: 'white',
                    padding: '12px 15px',
                    borderRadius: isOwnMessage ? '18px 18px 0 18px' : '18px 18px 18px 0',
                    wordBreak: 'break-word',
                    position: 'relative',
                    opacity: isDeleting ? 0.6 : 1,
                    border: isOwnMessage ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {/* Delete Button (only for own messages) */}
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
                          display: 'none', // Hidden by default, shown on hover
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1,
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}
                        title="Delete message"
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.2)';
                          e.currentTarget.style.background = '#dc2626';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.background = '#ef4444';
                        }}
                      >
                        ✕
                      </button>
                    )}
                    
                    {/* Deleting indicator */}
                    {isDeleting && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          border: '2px solid white', 
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Deleting...
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div style={{ 
                      fontSize: '14px',
                      lineHeight: '1.4',
                      color: isOwnMessage ? '#e0e0e0' : '#f1f5f9'
                    }}>
                      {msg.text}
                    </div>
                    
                    {/* Timestamp */}
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
        {/* Current User Profile Pic */}
        {userProfile && (
          <img
            src={userProfile.profilePicUrl}
            alt="You"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid #10b981',
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
            background: !text.trim() || isSending ? '#555' : '#10b981', 
            border: 'none', 
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            cursor: !text.trim() || isSending ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: !text.trim() || isSending ? 0.7 : 1,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseOver={(e) => {
            if (text.trim() && !isSending) {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseOut={(e) => {
            if (text.trim() && !isSending) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }
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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}