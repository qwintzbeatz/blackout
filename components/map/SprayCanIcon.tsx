import React from 'react';

/**
 * Creates a spray can tag marker icon HTML string
 * Used for graffiti markers on the map
 */
export const createSprayCanIcon = (
  color: string = '#ff6b6b',
  specialType?: 'rainbow' | 'glow' | 'metallic' | null
): string => {
  // Handle special color effects
  let markerColor = color;
  let additionalStyles = '';
  
  if (specialType === 'rainbow') {
    markerColor = 'transparent';
    additionalStyles = `
      background: linear-gradient(135deg, #ff6b6b, #fbbf24, #10b981, #4dabf7, #8b5cf6) !important;
      animation: rainbowShift 3s ease infinite;
    `;
  } else if (specialType === 'glow') {
    additionalStyles = `
      box-shadow: 0 0 15px ${color}, 0 0 30px ${color}80 !important;
      animation: glowPulse 1.5s ease infinite;
    `;
  } else if (specialType === 'metallic') {
    additionalStyles = `
      background: linear-gradient(135deg, #c0c0c0 0%, ${color} 50%, #808080 100%) !important;
      box-shadow: inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3) !important;
    `;
  }

  // Create a spray can style marker
  const iconHtml = `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <!-- Spray paint splatter background -->
      <div style="
        position: absolute;
        width: 24px;
        height: 24px;
        background-color: ${markerColor};
        ${additionalStyles}
        border-radius: 50%;
        opacity: 0.7;
        filter: blur(1px);
      "></div>
      
      <!-- Main marker body -->
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        background-color: ${markerColor};
        ${additionalStyles}
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Spray nozzle detail -->
        <div style="
          width: 6px;
          height: 6px;
          background-color: rgba(255,255,255,0.8);
          border-radius: 50%;
        "></div>
      </div>
      
      <!-- Drip effect -->
      <div style="
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 8px;
        background-color: ${markerColor};
        border-radius: 0 0 4px 4px;
        opacity: 0.8;
      "></div>
    </div>
  `;

  return iconHtml;
};

/**
 * Creates a Leaflet DivIcon for spray can markers
 */
export const createSprayCanDivIcon = (
  color: string = '#ff6b6b',
  specialType?: 'rainbow' | 'glow' | 'metallic' | null
) => {
  if (typeof window === 'undefined') return undefined;
  
  const L = require('leaflet');
  const iconHtml = createSprayCanIcon(color, specialType);
  
  return new L.DivIcon({
    html: iconHtml,
    iconSize: [28, 32],
    iconAnchor: [14, 16],
    popupAnchor: [0, -16],
    className: 'spray-can-marker'
  });
};

// Add CSS for animations
if (typeof document !== 'undefined') {
  const styleId = 'spray-can-icon-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes rainbowShift {
        0% { filter: hue-rotate(0deg); }
        50% { filter: hue-rotate(180deg); }
        100% { filter: hue-rotate(360deg); }
      }
      
      @keyframes glowPulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 15px currentColor, 0 0 30px currentColor; }
        50% { opacity: 0.8; box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
      }
      
      .spray-can-marker {
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default createSprayCanIcon;