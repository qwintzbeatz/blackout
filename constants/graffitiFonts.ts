// Graffiti Fonts Configuration for Blackout NZ
// System: Fonts are FREE (starter), SVG Icons are UNLOCKABLE with REP

import { CrewId } from './crewGraffitiStyles';
import { GraffitiType } from './graffitiTypes';

// Style type - can be SVG icon or Font
export type StyleType = 'svg' | 'font';

// Tier levels for SVG unlocks
export type StyleTier = 'starter' | 'common' | 'rare' | 'epic' | 'legendary' | 'master';

// Combined style interface for both SVG and Font styles
export interface GraffitiStyle {
  id: string;              // e.g., "bqc-tag-svg-1" or "bqc-tag-font"
  crewId: CrewId;
  graffitiType: GraffitiType;
  styleType: StyleType;    // 'svg' or 'font'
  variant: number;         // 1-5 for SVG, 0 for font (single font per type)
  name: string;            // Display name
  description: string;
  
  // SVG-specific
  svgPath?: string;        // Path to SVG file
  
  // Font-specific  
  fontFamily?: string;     // CSS font-family name
  fontUrl?: string;        // Primary font file (woff2 preferred)
  fontUrlWoff?: string;    // Fallback woff format
  fontUrlOtf?: string;     // Fallback otf format
  fontUrlTtf?: string;     // Fallback ttf format
  
  // Unlock requirements
  unlockRep: number;       // REP needed to unlock (0 = free/starter)
  tier: StyleTier;
  
  // Preview
  previewUrl?: string;     // Preview image path
}

// SVG Unlock thresholds (Fonts are FREE)
export const SVG_UNLOCK_THRESHOLDS: Record<StyleTier, number> = {
  starter: 0,      // Not used for SVG
  common: 25,      // SVG 1
  rare: 75,        // SVG 2
  epic: 150,       // SVG 3
  legendary: 250,  // SVG 4
  master: 400      // SVG 5
};

// Font sizes by type (for rendering text with fonts)
export const FONT_SIZES: Record<GraffitiType, number> = {
  sticker: 14,
  tag: 16,
  mops: 16,
  stencil: 18,
  pasteup: 20,
  throwup: 20,
  roller: 22,
  etch: 22,
  piece: 26,
  extinguisher: 24,
  burner: 30,
  mural: 34,
  rapel: 38
};

// Generate all styles for all crews
function generateAllStyles(): GraffitiStyle[] {
  const styles: GraffitiStyle[] = [];
  const crews: CrewId[] = ['bqc', 'sps', 'lzt', 'dgc'];
  const types: GraffitiType[] = [
    'sticker', 'tag', 'mops', 'stencil', 'pasteup', 
    'throwup', 'roller', 'etch', 'piece', 
    'extinguisher', 'burner', 'mural', 'rapel'
  ];
  
  const svgTiers: StyleTier[] = ['common', 'rare', 'epic', 'legendary', 'master'];
  const svgThresholds = [25, 75, 150, 250, 400];
  
  crews.forEach(crewId => {
    types.forEach(type => {
      // Generate 1 Font style per type (FREE - starter tier)
      const fontStyleId = `${crewId}-${type}-font`;
      
      styles.push({
        id: fontStyleId,
        crewId,
        graffitiType: type,
        styleType: 'font',
        variant: 0,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Font`,
        description: `Free ${type} font style - displays your tag name!`,
        fontFamily: `${crewId.toUpperCase()}_${type}`.replace('-', '_'),
        fontUrl: `/fonts/${crewId}/${type}.woff2`,
        fontUrlWoff: `/fonts/${crewId}/${type}.woff`,
        fontUrlOtf: `/fonts/${crewId}/${type}.otf`,
        fontUrlTtf: `/fonts/${crewId}/${type}.ttf`,
        previewUrl: `/fonts/${crewId}/previews/${type}.png`,
        unlockRep: 0, // FREE!
        tier: 'starter'
      });
      
      // Generate 5 SVG styles (variants 1-5) - UNLOCKABLE
      for (let v = 1; v <= 5; v++) {
        const tier = svgTiers[v - 1];
        const threshold = svgThresholds[v - 1];
        const styleId = `${crewId}-${type}-svg-${v}`;
        
        styles.push({
          id: styleId,
          crewId,
          graffitiType: type,
          styleType: 'svg',
          variant: v,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Icon ${v}`,
          description: `${tier} ${type} icon - unlock at ${threshold} REP`,
          svgPath: `/icons/${crewId}/${type}-${v}.svg`,
          previewUrl: `/icons/${crewId}/previews/${type}-${v}.png`,
          unlockRep: threshold,
          tier
        });
      }
    });
  });
  
  return styles;
}

