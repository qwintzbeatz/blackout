/**
 * Color Unlock System for Blackout
 * 
 * Players start with crew colors only (or grey for solo)
 * Additional colors can be unlocked through gameplay
 */

export interface ColorDefinition {
  id: string;
  name: string;
  hex: string;
  category: 'starter' | 'standard' | 'super';
  crewId?: string; // For starter colors, which crew they belong to
  special?: 'rainbow' | 'glow' | 'metallic'; // Special rendering effects
}

export type CrewId = 'bqc' | 'sps' | 'lzt' | 'dgc';

/**
 * All available colors in the game (25 total)
 */
export const ALL_COLORS: ColorDefinition[] = [
  // === STARTER COLORS (Crew-based) ===
  // BLAQWT CREW - Black & White
  {
    id: 'black',
    name: 'Black',
    hex: '#000000',
    category: 'starter',
    crewId: 'bqc'
  },
  {
    id: 'white',
    name: 'White',
    hex: '#FFFFFF',
    category: 'starter',
    crewId: 'bqc'
  },
  
  // SPONTANEOUS - Green & Dark Green
  {
    id: 'green',
    name: 'Green',
    hex: '#10B981',
    category: 'starter',
    crewId: 'sps'
  },
  {
    id: 'dark-green',
    name: 'Dark Green',
    hex: '#059669',
    category: 'starter',
    crewId: 'sps'
  },
  
  // LUZUNT - Blue & Light Blue
  {
    id: 'blue',
    name: 'Blue',
    hex: '#3B82F6',
    category: 'starter',
    crewId: 'lzt'
  },
  {
    id: 'light-blue',
    name: 'Light Blue',
    hex: '#87CEEB',
    category: 'starter',
    crewId: 'lzt'
  },
  
  // DON'T GET CAPPED - Orange & Brown
  {
    id: 'orange',
    name: 'Orange',
    hex: '#FF8C00',
    category: 'starter',
    crewId: 'dgc'
  },
  {
    id: 'brown',
    name: 'Brown',
    hex: '#8B4513',
    category: 'starter',
    crewId: 'dgc'
  },
  
  // Solo - Grey & Pink
  {
    id: 'grey',
    name: 'Grey',
    hex: '#6B7280',
    category: 'starter',
    crewId: 'solo'
  },
  {
    id: 'pink',
    name: 'Pink',
    hex: '#EC4899',
    category: 'starter',
    crewId: 'solo'
  },
  
  // === STANDARD SPRAY CAN COLORS (10 unlockable) ===
  {
    id: 'red',
    name: 'Red',
    hex: '#EF4444',
    category: 'standard'
  },
  {
    id: 'yellow',
    name: 'Yellow',
    hex: '#FBBF24',
    category: 'standard'
  },
  {
    id: 'purple',
    name: 'Purple',
    hex: '#8B5CF6',
    category: 'standard'
  },
  {
    id: 'cyan',
    name: 'Cyan',
    hex: '#22D3EE',
    category: 'standard'
  },
  {
    id: 'magenta',
    name: 'Magenta',
    hex: '#D946EF',
    category: 'standard'
  },
  {
    id: 'lime',
    name: 'Lime',
    hex: '#84CC16',
    category: 'standard'
  },
  {
    id: 'teal',
    name: 'Teal',
    hex: '#14B8A6',
    category: 'standard'
  },
  {
    id: 'navy',
    name: 'Navy',
    hex: '#1E3A8A',
    category: 'standard'
  },
  {
    id: 'maroon',
    name: 'Maroon',
    hex: '#800000',
    category: 'standard'
  },
  {
    id: 'coral',
    name: 'Coral',
    hex: '#FF6B6B',
    category: 'standard'
  },
  
  // === SUPER UNLOCKABLES (5 special) ===
  {
    id: 'platinum',
    name: 'Platinum',
    hex: '#E5E4E2',
    category: 'super',
    special: 'metallic'
  },
  {
    id: 'shiny-chrome',
    name: 'Shiny Chrome',
    hex: '#C0C0C0',
    category: 'super',
    special: 'metallic'
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    hex: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)',
    category: 'super',
    special: 'rainbow'
  },
  {
    id: 'shiny-gold',
    name: 'Shiny Gold',
    hex: '#FFD700',
    category: 'super',
    special: 'metallic'
  },
  {
    id: 'glow-green',
    name: 'Glow in the Dark Green',
    hex: '#39FF14',
    category: 'super',
    special: 'glow'
  }
];

/**
 * Get starter colors for a specific crew
 */
export function getCrewColors(crewId: CrewId | null): ColorDefinition[] {
  if (!crewId) {
    // Solo players get grey and pink
    return ALL_COLORS.filter(c => c.crewId === 'solo');
  }
  return ALL_COLORS.filter(c => c.crewId === crewId);
}

/**
 * Get starter color hex values for a specific crew
 */
export function getCrewColorHexes(crewId: CrewId | null): string[] {
  return getCrewColors(crewId).map(c => c.hex);
}

/**
 * Get color definition by ID
 */
export function getColorById(id: string): ColorDefinition | undefined {
  return ALL_COLORS.find(c => c.id === id);
}

/**
 * Get color definition by hex value
 */
export function getColorByHex(hex: string): ColorDefinition | undefined {
  return ALL_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
}

/**
 * Get all colors in a specific category
 */
export function getColorsByCategory(category: 'starter' | 'standard' | 'super'): ColorDefinition[] {
  return ALL_COLORS.filter(c => c.category === category);
}

/**
 * Check if a color is unlocked for a user
 */
export function isColorUnlocked(colorId: string, unlockedColors: string[]): boolean {
  return unlockedColors.includes(colorId);
}

/**
 * Get default color for a crew (first crew color)
 */
export function getDefaultColorForCrew(crewId: CrewId | null): string {
  const colors = getCrewColors(crewId);
  return colors.length > 0 ? colors[0].hex : '#6B7280'; // Default to grey
}

/**
 * Initialize unlocked colors for a new player
 */
export function initializeUnlockedColors(crewId: CrewId | null): string[] {
  return getCrewColors(crewId).map(c => c.id);
}

/**
 * Get CSS style for a color (handles special effects)
 */
export function getColorStyle(color: ColorDefinition): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    backgroundColor: color.hex,
  };
  
  if (color.special === 'rainbow') {
    return {
      background: 'linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)',
    };
  }
  
  if (color.special === 'glow') {
    return {
      backgroundColor: color.hex,
      boxShadow: `0 0 10px ${color.hex}, 0 0 20px ${color.hex}, 0 0 30px ${color.hex}`,
    };
  }
  
  if (color.special === 'metallic') {
    return {
      background: `linear-gradient(135deg, ${color.hex} 0%, ${lightenColor(color.hex, 30)} 50%, ${color.hex} 100%)`,
    };
  }
  
  return baseStyle;
}

/**
 * Helper to lighten a hex color
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Export color hex values for easy access
 */
export const STARTER_COLORS = ALL_COLORS.filter(c => c.category === 'starter');
export const STANDARD_COLORS = ALL_COLORS.filter(c => c.category === 'standard');
export const SUPER_COLORS = ALL_COLORS.filter(c => c.category === 'super');