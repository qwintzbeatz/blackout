// lib/services/soundcloud.ts

export const extractSoundCloudTrackId = (url: string): string | null => {
  try {
    // Multiple URL patterns to extract track ID
    const patterns = [
      /tracks\/(\d+)/,
      /soundcloud\.com\/[^\/]+\/[^\/]+\/(\d+)/,
      /%2Ftracks%2F(\d+)/,
      /soundcloud\.com\/[^\/]+\/([^\/\?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch {
    return null;
  }
};

export const getSoundCloudArtwork = (trackUrl: string): string => {
  const trackId = extractSoundCloudTrackId(trackUrl);
  if (trackId) {
    // Try different artwork sizes (500x500 is usually available)
    return `https://i1.sndcdn.com/artworks-${trackId}-t500x500.jpg`;
  }
  return ''; // Empty string = use fallback in component
};

export const getSoundCloudEmbedUrl = (trackUrl: string): string => {
  const params = new URLSearchParams({
    url: trackUrl,
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'true',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
    buying: 'false',
    sharing: 'false',
    download: 'false',
    show_playcount: 'false',
    color: 'ff5500'
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
};

// Get track metadata using oEmbed (no authentication required)
export const getTrackMetadata = async (trackUrl: string): Promise<{ title: string; artwork?: string } | null> => {
  try {
    const oEmbedUrl = `https://soundcloud.com/oembed.json?url=${encodeURIComponent(trackUrl)}&format=json`;
    const response = await fetch(oEmbedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      title: data.title || 'Unknown Track',
      artwork: data.thumbnail_url
    };
  } catch (error) {
    console.error('Error fetching track metadata:', error);
    return null;
  }
};

// Helper for fallback gradient colors
export const getColorFromTrack = (trackUrl: string): string => {
  let hash = 0;
  for (let i = 0; i < trackUrl.length; i++) {
    hash = trackUrl.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
    '#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E'
  ];
  return colors[Math.abs(hash) % colors.length];
};

export const getTrackInitial = (trackName: string): string => {
  return trackName.charAt(0).toUpperCase() || '♫';
};