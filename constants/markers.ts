export type MarkerName = 'Pole' | 'Sign' | 'E.Box' | 'Fence' | 'Wall' | 'Shutter' | 'Sewer' | 'Rooftop' | 'Ground' | 'Train' | 'Bridge' | 'Traffic Light' | 'Truck' | 'Van' | 'Post Box' | 'Speed Camera' | 'ATM Machine' | 'Bus Stop';
export type MarkerDescription = 'Sticker/Slap' | 'Stencil/Brand/Stamp' | 'Tag/Signature' | 'Etch/Scribe/Scratch' | 'Throw-Up' | 'Paste-Up/Poster' | 'Piece/Bombing' | 'Burner/Heater' | 'Roller/Blockbuster' | 'Extinguisher' | 'Mural';
export type CrewId = 'bqc' | 'sps' | 'lzt' | 'dgc' | null;
export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

export const MARKER_NAMES: MarkerName[] = ['Pole', 'Sign', 'E.Box', 'Fence', 'Wall', 'Shutter', 'Sewer', 'Rooftop', 'Ground', 'Train', 'Bridge', 'Traffic Light', 'Truck', 'Van', 'Post Box', 'Speed Camera', 'ATM Machine', 'Bus Stop'];

export const MARKER_DESCRIPTIONS: MarkerDescription[] = ['Sticker/Slap', 'Stencil/Brand/Stamp', 'Tag/Signature', 'Etch/Scribe/Scratch', 'Throw-Up', 'Paste-Up/Poster', 'Piece/Bombing', 'Burner/Heater', 'Roller/Blockbuster', 'Extinguisher', 'Mural'];

export const MARKER_COLORS = [
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#4dabf7' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Gray', value: '#6b7280' }
] as const;