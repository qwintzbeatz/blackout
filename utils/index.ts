export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculateRepForMarker = (distanceFromCenter: number | null, markerDescription: string): number => {
  let rep = 10; // Base REP for placing any marker
  
  if (distanceFromCenter && distanceFromCenter <= 50) {
    rep += 5;
  }
  
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
  
  return rep;
};

export const calculateRank = (rep: number): string => {
  if (rep >= 300) return 'WRITER';
  if (rep >= 100) return 'VANDAL';
  return 'TOY';
};

export const calculateLevel = (rep: number): number => {
  return Math.floor(rep / 100) + 1;
};

export const getTrackNameFromUrl = (url: string): string => {
  if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
  if (url.includes('soundcloud.com')) {
    // Extract track name from SoundCloud URL
    const segments = url.split('/');
    const trackSegment = segments[segments.length - 1];
    return trackSegment.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  return 'Unknown Track';
};

export const calculateBoundsFromMarkers = (markers: { position: [number, number] }[]): [[number, number], [number, number]] | null => {
  if (markers.length === 0) return null;
  
  const lats = markers.map(m => m.position[0]);
  const lngs = markers.map(m => m.position[1]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  return [[minLat, minLng], [maxLat, maxLng]];
};

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
    show_playlist: 'false'
  });
  
  return `https://w.soundcloud.com/player/?${params.toString()}`;
};

export const generateAvatarUrl = (userId: string, username: string, gender?: string): string => {
  const seed = username || userId;
  
  // Define avatar styles based on gender
  let avatarStyle = 'open-peeps'; // default style
  
  if (gender === 'male') {
    avatarStyle = 'adventurer'; // boyish/ masculine style
  } else if (gender === 'female') {
    avatarStyle = 'avataaars'; // girlish/ feminine style
  } else if (gender === 'other') {
    avatarStyle = 'bottts'; // alien/robot style for 'other'
  } else if (gender === 'prefer-not-to-say') {
    avatarStyle = 'identicon'; // android/geometric style
  }
  
  // Color palette for avatars
  const colors = [
    '4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316',
    '3b82f6', '06b6d4', '8b5cf6', 'ef4444', '84cc16', '14b8a6'
  ];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Construct URL based on style
  let url = '';
  
  switch (avatarStyle) {
    case 'adventurer': // Male (boyish)
      url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'avataaars': // Female (girlish)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'bottts': // Other (alien/robot)
      url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'identicon': // Prefer not to say (android/geometric)
      url = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    default: // open-peeps as fallback
      url = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  }
  
  return url;
};

export const unlockRandomTrack = (currentUnlocked: string[]): string[] => {
  // Import tracks dynamically to avoid circular dependency
  const HIPHOP_TRACKS = [
    "https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1",
    // ... (add a few sample tracks here, full list should be imported from constants)
  ];
  
  // Get tracks that haven't been unlocked yet
  const availableTracks = HIPHOP_TRACKS.filter(track =>
    !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) return currentUnlocked;

  // Pick random track
  const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];

  return [...currentUnlocked, randomTrack];
};

export const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#e0e0e0',
  padding: '16px',
  borderRadius: '12px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  width: 'min(110vw, 400px)',
  maxHeight: '75vh',
  overflowY: 'auto' as const,
  border: '1px solid rgba(255,255,255,0.15)',
  backdropFilter: 'blur(8px)',
  zIndex: 1200,
  position: 'relative'
};

export const detectDevicePerformance = (): 'low' | 'medium' | 'high' => {
  if (typeof window === 'undefined') return 'medium';
  
  // Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory) {
    if (deviceMemory <= 2) return 'low';
    if (deviceMemory <= 4) return 'medium';
    return 'high';
  }
  
  // Check screen size as fallback
  const screenSize = window.screen.width * window.screen.height;
  if (screenSize <= 768 * 1024) return 'low'; // Small screens
  if (screenSize <= 1920 * 1080) return 'medium'; // Medium screens
  return 'high'; // Large screens
};