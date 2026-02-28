'use client';

import { StoryManagerProvider } from '@/components/story/StoryManager';
import StoryPanel from '@/components/story/StoryPanel';
import { useMissionTriggers } from '@/hooks/useMissionTriggers';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp as firestoreServerTimestamp 
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { auth, db, realtimeDb, storage } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, push, onValue, query as rtdbQuery, orderByChild, limitToLast, off, set, remove, get, serverTimestamp } from 'firebase/database';
import { UserMarker, MarkerName, MarkerDescription } from '@/lib/utils/types';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { calculateEnhancedRank } from '@/lib/utils';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import PhotoSelectionModal from '@/components/ui/PhotoSelectionModal';
import DropPopup from '@/components/map/DropPopup';
import MarkerPopupCard from '@/components/MarkerPopupCard';
import DirectMessaging from '@/components/DirectMessaging';
import { uploadImageToImgBB } from '@/lib/services/imgbb';
import { saveDropToFirestore, loadAllDrops } from '@/lib/firebase/drops';
import CrewChatPanel from '@/components/chat/CrewChatPanel';
import { MusicPlayer } from '@/components/music/MusicPlayer';
import { useSoundCloud } from '@/lib/soundcloud/hooks';
import { ProfilePanel } from '@/components/profile/ProfilePanel';
import BlackbookPanel from '@/src/components/panels/BlackbookPanel';
import PhotosPanel from '@/src/components/panels/PhotosPanel';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useMarkers } from '@/hooks/useMarkers';
import { Crew } from '@/lib/types/blackout';
import { CREWS } from '@/data/crews';
import { useGPSTracker } from '@/hooks/useGPSTracker';
import { EnhancedErrorBoundary } from '@/src/components/ui/EnhancedErrorBoundary';
import { ErrorRecoveryPanel } from '@/src/components/ui/ErrorRecoveryPanel';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';
import ErrorTest from '@/components/ui/ErrorTest';
import AuthOverlay from '@/src/components/ui/AuthOverlay';
import BottomNavigation from '@/src/components/ui/BottomNavigation';
import SVGBottomNavigation from '@/src/components/ui/SVGBottomNavigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import StatusPanel from '@/components/ui/StatusPanel';
import ColorPickerPanel from '@/components/ui/ColorPickerPanel';
import { getTrackNameFromUrl, calculateDistance } from '@/lib/utils/dropHelpers';
import { calculateRepForMarker } from '@/lib/utils';