// All graffiti styles
export const ALL_GRAFFITI_STYLES: GraffitiStyle[] = generateAllStyles();

// Get styles by crew
export function getStylesByCrew(crewId: CrewId): GraffitiStyle[] {
  return ALL_GRAFFITI_STYLES.filter(s => s.crewId === crewId);
}

// Get styles by type
export function getStylesByGraffitiType(graffitiType: GraffitiType): GraffitiStyle[] {
  return ALL_GRAFFITI_STYLES.filter(s => s.graffitiType === graffitiType);
}

// Get styles by crew and type
export function getStylesByCrewAndType(crewId: CrewId, graffitiType: GraffitiType): GraffitiStyle[] {
  return ALL_GRAFFITI_STYLES.filter(s => s.crewId === crewId && s.graffitiType === graffitiType);
}

// Get SVG styles only (variants 1-5) - UNLOCKABLE
export function getSVGStyles(crewId: CrewId, graffitiType: GraffitiType): GraffitiStyle[] {
  return getStylesByCrewAndType(crewId, graffitiType).filter(s => s.styleType === 'svg');
}

// Get Font style (single font per type) - FREE
export function getFontStyle(crewId: CrewId, graffitiType: GraffitiType): GraffitiStyle | undefined {
  return getStylesByCrewAndType(crewId, graffitiType).find(s => s.styleType === 'font');
}

// Get all font styles for a crew
export function getFontStyles(crewId: CrewId, graffitiType: GraffitiType): GraffitiStyle[] {
  const fontStyle = getFontStyle(crewId, graffitiType);
  return fontStyle ? [fontStyle] : [];
}

// Get a specific style by ID
export function getStyleById(styleId: string): GraffitiStyle | undefined {
  return ALL_GRAFFITI_STYLES.find(s => s.id === styleId);
}

// Check if a style is unlocked
export function isStyleUnlocked(
  styleId: string, 
  userRep: number, 
  unlockedStyles: string[]
): boolean {
  const style = getStyleById(styleId);
  if (!style) return false;
  
  // Fonts are always free
  if (style.styleType === 'font') return true;
  
  // SVGs need REP or explicit unlock
  return unlockedStyles.includes(styleId) || userRep >= style.unlockRep;
}

// Get unlocked styles for a user
export function getUnlockedStyles(
  crewId: CrewId, 
  userRep: number, 
  unlockedStyles: string[]
): GraffitiStyle[] {
  return getStylesByCrew(crewId).filter(style => 
    isStyleUnlocked(style.id, userRep, unlockedStyles)
  );
}

// Get default style for a crew (always the font)
export function getDefaultStyleForCrew(crewId: CrewId): string {
  return `${crewId}-tag-font`; // Default to tag font (free)
}

// Get font size for a type
export function getFontSizeForType(graffitiType: GraffitiType): number {
  return FONT_SIZES[graffitiType] || 16;
}

// Get total count
export function getTotalStyleCount(): number {
  return ALL_GRAFFITI_STYLES.length;
}

// Get count per crew
export function getStyleCountPerCrew(): number {
  return ALL_GRAFFITI_STYLES.length / 4; // 4 crews
}

// Get next unlock for a user
export function getNextSVGUnlock(userRep: number, crewId: CrewId, graffitiType: GraffitiType): GraffitiStyle | null {
  const svgStyles = getSVGStyles(crewId, graffitiType);
  const locked = svgStyles.filter(s => s.unlockRep > userRep);
  return locked.length > 0 ? locked[0] : null;
}