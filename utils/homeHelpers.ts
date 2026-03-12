/**
 * homeHelpers.ts
 * Pure helper / utility functions extracted from page.tsx
 */

import { calculateRep, RepResult, calculateEnhancedRank } from '@/utils/repCalculator';
import { MarkerName, MarkerDescription } from '@/constants/markers';
import { SurfaceType, GraffitiType } from '@/types';
import { Gender } from '@/constants/markers';

// ─── REP ────────────────────────────────────────────────────────────────────

export const calculateRepForMarker = (
  markerName: MarkerName,
  markerDescription: MarkerDescription,
  distanceFromCenter: number | null,
  surface?: SurfaceType,
  graffitiType?: GraffitiType
): { rep: number; breakdown?: RepResult['breakdown'] } => {
  if (surface && graffitiType) {
    const options = {
      isHeaven: ['rooftop', 'bridge'].includes(surface),
      isMovingTarget: ['train', 'truck', 'van'].includes(surface),
      isHighRisk: ['speed_camera', 'traffic_light'].includes(surface),
      hasStreakBonus: distanceFromCenter !== null && distanceFromCenter <= 50,
    };
    const result = calculateRep(surface, graffitiType, options);
    return { rep: result.rep, breakdown: result.breakdown };
  }

  // Legacy fallback
  let rep = 10;
  if (distanceFromCenter && distanceFromCenter <= 50) rep += 5;

  switch (markerDescription) {
    case 'Piece/Bombing':
    case 'Burner/Heater':
      rep += 15;
      break;
    case 'Throw-Up':
    case 'Roller/Blockbuster':
      rep += 10;
      break;
    case 'Stencil/Brand/Stamp':
    case 'Paste-Up/Poster':
      rep += 8;
      break;
    case 'Tag/Signature':
      rep += 5;
      break;
    default:
      rep += 3;
  }

  return { rep };
};

export const calculateRank = (rep: number): string => calculateEnhancedRank(rep);

export const calculateLevel = (rep: number): number => Math.floor(rep / 100) + 1;

// ─── BOUNDS ─────────────────────────────────────────────────────────────────

import { UserMarker } from '@/lib/types/blackout';

export const calculateBoundsFromMarkers = (
  markers: UserMarker[]
): [[number, number], [number, number]] | null => {
  if (markers.length === 0) return null;

  const lats = markers.map((m) => m.position[0]);
  const lngs = markers.map((m) => m.position[1]);

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
};

// ─── SOUNDCLOUD ──────────────────────────────────────────────────────────────

export const createSoundCloudIframeUrl = (trackUrl: string): string => {
  const params = new URLSearchParams({
    url: trackUrl,
    color: 'ff5500',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'false',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
    sharing: 'false',
    buying: 'false',
    download: 'false',
    show_playcount: 'false',
    show_artwork: 'false',
    show_playlist: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
};

// ─── AVATAR ──────────────────────────────────────────────────────────────────

export const generateAvatarUrl = (
  userId: string,
  username: string,
  gender?: Gender
): string => {
  const seed = username || userId;

  const colorPalette = [
    '4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316',
    '3b82f6', '06b6d4', '8b5cf6', 'ef4444', '84cc16', '14b8a6',
  ];
  const selectedColor =
    colorPalette[Math.floor(Math.random() * colorPalette.length)];

  let avatarStyle: string;
  switch (gender) {
    case 'male':
      avatarStyle = 'adventurer';
      break;
    case 'female':
      avatarStyle = 'avataaars';
      break;
    case 'other':
      avatarStyle = 'bottts';
      break;
    case 'prefer-not-to-say':
      avatarStyle = 'identicon';
      break;
    default:
      avatarStyle = 'open-peeps';
  }

  // All non-default styles currently resolve to the same DiceBear endpoint
  if (avatarStyle !== 'open-peeps') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  }
  return `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}&backgroundColor=${selectedColor}`;
};
