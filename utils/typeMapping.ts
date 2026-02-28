// Type Mapping Utilities for Blackout NZ
// Bridges old MarkerName/MarkerDescription with new SurfaceType/GraffitiType

import { MarkerName, MarkerDescription } from '@/constants/markers';
import { SurfaceType, SURFACES } from '@/constants/surfaces';
import { GraffitiType, GRAFFITI_TYPES } from '@/constants/graffitiTypes';

// Mapping from old MarkerName to new SurfaceType
export const MARKER_NAME_TO_SURFACE: Record<MarkerName, SurfaceType> = {
  'Pole': 'pole',
  'Sign': 'sign', 
  'E.Box': 'ebox',
  'Fence': 'fence',
  'Wall': 'wall',
  'Shutter': 'shutter',
  'Sewer': 'sewer',
  'Rooftop': 'rooftop',
  'Ground': 'ground',
  'Train': 'train',
  'Bridge': 'bridge',
  'Traffic Light': 'traffic_light',
  'Truck': 'truck',
  'Van': 'van',
  'Post Box': 'postbox',
  'Speed Camera': 'speed_camera',
  'ATM Machine': 'ebox', // Map to ebox as closest equivalent
  'Bus Stop': 'bus_stop'
};

// Mapping from old MarkerDescription to new GraffitiType
export const MARKER_DESCRIPTION_TO_GRAFFITI: Record<MarkerDescription, GraffitiType> = {
  'Sticker/Slap': 'sticker',
  'Stencil/Brand/Stamp': 'stencil',
  'Tag/Signature': 'tag',
  'Etch/Scribe/Scratch': 'etch',
  'Throw-Up': 'throwup',
  'Paste-Up/Poster': 'pasteup',
  'Piece/Bombing': 'piece',
  'Burner/Heater': 'burner',
  'Roller/Blockbuster': 'roller',
  'Extinguisher': 'extinguisher',
  'Mural': 'mural'
};

// Reverse mapping for UI display
export const SURFACE_TO_MARKER_NAME: Record<SurfaceType, MarkerName> = {
  'pole': 'Pole',
  'sign': 'Sign',
  'ebox': 'E.Box',
  'fence': 'Fence',
  'wall': 'Wall',
  'shutter': 'Shutter',
  'sewer': 'Sewer',
  'rooftop': 'Rooftop',
  'ground': 'Ground',
  'train': 'Train',
  'bridge': 'Bridge',
  'traffic_light': 'Traffic Light',
  'truck': 'Truck',
  'van': 'Van',
  'postbox': 'Post Box',
  'speed_camera': 'Speed Camera',
  'bus_stop': 'Bus Stop'
};

export const GRAFFITI_TO_MARKER_DESCRIPTION: Record<GraffitiType, MarkerDescription> = {
  'sticker': 'Sticker/Slap',
  'stencil': 'Stencil/Brand/Stamp',
  'tag': 'Tag/Signature',
  'etch': 'Etch/Scribe/Scratch',
  'throwup': 'Throw-Up',
  'pasteup': 'Paste-Up/Poster',
  'piece': 'Piece/Bombing',
  'burner': 'Burner/Heater',
  'roller': 'Roller/Blockbuster',
  'extinguisher': 'Extinguisher',
  'mural': 'Mural',
  'rapel': 'Piece/Bombing', // Rapel is a heaven spot piece
  'mops': 'Tag/Signature' // Mops are a type of tag
};

// Migration utilities
export function migrateMarkerNameToSurface(markerName: MarkerName): SurfaceType {
  return MARKER_NAME_TO_SURFACE[markerName] || 'wall'; // Default to wall
}

export function migrateMarkerDescriptionToGraffiti(markerDescription: MarkerDescription): GraffitiType {
  return MARKER_DESCRIPTION_TO_GRAFFITI[markerDescription] || 'tag'; // Default to tag
}

// Validation utilities
export function isValidSurfaceForMarkerName(markerName: MarkerName, surface: SurfaceType): boolean {
  const expectedSurface = migrateMarkerNameToSurface(markerName);
  return surface === expectedSurface;
}

export function isValidGraffitiForMarkerDescription(markerDescription: MarkerDescription, graffitiType: GraffitiType): boolean {
  const expectedGraffiti = migrateMarkerDescriptionToGraffiti(markerDescription);
  return graffitiType === expectedGraffiti;
}

// Get display name for surface
export function getSurfaceDisplayName(surface: SurfaceType): string {
  return SURFACE_TO_MARKER_NAME[surface] || surface.charAt(0).toUpperCase() + surface.slice(1);
}

// Get display name for graffiti type
export function getGraffitiDisplayName(graffitiType: GraffitiType): string {
  return GRAFFITI_TO_MARKER_DESCRIPTION[graffitiType] || graffitiType.charAt(0).toUpperCase() + graffitiType.slice(1);
}

// Utility to get all surface options for dropdown
export function getSurfaceOptions(): Array<{ value: SurfaceType; label: string; icon: string; baseRep: number }> {
  return Object.entries(SURFACES).map(([key, config]) => ({
    value: key as SurfaceType,
    label: config.label,
    icon: config.icon,
    baseRep: config.baseRep
  })).sort((a, b) => b.baseRep - a.baseRep); // Sort by highest REP first
}

// Utility to get all graffiti type options for dropdown
export function getGraffitiTypeOptions(): Array<{ value: GraffitiType; label: string; icon: string; baseRep: number }> {
  return Object.entries(GRAFFITI_TYPES).map(([key, config]) => ({
    value: key as GraffitiType,
    label: config.label,
    icon: config.icon,
    baseRep: config.baseRep
  })).sort((a, b) => b.baseRep - a.baseRep); // Sort by highest REP first
}

// Quick lookup for REP preview
export function getQuickRepPreview(surface: SurfaceType, graffitiType: GraffitiType): number {
  const surfaceConfig = SURFACES[surface];
  const graffitiConfig = GRAFFITI_TYPES[graffitiType];
  return surfaceConfig.baseRep + graffitiConfig.baseRep;
}