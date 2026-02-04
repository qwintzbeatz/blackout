"use client";

import React, { useState, useEffect } from "react";

interface GridBackgroundProps {
  children: React.ReactNode;
}

const GridBackground: React.FC<GridBackgroundProps> = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Get mouse position relative to the viewport
      const { clientX, clientY } = event;
      // Calculate position from the center of the screen
      const x = clientX - window.innerWidth / 2;
      const y = clientY - window.innerHeight / 2;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden' 
    }}>
      {/* Content (Map) */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%', 
        height: '100%' 
      }}>
        {children}
      </div>
      
      {/* Grid Background - positioned on top of content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 10,
          background: 'rgba(0, 255, 255, 0.1)',
          backgroundImage: `
            linear-gradient(to right, rgba(0, 255, 255, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          animation: "moveGrid 20s linear infinite",
          // Apply a subtle transform based on mouse position for a parallax effect
          transform: `translate(${mousePosition.x / 30}px, ${mousePosition.y / 30}px)`,
          pointerEvents: 'none',
          opacity: 100
        }}
      >
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '60vmin',
          height: '60vmin',
          background: 'linear-gradient(45deg, rgba(0, 255, 255, 0.6), rgba(0, 0, 255, 0.4))',
          borderRadius: '50%',
          filter: 'blur(150px)',
          transform: 'translate(-50%, -50%)',
          opacity: 0.6
        }} />
        
        {/* Test element - bright pink square to verify visibility */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 80,
          height: 80,
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          borderRadius: 8
        }} />
        
        {/* Keyframes for the animation */}
        <style>
          {`
            @keyframes moveGrid {
              0% { background-position: 0 0; }
              100% { background-position: 80px 80px; }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default GridBackground;
