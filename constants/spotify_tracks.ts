// Spotify tracks for the music player (replaces SoundCloud due to API issues)
// These are popular NZ hip-hop and graffiti-themed tracks

export const SPOTIFY_TRACKS = [
  'https://open.spotify.com/track/5sICkBXVmaCQk5aISGR3x1', // Dr Dre - The Next Episode
  'https://open.spotify.com/track/0GjEhVFGZW8afUYGChu3Rr', // Snoop Dogg - Drop It Like It's Hot
  'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT', // Eminem - Lose Yourself
  'https://open.spotify.com/track/7l1Me2K9rTz9b8p8s4jjJ2', // 50 Cent - In Da Club
];

export const getSpotifyTrackName = (url: string): string => {
  const trackNames: Record<string, string> = {
    'https://open.spotify.com/track/5sICkBXVmaCQk5aISGR3x1': 'Dr Dre - The Next Episode',
    'https://open.spotify.com/track/0GjEhVFGZW8afUYGChu3Rr': 'Snoop Dogg - Drop It Like It\'s Hot',
    'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT': 'Eminem - Lose Yourself',
    'https://open.spotify.com/track/7l1Me2K9rTz9b8p8s4jjJ2': '50 Cent - In Da Club',
  };
  return trackNames[url] || 'Spotify Track';
};

export const isSpotifyUrl = (url: string): boolean => {
  return url.includes('open.spotify.com/track/');
};
