/**
 * useFirebaseDataLoaders.ts
 * Extracted from page.tsx – all Firestore "read" helpers:
 *   loadAllMarkers, loadTopPlayers, loadTopCrews, loadDrops, loadUserProfile
 *
 * Usage in HomeComponent:
 *   const { loadAllMarkers, loadTopPlayers, loadTopCrews, loadDrops, loadUserProfile } =
 *     useFirebaseDataLoaders({ ... });
 */

import { useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { loadAllDrops } from '@/lib/firebase/drops';
import { generateAvatarUrl } from '@/utils/homeHelpers';
import { getRandomStartTrack } from '@/hooks/useMusicPlayer';
import { initializeUnlockedColors } from '@/utils/colorUnlocks';
import { FirestoreMarker } from '@/lib/types/firestoreTypes';
import {
  UserProfile,
  UserMarker,
  TopPlayer,
  TopCrew,
  Drop,
} from '@/lib/types/blackout';
import { MarkerName, MarkerDescription } from '@/constants/markers';

// ─── Hook Params ─────────────────────────────────────────────────────────────

interface UseFirebaseDataLoadersParams {
  markerQuality: 'low' | 'medium' | 'high';
  logPerformance: (operation: string, startTime: number) => void;

  // State setters
  setLoadingMarkers: (v: boolean) => void;
  setUserMarkers: (markers: UserMarker[]) => void;
  setTopPlayers: (players: TopPlayer[]) => void;
  setTopCrews: (crews: TopCrew[]) => void;
  setDrops: (drops: Drop[]) => void;
  setUserProfile: (updater: ((prev: UserProfile | null) => UserProfile | null) | UserProfile | null) => void;
  setShowProfileSetup: (v: boolean) => void;
  setSelectedMarkerColor: (color: string) => void;
  setUnlockedTracks: (tracks: string[]) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useFirebaseDataLoaders = ({
  markerQuality,
  logPerformance,
  setLoadingMarkers,
  setUserMarkers,
  setTopPlayers,
  setTopCrews,
  setDrops,
  setUserProfile,
  setShowProfileSetup,
  setSelectedMarkerColor,
  setUnlockedTracks,
}: UseFirebaseDataLoadersParams) => {

  // ── loadAllMarkers ──────────────────────────────────────────────────────────
  const loadAllMarkers = useCallback(async (): Promise<void> => {
    const startTime = performance.now();
    setLoadingMarkers(true);
    try {
      const markerLimit =
        markerQuality === 'low' ? 12 : markerQuality === 'medium' ? 25 : 50;
      const q = query(
        collection(db, 'markers'),
        orderBy('createdAt', 'desc'),
        limit(markerLimit)
      );
      const querySnapshot = await getDocs(q);
      const loadedMarkers: UserMarker[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as FirestoreMarker;
        loadedMarkers.push({
          id: `marker-${docSnap.id}`,
          firestoreId: docSnap.id,
          position: data.position,
          name: data.name as MarkerName,
          description: data.description as MarkerDescription,
          color: data.color || '#10b981',
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          userId: data.userId,
          username: data.username || 'Anonymous',
          userProfilePic:
            data.userProfilePic || generateAvatarUrl(data.userId, data.username),
          distanceFromCenter: data.distanceFromCenter ?? undefined,
          repEarned: data.repEarned || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          specialType: data.specialType || null,
          surface: 'wall' as any,
          graffitiType: 'tag' as any,
          styleId: data.styleId || undefined,
        });
      });

      loadedMarkers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setUserMarkers(loadedMarkers);
    } catch (error) {
      console.error('Error loading all markers:', error);
    } finally {
      setLoadingMarkers(false);
      logPerformance('loadAllMarkers', startTime);
    }
  }, [markerQuality, logPerformance, setLoadingMarkers, setUserMarkers]);

  // ── loadTopPlayers ──────────────────────────────────────────────────────────
  const loadTopPlayers = useCallback(async (): Promise<void> => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers: TopPlayer[] = [];

      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allUsers.push({
          uid: data.uid,
          username: data.username,
          profilePicUrl: data.profilePicUrl,
          rank: data.rank,
          rep: data.rep || 0,
          level: data.level || 1,
          totalMarkers: data.totalMarkers || 0,
          lastActive: data.lastActive?.toDate() || new Date(),
        });
      });

      const sortedUsers = allUsers
        .filter((u) => u.username && u.rep > 0)
        .sort((a, b) => b.rep - a.rep)
        .slice(0, 3);

      const playersWithPositions = await Promise.all(
        sortedUsers.map(async (player) => {
          try {
            const markersQuery = query(
              collection(db, 'markers'),
              where('userId', '==', player.uid),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const markersSnapshot = await getDocs(markersQuery);
            if (!markersSnapshot.empty) {
              return { ...player, position: markersSnapshot.docs[0].data().position };
            }
          } catch (err) {
            console.error(`Error getting position for ${player.username}:`, err);
          }
          return player;
        })
      );

      setTopPlayers(playersWithPositions);
    } catch (error) {
      console.error('Error loading top players:', error);
    }
  }, [setTopPlayers]);

  // ── loadTopCrews ────────────────────────────────────────────────────────────
  const loadTopCrews = useCallback(async (): Promise<void> => {
    try {
      const crewsSnapshot = await getDocs(collection(db, 'crews'));
      const allCrews: TopCrew[] = [];

      crewsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allCrews.push({
          crewId: data.id || docSnap.id,
          name: data.name,
          totalRep: data.rep || 0,
          memberCount: data.members ? data.members.length : 0,
          color: data.color || '#4dabf7',
          accentColor: data.accentColor || '#339af0',
          description: data.description || '',
          leaderName: data.leader || 'Unknown',
          leaderUsername: data.leaderUsername || 'Unknown',
          leaderProfilePicUrl:
            data.leaderProfilePicUrl ||
            generateAvatarUrl(docSnap.id, data.leader || 'Unknown'),
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date(),
        });
      });

      const sortedCrews = allCrews
        .filter((c) => c.name && c.totalRep > 0)
        .sort((a, b) => b.totalRep - a.totalRep)
        .slice(0, 3);

      setTopCrews(sortedCrews);
    } catch (error) {
      console.error('Error loading top crews:', error);
    }
  }, [setTopCrews]);

  // ── loadDrops ───────────────────────────────────────────────────────────────
  const loadDrops = useCallback(async (): Promise<void> => {
    try {
      const dropLimit =
        markerQuality === 'low' ? 30 : markerQuality === 'medium' ? 75 : 150;
      const loadedDrops = await loadAllDrops();
      setDrops((loadedDrops as Drop[]).slice(0, dropLimit));
    } catch (error) {
      console.error('Error loading drops:', error);
    }
  }, [markerQuality, setDrops]);

  // ── loadUserProfile ─────────────────────────────────────────────────────────
  const loadUserProfile = useCallback(
    async (currentUser: FirebaseUser): Promise<boolean> => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          setShowProfileSetup(true);
          setUserProfile(null);
          return false;
        }

        const data = userDoc.data();

        let profilePicUrl = data.profilePicUrl;
        if (!profilePicUrl || profilePicUrl === '') {
          profilePicUrl = generateAvatarUrl(currentUser.uid, data.username, data.gender);
        }

        const favoriteColor = data.favoriteColor || '#10b981';
        setSelectedMarkerColor(favoriteColor);

        const userUnlockedTracks =
          data.unlockedTracks && data.unlockedTracks.length > 0
            ? data.unlockedTracks
            : getRandomStartTrack();
        setUnlockedTracks(userUnlockedTracks);

        const userUnlockedColors =
          data.unlockedColors || initializeUnlockedColors(data.crewId);

        const userProfileData: UserProfile = {
          uid: data.uid || currentUser.uid,
          email: data.email || currentUser.email || '',
          username: data.username || 'Anonymous',
          gender: data.gender || 'prefer-not-to-say',
          profilePicUrl,
          rep: data.rep || 0,
          level: data.level || 1,
          rank: data.rank || 'TOY',
          totalMarkers: data.totalMarkers || 0,
          favoriteColor,
          unlockedColors: userUnlockedColors,
          unlockedTracks: userUnlockedTracks,
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
          hasReceivedCrewWelcomeMessage:
            data.hasReceivedCrewWelcomeMessage || false,
          unlockedVideos: data.unlockedVideos || [],
        };

        setUserProfile(userProfileData);
        setShowProfileSetup(false);

        // Load supporting data after profile is set
        try {
          await Promise.all([loadTopPlayers(), loadAllMarkers(), loadDrops()]);
        } catch (loadError) {
          console.error('Error loading additional data:', loadError);
        }

        return true;
      } catch (error) {
        console.error('Error loading user profile:', error);
        setShowProfileSetup(true);
        setUserProfile(null);
        return false;
      }
    },
    [
      setShowProfileSetup,
      setUserProfile,
      setSelectedMarkerColor,
      setUnlockedTracks,
      loadTopPlayers,
      loadAllMarkers,
      loadDrops,
    ]
  );

  return { loadAllMarkers, loadTopPlayers, loadTopCrews, loadDrops, loadUserProfile };
};
