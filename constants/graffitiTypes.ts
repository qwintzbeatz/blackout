// Graffiti Types Configuration for Blackout NZ
// These define what type of graffiti was placed

export interface GraffitiTypeConfig {
  id: string;
  label: string;
  icon: string;
  baseRep: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  family: 'tag' | 'throw' | 'piece' | 'stencil' | 'paste' | 'roller' | 'mural';
}

export const GRAFFITI_TYPES: Record<string, GraffitiTypeConfig> = {
  sticker: {
    id: 'sticker',
    label: 'Sticker/Slap',
    icon: '🏷️',
    baseRep: 3,
    difficulty: 'easy',
    family: 'paste'
  },
  stencil: {
    id: 'stencil',
    label: 'Stencil/Brand/Stamp',
    icon: '🔳',
    baseRep: 5,
    difficulty: 'medium',
    family: 'stencil'
  },
  tag: {
    id: 'tag',
    label: 'Tag/Signature',
    icon: '✍️',
    baseRep: 5,
    difficulty: 'easy',
    family: 'tag'
  },
  etch: {
    id: 'etch',
    label: 'Etch/Scribe/Scratch',
    icon: '💎',
    baseRep: 8,
    difficulty: 'hard',
    family: 'tag'
  },
  throwup: {
    id: 'throwup',
    label: 'Throw-Up',
    icon: '2️⃣',
    baseRep: 8,
    difficulty: 'medium',
    family: 'throw'
  },
  pasteup: {
    id: 'pasteup',
    label: 'Paste-Up/Poster',
    icon: '📄',
    baseRep: 6,
    difficulty: 'easy',
    family: 'paste'
  },
  piece: {
    id: 'piece',
    label: 'Piece/Bombing',
    icon: '💥',
    baseRep: 15,
    difficulty: 'hard',
    family: 'piece'
  },
  burner: {
    id: 'burner',
    label: 'Burner/Heater',
    icon: '🔥',
    baseRep: 20,
    difficulty: 'expert',
    family: 'piece'
  },
  roller: {
    id: 'roller',
    label: 'Roller/Blockbuster',
    icon: '🖌️',
    baseRep: 10,
    difficulty: 'medium',
    family: 'roller'
  },
  extinguisher: {
    id: 'extinguisher',
    label: 'Extinguisher',
    icon: '🧯',
    baseRep: 12,
    difficulty: 'hard',
    family: 'throw'
  },
  mural: {
    id: 'mural',
    label: 'Mural',
    icon: '🎨',
    baseRep: 25,
    difficulty: 'expert',
    family: 'mural'
  },
  rapel: {
    id: 'rapel',
    label: 'Rapel/Heaven Spot',
    icon: '🧗',
    baseRep: 30,
    difficulty: 'expert',
    family: 'mural'
  },
  mops: {
    id: 'mops',
    label: 'Mop/Dirty',
    icon: '🧹',
    baseRep: 7,
    difficulty: 'easy',
    family: 'tag'
  }
};

// Type for graffiti type keys
export type GraffitiType = keyof typeof GRAFFITI_TYPES;

// Array of all graffiti types for iteration
export const GRAFFITI_LIST = Object.keys(GRAFFITI_TYPES) as GraffitiType[];

// Get graffiti type config
export function getGraffitiTypeConfig(type: GraffitiType): GraffitiTypeConfig {
  return GRAFFITI_TYPES[type] || GRAFFITI_TYPES.tag;
}

// Get default graffiti type
export const DEFAULT_GRAFFITI_TYPE: GraffitiType = 'tag';

// Difficulty REP multipliers
export const DIFFICULTY_MULTIPLIERS = {
  easy: 1.0,
  medium: 1.25,
  hard: 1.5,
  expert: 2.0
};

// Get difficulty multiplier
export function getDifficultyMultiplier(type: GraffitiType): number {
  const config = getGraffitiTypeConfig(type);
  return DIFFICULTY_MULTIPLIERS[config.difficulty] || 1.0;
}

// Graffiti families for grouping
export const GRAFFITI_FAMILIES = {
  tag: ['tag', 'etch', 'mops'],
  throw: ['throwup', 'extinguisher'],
  piece: ['piece', 'burner'],
  stencil: ['stencil'],
  paste: ['sticker', 'pasteup'],
  roller: ['roller'],
  mural: ['mural', 'rapel']
};

// Get types by family
export function getTypesByFamily(family: string): GraffitiType[] {
  const familyTypes = GRAFFITI_FAMILIES[family as keyof typeof GRAFFITI_FAMILIES] || [];
  return familyTypes as GraffitiType[];
}

// Sort types by REP (highest first)
export const GRAFFITI_BY_REP = [...GRAFFITI_LIST].sort((a, b) => {
  return GRAFFITI_TYPES[b].baseRep - GRAFFITI_TYPES[a].baseRep;
});

// Sort types by difficulty (hardest first)
export const GRAFFITI_BY_DIFFICULTY = [...GRAFFITI_LIST].sort((a, b) => {
  const difficultyOrder = { expert: 0, hard: 1, medium: 2, easy: 3 };
  return difficultyOrder[GRAFFITI_TYPES[a].difficulty] - difficultyOrder[GRAFFITI_TYPES[b].difficulty];
});
