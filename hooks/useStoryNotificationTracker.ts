// hooks/useStoryNotificationTracker.ts
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types/blackout';
import { STORY_MISSIONS as storyMissions } from '@/lib/missions/storyMissions';

export interface StoryNotificationStatus {
  hasNewStoryContent: boolean;
  activeMissionCount: number;
}

const useStoryNotificationTracker = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasNewStoryContent, setHasNewStoryContent] = useState<boolean>(false);
  const [activeMissionCount, setActiveMissionCount] = useState<number>(0);
  const [lastViewedStoryTimestamp, setLastViewedStoryTimestamp] = useState<number>(0);

  // 1. Listen for current user
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Listen for user profile
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    const userProfileRef = doc(db, 'users', currentUser.uid);
    const unsubscribeProfile = onSnapshot(userProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setUserProfile(profileData);
        // Also get last viewed story timestamp if available
        setLastViewedStoryTimestamp(profileData.lastViewedStoryTimestamp?.toMillis() || 0);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribeProfile();
  }, [currentUser]);

  // 3. Determine new story content based on activeMissions and storyProgress
  useEffect(() => {
    if (!userProfile) {
      setHasNewStoryContent(false);
      setActiveMissionCount(0);
      return;
    }

    // Check for any active missions that are not yet completed
    const activeMissionsPending = (userProfile.activeMissions || []).filter(missionId => {
        const mission = storyMissions.find(m => m.id === missionId);
        // Mission is active and not yet completed by checking against storyProgress
        return mission && (userProfile.storyProgress || 0) < mission.progressThreshold;
    });

    const hasNew = activeMissionsPending.length > 0;
    
    setHasNewStoryContent(hasNew);
    setActiveMissionCount(activeMissionsPending.length);

  }, [userProfile]);

  // Function to mark story content as viewed (update timestamp in user profile)
  const markStoryContentAsViewed = async () => {
    if (!currentUser) return;

    try {
      const userProfileRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userProfileRef, {
        lastViewedStoryTimestamp: new Date(), // Use new Date() for server timestamp behavior if needed, or Timestamp.now()
      });
      console.log(`Marked story content as viewed for user ${currentUser.uid}`);
      setHasNewStoryContent(false); // Optimistically update UI
      setActiveMissionCount(0);
    } catch (error) {
      console.error('Error marking story content as viewed:', error);
    }
  };

  return { hasNewStoryContent, activeMissionCount, markStoryContentAsViewed };
};

export default useStoryNotificationTracker;
