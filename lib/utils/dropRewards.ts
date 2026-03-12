import { UserProfile } from '@/lib/types/blackout';
import { characters } from '@/data/characters';
import { CREWS } from '@/data/crews';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Dispatch, SetStateAction } from 'react';

export interface RepNotificationPayload {
  show: boolean;
  amount: number;
  message: string;
  breakdown?: any;
}

export interface NpcNotificationPayload {
  show: boolean;
  leaderName: string;
  message: string;
}

/**
 * Shared logic for showing crew welcome notification when a user places their first drop
 */
export const maybeShowCrewWelcome = async (
  userProfile: UserProfile | null,
  userUid: string,
  dropType: 'marker' | 'photo' | 'music',
  setNpcWelcomeNotification: Dispatch<SetStateAction<NpcNotificationPayload | null>>,
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>
): Promise<void> => {
  if (!userProfile?.crewId || userProfile.hasReceivedCrewWelcomeMessage) {
    return;
  }

  const crewLeaderName = CREWS.find(c => c.id === userProfile.crewId)?.leader;
  const leaderCharacter = characters.find(char => char.name.includes(crewLeaderName || ''));

  if (leaderCharacter) {
    const greetingMessage =
      `${leaderCharacter.name.replace('👑 ', '')}: Awesome first tag, ${userProfile.username}! Keep it up. This city won't tag itself. 🎨`;

    setNpcWelcomeNotification({
      show: true,
      leaderName: leaderCharacter.name.replace('👑 ', ''),
      message: greetingMessage,
    });

    const userRef = doc(db, 'users', userUid);
    await updateDoc(userRef, {
      hasReceivedCrewWelcomeMessage: true,
      lastActive: Timestamp.now()
    });

    setUserProfile(prev => prev ? { ...prev, hasReceivedCrewWelcomeMessage: true } : null);
  }
};

/**
 * Shared logic for checking and completing the "First Tags" mission after 3rd drop
 */
export const maybeCompleteAct1Mission = async (
  userProfile: UserProfile | null,
  userUid: string,
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>,
  setRepNotification: Dispatch<SetStateAction<RepNotificationPayload | null>>
): Promise<void> => {
  if (!userProfile) return;

  const newTotalMarkers = (userProfile.totalMarkers || 0) + 1;
  if (newTotalMarkers !== 3 || !userProfile.activeMissions?.includes('act1_intro')) return;

  const storyRef = doc(db, 'story', userUid);
  await updateDoc(storyRef, {
    activeMissions: (userProfile.activeMissions || []).filter(id => id !== 'act1_intro'),
    completedMissions: [...(userProfile.completedMissions || []), 'act1_intro'],
    storyProgress: (userProfile.storyProgress || 0) + 1,
    lastUpdated: Timestamp.now()
  });

  setUserProfile(prev => prev ? {
    ...prev,
    activeMissions: prev.activeMissions?.filter(id => id !== 'act1_intro') || [],
    completedMissions: [...(prev.completedMissions || []), 'act1_intro'],
    storyProgress: (prev.storyProgress || 0) + 1,
  } : null);

  setRepNotification({
    show: true,
    amount: 0,
    message: 'MISSION COMPLETE: First Tags! 🎉',
  });
};