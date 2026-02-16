// REP Calculator Utility for Blackout NZ
// Calculates REP based on surface and graffiti type

import { 
  SurfaceType, 
  SURFACES, 
  getSurfaceConfig,
  getSurfaceMultiplier,
  SURFACE_MULTIPLIERS
} from '@/constants/surfaces';

import { 
  GraffitiType, 
  GRAFFITI_TYPES, 
  getGraffitiTypeConfig,
  getDifficultyMultiplier,
  DIFFICULTY_MULTIPLIERS
} from '@/constants/graffitiTypes';

export interface RepBreakdown {
  surfaceBase: number;
  graffitiBase: number;
  surfaceMultiplier: number;
  difficultyMultiplier: number;
  totalMultiplier: number;
  totalRep: number;
  breakdown: {
    surface: string;
    graffiti: string;
    bonuses: string[];
  };
}

export interface RepResult {
  rep: number;
  breakdown: RepBreakdown;
  tips: string[];
}

/**
 * Calculate REP for a marker placement
 */
export function calculateRep(
  surface: SurfaceType, 
  graffitiType: GraffitiType,
  options: {
    isHeaven?: boolean;
    isMovingTarget?: boolean;
    isHighRisk?: boolean;
    hasStreakBonus?: boolean;
    isCollaboration?: boolean;
  } = {}
): RepResult {
  // Get base values
  const surfaceConfig = getSurfaceConfig(surface);
  const graffitiConfig = getGraffitiTypeConfig(graffitiType);
  
  const surfaceBase = surfaceConfig.baseRep;
  const graffitiBase = graffitiConfig.baseRep;
  
  // Calculate multipliers
  const surfaceMultiplier = getSurfaceMultiplier(surface);
  const difficultyMultiplier = getDifficultyMultiplier(graffitiType);
  
  // Apply options
  let customMultipliers: number[] = [];
  
  if (options.isHeaven) {
    customMultipliers.push(1.5);
  }
  if (options.isMovingTarget) {
    customMultipliers.push(1.25);
  }
  if (options.isHighRisk) {
    customMultipliers.push(1.5);
  }
  if (options.isCollaboration) {
    customMultipliers.push(1.25);
  }
  if (options.hasStreakBonus) {
    customMultipliers.push(1.25);
  }
  
  // Calculate total multiplier
  const baseMultiplier = surfaceMultiplier * difficultyMultiplier;
  const customMultiplier = customMultipliers.reduce((a, b) => a * b, 1);
  const totalMultiplier = baseMultiplier * customMultiplier;
  
  // Calculate total REP
  const baseRep = surfaceBase + graffitiBase;
  const totalRep = Math.round(baseRep * totalMultiplier);
  
  // Generate breakdown
  const breakdown: RepBreakdown = {
    surfaceBase,
    graffitiBase,
    surfaceMultiplier,
    difficultyMultiplier,
    totalMultiplier,
    totalRep,
    breakdown: {
      surface: `${surfaceConfig.icon} ${surfaceConfig.label}`,
      graffiti: `${graffitiConfig.icon} ${graffitiConfig.label}`,
      bonuses: [
        surfaceMultiplier > 1 ? `${surfaceConfig.category} bonus: x${surfaceMultiplier}` : null,
        difficultyMultiplier > 1 ? `${graffitiConfig.difficulty} difficulty: x${difficultyMultiplier}` : null,
        options.isHeaven ? 'Heaven spot: x1.5' : null,
        options.isMovingTarget ? 'Moving target: x1.25' : null,
        options.isHighRisk ? 'High risk: x1.5' : null,
        options.isCollaboration ? 'Collaboration: x1.25' : null,
        options.hasStreakBonus ? 'Streak bonus: x1.25' : null,
      ].filter(Boolean) as string[]
    }
  };
  
  // Generate tips
  const tips: string[] = [];
  
  if (surface === 'train' || surface === 'truck' || surface === 'van') {
    tips.push('🎯 Moving targets are worth 2x base REP!');
  }
  if (surface === 'rooftop' || surface === 'bridge') {
    tips.push('☁️ Heaven spots are worth 1.5x!');
  }
  if (surface === 'speed_camera') {
    tips.push('⚠️ Speed cameras are high risk but high reward!');
  }
  if (graffitiConfig.difficulty === 'expert') {
    tips.push('🔥 Expert level graffiti! Keep practicing!');
  }
  if (options.hasStreakBonus) {
    tips.push('🔥 Streak bonus applied!');
  }
  
  return { rep: totalRep, breakdown, tips };
}

/**
 * Recalculate REP when marker is edited
 */
export function recalculateRep(
  oldSurface: SurfaceType,
  oldGraffitiType: GraffitiType,
  newSurface: SurfaceType,
  newGraffitiType: GraffitiType,
  originalRep: number
): {
  newRep: number;
  repDiff: number;
  message: string;
} {
  const oldResult = calculateRep(oldSurface, oldGraffitiType);
  const newResult = calculateRep(newSurface, newGraffitiType);
  
  const newRep = newResult.breakdown.totalRep;
  const repDiff = newRep - originalRep;
  
  let message = '';
  if (repDiff > 0) {
    message = `REP increased by +${repDiff}`;
  } else if (repDiff < 0) {
    message = `REP decreased by ${repDiff}`;
  } else {
    message = 'REP unchanged';
  }
  
  return { newRep, repDiff, message };
}

