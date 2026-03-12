'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface OfflineJoystickProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onCenter: () => void;
}

const OfflineJoystick: React.FC<OfflineJoystickProps> = ({
  onMove,
  onCenter
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);

  // Helper to get the thumb's top-left position for centering
  const getCenterPosition = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    // thumb is 40x40
    return {
      x: rect.width / 2 - 20,
      y: rect.height / 2 - 20
    };
  }, []);

  // Initialize and keep centered when not dragging (e.g., on resize)
  useEffect(() => {
    const center = getCenterPosition();
    setJoystickPosition(center);
  }, [getCenterPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (!isDragging) {
        const center = getCenterPosition();
        setJoystickPosition(center);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDragging, getCenterPosition]);

  // Reset to center and call onCenter
  const resetToCenter = useCallback(() => {
    const center = getCenterPosition();
    setJoystickPosition(center);
    onCenter();
  }, [getCenterPosition, onCenter]);

  // Handle mouse/touch start
  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current || !joystickRef.current) return;
    
    setIsDragging(true);
    
    const rect = containerRef.current.getBoundingClientRect();
    const joystickRect = joystickRef.current.getBoundingClientRect();
    
    const x = clientX - rect.left - (joystickRect.width / 2);
    const y = clientY - rect.top - (joystickRect.height / 2);
    
    updatePosition(x, y, rect);
  };

  // Handle mouse/touch move
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current || !joystickRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const joystickRect = joystickRef.current.getBoundingClientRect();
    
    const x = clientX - rect.left - (joystickRect.width / 2);
    const y = clientY - rect.top - (joystickRect.height / 2);
    
    updatePosition(x, y, rect);
  };

  // Handle mouse/touch end – snap back to center
  const handleEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    resetToCenter();
  };

  // Update joystick position and calculate direction
  const updatePosition = (x: number, y: number, rect: DOMRect) => {
    // Constrain joystick within container bounds
    const maxX = rect.width - 40; // 40px is joystick width
    const maxY = rect.height - 40; // 40px is joystick height
    const clampedX = Math.max(0, Math.min(maxX, x));
    const clampedY = Math.max(0, Math.min(maxY, y));
    
    setJoystickPosition({ x: clampedX, y: clampedY });
    
    // Calculate direction based on position relative to center
    const centerX = maxX / 2;
    const centerY = maxY / 2;
    const threshold = 15; // Minimum distance to register movement
    
    const dx = clampedX - centerX;
    const dy = clampedY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > threshold) {
      // Determine direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal movement
        if (dx > 0) {
          onMove('right');
        } else {
          onMove('left');
        }
      } else {
        // Vertical movement
        if (dy > 0) {
          onMove('down');
        } else {
          onMove('up');
        }
      }
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while dragging
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global event listeners for mouse dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        bottom: '150px',
        right: '20px',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '2px solid rgba(239, 68, 68, 0.5)',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        cursor: 'grab',
        userSelect: 'none',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.8)';
          e.currentTarget.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.5), inset 0 0 30px rgba(239, 68, 68, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.3), inset 0 0 20px rgba(239, 68, 68, 0.2)';
        }
      }}
      onClick={resetToCenter}
    >
      {/* Joystick thumb */}
      <div
        ref={joystickRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'absolute',
          left: joystickPosition.x,
          top: joystickPosition.y,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          border: '3px solid rgba(255, 255, 255, 0.8)',
          boxShadow: `
            0 4px 15px rgba(239, 68, 68, 0.6),
            0 0 20px rgba(239, 68, 68, 0.4),
            inset 0 0 10px rgba(255, 255, 255, 0.5)
          `,
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: `scale(${isDragging ? 1.1 : 1})`,
          transition: 'all 0.2s ease',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = `
              0 6px 20px rgba(239, 68, 68, 0.8),
              0 0 30px rgba(239, 68, 68, 0.6),
              inset 0 0 15px rgba(255, 255, 255, 0.7)
            `;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `
              0 4px 15px rgba(239, 68, 68, 0.6),
              0 0 20px rgba(239, 68, 68, 0.4),
              inset 0 0 10px rgba(255, 255, 255, 0.5)
            `;
          }
        }}
      />
    </div>
  );
};

export default OfflineJoystick;