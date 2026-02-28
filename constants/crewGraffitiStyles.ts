// Crew Graffiti Styles Configuration for Blackout NZ
// Each crew has 5 variants per graffiti type (13 types × 5 variants × 4 crews = 260 styles)

import { GraffitiType, GRAFFITI_TYPES } from './graffitiTypes';

// Crew IDs
export type CrewId = 'bqc' | 'sps' | 'lzt' | 'dgc';

// Crew theme colors for reference
export const CREW_THEMES: Record<CrewId, { name: string; primary: string; secondary: string; accent: string }> = {
  bqc: {
    name: 'BLAQWT CREW',
    primary: '#000000',
    secondary: '#FFFFFF',
    accent: '#4a4a4a'
  },
  sps: {
    name: 'SPONTANEOUS',
    primary: '#10B981',
    secondary: '#000000',
    accent: '#34d399'
  },
  lzt: {
    name: 'LUZUNT',
    primary: '#87CEEB',
    secondary: '#1E3A8A',
    accent: '#60a5fa'
  },
  dgc: {
    name: "DON'T GET CAPPED",
    primary: '#FF8C00',
    secondary: '#000000',
    accent: '#fbbf24'
  }
};

// Style variant names per graffiti type
export const VARIANT_NAMES: Record<GraffitiType, string[]> = {
  sticker: ['Slap', 'Label', 'Sticky', 'Press-On', 'Decal'],
  tag: ['Scratch', 'Scribble', 'Scrawl', 'Scriber', 'Etch-Tag'],
  stencil: ['Cut-Out', 'Spray-Over', 'Template', 'Mask', 'Shadow'],
  poster: ['Wheatpaste', 'Flyer', 'Poster', 'Billboard', 'Collage'],
  throwup: ['Bubble', 'Quickie', 'Two-Tone', 'Fill-In', 'Outline'],
  etch: ['Scratch', 'Acid', 'Scribe', 'Glass-Tag', 'Window'],
  roller: ['Blockbuster', 'Roll-Over', 'Wide-Body', 'Stretch', 'Extend'],
  extinguisher: ['Fire-Bomb', 'Extinguish', 'Powder', 'Spray-Out', 'Dust'],
  piece: ['Masterpiece', 'Burner-Lite', 'Wildstyle', 'Bubble-Piece', 'Block'],
  burner: ['Fire-Heat', 'Hot-Flame', 'Blaze', 'Inferno', 'Scorch'],
  mural: ['Wall-Art', 'Large-Scale', 'Community', 'Commission', 'Street-Art'],
  rapel: ['Heaven', 'Sky-High', 'Rooftop', 'Dangle', 'Death-Defy'],
  mops: ['Mop-Tag', 'Squeeze', 'Drip', 'Flow', 'Bucket']
};

// Individual style configuration
export interface CrewGraffitiStyle {
  id: string;           // e.g., "bqc-sticker-1"
  crewId: CrewId;       // "bqc", "sps", "lzt", "dgc"
  graffitiType: GraffitiType;
  variant: number;      // 1-5
  variantName: string;  // e.g., "Slap", "Bubble", etc.
  name: string;         // Full name e.g., "BLAQWT Slap"
  iconPath: string;     // Path to hand-drawn icon SVG
  previewPath?: string; // Optional larger preview image
}

// Unlock thresholds for graffiti types (REP needed)
export const TYPE_UNLOCK_THRESHOLDS: Record<GraffitiType, number> = {
  sticker: 0,
  tag: 0,
  mops: 0,
  stencil: 25,
  pasteup: 50,
  throwup: 100,
  roller: 150,
  etch: 200,
  piece: 300,
  extinguisher: 400,
  burner: 500,
  mural: 750,
  rapel: 1000
};

// Variant unlock thresholds (additional REP after type is unlocked)
export const VARIANT_UNLOCK_THRESHOLDS: number[] = [0, 25, 75, 150, 250];

