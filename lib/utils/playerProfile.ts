import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/lib/types/blackout';
import { getCrewColor, getCrewTheme } from '@/utils/crewTheme';
import { getRankColor } from '@/utils/repCalculator';

/**
 * Fetch complete player profile for display in popups
 * @param userId - The user ID to fetch profile for
 * @returns Complete user profile or null if not found
 */
export async function fetchPlayerProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      
      // Ensure we have all required fields with defaults
      const profile: UserProfile = {
        uid: data.uid || userId,
        email: data.email || '',
        username: data.username || 'Anonymous',
        gender: data.gender || 'prefer-not-to-say',
        profilePicUrl: data.profilePicUrl || generateAvatarUrl(userId, data.username || 'Anonymous', data.gender),
        rep: data.rep || 0,
        level: data.level || 1,
        rank: data.rank || 'TOY',
        totalMarkers: data.totalMarkers || 0,
        favoriteColor: data.favoriteColor || '#4dabf7',
        unlockedColors: data.unlockedColors || [],
        unlockedTracks: data.unlockedTracks || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActive: data.lastActive?.toDate() || new Date(),
        crewId: data.crewId || null,
        crewName: data.crewName || null,
        isSolo: data.isSolo !== undefined ? data.isSolo : true,
        crewJoinedAt: data.crewJoinedAt?.toDate() || null,
        crewRank: data.crewRank || 'RECRUIT',
        crewRep: data.crewRep || 0,
        currentAct: data.currentAct || 1,
        storyProgress: data.storyProgress || 0,
        markersPlaced: data.markersPlaced || 0,
        photosTaken: data.photosTaken || 0,
        collaborations: data.collaborations || 0,
        blackoutEventsInvestigated: data.blackoutEventsInvestigated || 0,
        kaiTiakiEvaluationsReceived: data.kaiTiakiEvaluationsReceived || 0,
        hasReceivedCrewWelcomeMessage: data.hasReceivedCrewWelcomeMessage || false,
        activeMissions: data.activeMissions || [],
        completedMissions: data.completedMissions || [],
        unlockedGraffitiTypes: data.unlockedGraffitiTypes || [],
        activeGraffitiStyle: data.activeGraffitiStyle || 'tag',
        unlockedStyleVariants: data.unlockedStyleVariants || [],
        selectedStyleVariant: data.selectedStyleVariant || '',
        unlockedGraffitiStyles: data.unlockedGraffitiStyles || [],
        selectedGraffitiStyle: data.selectedGraffitiStyle || '',
        selectedStyleType: data.selectedStyleType || 'font',
        selectedColor: data.selectedColor || '#4dabf7',
        unlockedVideos: data.unlockedVideos || []
      };
      
      return profile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
}

/**
 * Generate avatar URL for a user
 * @param userId - User ID
 * @param username - Username
 * @param gender - User gender
 * @returns Avatar URL
 */
export function generateAvatarUrl(userId: string, username: string, gender?: string): string {
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
    '4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4444', 'f97316',
    '3b82f6', '06b6d4', '8b5cf6', 'ef4444', '84cc16', '14b8a6'
  ];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Construct URL based on style
  let url = '';
  
  switch (avatarStyle) {
    case 'adventurer': // Male (boyish)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'avataaars': // Female (girlish)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'bottts': // Other (alien/robot)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'identicon': // Prefer not to say (android/geometric)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    default: // open-peeps as fallback
      url = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  }
  
  return url;
}

/**
 * Get player card display data for popups
 * @param profile - User profile
 * @returns Formatted display data
 */
export function getPlayerCardData(profile: UserProfile) {
  const crewTheme = getCrewTheme(profile.crewId);
  const rankColor = getRankColor(profile.rank);
  
  return {
    username: profile.username,
    rank: profile.rank,
    level: profile.level,
    rep: profile.rep,
    totalMarkers: profile.totalMarkers,
    crewName: profile.crewName || (profile.isSolo ? 'Solo Writer' : 'No Crew'),
    crewColor: crewTheme.primary,
    rankColor: rankColor,
    lastActive: profile.lastActive,
    profilePicUrl: profile.profilePicUrl,
    gender: profile.gender,
    isSolo: profile.isSolo
  };
}

/**
 * Format last active time for display
 * @param date - Date object
 * @returns Formatted time string
 */
export function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}