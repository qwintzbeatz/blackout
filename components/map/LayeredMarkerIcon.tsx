'use client';

import React, { useMemo } from 'react';
import type { DivIcon } from 'leaflet';
import { SurfaceType, SURFACES, getSurfaceConfig } from '@/constants/surfaces';
import { GraffitiType, GRAFFITI_TYPES, getGraffitiTypeConfig } from '@/constants/graffitiTypes';

interface LayeredMarkerIconProps {
  surface: SurfaceType;
  graffitiType: GraffitiType;
  size?: number;
  isOwn?: boolean;
  repEarned?: number;
  color?: string;
}

// Store for dynamic leaflet import
let L: any = null;

export async function createLayeredMarkerIcon(
  surface: SurfaceType,
  graffitiType: GraffitiType,
  options: {
    size?: number;
    isOwn?: boolean;
    repEarned?: number;
    color?: string;
  } = {}
): Promise<DivIcon> {
  // Dynamic import leaflet
  if (!L) {
    L = await import('leaflet');
  }
  
  const size = options.size || 40;
  const isOwn = options.isOwn || false;
  const rep = options.repEarned || 0;
  const markerColor = options.color || '#4dabf7';
  
  const surfaceConfig = getSurfaceConfig(surface);
  const graffitiConfig = getGraffitiTypeConfig(graffitiType);
  
  const surfaceIcon = surfaceConfig.icon;
  const graffitiIcon = graffitiConfig.icon;
  
  const badgeColor = isOwn ? markerColor : '#ffffff';
  const badgeBorder = isOwn ? markerColor : '#333333';
  
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
      
      <!-- Graffiti Type Overlay Badge -->
      <span style="
        position: absolute;
        bottom: ${size * 0.02}px;
        right: ${size * 0.02}px;
        width: ${size * 0.42}px;
        height: ${size * 0.42}px;
        background: ${badgeColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.28}px;
        border: 2px solid ${badgeBorder};
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 10;
      ">${graffitiIcon}</span>
      
      <!-- REP Badge (optional) -->
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
  
  return L.divIcon({
    html,
    className: 'layered-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

export async function getLayeredIconForMarker(
  marker: {
    surface?: SurfaceType;
    graffitiType?: GraffitiType;
    repEarned?: number;
    userId?: string;
    color?: string;
  },
  currentUserId?: string
): Promise<DivIcon> {
  const surface = marker.surface || 'wall';
  const graffitiType = marker.graffitiType || 'tag';
  const rep = marker.repEarned || 0;
  const isOwn = marker.userId === currentUserId;
  const color = marker.color || '#4dabf7';
  
  return createLayeredMarkerIcon(surface, graffitiType, {
    size: 40,
    isOwn,
    repEarned: rep,
    color
  });
}

// React component version for previews
export function LayeredMarkerIconPreview({ 
  surface, 
  graffitiType, 
  size = 40,
  isOwn = false,
  repEarned = 0
}: LayeredMarkerIconProps) {
  const surfaceConfig = useMemo(() => getSurfaceConfig(surface), [surface]);
  const graffitiConfig = useMemo(() => getGraffitiTypeConfig(graffitiType), [graffitiType]);
  
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
      <span style={{
        position: 'absolute',
        bottom: size * 0.02,
        right: size * 0.02,
        width: size * 0.42,
        height: size * 0.42,
        background: isOwn ? '#4dabf7' : '#fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.28,
        border: `2px solid ${isOwn ? '#4dabf7' : '#333'}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        {graffitiConfig.icon}
      </span>
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
