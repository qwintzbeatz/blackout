'use client';

import React from 'react';
import { RepResult } from '@/utils/repCalculator';

interface RepNotificationProps {
  show: boolean;
  amount: number;
  message: string;
  breakdown?: RepResult['breakdown'];
  onClose?: () => void;
}

export const RepNotification: React.FC<RepNotificationProps> = ({
  show,
  amount,
  message,
  breakdown,
  onClose
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        minWidth: '300px',
        maxWidth: '400px',
        animation: 'slideInRight 0.3s ease-out',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎯</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{message}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)'
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Main REP Amount */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px', fontWeight: 'bold', display: 'block' }}>
          +{amount}
        </span>
        <span style={{ fontSize: '14px', opacity: 0.9 }}>REP Earned</span>
      </div>

      {/* REP Breakdown */}
      {breakdown && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
            REP BREAKDOWN
          </div>
          
          {/* Surface and Graffiti */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
            <span>{breakdown.breakdown.surface}</span>
            <span>+{breakdown.surfaceBase}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
            <span>{breakdown.breakdown.graffiti}</span>
            <span>+{breakdown.graffitiBase}</span>
          </div>
          
          {/* Bonuses */}
          {breakdown.breakdown.bonuses.length > 0 && (
            <>
              <div style={{ 
                height: '1px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                margin: '8px 0' 
              }} />
              {breakdown.breakdown.bonuses.map((bonus, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '4px', 
                  fontSize: '11px',
                  opacity: 0.9
                }}>
                  <span>{bonus}</span>
                </div>
              ))}
            </>
          )}
          
          {/* Multiplier */}
          {breakdown.totalMultiplier > 1 && (
            <>
              <div style={{ 
                height: '1px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                margin: '8px 0' 
              }} />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                <span>Total Multiplier</span>
                <span>x{breakdown.totalMultiplier.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '12px', opacity: 0.8 }}>
        Keep building your REP! 🚀
      </div>
    </div>
  );
};

export default RepNotification;