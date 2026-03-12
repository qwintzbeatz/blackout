import { UserProfile } from '@/lib/types/blackout';
import { characters } from '@/data/characters';
import { CREWS } from '@/data/crews';
import { doc, setDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateAvatarUrl } from '@/utils/homeHelpers';
import { getRandomStartTrack } from '@/hooks/useMusicPlayer';
import { initializeUnlockedColors, getDefaultColorForCrew } from '@/utils/colorUnlocks';
import { CrewId } from '@/constants/markers';

interface UseProfileSetupProps {
  user: any;
  setProfileLoading: (loading: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setSelectedMarkerColor: (color: string) => void;
  setUnlockedTracks: (tracks: string[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setShowProfileSetup: (show: boolean) => void;
  setProfileUsername: (username: string) => void;
  setProfileCrewName: (crewName: string) => void;
  setSelectedCrew: (crew: string) => void;
  setProfileCrewChoice: (choice: 'crew' | 'solo') => void;
  loadTopPlayers: () => Promise<void>;
  loadAllMarkers: () => Promise<void>;
}

export const useProfileSetup = ({
  user,
  setProfileLoading,
  setUserProfile,
  setSelectedMarkerColor,
  setUnlockedTracks,
  setCurrentTrackIndex,
  setIsPlaying,
  setShowProfileSetup,
  setProfileUsername,
  setProfileCrewName,
  setSelectedCrew,
  setProfileCrewChoice,
  loadTopPlayers,
  loadAllMarkers,
}: UseProfileSetupProps) => {
  const handleProfileSetup = async (data: {
    username: string;
    gender: string;
    crewChoice: 'crew' | 'solo';
    selectedCrew?: string;
  }): Promise<void> => {
    if (!user || !data.username.trim()) {
      alert('Please enter a username');
      return;
    }
    
    setProfileLoading(true);
    
    try {
      const profilePicUrl = generateAvatarUrl(user.uid, data.username.trim(), data.gender as any);
      
      let crewId: string | null = null;
      let crewName: string | null = null;
      const isSolo = data.crewChoice === 'solo';
      
      if (!isSolo && data.selectedCrew) {
        crewId = data.selectedCrew;
        const selectedCrewData = CREWS.find(c => c.id === data.selectedCrew);
        crewName = selectedCrewData?.name || null;
        
        const crewsRef = collection(db, 'crews');
        const crewQuery = query(crewsRef, where('id', '==', crewId));
        const crewSnapshot = await getDocs(crewQuery);
        
        if (crewSnapshot.empty) {
          const newCrewRef = doc(crewsRef);
          await setDoc(newCrewRef, {
            id: crewId,
            name: crewName,
            members: [user.uid],
            createdAt: Timestamp.now(),
            createdBy: user.uid,
            rep: 0,
            color: selectedCrewData?.colors?.primary || '#4dabf7',
            description: selectedCrewData?.description || ''
          });
        } else {
          const crewDoc = crewSnapshot.docs[0];
          const currentMembers = crewDoc.data().members || [];
          if (!currentMembers.includes(user.uid)) {
            await updateDoc(doc(db, 'crews', crewDoc.id), {
              members: [...currentMembers, user.uid]
            });
          }
        }
      }
      
      // Initialize unlocked colors based on crew/solo choice
      const initialUnlockedColors = initializeUnlockedColors(crewId as CrewId | null);
      const initialFavoriteColor = getDefaultColorForCrew(crewId as CrewId | null);
      
      // Set the selected marker color to the crew's default
      setSelectedMarkerColor(initialFavoriteColor);
      
      const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        username: data.username.trim(),
        gender: data.gender as any,
        profilePicUrl: profilePicUrl,
        rep: 0,
        level: 1,
        rank: 'TOY',
        totalMarkers: 0,
        favoriteColor: initialFavoriteColor,
        unlockedColors: initialUnlockedColors,
        unlockedTracks: getRandomStartTrack(),
        createdAt: new Date(),
        lastActive: new Date(),
        crewId: crewId,
        crewName: crewName,
        isSolo: isSolo,
        crewJoinedAt: crewId ? new Date() : null,
        crewRank: 'RECRUIT',
        crewRep: 0,
        currentAct: 1,
        storyProgress: 0,
        markersPlaced: 0,
        photosTaken: 0,
        collaborations: 0,
        blackoutEventsInvestigated: 0,
        kaiTiakiEvaluationsReceived: 0,
        hasReceivedCrewWelcomeMessage: false,
        unlockedGraffitiTypes: ['tag'],
        activeGraffitiStyle: 'tag'
      };
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...userProfileData,
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now(),
        crewJoinedAt: crewId ? Timestamp.now() : null
      });
      
      const storyRef = doc(db, 'story', user.uid);
      await setDoc(storyRef, {
        userId: user.uid,
        currentAct: 1,
        storyProgress: 0,
        completedMissions: [],
        activeMissions: ['act1_intro'],
        crewTrust: { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
        plotRevealed: false,
        lastUpdated: Timestamp.now()
      });
      
      setUserProfile(userProfileData);
      
      // 🎵 START MUSIC DURING PROFILE SETUP
      // Set up the default track for new users
      setUnlockedTracks(getRandomStartTrack());
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      
      setShowProfileSetup(false);
      setProfileUsername('');
      setProfileCrewName('');
      setSelectedCrew('');
      setProfileCrewChoice('crew');
      
      await loadTopPlayers();
      await loadAllMarkers();
      
      // 🎵 Show welcome message with music info
      setTimeout(() => {
        alert(`🎉 Welcome to Blackout NZ, ${data.username}!\n\n🎵 Your music is now playing: Blackout - Classic\n\nThe city awaits your tags. Get out there and make your mark!`);
      }, 500);
      
    } catch (error: any) {
      console.error('Error creating profile:', error);
      alert(`Failed to create profile: ${error.message}`);
    } finally {
      setProfileLoading(false);
    }
  };

  return { handleProfileSetup };
};