/**
 * Crew Theme Utility
 * Centralized crew color theming for consistent UI across all components
 */

export type CrewId = 'bqc' | 'sps' | 'lzt' | 'dgc';

export interface CrewTheme {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}

/**
 * Solo theme (default when no crew)
 */
export const SOLO_THEME: CrewTheme = {
  primary: '#f59e0b',      // Amber for solo
  secondary: '#000000',    // Black
  glow: 'rgba(245, 158, 11, 0.8)', // Amber glow
  name: 'SOLO'
};

/**
 * Crew color themes based on official crew colors
 * - BQC (Blaqwt Crew): Black
 * - SPS (Spontaneous): Green
 * - LZT (Luzunt): Blue
 * - DGC (Don't Get Capped): Orange
 */
export const CREW_THEMES: Record<CrewId, CrewTheme> = {
  bqc: {
    primary: '#000000',      // Black
    secondary: '#FFFFFF',    // White
    glow: 'rgba(128, 128, 128, 0.8)', // Gray glow for visibility
    name: 'BLAQWT CREW'
  },
  sps: {
    primary: '#10B981',      // Green
    secondary: '#000000',    // Black
    glow: 'rgba(16, 185, 129, 0.8)', // Green glow
    name: 'SPONTANEOUS'
  },
  lzt: {
    primary: '#87CEEB',      // Sky Blue
    secondary: '#1E3A8A',    // Dark Blue
    glow: 'rgba(135, 206, 235, 0.8)', // Blue glow
    name: 'LUZUNT'
  },
  dgc: {
    primary: '#FF8C00',      // Orange
    secondary: '#000000',    // Black
    glow: 'rgba(255, 140, 0, 0.8)', // Orange glow
    name: "DON'T GET CAPPED"
  }
};

/**
 * Get crew theme based on crewId
 * @param crewId - The crew identifier or null/undefined for solo
 * @returns CrewTheme object with colors and name
 */
export function getCrewTheme(crewId: CrewId | string | null | undefined): CrewTheme {
  if (!crewId || crewId === 'solo') {
    return SOLO_THEME;
  }
  return CREW_THEMES[crewId as CrewId] || SOLO_THEME;
}

/**
 * Get primary crew color
 * @param crewId - The crew identifier
 * @returns Primary color hex string
 */
export function getCrewColor(crewId: CrewId | string | null | undefined): string {
  return getCrewTheme(crewId).primary;
}

/**
 * Get crew glow color for effects
 * @param crewId - The crew identifier
 * @returns Glow color rgba string
 */
export function getCrewGlow(crewId: CrewId | string | null | undefined): string {
  return getCrewTheme(crewId).glow;
}

/**
 * Get CSS box shadow for crew glow effect
 * @param crewId - The crew identifier
 * @param intensity - Glow intensity (default: 0.8)
 * @returns CSS box-shadow string
 */
export function getCrewBoxShadow(crewId: CrewId | string | undefined, intensity: number = 0.8): string {
  const theme = getCrewTheme(crewId);
  const primaryRgb = hexToRgb(theme.primary);
  if (!primaryRgb) {
    return `0 0 20px ${theme.glow}`;
  }
  return `
    0 0 20px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${intensity}),
    0 0 40px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${intensity * 0.6}),
    0 0 60px rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, ${intensity * 0.4})
  `;
}

/**
 * Convert hex color to RGB
 * @param hex - Hex color string
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Handle special colors
  if (hex === '#000000') {
    return { r: 128, g: 128, b: 128 }; // Use gray for black glow visibility
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Get inline style object for crew border
 * @param crewId - The crew identifier
 * @returns CSS properties object
 */
export function getCrewBorderStyle(crewId: CrewId | string | undefined): React.CSSProperties {
  const theme = getCrewTheme(crewId);
  return {
    borderColor: theme.primary,
    boxShadow: getCrewBoxShadow(crewId, 0.5)
  };
}

/**
 * Get gradient background for crew
 * @param crewId - The crew identifier
 * @returns CSS gradient string
 */
export function getCrewGradient(crewId: CrewId | string | undefined): string {
  const theme = getCrewTheme(crewId);
  return `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
}