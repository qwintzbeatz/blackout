'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Conversation {
  chatId: string;
  participantId: string;
  participantName: string;
  participantProfilePic: string;
  unreadCount: number;
  lastMessage?: string;
}

interface MessengerHeadsProps {
  conversations: Conversation[];
  onSelectConversation: (chatId: string, participantId: string) => void;
  onCloseConversation: (chatId: string) => void;
}

interface HeadPosition {
  x: number;
  y: number;
}

export default function MessengerHeads({ 
  conversations, 
  onSelectConversation,
  onCloseConversation 
}: MessengerHeadsProps) {
  const [heads, setHeads] = useState<Map<string, HeadPosition>>(new Map());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize heads when conversations change
  useEffect(() => {
    if (conversations.length === 0) return;

    setHeads(prev => {
      const newHeads = new Map(prev);
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const startX = screenWidth - 70;
      
      conversations.forEach((conv, index) => {
        if (!newHeads.has(conv.chatId)) {
          // Position from bottom-right, stacking upwards
          newHeads.set(conv.chatId, {
            x: startX,
            y: screenHeight - 120 - (index * 70)
          });
        }
      });
      
      return newHeads;
    });
  }, [conversations.length]);

  const handleMouseDown = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    const head = heads.get(chatId);
    if (head) {
      setDraggingId(chatId);
      setDragOffset({
        x: e.clientX - head.x,
        y: e.clientY - head.y
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent, chatId: string) => {
    const head = heads.get(chatId);
    if (head && e.touches[0]) {
      setDraggingId(chatId);
      setDragOffset({
        x: e.touches[0].clientX - head.x,
        y: e.touches[0].clientY - head.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingId) return;
    
    setHeads(prev => {
      const newHeads = new Map(prev);
      const head = newHeads.get(draggingId);
      if (head) {
        newHeads.set(draggingId, {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
      return newHeads;
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!draggingId || !e.touches[0]) return;
    
    setHeads(prev => {
      const newHeads = new Map(prev);
      const head = newHeads.get(draggingId);
      if (head) {
        newHeads.set(draggingId, {
          x: e.touches[0].clientX - dragOffset.x,
          y: e.touches[0].clientY - dragOffset.y
        });
      }
      return newHeads;
    });
  };

  const handleMouseUp = () => {
    if (draggingId) {
      const head = heads.get(draggingId);
      if (head) {
        // If dragged off screen (to the left or bottom), close it
        const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
        const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        
        if (head.x < 0 || head.y > screenHeight - 50) {
          onCloseConversation(draggingId);
        }
      }
    }
    setDraggingId(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [draggingId, dragOffset]);

  if (conversations.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9999
      }}
    >
      {conversations.map(conv => {
        const position = heads.get(conv.chatId) || { x: 100, y: 100 };
        const isDragging = draggingId === conv.chatId;
        
        return (
          <div
            key={conv.chatId}
            onMouseDown={(e) => handleMouseDown(e, conv.chatId)}
            onTouchStart={(e) => handleTouchStart(e, conv.chatId)}
            onClick={() => !isDragging && onSelectConversation(conv.chatId, conv.participantId)}
            style={{
              position: 'absolute',
              left: position.x,
              top: position.y,
              cursor: isDragging ? 'grabbing' : 'grab',
              pointerEvents: 'auto',
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              zIndex: isDragging ? 10000 : 9999
            }}
          >
            {/* Chat Head */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: conv.unreadCount > 0 ? 'linear-gradient(135deg, #0084ff, #00c6ff)' : '#666',
              padding: '3px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              position: 'relative'
            }}>
              <img
                src={conv.participantProfilePic}
                alt={conv.participantName}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #1a1a1a'
                }}
              />
              
              {/* Notification Badge */}
              {conv.unreadCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ff3b30',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  border: '2px solid #1a1a1a'
                }}>
                  {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                </div>
              )}
              
              {/* Close Button (X) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseConversation(conv.chatId);
                }}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '-8px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#ff3b30',
                  border: '2px solid #1a1a1a',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  zIndex: 1
                }}
              >
                ×
              </button>
            </div>
            
            {/* Name tooltip on hover */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '-24px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              opacity: 0,
              transition: 'opacity 0.2s',
              pointerEvents: 'none'
            }}
            className="head-tooltip"
            >
              {conv.participantName}
            </div>
            
            <style>{`
              div:hover > .head-tooltip {
                opacity: 1;
              }
            `}</style>
          </div>
        );
      })}
    </div>
  );
}
