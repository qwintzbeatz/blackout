import { SPOTIFY_TRACKS } from '@/constants/all_tracks';
import { HIPHOP_TRACKS } from '@/constants/tracks';
import { getTrackName } from '@/constants/all_tracks';

export type UnlockedTrackInfo = {
  url: string;
  name: string;
  source: 'Spotify' | 'SoundCloud';
} | null;

export type UnlockResult = {
  newTracks: string[];
  newlyUnlocked: UnlockedTrackInfo;
};

const getTrackNameFromUrl = (url: string | undefined | null): string => {
  if (!url) return 'Unknown Track';
  if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
  if (url.includes('open.spotify.com/')) {
    return getTrackName(url);
  }
  if (url.includes('soundcloud.com')) {
    const segments = url.split('/');
    const trackSegment = segments[segments.length - 1];
    return trackSegment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return 'Unknown Track';
};

export const unlockRandomSpotifyTrack = (currentUnlocked: string[]): UnlockResult => {
  const availableTracks = SPOTIFY_TRACKS.filter(
    (track) => !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) {
    return { newTracks: currentUnlocked, newlyUnlocked: null };
  }

  const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];

  return {
    newTracks: [...currentUnlocked, randomTrack],
    newlyUnlocked: {
      url: randomTrack,
      name: getTrackNameFromUrl(randomTrack),
      source: 'Spotify'
    }
  };
};

export const unlockRandomSoundCloudTrack = (currentUnlocked: string[]): UnlockResult => {
  const availableTracks = HIPHOP_TRACKS.filter(
    (track) => !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) {
    return { newTracks: currentUnlocked, newlyUnlocked: null };
  }

  const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];

  return {
    newTracks: [...currentUnlocked, randomTrack],
    newlyUnlocked: {
      url: randomTrack,
      name: getTrackNameFromUrl(randomTrack),
      source: 'SoundCloud'
    }
  };
};

export const unlockRandomTrack = (currentUnlocked: string[]): UnlockResult => {
  const ALL_TRACKS = [...SPOTIFY_TRACKS, ...HIPHOP_TRACKS];

  const availableTracks = ALL_TRACKS.filter(
    (track) => !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) {
    return { newTracks: currentUnlocked, newlyUnlocked: null };
  }

  const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
  const isSpotify = randomTrack.includes('open.spotify.com');

  return {
    newTracks: [...currentUnlocked, randomTrack],
    newlyUnlocked: {
      url: randomTrack,
      name: getTrackNameFromUrl(randomTrack),
      source: isSpotify ? 'Spotify' : 'SoundCloud'
    }
  };
};

