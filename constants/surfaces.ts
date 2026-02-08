// Surface Types Configuration for Blackout NZ
// These define where markers can be placed

export interface SurfaceConfig {
  id: string;
  label: string;
  icon: string;
  baseRep: number;
  risk: 'low' | 'medium' | 'high' | 'very-high';
  category: 'vertical' | 'horizontal' | 'moving' | 'structure' | 'vehicle';
}

export const SURFACES: Record<string, SurfaceConfig> = {
  pole: {
    id: 'pole',
    label: 'Pole',
    icon: '🪜',
    baseRep: 5,
    risk: 'low',
    category: 'vertical'
  },
  sign: {
    id: 'sign',
    label: 'Sign',
    icon: '🚏',
    baseRep: 5,
    risk: 'low',
    category: 'vertical'
  },
  ebox: {
    id: 'ebox',
    label: 'E.Box',
    icon: '📦',
    baseRep: 6,
    risk: 'medium',
    category: 'vertical'
  },
  fence: {
    id: 'fence',
    label: 'Fence',
    icon: '🚧',
    baseRep: 6,
    risk: 'low',
    category: 'vertical'
  },
  wall: {
    id: 'wall',
    label: 'Wall',
    icon: '🧱',
    baseRep: 8,
    risk: 'medium',
    category: 'structure'
  },
  shutter: {
    id: 'shutter',
    label: 'Shutter',
    icon: '🔒',
    baseRep: 6,
    risk: 'medium',
    category: 'vertical'
  },
  sewer: {
    id: 'sewer',
    label: 'Sewer',
    icon: '⬇️',
    baseRep: 10,
    risk: 'high',
    category: 'horizontal'
  },
  rooftop: {
    id: 'rooftop',
    label: 'Rooftop',
    icon: '🏠',
    baseRep: 15,
    risk: 'high',
    category: 'structure'
  },
  ground: {
    id: 'ground',
    label: 'Ground',
    icon: '⬜',
    baseRep: 4,
    risk: 'low',
    category: 'horizontal'
  },
  train: {
    id: 'train',
    label: 'Train',
    icon: '🚇',
    baseRep: 20,
    risk: 'high',
    category: 'moving'
  },
  bridge: {
    id: 'bridge',
    label: 'Bridge',
    icon: '🌉',
    baseRep: 12,
    risk: 'high',
    category: 'structure'
  },
  traffic_light: {
    id: 'traffic_light',
    label: 'Traffic Light',
    icon: '🚦',
    baseRep: 8,
    risk: 'high',
    category: 'vertical'
  },
  truck: {
    id: 'truck',
    label: 'Truck',
    icon: '🚚',
    baseRep: 15,
    risk: 'medium',
    category: 'vehicle'
  },
  van: {
    id: 'van',
    label: 'Van',
    icon: '🚐',
    baseRep: 12,
    risk: 'medium',
    category: 'vehicle'
  },
  postbox: {
    id: 'postbox',
    label: 'Post Box',
    icon: '📮',
    baseRep: 7,
    risk: 'low',
    category: 'vertical'
  },
  speed_camera: {
    id: 'speed_camera',
    label: 'Speed Camera',
    icon: '📸',
    baseRep: 25,
    risk: 'very-high',
    category: 'vertical'
  },
  bus_stop: {
    id: 'bus_stop',
    label: 'Bus Stop',
    icon: '🚌',
    baseRep: 6,
    risk: 'low',
    category: 'structure'
  }
};

// Type for surface keys
export type SurfaceType = keyof typeof SURFACES;

// Array of all surface types for iteration
export const SURFACE_LIST = Object.keys(SURFACES) as SurfaceType[];

// Get surface config
export function getSurfaceConfig(surface: SurfaceType): SurfaceConfig {
  return SURFACES[surface] || SURFACES.wall;
}

// Get default surface
export const DEFAULT_SURFACE: SurfaceType = 'wall';

// REP multipliers for different categories
export const SURFACE_MULTIPLIERS = {
  heaven: 1.5,      // Rooftop, Bridge
  moving: 2.0,      // Train, Truck, Van
  highRisk: 1.5,    // Speed Camera, Traffic Light
  underground: 1.5, // Sewer
  normal: 1.0
};

// Get REP multiplier for a surface
export function getSurfaceMultiplier(surface: SurfaceType): number {
  const config = getSurfaceConfig(surface);
  
  if (['rooftop', 'bridge'].includes(surface)) {
    return SURFACE_MULTIPLIERS.heaven;
  }
  if (['train', 'truck', 'van'].includes(surface)) {
    return SURFACE_MULTIPLIERS.moving;
  }
  if (['speed_camera', 'traffic_light'].includes(surface)) {
    return SURFACE_MULTIPLIERS.highRisk;
  }
  if (['sewer'].includes(surface)) {
    return SURFACE_MULTIPLIERS.underground;
  }
  
  return SURFACE_MULTIPLIERS.normal;
}
