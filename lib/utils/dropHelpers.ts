/**
 * Shared utilities for drop components
 */

import { Drop } from '@/lib/types/blackout';

export { generateAvatarUrl } from '@/lib/utils/avatarGenerator';

// Time formatting
export const getTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
};

// GPS formatting
export const formatGPS = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export const getCardinalDirection = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
};

export const getMapLink = (lat: number, lng: number): string => {
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

// Track utilities - Spotify
const SPOTIFY_TRACK_NAMES: Record<string, string> = {
  '5sICkBXVmaCQk5aISGR3x1': 'Dr Dre - The Next Episode',
  '0GjEhVFGZW8afUYGChu3Rr': 'Snoop Dogg - Drop It Like It\'s Hot',
  '4cOdK2wGLETKBW3PvgPWqT': 'Eminem - Lose Yourself',
  '7l1Me2K9rTz9b8p8s4jjJ2': '50 Cent - In Da Club',
};

export const getTrackNameFromUrl = (url: string): string => {
  if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
  if (url.includes('soundcloud.com')) {
    const segments = url.split('/');
    const trackSegment = segments[segments.length - 1];
    return trackSegment.split('-').map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  if (url.includes('open.spotify.com/track/')) {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (match && SPOTIFY_TRACK_NAMES[match[1]]) {
      return SPOTIFY_TRACK_NAMES[match[1]];
    }
  }
  return 'Unknown Track';
};

export const getTrackPlatform = (url: string): string => {
  if (url.includes('soundcloud.com')) return 'SoundCloud';
  if (url.includes('spotify.com')) return 'Spotify';
  if (url.includes('bandcamp.com')) return 'Bandcamp';
  if (url.includes('youtube.com')) return 'YouTube';
  return 'External';
};

export const isSpotifyUrl = (url: string): boolean => {
  return url.includes('open.spotify.com/track/');
};

export const getSpotifyEmbedUrl = (url: string): string => {
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (match) {
    // Using embed/track for video preview capability
    return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
  }
  return '';
};

export const getSoundCloudEmbedUrl = (trackUrl: string): string => {
  // Enable visual=true to show the visual player with artwork/video
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
};

// Drop type detection
export type DropType = 'marker' | 'photo' | 'music' | 'generic';

export const getDropType = (drop: Drop): DropType => {
  if (drop.photoUrl) return 'photo';
  if (drop.trackUrl) return 'music';
  if (drop.color || drop.markerType) return 'marker';
  return 'generic';
};

// Get drop display title
export const getDropTitle = (drop: Drop): string => {
  const type = getDropType(drop);
  switch (type) {
    case 'photo':
      return '📸 Photo Drop';
    case 'music':
      return `🎵 ${getTrackNameFromUrl(drop.trackUrl || '')}`;
    case 'marker':
      return `📍 ${drop.markerType || 'Location Tag'}`;
    default:
      return '📍 Drop';
  }
};

// Get drop color based on type
export const getDropColor = (drop: Drop): string => {
  const type = getDropType(drop);
  switch (type) {
    case 'photo':
      return '#10b981';
    case 'music':
      return '#8a2be2';
    case 'marker':
      return drop.color || '#4dabf7';
    default:
      return '#4dabf7';
  }
};