// Generate all style variants
function generateAllStyles(): Record<string, CrewGraffitiStyle> {
  const styles: Record<string, CrewGraffitiStyle> = {};
  const graffitiTypes = Object.keys(GRAFFITI_TYPES) as GraffitiType[];
  const crews: CrewId[] = ['bqc', 'sps', 'lzt', 'dgc'];

  crews.forEach(crewId => {
    const crewTheme = CREW_THEMES[crewId];
    
    graffitiTypes.forEach(type => {
      const variantNames = VARIANT_NAMES[type] || ['Style 1', 'Style 2', 'Style 3', 'Style 4', 'Style 5'];
      
      for (let variant = 1; variant <= 5; variant++) {
        const styleId = `${crewId}-${type}-${variant}`;
        const variantName = variantNames[variant - 1] || `Style ${variant}`;
        
        styles[styleId] = {
          id: styleId,
          crewId,
          graffitiType: type,
          variant,
          variantName,
          name: `${crewTheme.name} ${variantName}`,
          iconPath: `/icons/${crewId}/${type}-${variant}.svg`,
          previewPath: `/icons/${crewId}/previews/${type}-${variant}.png`
        };
      }
    });
  });

  return styles;
}

// All crew graffiti styles
export const CREW_GRAFFITI_STYLES: Record<string, CrewGraffitiStyle> = generateAllStyles();

// Get styles by crew
export function getStylesByCrew(crewId: CrewId): CrewGraffitiStyle[] {
  return Object.values(CREW_GRAFFITI_STYLES).filter(s => s.crewId === crewId);
}

// Get styles by graffiti type
export function getStylesByType(graffitiType: GraffitiType): CrewGraffitiStyle[] {
  return Object.values(CREW_GRAFFITI_STYLES).filter(s => s.graffitiType === graffitiType);
}

// Get styles by crew and type
export function getStylesByCrewAndType(crewId: CrewId, graffitiType: GraffitiType): CrewGraffitiStyle[] {
  return Object.values(CREW_GRAFFITI_STYLES).filter(
    s => s.crewId === crewId && s.graffitiType === graffitiType
  );
}

// Get a specific style
export function getStyleById(styleId: string): CrewGraffitiStyle | undefined {
  return CREW_GRAFFITI_STYLES[styleId];
}

// Check if a style variant is unlocked
export function isStyleVariantUnlocked(
  styleId: string,
  userRep: number,
  unlockedTypes: string[],
  unlockedVariants: string[]
): boolean {
  const style = getStyleById(styleId);
  if (!style) return false;

  // Check if the graffiti type is unlocked
  const typeThreshold = TYPE_UNLOCK_THRESHOLDS[style.graffitiType] || 0;
  const typeUnlocked = unlockedTypes.includes(style.graffitiType) || userRep >= typeThreshold;
  
  if (!typeUnlocked) return false;

  // Check if the variant is unlocked
  const variantThreshold = VARIANT_UNLOCK_THRESHOLDS[style.variant - 1] || 0;
  const repAfterTypeUnlock = userRep - typeThreshold;
  
  return unlockedVariants.includes(styleId) || repAfterTypeUnlock >= variantThreshold;
}

// Get unlock progress for a style variant
export function getVariantUnlockProgress(
  styleId: string,
  userRep: number,
  unlockedTypes: string[]
): { isUnlocked: boolean; progress: number; repNeeded: number } {
  const style = getStyleById(styleId);
  if (!style) return { isUnlocked: false, progress: 0, repNeeded: 0 };

  const typeThreshold = TYPE_UNLOCK_THRESHOLDS[style.graffitiType] || 0;
  const typeUnlocked = unlockedTypes.includes(style.graffitiType) || userRep >= typeThreshold;
  
  if (!typeUnlocked) {
    return { 
      isUnlocked: false, 
      progress: 0, 
      repNeeded: typeThreshold - userRep 
    };
  }

  const variantThreshold = VARIANT_UNLOCK_THRESHOLDS[style.variant - 1] || 0;
  const repAfterTypeUnlock = userRep - typeThreshold;
  const progress = Math.min((repAfterTypeUnlock / variantThreshold) * 100, 100);
  const repNeeded = Math.max(variantThreshold - repAfterTypeUnlock, 0);
  
  return { 
    isUnlocked: repAfterTypeUnlock >= variantThreshold, 
    progress, 
    repNeeded 
  };
}

// Get all available styles for a user
export function getAvailableStyles(
  crewId: CrewId | null,
  userRep: number,
  unlockedTypes: string[],
  unlockedVariants: string[]
): CrewGraffitiStyle[] {
  if (!crewId) return [];
  
  return getStylesByCrew(crewId).filter(style => 
    isStyleVariantUnlocked(style.id, userRep, unlockedTypes, unlockedVariants)
  );
}

// Default style for new users
export const DEFAULT_STYLE_ID = 'bqc-tag-1';

// Get default style for a crew
export function getDefaultStyleForCrew(crewId: CrewId): string {
  return `${crewId}-tag-1`;
}