const HIPHOP_TRACKS = [
  "https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1",
  "https://soundcloud.com/e-u-g-hdub-connected/hdub-party-ft-koers",
  "https://soundcloud.com/e-u-g-hdub-connected/fight-music",
  "https://soundcloud.com/e-u-g-hdub-connected/rockin-in-the-club",
  "https://soundcloud.com/e-u-g-hdub-connected/we-dont-owe-u-shit-ft-koers",
  "https://soundcloud.com/davidkdallas/runnin",
  "https://soundcloud.com/eke_87/eke-hangn-about",
  "https://soundcloud.com/hustle-kangs/so-good",
  "https://soundcloud.com/e-u-g-hdub-connected/b-o-p-freestyle-at-western",
  "https://soundcloud.com/nzhiphop/ermehn-bank-job-feat-tuface-mr-sicc",
  "https://soundcloud.com/nzhiphop/smashproof-liquor-anthem",
  "https://soundcloud.com/nzhiphop/home-brew-monday",
  "https://soundcloud.com/nzhiphop/deceptikonz-go-home-stay-home",
  "https://soundcloud.com/nzhiphop/tuface-otara-state-of-mind",
  "https://soundcloud.com/nzhiphop/mareko-city-line",
  "https://soundcloud.com/nzhiphop/tyna-iv-corners-djsmv-welcome-to-hamilton-city",
  "https://soundcloud.com/truenelly/true-nelly-no-way-feat-dray-ryda",
  "https://soundcloud.com/colourway_records/colourway-put-your-colors-on",
  "https://soundcloud.com/nzhiphop/usual-suspects-wreck-tee-feat-j1-tyson-tyler",
  "https://soundcloud.com/enolasoldier/dont-give-a-fck-about-you",
  "https://soundcloud.com/nzhiphop/dj-ali-the-summit-anthem-feat-mareko-flowz-scribe",
  "https://soundcloud.com/strikaone/westcoast-ridin",
  "https://soundcloud.com/user-223219940/crazy-samples",
  "https://soundcloud.com/user-270967129/chch-hiphop",
  "https://soundcloud.com/user-270967129/flow-wit-us-a1-blazeske-ekebeat-by-p1ne",
  "https://soundcloud.com/seasidah/ocean-view",
  "https://soundcloud.com/loopcrew/12-waka",
  "https://soundcloud.com/nzhiphop/nesian-mystik-brothaz",
  "https://soundcloud.com/fame-petuha/pulling-me-back",
  "https://soundcloud.com/tui-graham/baddest-bitch-mixdown",
  "https://soundcloud.com/ghostdirtysteath274/ghost-self-side-glow",
  "https://soundcloud.com/ghostdirtysteath274/hustle-intently",
  "https://soundcloud.com/oh6-offishalz/more-than-anything-remix-oh6-offishal",
  "https://soundcloud.com/dennis-jnr-makalio/nizz-feat-teezee-hustlaz",
  "https://soundcloud.com/user-596628786-171564320/oh6-offishal-this-is-where-the-heart-iz",
  "https://soundcloud.com/southgate-entertainment/12-journeys-feat-random-klik",
  "https://soundcloud.com/base-herbert/hammer-time-dtox-west-outlawz",
  "https://soundcloud.com/davidkdallas/dont-rate-that",
  "https://soundcloud.com/davidkdallas/southside",
  "https://soundcloud.com/davidkdallas/david-dallas-caught-in-a-daze",
  "https://soundcloud.com/davidkdallas/til-tomorrow",
  "https://soundcloud.com/stallyano/auckland-connect-feat-k-kila",
  "https://soundcloud.com/pswish/west-auckland-pswish",
  "https://soundcloud.com/dopekrew/ace-ft-imageprod-aebeats",
  "https://soundcloud.com/dopekrew/family-binis-ft-mikey-mayz",
  "https://soundcloud.com/pnc-1/ambitionz-of-a-writer-pac-beats-freestyle",
  "https://soundcloud.com/pnc-1/12-1-2kast",
  "https://soundcloud.com/pnc-1/02-bazookas-theme",
  "https://soundcloud.com/btdubsta187/roll-call-187-gravity-young-sid-fizek",
  "https://soundcloud.com/tysontyler/tyson-tyler-pull-the-trigger",
  "https://soundcloud.com/cbrook300/conquerors-hmewrk",
  "https://soundcloud.com/cbrook300/broken-wing-1",
  "https://soundcloud.com/cbrook300/cbrook-yngskzr-crossfade",
  "https://soundcloud.com/schemeofficial/belly-of-the-beast-ft-tommy-graffiti",
  "https://soundcloud.com/terangihika/sync-hmewrk",
  "https://soundcloud.com/terangihika/01-rec-2024-09-10",
  "https://soundcloud.com/noize_kontrolnz/nk-radio-w-observe-feat-windu-22042025-13",
  "https://soundcloud.com/melodownz/same-as-before",
  "https://soundcloud.com/melodownz/eastdale-blues",
  "https://soundcloud.com/melodownz/chocolate",
  "https://soundcloud.com/homebrewcrew/home-brew-listen-to-us-feat",
  "https://soundcloud.com/homebrewcrew/home-brew-just-another-prod-by",
  "https://soundcloud.com/churchap/ready-or-not",
  "https://soundcloud.com/swidt/kelz-garage-feat-lomez-brown",
  "https://soundcloud.com/ladi6/4-walk-right-up-1",
  "https://soundcloud.com/neng42/scribe-not-many-neng-bootleg",
  "https://soundcloud.com/tipenemusic/tipene-doin-my-thing-ft-scribe",
  "https://soundcloud.com/steven-ngametua-teritaiti/deceptikonz-p-money-fallen",
  "https://soundcloud.com/skzr-music/moonlight-ftflocki",
  "https://soundcloud.com/skzr-music/free-ft-oxoxci",
  "https://soundcloud.com/skzr-music/life-hacks",
  "https://soundcloud.com/skzr-music/trip-into-my-mind-master",
  "https://soundcloud.com/skzr-music/emotions-ft-jlowtbh",
  "https://soundcloud.com/skzr-music/love-sux",
  "https://soundcloud.com/skzr-music/vibe-with-me",
  "https://soundcloud.com/skzr-music/helen-clark-ft-c-brook-tynie-t",
  "https://soundcloud.com/skzr-music/matters-freestyle",
  "https://soundcloud.com/jlowtbh/ironic-hope-prod-classixs",
  "https://soundcloud.com/intreigue/misunderstood-h-dub-c",
  "https://soundcloud.com/intreigue/back-in-the-day-h-dub-c",
  "https://soundcloud.com/intreigue/turn-dat-40-up-hdub-c",
  "https://soundcloud.com/dawnraidmusic/savage-all-in-featuring",
  "https://soundcloud.com/marekothehorse/07-deceptikonz-back-to-front-freestyle",
  "https://soundcloud.com/marekothehorse/mareko-this-is-it",
  "https://soundcloud.com/marekothehorse/rex-martel-free-at-last",
  "https://soundcloud.com/diggydupe/diggy-dupe-godlike",
  "https://soundcloud.com/diggydupe/bring-back-badu-prod-tantu",
  "https://soundcloud.com/user-565273118/nesian-mystik-sun-goes-down",
  "https://soundcloud.com/anatonga-patricia-uate/nesian-mystik-nesian-style",
  "https://soundcloud.com/freeloaderactivity/nesian-mystik-unity",
  "https://soundcloud.com/jacob5-1/nesian-mystik-for-the-people",
  "https://soundcloud.com/tianna-cole-440312719/nesian-mystik-robbin-hood",
  "https://soundcloud.com/t1zzle/aquarius-sir-t",
  "https://soundcloud.com/t1zzle/hands-up-featuring-tha",
  "https://soundcloud.com/t1zzle/further-than-you-thought",
  "https://soundcloud.com/t1zzle/ready-for-whatever-feat-sidney",
  "https://soundcloud.com/t1zzle/celebrate-mugz-x-sir-t-x-resin-one",
  "https://soundcloud.com/diamonddistrict-1/bottles",
  "https://soundcloud.com/frasko-1/frasko-outlaw",
  "https://soundcloud.com/user-27171095/equinimity-nz-hiphop",
  "https://soundcloud.com/john-donnelly-992133591/kwick-ft-john-dee-with-you",
  "https://soundcloud.com/phdhiphop/phd-summer-nz",
  "https://soundcloud.com/madisnzofficial/madis-thats-life-produced-by",
  "https://soundcloud.com/empirerecordsnz/tipene-west-side-hori-remix",
  "https://soundcloud.com/markangel-71269802/smashproof-feat-gin-wigmore-brother",
  "https://soundcloud.com/johnny-sicario/nobody-to-me-dame-teezee",
  "https://soundcloud.com/johnny-sicario/armed-dangerous-coey-east"
];

