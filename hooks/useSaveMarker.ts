import { useCallback, useRef } from 'react';
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  Timestamp,
  serverTimestamp as firestoreServerTimestamp,
} from 'firebase/firestore';
import type { Dispatch, SetStateAction } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { characters } from '@/data/characters';
import { CREWS } from '@/data/crews';
import { calculateRepForMarker, calculateRank, calculateLevel } from '@/utils/homeHelpers';
import { migrateMarkerNameToSurface, migrateMarkerDescriptionToGraffiti } from '@/utils/typeMapping';
import { maybeShowCrewWelcome, maybeCompleteAct1Mission, RepNotificationPayload, NpcNotificationPayload } from '@/lib/utils/dropRewards';
import { UserProfile, UserMarker } from '@/lib/types/blackout';

interface UseSaveMarkerParams {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  lastMarkerDate: string | null;

  setLastMarkerDate: Dispatch<SetStateAction<string | null>>;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>;
  setRepNotification: Dispatch<SetStateAction<RepNotificationPayload | null>>;
  setNpcWelcomeNotification: Dispatch<SetStateAction<NpcNotificationPayload | null>>;

  loadTopPlayers: () => Promise<void>;
}

export const useSaveMarker = ({
  user,
  userProfile,
  lastMarkerDate,
  setLastMarkerDate,
  setUserProfile,
  setRepNotification,
  setNpcWelcomeNotification,
  loadTopPlayers,
}: UseSaveMarkerParams) => {

  const calculateStreakBonus = useCallback((): number => {
    const today = new Date().toDateString();
    if (lastMarkerDate === today) return 0;
    setLastMarkerDate(today);
    return 25;
  }, [lastMarkerDate, setLastMarkerDate]);

  const saveMarkerToFirestore = useCallback(async (marker: UserMarker): Promise<string | null> => {
    if (!user || !userProfile) return null;

    try {
      const repResult = calculateRepForMarker(
        marker.name,
        marker.description,
        marker.distanceFromCenter || null,
        marker.surface,
        marker.graffitiType
      );
      const streakBonus = calculateStreakBonus();
      const totalRep = repResult.rep + streakBonus;

      const markerData = {
        position: marker.position,
        name: marker.name,
        description: marker.description,
        color: marker.color,
        timestamp: Timestamp.fromDate(marker.timestamp),
        userId: user.uid,
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
        createdAt: firestoreServerTimestamp(),
        distanceFromCenter: marker.distanceFromCenter || null,
        repEarned: totalRep,
        surface: marker.surface || migrateMarkerNameToSurface(marker.name),
        graffitiType: marker.graffitiType || migrateMarkerDescriptionToGraffiti(marker.description),
        repBreakdown: repResult.breakdown,
        specialType: marker.specialType || null,
        ...(marker.styleId || userProfile.selectedGraffitiStyle
          ? { styleId: marker.styleId || userProfile.selectedGraffitiStyle }
          : {}),
      };

      const docRef = await addDoc(collection(db, 'markers'), markerData);

      const newRep = userProfile.rep + totalRep;
      const newRank = calculateRank(newRep);
      const newLevel = calculateLevel(newRep);

      await updateDoc(doc(db, 'users', user.uid), {
        rep: newRep,
        rank: newRank,
        level: newLevel,
        totalMarkers: userProfile.totalMarkers + 1,
        lastActive: Timestamp.now(),
      });

      setUserProfile(prev =>
        prev ? { ...prev, rep: newRep, rank: newRank, level: newLevel, totalMarkers: prev.totalMarkers + 1 } : null
      );

      await loadTopPlayers();

      let message = 'Marker placed!';
      if (streakBonus > 0) message = '🔥 Daily Streak Bonus!';
      else if (marker.description === 'Piece/Bombing' || marker.description === 'Burner/Heater') message = '🔥 BOMBING REP!';

      setRepNotification({ show: true, amount: totalRep, message, breakdown: repResult.breakdown });

      await maybeShowCrewWelcome(userProfile, user.uid, 'marker', setNpcWelcomeNotification, setUserProfile);
      await maybeCompleteAct1Mission(userProfile, user.uid, setUserProfile, setRepNotification);

      return docRef.id;
    } catch (error) {
      console.error('Error saving marker to Firestore:', error);
      return null;
    }
  }, [user, userProfile, calculateStreakBonus, setUserProfile, setRepNotification, setNpcWelcomeNotification, loadTopPlayers]);

  return { saveMarkerToFirestore, calculateStreakBonus };
};
