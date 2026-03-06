import { FACEBOOK_VIDEOS } from '@/constants/videos';

/**
 * Helper function to get video name from URL
 */
export function getVideoName(videoUrl: string): string {
  // Extract video ID from Facebook URL
  const match = videoUrl.match(/videos\/(\d+)/);
  if (match && match[1]) {
    return `Facebook Video ${match[1].slice(0, 8)}...`;
  }
  return 'Facebook Video';
}

/**
 * Helper function to unlock a random video
 */
export function unlockRandomVideo(currentVideos: string[] = []): {
  newVideos: string[];
  newlyUnlocked?: { url: string; name: string };
} {
  const availableVideos = FACEBOOK_VIDEOS.filter(v => !currentVideos.includes(v));
  
  if (availableVideos.length === 0) {
    return { newVideos: currentVideos };
  }
  
  const randomVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
  const newVideos = [...currentVideos, randomVideo];
  
  return {
    newVideos,
    newlyUnlocked: {
      url: randomVideo,
      name: getVideoName(randomVideo)
    }
  };
}

/**
 * Helper function to check if all videos are unlocked
 */
export function areAllVideosUnlocked(currentVideos: string[]): boolean {
  return currentVideos.length >= FACEBOOK_VIDEOS.length;
}

/**
 * Helper function to get unlock progress
 */
export function getVideoUnlockProgress(currentVideos: string[]): {
  unlocked: number;
  total: number;
  percentage: number;
} {
  return {
    unlocked: currentVideos.length,
    total: FACEBOOK_VIDEOS.length,
    percentage: Math.round((currentVideos.length / FACEBOOK_VIDEOS.length) * 100)
  };
}