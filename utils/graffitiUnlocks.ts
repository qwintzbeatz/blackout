/**
 * Graffiti Style Unlock System
 * 
 * Players unlock new graffiti styles based on their REP score.
 * Each style has a REP threshold that must be reached to unlock it.
 */

import { GraffitiType } from '@/types';

// All available graffiti styles with their unlock requirements
export interface GraffitiStyle {
  id: GraffitiType;
  name: string;
  description: string;
  repRequired: number;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Define all graffiti styles with unlock thresholds
export const GRAFFITI_STYLES: GraffitiStyle[] = [
  // Common - Unlocked by default
  {
    id: 'tag',
    name: 'Tag',
    description: 'Quick signature style. The foundation of every writer\'s journey.',
    repRequired: 0,
    icon: '✏️',
    rarity: 'common'
  },
  {
    id: 'throwup',
    name: 'Throw-Up',
    description: 'Bubble letters, fast and clean. A step up from basic tags.',
    repRequired: 25,
    icon: '🔵',
    rarity: 'common'
  },
  
  // Uncommon
  {
    id: 'stencil',
    name: 'Stencil',
    description: 'Precise spray-paint technique. Clean lines, political power.',
    repRequired: 50,
    icon: '📐',
    rarity: 'uncommon'
  },
  {
    id: 'pasteup',
    name: 'Paste-Up',
    description: 'Wheatpaste posters. Street art meets graffiti culture.',
    repRequired: 75,
    icon: '📄',
    rarity: 'uncommon'
  },
  
  // Rare
  {
    id: 'blockbuster',
    name: 'Blockbuster',
    description: 'Massive block letters. Maximum visibility, maximum impact.',
    repRequired: 100,
    icon: '🧱',
    rarity: 'rare'
  },
  {
    id: 'roller',
    name: 'Roller',
    description: 'Paint roller technique. Cover large areas with style.',
    repRequired: 150,
    icon: '🎨',
    rarity: 'rare'
  },
  
  // Epic
  {
    id: 'piece',
    name: 'Piece',
    description: 'Masterpiece-level work. Complex letterforms and color schemes.',
    repRequired: 250,
    icon: '🖼️',
    rarity: 'epic'
  },
  {
    id: 'heaven',
    name: 'Heaven Spot',
    description: 'High-up, hard-to-reach locations. Risk taker\'s prestige.',
    repRequired: 350,
    icon: '☁️',
    rarity: 'epic'
  },
  
  // Legendary
  {
    id: 'wildstyle',
    name: 'Wildstyle',
    description: 'Interlocking, arrow-filled masterpieces. Elite writer status.',
    repRequired: 500,
    icon: '🔥',
    rarity: 'legendary'
  },
  {
    id: 'burner',
    name: 'Burner',
    description: 'The ultimate expression. Colors, characters, and pure fire.',
    repRequired: 750,
    icon: '💎',
    rarity: 'legendary'
  }
];

// Get rarity color
export const getRarityColor = (rarity: GraffitiStyle['rarity']): string => {
  switch (rarity) {
    case 'common': return '#9ca3af'; // Gray
    case 'uncommon': return '#10b981'; // Green
    case 'rare': return '#3b82f6'; // Blue
    case 'epic': return '#8b5cf6'; // Purple
    case 'legendary': return '#f59e0b'; // Gold
    default: return '#9ca3af';
  }
};

// Get rarity background gradient
export const getRarityGradient = (rarity: GraffitiStyle['rarity']): string => {
  switch (rarity) {
    case 'common': return 'linear-gradient(135deg, #374151, #1f2937)';
    case 'uncommon': return 'linear-gradient(135deg, #065f46, #064e3b)';
    case 'rare': return 'linear-gradient(135deg, #1e40af, #1e3a8a)';
    case 'epic': return 'linear-gradient(135deg, #6d28d9, #5b21b6)';
    case 'legendary': return 'linear-gradient(135deg, #d97706, #b45309)';
    default: return 'linear-gradient(135deg, #374151, #1f2937)';
  }
};

/**
 * Get all styles that should be unlocked based on REP
 */
export const getUnlockedStyles = (rep: number): GraffitiType[] => {
  return GRAFFITI_STYLES
    .filter(style => rep >= style.repRequired)
    .map(style => style.id);
};

/**
 * Get the next style to unlock and progress towards it
 */
export const getNextUnlock = (rep: number): { 
  style: GraffitiStyle | null; 
  progress: number; 
  repNeeded: number;
  totalRep: number;
} => {
  // Find the first locked style
  const nextStyle = GRAFFITI_STYLES.find(style => rep < style.repRequired);
  
  if (!nextStyle) {
    // All styles unlocked!
    return { 
      style: null, 
      progress: 100, 
      repNeeded: 0,
      totalRep: rep 
    };
  }
  
  // Find the previous style for progress calculation
  const previousStyle = GRAFFITI_STYLES
    .filter(style => rep >= style.repRequired)
    .pop();
  
  const prevRep = previousStyle?.repRequired ?? 0;
  const nextRep = nextStyle.repRequired;
  
  const progress = ((rep - prevRep) / (nextRep - prevRep)) * 100;
  const repNeeded = nextRep - rep;
  
  return {
    style: nextStyle,
    progress: Math.min(progress, 100),
    repNeeded,
    totalRep: rep
  };
};

/**
 * Get styles that were just unlocked at a specific REP milestone
 */
export const getNewlyUnlockedStyles = (previousRep: number, currentRep: number): GraffitiStyle[] => {
  return GRAFFITI_STYLES.filter(style => 
    style.repRequired > previousRep && style.repRequired <= currentRep
  );
};

/**
 * Check if a specific style is unlocked
 */
export const isStyleUnlocked = (styleId: GraffitiType, rep: number): boolean => {
  const style = GRAFFITI_STYLES.find(s => s.id === styleId);
  return style ? rep >= style.repRequired : false;
};

/**
 * Get style info by ID
 */
export const getStyleById = (styleId: GraffitiType): GraffitiStyle | undefined => {
  return GRAFFITI_STYLES.find(s => s.id === styleId);
};

/**
 * Get all styles with unlock status
 */
export const getStylesWithStatus = (rep: number): Array<GraffitiStyle & { unlocked: boolean }> => {
  return GRAFFITI_STYLES.map(style => ({
    ...style,
    unlocked: rep >= style.repRequired
  }));
};

/**
 * Get total number of unlocked styles
 */
export const getUnlockedCount = (rep: number): number => {
  return GRAFFITI_STYLES.filter(style => rep >= style.repRequired).length;
};

/**
 * Get total number of styles
 */
export const getTotalStylesCount = (): number => {
  return GRAFFITI_STYLES.length;
};

/**
 * Get unlock progress percentage across all styles
 */
export const getOverallUnlockProgress = (rep: number): number => {
  const maxRep = Math.max(...GRAFFITI_STYLES.map(s => s.repRequired));
  return Math.min((rep / maxRep) * 100, 100);
};