/**
 * Get maximum possible REP for a surface
 */
export function getMaxRepForSurface(surface: SurfaceType): number {
  const result = calculateRep(surface, 'mural');
  return result.rep;
}

/**
 * Get minimum possible REP for a surface
 */
export function getMinRepForSurface(surface: SurfaceType): number {
  const result = calculateRep(surface, 'sticker');
  return result.rep;
}

/**
 * Get REP range for a graffiti type
 */
export function getRepRangeForGraffitiType(type: GraffitiType): { min: number; max: number } {
  const typeResult = calculateRep('wall', type);
  return {
    min: typeResult.rep,
    max: typeResult.rep
  };
}

/**
 * Format REP for display
 */
export function formatRep(rep: number): string {
  if (rep >= 100) {
    return `${rep}`;
  } else if (rep >= 10) {
    return ` ${rep}`;
  } else {
    return `  ${rep}`;
  }
}

/**
 * Get REP color based on amount
 */
export function getRepColor(rep: number): string {
  if (rep >= 50) return '#fbbf24'; // Gold
  if (rep >= 25) return '#10b981'; // Green
  if (rep >= 15) return '#4dabf7'; // Blue
  if (rep >= 10) return '#8b5cf6'; // Purple
  return '#6b7280'; // Gray
}

/**
 * Calculate all REP values for a surface (all graffiti types)
 */
export function calculateAllRepForSurface(surface: SurfaceType): Record<GraffitiType, number> {
  const results: Record<string, number> = {};
  
  for (const type of Object.keys(GRAFFITI_TYPES)) {
    const result = calculateRep(surface, type as GraffitiType);
    results[type] = result.rep;
  }
  
  return results as Record<GraffitiType, number>;
}

/**
 * Get REP ranking for a surface
 */
export function getSurfaceRepRanking(surface: SurfaceType): Array<{
  type: GraffitiType;
  rep: number;
  icon: string;
  label: string;
}> {
  const allRep = calculateAllRepForSurface(surface);
  
  return Object.entries(allRep)
    .map(([type, rep]) => ({
      type: type as GraffitiType,
      rep,
      icon: GRAFFITI_TYPES[type].icon,
      label: GRAFFITI_TYPES[type].label
    }))
    .sort((a, b) => b.rep - a.rep);
}

/**
 * Quick REP lookup for dropdown previews
 */
export function getQuickRep(surface: SurfaceType, graffitiType: GraffitiType): number {
  return calculateRep(surface, graffitiType).rep;
}

/**
 * Enhanced Rank Calculation based on total REP
 * More granular ranking system with additional criteria
 */
export function calculateEnhancedRank(rep: number): string {
  // Master ranks (very rare)
  if (rep >= 1000) return 'LEGEND';
  if (rep >= 750) return 'MASTER';
  if (rep >= 500) return 'PRO';
  
  // Standard ranks
  if (rep >= 300) return 'WRITER';
  if (rep >= 200) return 'VANDAL';
  if (rep >= 100) return 'TAGGER';
  if (rep >= 50) return 'TOY';
  
  // Beginner ranks
  if (rep >= 25) return 'ROOKIE';
  return 'NEWBIE';
}

/**
 * Get rank color for display
 */
export function getRankColor(rank: string): string {
  switch (rank) {
    case 'LEGEND': return '#ffd700'; // Gold
    case 'MASTER': return '#c0c0c0'; // Silver
    case 'PRO': return '#cd7f32'; // Bronze
    case 'WRITER': return '#ff6b6b'; // Red
    case 'VANDAL': return '#feca57'; // Yellow
    case 'TAGGER': return '#4dabf7'; // Blue
    case 'TOY': return '#10b981'; // Green
    case 'ROOKIE': return '#8b5cf6'; // Purple
    case 'NEWBIE': return '#6b7280'; // Gray
    default: return '#6b7280';
  }
}

/**
 * Get rank progress to next level
 */
export function getRankProgress(rep: number): {
  currentRank: string;
  nextRank: string | null;
  progress: number;
  repToNextLevel: number;
} {
  const ranks = [
    { name: 'NEWBIE', min: 0 },
    { name: 'ROOKIE', min: 50 },
    { name: 'TOY', min: 100 },
    { name: 'TAGGER', min: 200 },
    { name: 'VANDAL', min: 300 },
    { name: 'WRITER', min: 500 },
    { name: 'PRO', min: 750 },
    { name: 'MASTER', min: 1000 },
    { name: 'LEGEND', min: 1500 }
  ];
  
  let currentRank = ranks[0];
  let nextRank: typeof ranks[0] | null = null;
  
  for (let i = 0; i < ranks.length; i++) {
    if (rep >= ranks[i].min) {
      currentRank = ranks[i];
      nextRank = ranks[i + 1] || null;
    }
  }
  
  let progress = 0;
  let repToNextLevel = 0;
  
  if (nextRank) {
    const rankRange = nextRank.min - currentRank.min;
    const repInRank = rep - currentRank.min;
    progress = Math.min(100, Math.round((repInRank / rankRange) * 100));
    repToNextLevel = nextRank.min - rep;
  }
  
  return {
    currentRank: currentRank.name,
    nextRank: nextRank?.name || null,
    progress,
    repToNextLevel
  };
}