// 🔧 PERFORMANCE: Enable SoundCloud for music playback functionality
const ENABLE_SOUNDCLOUD = true;

// ========== TYPE DEFINITIONS ==========
type CrewId = 'bqc' | 'sps' | 'lzt' | 'dgc' | null;
type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  gender: Gender;
  profilePicUrl: string;
  rep: number;
  level: number;
  rank: string;
  totalMarkers: number;
  favoriteColor?: string;
  createdAt: Date;
  lastActive: Date;
  isSolo?: boolean;
  crewName?: string | null;
  crewId?: CrewId | null;
  isLeader?: boolean;
  unlockedTracks?: string[];
  crewJoinedAt?: Date | null;
  crewRank?: string;
  crewRep?: number;
  currentAct?: number;
  storyProgress?: number;
  markersPlaced?: number;
  photosTaken?: number;
  collaborations?: number;
  blackoutEventsInvestigated?: number;
  kaiTiakiEvaluationsReceived?: number;
}

interface TopPlayer {
  uid: string;
  username: string;
  profilePicUrl: string;
  rank: string;
  rep: number;
  level: number;
  totalMarkers: number;
  position?: [number, number];
  lastActive: Date;
}

interface SoundCloudTrack {
  url: string;
  title: string;
  isLoaded: boolean;
  iframeId?: string;
}

interface CrewData {
  id: string;
  name: string;
  leader: string;
  description: string;
  bonus: string;
  color: string;
  accentColor: string;
}

interface LocationInfo {
  coords: [number, number];
  description: string;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
  userProfilePic?: string;
}


interface Drop {
  id?: string;
  firestoreId?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  trackUrl?: string;
  createdBy: string;
  timestamp: Date;
  likes: string[];
  username: string;
  userProfilePic: string;
}

interface NearbyCrewMember {
  uid: string;
  username: string;
  distance: number;
}

// 🆕 CREW CHAT MESSAGE TYPE
interface CrewChatMessage {
  id: string;
  text: string;
  uid: string;
  username: string;
  avatar?: string;
  timestamp: number;
  failed?: boolean; // For failed messages
}

// 🆕 MESSAGING TYPES (for direct messages)
interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePic: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'text' | 'location' | 'photo' | 'crew_invite';
  location?: [number, number];
  photoUrl?: string;
}

interface DirectChat {
  chatId: string;
  participantIds: string[];
  participantNames: string[];
  participantProfilePics: string[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

// ========== END TYPE DEFINITIONS ==========

// PERFORMANCE OPTIMIZATIONS:
// - Component splitting: CrewChatPanel, MusicPlayer, ProfilePanel extracted
// - State management: useMemo, useCallback, React.memo implemented
// - Memory cleanup: Proper event listener cleanup in useEffect
// - Bundle reduction: Separated concerns into modular components

const NEW_ZEALAND_LOCATIONS: Record<string, LocationInfo> = {
  'Auckland': {
    coords: [-36.8485, 174.7633],
    description: 'City of Sails'
  },
  'Wellington': {
    coords: [-41.2865, 174.7762],
    description: 'Windy City'
  },
  'Christchurch': {
    coords: [-43.5320, 172.6306],
    description: 'Garden City'
  },
  'Queenstown': {
    coords: [-45.0312, 168.6626],
    description: 'Adventure Capital'
  },
  'Dunedin': {
    coords: [-45.8788, 170.5028],
    description: 'Edinburgh of the South'
  }
};

// Extended iframe interface
declare global {
  interface HTMLIFrameElement {
    _scWidget?: any;
  }
}

// Marker name options
const MARKER_NAMES: MarkerName[] = ['Pole', 'Sign', 'E.Box', 'Fence', 'Wall', 'Shutter', 'Sewer', 'Rooftop', 'Ground', 'Train', 'Bridge', 'Traffic Light', 'Truck', 'Van', 'Post Box', 'Speed Camera', 'ATM Machine', 'Bus Stop'];

// Marker description options
const MARKER_DESCRIPTIONS: MarkerDescription[] = ['Sticker/Slap', 'Stencil/Brand/Stamp', 'Tag/Signature', 'Etch/Scribe/Scratch', 'Throw-Up', 'Paste-Up/Poster', 'Piece/Bombing', 'Burner/Heater', 'Roller/Blockbuster', 'Extinguisher', 'Mural'];

// Modern panel styling constant for consistency across all UI panels
const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#e0e0e0',
  padding: '16px',
  borderRadius: '12px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  width: 'min(110vw, 400px)',
  maxHeight: '75vh',
  overflowY: 'auto' as const,
  border: '1px solid rgba(255,255,255,0.15)',
  backdropFilter: 'blur(8px)',
  zIndex: 1200,
  position: 'relative' as const
};

// 🔧 PERFORMANCE: Custom throttle function to prevent infinite loops
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// 🔧 PERFORMANCE: Custom debounce function for GPS position updates
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const calculateRank = (rep: number): string => {
  return calculateEnhancedRank(rep);
};

const calculateLevel = (rep: number): number => {
  return Math.floor(rep / 100) + 1;
};

// Helper function to unlock a random track
const unlockRandomTrack = (currentUnlocked: string[]): string[] => {
  // Get tracks that haven't been unlocked yet
  const availableTracks = HIPHOP_TRACKS.filter(track =>
    !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) return currentUnlocked;

  // Pick random track
  const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];

