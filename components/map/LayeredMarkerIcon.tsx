'use client';

import React, { useMemo } from 'react';
import type { DivIcon } from 'leaflet';
import { SurfaceType, getSurfaceConfig } from '@/constants/surfaces';
import { GraffitiType, getGraffitiTypeConfig } from '@/constants/graffitiTypes';
import { SpecialMarkerType } from '@/lib/types/blackout';

interface LayeredMarkerIconOptions {
  surface?: SurfaceType;
  graffitiType?: GraffitiType;
  size?: number;
  isOwn?: boolean;
  repEarned?: number;
  color?: string;
  playerTagName?: string;
  styleId?: string;
  specialType?: SpecialMarkerType;
  crewId?: string | null;
  variant?: number;
}

// Get the leaflet DivIcon synchronously
export function getLayeredIconForMarker(options: LayeredMarkerIconOptions): DivIcon {
  const surface = options.surface || 'wall';
  const graffitiType = options.graffitiType || 'tag';
  const size = options.size || 40;
  const isOwn = options.isOwn || false;
  const rep = options.repEarned || 0;
  const markerColor = options.color || '#4dabf7';
  const playerTagName = options.playerTagName;
  const crewId = options.crewId || 'bqc';
  const variant = options.variant || 1;
  const specialType = options.specialType;
  
  const surfaceConfig = getSurfaceConfig(surface);
  const graffitiConfig = getGraffitiTypeConfig(graffitiType);
  
  const surfaceIcon = surfaceConfig.icon;
  const graffitiIcon = graffitiConfig.icon;
  
  const badgeColor = isOwn ? markerColor : '#ffffff';
  const badgeBorder = isOwn ? markerColor : '#333333';
  
  // Simple logic: show font if playerTagName, otherwise show SVG
  const showFont = !!playerTagName;
  const fontSize = 16;
  
  // Get font family for player tags
  const getFontFamily = () => {
    return '"Permanent Marker", "Impact", "Arial Black", sans-serif';
  };
  
  // Apply special effects
  let colorStyle = '';
  if (specialType === 'rainbow') {
    colorStyle = `
      background: linear-gradient(135deg, #ff0000, #ff7700, #ffff00, #00ff00, #0077ff, #7700ff) !important;
      animation: rainbowPulse 2s ease-in-out infinite;
    `;
  } else if (specialType === 'glow') {
    colorStyle = `
      box-shadow: 0 0 15px ${markerColor}, 0 0 30px ${markerColor} !important;
      animation: glowPulse 1.5s ease-in-out infinite;
    `;
  } else if (specialType === 'metallic') {
    colorStyle = `
      background: linear-gradient(135deg, #c0c0c0, #e8e8e8, #a0a0a0) !important;
      border: 2px solid #888 !important;
    `;
  }
  
  // Construct SVG path directly from graffitiType, crewId, and variant
  const svgPath = `/icons/${crewId}/${graffitiType}-${variant}.svg`;
  
  let badgeContent: string;
  
  if (showFont && playerTagName) {
    badgeContent = `
      <span style="
        font-family: ${getFontFamily()};
        font-size: ${fontSize * 0.5}px;
        font-weight: bold;
        color: ${specialType === 'metallic' ? '#333' : markerColor};
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        -webkit-text-stroke: 0.3px rgba(0,0,0,0.2);
        letter-spacing: 0.5px;
        white-space: nowrap;
        max-width: ${size * 1.2}px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
        line-height: 1;
      ">${playerTagName.toUpperCase()}</span>
    `;
  } else {
    // Show SVG icon (default variant 1)
    badgeContent = `
      <img src="${svgPath}" 
           style="
             width: ${size * 0.55}px;
             height: ${size * 0.55}px;
             filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
             display: block;
           "
           alt="${graffitiType}"
           onerror="this.onerror=null; this.parentElement.innerHTML='<span style=\'font-size:${size * 0.28}px;color:red;\'>⚠️</span>';"
      />
    `;
  }
  
  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      font-size: ${size * 0.75}px;
    ">
      <!-- Surface Base Icon -->
      <span style="
        filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
      ">${surfaceIcon}</span>
      
      <!-- Graffiti Type / Player Name Badge -->
      <span style="
        position: absolute;
        bottom: ${size * 0.02}px;
        right: ${size * 0.02}px;
        ${showFont ? `
          min-width: ${size * 0.65}px;
          height: ${size * 0.65}px;
          padding: 0 ${size * 0.08}px;
          border-radius: ${size * 0.15}px;
        ` : `
          width: ${size * 0.65}px;
          height: ${size * 0.65}px;
          border-radius: 50%;
        `}
        background: ${badgeColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.28}px;
        border: 2px solid ${badgeBorder};
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 10;
        ${colorStyle}
      ">${badgeContent}</span>
      
      <!-- SVG variant indicator -->
      ${!showFont ? `
      <span style="
        position: absolute;
        bottom: -${size * 0.05}px;
        right: ${size * 0.05}px;
        background: ${markerColor};
        color: white;
        font-size: ${size * 0.1}px;
        font-weight: bold;
        padding: 1px 4px;
        border-radius: 3px;
        opacity: 0.9;
      ">V1</span>
      ` : ''}
      
      <!-- REP Badge -->
      ${rep > 0 ? `
      <span style="
        position: absolute;
        top: -${size * 0.15}px;
        left: -${size * 0.15}px;
        background: #10b981;
        color: white;
        font-size: ${size * 0.2}px;
        font-weight: bold;
        padding: ${size * 0.05}px ${size * 0.1}px;
        border-radius: ${size * 0.15}px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">+${rep}</span>
      ` : ''}
      
      <!-- Own Marker Indicator -->
      ${isOwn ? `
      <span style="
        position: absolute;
        bottom: -${size * 0.1}px;
        left: 50%;
        transform: translateX(-50%);
        background: ${markerColor};
        color: white;
        font-size: ${size * 0.18}px;
        padding: ${size * 0.03}px ${size * 0.08}px;
        border-radius: ${size * 0.1}px;
        font-weight: bold;
        white-space: nowrap;
      ">YOU</span>
      ` : ''}
    </div>
  `;
  
  const L = require('leaflet');
  
  return L.divIcon({
    html,
    className: 'layered-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

// React component version for previews
export function LayeredMarkerIconPreview({ 
  surface, 
  graffitiType, 
  size = 40,
  isOwn = false,
  repEarned = 0,
  color = '#4dabf7',
  playerTagName,
  styleId,
  crewId,
  variant = 1
}: {
  surface: SurfaceType;
  graffitiType: GraffitiType;
  size?: number;
  isOwn?: boolean;
  repEarned?: number;
  color?: string;
  playerTagName?: string;
  styleId?: string;
  crewId?: string | null;
  variant?: number;
}) {
  const surfaceConfig = useMemo(() => getSurfaceConfig(surface), [surface]);
  const graffitiConfig = useMemo(() => getGraffitiTypeConfig(graffitiType), [graffitiType]);
  
  const showFont = !!playerTagName;
  const crew = crewId || 'bqc';
  const svgPath = `/icons/${crew}/${graffitiType}-${variant}.svg`;
  const fontSize = 16;
  
  const getFontFamily = () => {
    return '"Permanent Marker", "Impact", "Arial Black", sans-serif';
  };
  
  return (
    <div style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      fontSize: size * 0.75
    }}>
      <span>{surfaceConfig.icon}</span>
      
      {/* Badge - either font text or SVG icon */}
      <span style={{
        position: 'absolute',
        bottom: size * 0.02,
        right: size * 0.02,
        width: showFont ? 'auto' : size * 0.65,
        height: size * 0.65,
        minWidth: size * 0.65,
        padding: showFont ? `0 ${size * 0.08}px` : 0,
        borderRadius: showFont ? size * 0.12 : '50%',
        background: isOwn ? color : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.28,
        border: `2px solid ${isOwn ? color : '#333'}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        {showFont && playerTagName ? (
          <span style={{
            fontFamily: getFontFamily(),
            fontSize: fontSize * 0.6,
            fontWeight: 'bold',
            color: color,
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
            letterSpacing: '1px',
            whiteSpace: 'nowrap'
          }}>
            {playerTagName.toUpperCase()}
          </span>
        ) : (
          <img 
            src={svgPath}
            alt={graffitiType}
            style={{
              width: size * 0.55,
              height: size * 0.55,
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))',
              display: 'block'
            }}
          />
        )}
      </span>
      
      {/* SVG variant indicator */}
      {!showFont && (
        <span style={{
          position: 'absolute',
          bottom: -size * 0.05,
          right: size * 0.05,
          background: color,
          color: 'white',
          fontSize: size * 0.1,
          fontWeight: 'bold',
          padding: '1px 4px',
          borderRadius: 3,
          opacity: 0.9
        }}>
          V1
        </span>
      )}
      
      {repEarned > 0 && (
        <span style={{
          position: 'absolute',
          top: -size * 0.15,
          left: -size * 0.15,
          background: '#10b981',
          color: 'white',
          fontSize: size * 0.2,
          fontWeight: 'bold',
          padding: `${size * 0.05}px ${size * 0.1}px`,
          borderRadius: size * 0.15
        }}>
          +{repEarned}
        </span>
      )}
    </div>
  );
}

export default LayeredMarkerIconPreview;