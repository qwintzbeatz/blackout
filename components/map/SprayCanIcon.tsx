'use client';

import L from 'leaflet';

interface SprayCanIconProps {
  color: string;
  size?: number;
  withDrip?: boolean;
}

export function createSprayCanIcon(color: string, size: number = 40): L.DivIcon {
  const svg = createSprayCanSVG(color, size, true);
  
  return L.divIcon({
    html: svg,
    className: 'spray-can-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export function createSprayCanSVG(color: string, size: number = 40, withDrip: boolean = true): string {
  const padding = 4;
  const dripHeight = withDrip ? 25 : 0;
  const width = size + padding * 2;
  const height = size + padding * 2 + dripHeight;
  
  // Splash blob path - organic irregular shape
  const splashPath = `M 20,5 C 25,3 30,5 33,8 C 37,4 40,7 40,12 C 42,15 40,20 38,22 C 41,25 40,30 37,33 C 35,38 38,40 32,40 C 28,42 22,40 18,38 C 12,40 8,37 7,32 C 4,28 5,22 8,18 C 3,15 2,10 8,7 C 12,4 16,6 20,5 Z`;
  
  // Splatter dots
  const splatterDots = `<circle cx="8" cy="3" r="2" fill="${color}"/><circle cx="42" cy="18" r="1.5" fill="${color}"/><circle cx="3" cy="25" r="1.8" fill="${color}"/><circle cx="15" cy="42" r="2" fill="${color}"/><circle cx="35" cy="3" r="1.5" fill="${color}"/><circle cx="5" cy="12" r="1.2" fill="${color}"/><circle cx="28" cy="43" r="1.8" fill="${color}"/><circle cx="45" cy="30" r="1.5" fill="${color}"/>`;
  
  // Drip lines
  const drip1 = withDrip ? `<path d="M 14,40 Q 12,50 14,55 Q 16,50 14,40" fill="${color}"/>` : '';
  const drip2 = withDrip ? `<path d="M 22,40 Q 20,52 22,60 Q 24,52 22,40" fill="${color}"/>` : '';
  const drip3 = withDrip ? `<path d="M 30,40 Q 28,48 30,53 Q 32,48 30,40" fill="${color}"/>` : '';
  
  // Shadow
  const shadow = `<ellipse cx="20" cy="62" rx="12" ry="4" fill="rgba(0,0,0,0.3)"/>`;
  
  // Inner highlight
  const highlight = `<ellipse cx="16" cy="18" rx="6" ry="5" fill="rgba(255,255,255,0.25)"/>`;
  
  // Combine all
  const content = shadow + drip1 + drip2 + drip3 + splatterDots + `<path d="${splashPath}" fill="${color}"/>` + highlight;
  
  // Return compact SVG
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${40 + padding * 2} ${60 + padding * 2}" xmlns="http://www.w3.org/2000/svg"><g transform="translate(${padding}, ${padding})">${content}</g></svg>`;
}

// React component version for inline use
export default function SprayCanIcon({ color, size = 40, withDrip = true }: SprayCanIconProps) {
  const svg = createSprayCanSVG(color, size, withDrip);
  return <div dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'inline-block' }} />;
}