  return [...currentUnlocked, randomTrack];
};

// Marker colors
const MARKER_COLORS = [
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#4dabf7' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Black', value: '#000000' },
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Cyan', value: '#22d3ee' },
  { name: 'Gray', value: '#6b7280' }
] as const;

// Helper function to calculate bounds from markers
const calculateBoundsFromMarkers = (markers: UserMarker[]): [[number, number], [number, number]] | null => {
  if (markers.length === 0) return null;
  
  const lats = markers.map(m => m.position[0]);
  const lngs = markers.map(m => m.position[1]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  return [[minLat, minLng], [maxLat, maxLng]];
};

// Function to create SoundCloud iframe URL
const createSoundCloudIframeUrl = (trackUrl: string): string => {
  const params = new URLSearchParams({
    url: trackUrl,
    color: 'ff5500',
    auto_play: 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'false',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
    sharing: 'false',
    buying: 'false',
    download: 'false',
    show_playcount: 'false',
    show_artwork: 'false',
    show_playlist: 'false'
  });
  
  return `https://w.soundcloud.com/player/?${params.toString()}`;
};

// Dynamically import leaflet only on client side
const MapComponent = dynamic(
  () => import('@/components/map/MapComponent').then((mod) => mod.default),
  { ssr: false }
);

const HomeComponent = () => {
  const { hasRecentErrors } = useErrorHandler();
  
  // ========== AUTHENTICATION HOOK ==========
  const {
    user: firebaseUser,
    loadingAuth,
    authError,
    handleLogin,
    handleSignup,
    handleLogout,
    setAuthError
  }: {
    user: FirebaseUser | null;
    loadingAuth: boolean;
    authError: string | null;
    handleLogin: (email: string, password: string) => Promise<boolean>;
    handleSignup: (email: string, password: string) => Promise<boolean>;
    handleLogout: () => Promise<void>;
    setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  } = useFirebaseAuth();

  // Use the Firebase User directly (ProfilePanel expects FirebaseUser which has uid and email)
  const user = firebaseUser;
   
  // ========== USER PROFILE HOOK ==========
  const {
    userProfile,
    loadingProfile,
    showProfileSetup,
    handleProfileSetup,
    updateUserProfile
  } = useUserProfile(user);

  // ========== MARKERS HOOK ==========
  const {
    userMarkers,
    loadingMarkers,
    addMarker,
    deleteMarker,
    deleteAllMarkers,
    loadUserMarkers,
    setUserMarkers
  } = useMarkers(user, userProfile);

  // Panel states
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Enhanced panel toggle function - closes panel if same button is clicked again
  const handlePanelToggle = useCallback((panelName: string) => {
    setActivePanel(prev => prev === panelName ? null : panelName);
    
    // Clear notification count for opened panel
    if (panelName === 'blackbook') {
      setUnreadCounts(prev => ({ ...prev, blackbook: 0 }));
    } else if (panelName === 'photos') {
      setUnreadCounts(prev => ({ ...prev, photos: 0 }));
    } else if (panelName === 'crew') {
      setUnreadCounts(prev => ({ ...prev, crew: 0 }));
    }
    
    // Reset global notification count for any panel that requires user attention
    if (panelName === 'photos' || panelName === 'blackbook' || panelName === 'crew') {
      setNotificationCount(prev => Math.max(0, prev - 1)); // Decrease when opening panels that clear notifications
    }
  }, []);
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    crew: 0,
    photos: 0,
    blackbook: 0
  });
  const [notificationCount, setNotificationCount] = useState(0);

  // Auth overlay state
  const [showAuthOverlay, setShowAuthOverlay] = useState(true);
  
  // Map and GPS states
  const [mapCenter, setMapCenter] = useState<[number, number]>([-40.9006, 174.8860]);
  const [mapZoom, setMapZoom] = useState(6);
  const [expandedRadius, setExpandedRadius] = useState(50);
  
  // GPS Tracker integration
  const {
    position: gpsPosition,
    accuracy,
    speed,
    heading,
    error: gpsError,
    isTracking,
    isLoading: gpsLoading
  } = useGPSTracker();
  
  // Drop states
  const [pendingDropPosition, setPendingDropPosition] = useState<[number, number] | null>(null);
  const [selectedTrackForMusicDrop, setSelectedTrackForMusicDrop] = useState<string | null>(null);
  
  // Load drops on component mount
  useEffect(() => {
    const loadDrops = async () => {
      if (user && userProfile) {
        try {
          const loadedDrops = await loadAllDrops(user.uid);
          setDrops(loadedDrops);
        } catch (error) {
          console.error('Error loading drops:', error);
        }
      }
    };
    
    loadDrops();
  }, [user, userProfile]);

  // Simulate photo notifications (temporary solution)
  const simulatePhotoUpload = useCallback(() => {
    const newPhotoCount = Math.floor(Math.random() * 3) + 1;
    setUnreadCounts(prev => ({
      ...prev,
      photos: (prev.photos || 0) + newPhotoCount
    }));
    setNotificationCount(prev => prev + newPhotoCount);
    
    setRepNotification({
      show: true,
      amount: newPhotoCount * 5, // 5 REP per photo
      message: `${newPhotoCount} new photo${newPhotoCount > 1 ? 's' : ''} uploaded! +${newPhotoCount * 5} REP`
    });
  }, [setUnreadCounts, setNotificationCount]);

  // Update notification counts when markers change
  useEffect(() => {
    if (userProfile) {
      const lastMarkerCount = userProfile.totalMarkers || 0;
      const currentMarkerCount = userMarkers.length;
      
      // If new markers were added, show notification
      if (currentMarkerCount > lastMarkerCount) {
        const newMarkerCount = currentMarkerCount - lastMarkerCount;
        setUnreadCounts(prev => ({
          ...prev,
          blackbook: (prev.blackbook || 0) + newMarkerCount
        }));
        setNotificationCount(prev => prev + newMarkerCount);
        
        // Show rep notification for new markers
        setRepNotification({
          show: true,
          amount: newMarkerCount * 10, // 10 REP per marker
          message: `${newMarkerCount} new marker${newMarkerCount > 1 ? 's' : ''} added to blackbook! +${newMarkerCount * 10} REP`
        });
      }
    }
  }, [userMarkers.length, userProfile?.totalMarkers]);
  
  // Other states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [soundCloudTrackUrl, setSoundCloudTrackUrl] = useState<string>('');
  const [showCreateDropModal, setShowCreateDropModal] = useState(false);
  const [showTrackSelectorModal, setShowTrackSelectorModal] = useState(false);
  const [markersPlacedToday, setMarkersPlacedToday] = useState(0);
  const [drops, setDrops] = useState<Drop[]>([]);
  // ========== STATE DECLARATIONS ==========
  // Notification states
  const [repNotification, setRepNotification] = useState<{
    show: boolean;
    amount: number;
    message: string;
  } | null>(null);
  
  // Music player states
  const [musicPlayerState, setMusicPlayerState] = useState({
    currentTrackIndex: 0,
    isPlaying: false,
    volume: 0.5
  });

  // ========== REFERENCES ==========
  const mapRef = useRef<any>(null);
  const createDropButtonRef = useRef<HTMLButtonElement>(null);
  
  // 🔧 PERFORMANCE: GPS throttling refs
  const lastMapUpdateRef = useRef<number>(0);
  const lastPositionRef = useRef<[number, number] | null>(null);
  const triggeredMissionsRef = useRef<Set<string>>(new Set());

  // ========== EFFECTS ==========
  // Update online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('online');
      setIsOfflineMode(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('offline - limited features');
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection check
    setIsOnline(navigator.onLine);
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🔧 PERFORMANCE: Throttled GPS position updates to prevent infinite loops
  useEffect(() => {
    if (gpsPosition && user && userProfile) {
      const now = Date.now();
      const lastUpdate = lastMapUpdateRef.current;
      
      // Throttle updates to every 2 seconds to prevent infinite loops
      if (now - lastUpdate > 2000) {
        // Check if position has actually changed significantly
        const lastPos = lastPositionRef.current;
        if (!lastPos || calculateDistance(lastPos[0], lastPos[1], gpsPosition[0], gpsPosition[1]) > 10) {
          setMapCenter([gpsPosition[0], gpsPosition[1]]);
          lastMapUpdateRef.current = now;
          lastPositionRef.current = [gpsPosition[0], gpsPosition[1]];
        }
      }
    }
  }, [gpsPosition, user, userProfile]);

  // 🔧 PERFORMANCE: Mission trigger effects with cooldown and ref tracking
  const { triggerMissionEvent, activeMissions } = useMissionTriggers(user, userProfile);

  // Mission trigger effect 1: GPS-based triggers
  useEffect(() => {
    if (gpsPosition && user && userProfile && activeMissions.length > 0) {
      const now = Date.now();
      
      // Check each active mission for GPS triggers
      activeMissions.forEach(missionId => {
        const missionKey = `gps_${missionId}`;
        
        // Check if this mission was recently triggered (5 second cooldown)
        if (!triggeredMissionsRef.current.has(missionKey)) {
          // For now, just trigger the mission without specific distance checking
          // since we don't have access to mission details
          triggeredMissionsRef.current.add(missionKey);
          
          // Clear the cooldown after 5 seconds
          setTimeout(() => {
            triggeredMissionsRef.current.delete(missionKey);
          }, 5000);
          
          triggerMissionEvent(missionId, { timestamp: new Date() });
        }
      });
    }
  }, [gpsPosition, user, userProfile, activeMissions, triggerMissionEvent]);

  // Mission trigger effect 2: Marker-based triggers
  useEffect(() => {
    if (user && userProfile && activeMissions.length > 0 && userMarkers.length > 0) {
      const now = Date.now();
      
      // Check each active mission for marker triggers
      activeMissions.forEach(missionId => {
        const missionKey = `marker_${missionId}`;
        
        // Check if this mission was recently triggered (5 second cooldown)
        if (!triggeredMissionsRef.current.has(missionKey)) {
          // For now, just trigger the mission without specific distance checking
          // since we don't have access to mission details
          triggeredMissionsRef.current.add(missionKey);
          
          // Clear the cooldown after 5 seconds
          setTimeout(() => {
            triggeredMissionsRef.current.delete(missionKey);
          }, 5000);
          
          triggerMissionEvent(missionId, { timestamp: new Date() });
        }
      });
    }
  }, [userMarkers, user, userProfile, activeMissions, triggerMissionEvent]);

  // Mission trigger effect 3: Story progression triggers
  useEffect(() => {
    if (user && userProfile) {
      const now = Date.now();
      const missionKey = `story_progress`;
      
      // Check if story progression was recently triggered (10 second cooldown)
      if (!triggeredMissionsRef.current.has(missionKey)) {
        // Trigger story-based events
        triggeredMissionsRef.current.add(missionKey);
        
        // Clear the cooldown after 10 seconds
        setTimeout(() => {
          triggeredMissionsRef.current.delete(missionKey);
        }, 10000);
        
        // Trigger story progression event
        triggerMissionEvent('story_progress', { timestamp: new Date() });
      }
    }
  }, [user, userProfile, triggerMissionEvent]);

  // ========== AUTHENTICATION FUNCTIONS ==========
  

  // ========== MAP HANDLERS ==========
  const handleMapCreated = (map: any) => {
    mapRef.current = map;
  };

  const handleMapClick = useCallback((e: any) => {
    if (e.lat && e.lng) {
      const newPosition: [number, number] = [e.lat, e.lng];
      setMapCenter(newPosition);
      setMapZoom(18);
      
      // Add marker at clicked position
      if (user && userProfile) {
        const newMarkerData = {
          position: newPosition,
          gpsPosition: gpsPosition ? [gpsPosition[0], gpsPosition[1]] as [number, number] : newPosition
        };
        addMarker(newMarkerData);
        
        // Show rep notification
        setRepNotification({
          show: true,
          amount: 15,
          message: 'Marker placed at clicked location! +15 REP'
        });
      }
    }
  }, [user, userProfile, gpsPosition, addMarker]);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMapZoom(18);
      });
    }
  };

  // ========== DROP HANDLERS ==========
  const handleCreateDrop = async (lat: number, lng: number, trackUrl?: string) => {
    if (!user || !userProfile) {
      alert('Please set up your profile first');
      return;
    }

    const dropData = {
      lat,
      lng,
      trackUrl,
      createdBy: user.uid,
      timestamp: new Date(),
      likes: [],
      username: userProfile.username,
      userProfilePic: userProfile.profilePicUrl
    };

    const savedDrop = await saveDropToFirestore(dropData);
      if (savedDrop && typeof savedDrop === 'object') {
        setDrops(prev => [...prev, savedDrop]);
        setSoundCloudTrackUrl('');

        if (trackUrl) {
          // Remove the track from user's unlocked tracks
          // This would be handled by the SoundCloud context
          setRepNotification({
            show: true,
            amount: 5,
            message: `Music drop created! You gave away "${getTrackNameFromUrl(trackUrl)}"`
          });

          // Increment markers placed today
          setMarkersPlacedToday(prev => prev + 1);
        }

        // Show success message
        setRepNotification({
          show: true,
          amount: 10,
          message: 'Music drop placed successfully!'
        });
      }
  };

  // ========== RENDER ==========
  if (loadingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '18px',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{ color: 'white' }}>Loading authentication...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '16px',
        backgroundColor: '#dc2626'
      }}>
        <div style={{ 
          color: 'white', 
          textAlign: 'center', 
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h2>Authentication Error</h2>
          <p>{authError}</p>
          <button
            onClick={() => setAuthError(null)}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#4dabf7',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user || loadingAuth) {
    if (loadingAuth) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          fontSize: '18px',
          backgroundColor: '#0a0a0a'
        }}>
          <div style={{ color: 'white' }}>Loading authentication...</div>
        </div>
      );
    }
    
    return (
      <AuthOverlay
        isVisible={showAuthOverlay}
        onClose={() => setShowAuthOverlay(false)}
        onAuthSuccess={() => setShowAuthOverlay(false)}
      />
    );
  }

  if (loadingProfile) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '18px',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{ color: 'white' }}>Loading profile...</div>
      </div>
    );
  }

  if (showProfileSetup && user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '18px',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{ color: 'white' }}>Profile setup required...</div>
      </div>
    );
  }

  if (!userProfile && user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        fontSize: '18px',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{ color: 'white' }}>Preparing profile...</div>
      </div>
    );
  }

  return (
    <EnhancedErrorBoundary
      onReset={() => {
        window.location.reload();
      }}
    >
      <div style={{ 
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {/* REPUTATION NOTIFICATIONS */}
        {repNotification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 2000,
            fontSize: '14px',
            maxWidth: '300px'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
              🎯 Reputation Increased!
            </div>
            <div>
              +{repNotification.amount} REP
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {repNotification.message}
            </div>
            <button
              onClick={() => setRepNotification(null)}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: '#4dabf7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MAP COMPONENT */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100vh'
        }}>
            <MapComponent
            center={mapCenter}
            zoom={mapZoom}
            userMarkers={userMarkers}
                        drops={drops}
            gpsPosition={gpsPosition}
            accuracy={accuracy}
            isTracking={isTracking}
            show50mRadius={true}
            onMapClick={handleMapClick}
            onMapCreated={handleMapCreated}
            userRank={userProfile?.rank || 'TOY'}
                        onDropClick={(drop) => {
                          // Handle drop click - could open a modal, panel, etc.
                          console.log('Drop clicked:', drop);
                          // You can add custom logic here to handle the drop interaction
                        }}
            onAddMarkerAtPosition={async (position) => {
              if (user && userProfile) {
                const newMarkerData = {
                  position: [position.lat, position.lng] as [number, number],
                  gpsPosition: gpsPosition ? [gpsPosition[0], gpsPosition[1]] as [number, number] : [position.lat, position.lng] as [number, number]
                };
                await addMarker(newMarkerData);
                
                // Show rep notification
                setRepNotification({
                  show: true,
                  amount: 15,
                  message: 'Marker placed at GPS location! +15 REP'
                });
              }
            }}
            userProfile={userProfile || undefined}
          />

          {/* CONNECTION STATUS */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 15px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
              {isOnline ? '🌐 Online' : '📱 Offline'}
            </div>
            <div style={{ fontSize: '10px' }}>
              {connectionStatus}
            </div>
            {isOfflineMode && (
              <div style={{ marginTop: '5px', fontSize: '10px', color: '#ff6b6b' }}>
                Offline Mode: Limited features available
              </div>
            )}
          </div>

          {/* MAP CONTROLS */}
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 15px',
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <button
              onClick={() => handleLocateUser()}
              disabled={!user || !userProfile}
              style={{
                padding: '8px 15px',
                backgroundColor: user && userProfile ? '#4dabf7' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: user && userProfile ? 'pointer' : 'not-allowed'
              }}
            >
              📍 Locate Me
            </button>
            <button
              onClick={() => setExpandedRadius(prev => prev === 0 ? 100 : 0)}
              style={{
                padding: '8px 15px',
                backgroundColor: expandedRadius > 0 ? '#4dabf7' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {expandedRadius > 0 ? '🔍 Hide Radius' : '🔍 Show 100km'}
            </button>
            <button
              onClick={() => setShowTrackSelectorModal(true)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#4dabf7',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🎵 Track Selector
            </button>
          </div>

{/* CREATE DROP BUTTON */}
          <button
            ref={createDropButtonRef}
            onClick={() => {
              setPendingDropPosition(mapCenter);
              setShowCreateDropModal(true);
            }}
            style={{
              position: 'absolute',
              bottom: '90px', // Positioned above navigation
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '15px 25px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              border: 'none',
              zIndex: 1700,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            }}
          >
            Drop Music 🎵
          </button>
        </div>

        {/* TRACK SELECTOR MODAL */}
        {showTrackSelectorModal && userProfile && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000
          }}>
            <div style={{ ...panelStyle, width: '90%', maxWidth: '600px' }}>
              <h3 style={{ color: '#4dabf7', marginBottom: '20px' }}>🎵 Select Track for Drop</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#aaa', marginBottom: '10px' }}>
                  Select a track from your collection to drop at your current location. 
                  Other players will be able to find and pick it up!
                </p>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                    Select Track:
                  </label>
                  <select
                    value={selectedTrackForMusicDrop || ''}
                    onChange={(e) => setSelectedTrackForMusicDrop(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: '1px solid \'#555\'',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Choose a track...</option>
                    {userProfile?.unlockedTracks?.map((track, index) => (
                      <option key={index} value={track}>
                        {getTrackNameFromUrl(track)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                    Or drop without track (hidden):
                  </label>
                  <input
                    type="checkbox"
                    checked={!selectedTrackForMusicDrop}
                    onChange={(e) => setSelectedTrackForMusicDrop(e.target.checked ? '' : null)}
                    style={{ marginLeft: '10px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowTrackSelectorModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE DROP MODAL */}
        {showCreateDropModal && userProfile && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000
          }}>
            <div style={{ ...panelStyle, width: '90%', maxWidth: '500px' }}>
              <h3 style={{ color: '#4dabf7', marginBottom: '20px' }}>🎵 Drop Music Track</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#aaa', marginBottom: '10px' }}>
                  Select a track from your collection to drop at your current location. 
                  Other players will be able to find and pick it up!
                </p>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                    Select Track:
                  </label>
                  <select
                    value={selectedTrackForMusicDrop || ''}
                    onChange={(e) => setSelectedTrackForMusicDrop(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#333',
                      color: 'white',
                      border: '1px solid \'#555\'',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Choose a track...</option>
                    {userProfile?.unlockedTracks?.map((track, index) => (
                      <option key={index} value={track}>
                        {getTrackNameFromUrl(track)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
                    Or drop without track (hidden):
                  </label>
                  <input
                    type="checkbox"
                    checked={!selectedTrackForMusicDrop}
                    onChange={(e) => setSelectedTrackForMusicDrop(e.target.checked ? '' : null)}
                    style={{ marginLeft: '10px' }}
                  />
                </div>
              </div>
            
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setShowCreateDropModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (mapCenter && pendingDropPosition) {
                      handleCreateDrop(mapCenter[0], mapCenter[1], selectedTrackForMusicDrop || undefined);
                      setShowCreateDropModal(false);
                      setSelectedTrackForMusicDrop(null);
                    }
                  }}
                  disabled={!pendingDropPosition}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#4dabf7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    opacity: pendingDropPosition ? 1 : 0.5
                  }}
                >
                  📍 Drop at Current Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEBUG PANEL */}
        {process.env.NODE_ENV === 'development' && <ErrorTest>Debug Panel</ErrorTest>}

        {/* ERROR RECOVERY PANEL */}
        {hasRecentErrors && <ErrorRecoveryPanel isOpen={true} onClose={() => {}} />}
        
        {/* BOTTOM NAVIGATION */}
        {user && userProfile && (
          <SVGBottomNavigation
            activePanel={activePanel}
            onPanelToggle={handlePanelToggle}
            userProfile={{
              rep: userProfile.rep || 0,
              level: userProfile.level || 1,
              rank: userProfile.rank || 'Newbie',
              username: userProfile.username || 'Player',
              profilePicUrl: userProfile.profilePicUrl || '',
              favoriteColor: userProfile.favoriteColor || '#10b981'
            }}
            unreadCounts={{
              messages: unreadCounts.messages,
              crew: unreadCounts.crew,
              photos: 0, // TODO: Add photo notification logic
              blackbook: 0 // TODO: Add new marker notification logic
            }}
            notificationCount={notificationCount}
          />
        )}

        {/* STATUS PANEL */}
        {user && userProfile && isTracking && (
          <StatusPanel
            isTracking={isTracking}
            userMarkersCount={userProfile?.totalMarkers || 0}
            accuracy={accuracy}
            speed={speed}
          />
        )}

        {/* PANELS */}
        {activePanel === 'profile' && (
          <ProfilePanel
            user={user}
            userProfile={userProfile}
            onClose={() => setActivePanel(null)}
            onProfileUpdate={updateUserProfile}
          />
        )}

        {activePanel === 'blackbook' && (
          <BlackbookPanel
            userMarkers={userMarkers}
            onDeleteMarker={(markerId) => {
              deleteMarker(markerId);
            }}
            onDeleteAllMarkers={() => {
              deleteAllMarkers();
            }}
            onClose={() => setActivePanel(null)}
            userProfile={{
              uid: userProfile?.uid,
              username: userProfile?.username || 'Player',
              profilePicUrl: userProfile?.profilePicUrl || '',
              rank: userProfile?.rank || 'TOY',
              level: userProfile?.level || 1,
              rep: userProfile?.rep || 0,
              totalMarkers: userProfile?.totalMarkers || 0,
              crewId: userProfile?.crewId,
              selectedColor: userProfile?.selectedColor,
              selectedGraffitiStyle: (userProfile as any)?.selectedGraffitiStyle
            }}
            onProfileUpdate={updateUserProfile}
          />
        )}

        {activePanel === 'music' && (
          <div style={{ ...panelStyle, position: 'fixed', top: '20px', left: '20px', right: '20px', bottom: '100px', zIndex: 1500 }}>
            <MusicPlayer
              unlockedTracks={userProfile?.unlockedTracks || []}
              userProfile={userProfile}
              user={user}
              currentTrackIndex={musicPlayerState.currentTrackIndex}
              isPlaying={musicPlayerState.isPlaying}
              onTrackChange={(index) => setMusicPlayerState(prev => ({ ...prev, currentTrackIndex: index }))}
              onPlayStateChange={(playing) => setMusicPlayerState(prev => ({ ...prev, isPlaying: playing }))}
              onVolumeChange={(volume) => setMusicPlayerState(prev => ({ ...prev, volume }))}
              onUnlockedTracksChange={(tracks) => {
                if (userProfile) {
                  updateUserProfile({ unlockedTracks: tracks });
                }
              }}
              volume={musicPlayerState.volume}
            />
          </div>
        )}

        {activePanel === 'map' && (
          <div style={{ ...panelStyle, position: 'fixed', top: '20px', left: '20px', right: '20px', bottom: '100px', zIndex: 1500 }}>
            <h3 style={{ color: '#4dabf7', marginBottom: '15px' }}>🗺️ Map Panel</h3>
            <p style={{ color: '#aaa', marginBottom: '10px' }}>
              Advanced map controls and settings would appear here.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => setActivePanel(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {activePanel === 'photos' && (
          <PhotosPanel
            isOpen={true}
            onClose={() => setActivePanel(null)}
            userProfile={{
              username: userProfile?.username,
              profilePicUrl: userProfile?.profilePicUrl
            }}
          />
        )}

        {activePanel === 'messages' && (
          <DirectMessaging
            isOpen={true}
            onClose={() => setActivePanel(null)}
            userProfile={userProfile}
            gpsPosition={gpsPosition}
          />
        )}

        {activePanel === 'crew' && (
          <CrewChatPanel
            crewId={userProfile?.crewId || null}
            onClose={() => setActivePanel(null)}
            userProfile={userProfile}
          />
        )}

        {/* COLOR PICKER PANEL */}
        {activePanel === 'colors' && (
          <ColorPickerPanel
            isOpen={true}
            onClose={() => setActivePanel(null)}
            unlockedColors={userProfile?.unlockedColors || ['grey']}
            selectedColor={userProfile?.selectedColor}
            onColorSelect={async (colorId, colorHex) => {
              // Update user's selected color in profile
              if (user && userProfile) {
                try {
                  const { doc, updateDoc } = await import('firebase/firestore');
                  const { db } = await import('@/lib/firebase/config');
                  await updateDoc(doc(db, 'users', user.uid), {
                    selectedColor: colorHex
                  });
                  updateUserProfile({ selectedColor: colorHex });
                } catch (error) {
                  console.error('Error updating color:', error);
                }
              }
            }}
            crewId={userProfile?.crewId}
            isSolo={userProfile?.isSolo}
          />
        )}
      </div>
    </EnhancedErrorBoundary>
  );
};

export default HomeComponent;
