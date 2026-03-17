'use client';

import React, { useEffect } from 'react';

interface DMNotificationProps {
  show: boolean;
  senderName: string;
  senderPic: string;
  message: string;
  onClose?: () => void;
  onClick?: () => void;
}

export default function DMNotification({
  show,
  senderName,
  senderPic,
  message,
  onClose,
  onClick
}: DMNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #0084ff, #00c6ff)',
        color: 'white',
        padding: '14px 16px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        minWidth: '300px',
        maxWidth: '350px',
        animation: 'slideInRight 0.3s ease-out',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={senderPic}
            alt={senderName}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid white'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '16px',
            height: '16px',
            background: '#0084ff',
            borderRadius: '50%',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px'
          }}>
            💬
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 'bold',
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{senderName}</span>
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  marginLeft: '8px'
                }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ 
            fontSize: '13px', 
            opacity: 0.95,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {message}
          </div>
        </div>
      </div>

      <div style={{
        fontSize: '11px',
        opacity: 0.8,
        marginTop: '8px',
        textAlign: 'center'
      }}>
        Tap to open conversation
      </div>

      <style>{`
        @keyframes slideInRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
