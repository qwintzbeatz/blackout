export interface LocationInfo {
  coords: [number, number];
  description: string;
}

export const NEW_ZEALAND_LOCATIONS: Record<string, LocationInfo> = {
  'Auckland': {
    coords: [-36.8485, 174.7633],
    description: 'City of Sails'
  },
  'Wellington': {
    coords: [-41.2865, 174.7762],
    description: 'Windy City'
  },
  'Christchurch': {
    coords: [-43.5320, 172.6306],
    description: 'Garden City'
  },
  'Queenstown': {
    coords: [-45.0312, 168.6626],
    description: 'Adventure Capital'
  },
  'Dunedin': {
    coords: [-45.8788, 170.5028],
    description: 'Edinburgh of the South'
  }
};

export const NZ_BOUNDS: [[number, number], [number, number]] = [
  [-47.5, 165.0],
  [-34.0, 179.0]
];

export const NZ_CENTER: [number, number] = [-40.9006, 174.8860];
export const NZ_DEFAULT_ZOOM = 5;
export const GPS_DEFAULT_ZOOM = 18;