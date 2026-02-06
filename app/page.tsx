'use client';

import { StoryManagerProvider } from '@/components/story/StoryManager';
import StoryPanel from '@/components/story/StoryPanel';
import { useMissionTriggers } from '@/hooks/useMissionTriggers';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  Timestamp,
  orderBy,
  limit,
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
import { ref, push, onValue, query as rtdbQuery, orderByChild, limitToLast, off, set, remove, get, serverTimestamp } from 'firebase/database';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { createSprayCanIcon } from '@/components/map/SprayCanIcon';

import PhotoSelectionModal from '@/components/ui/PhotoSelectionModal';
import DropPopup from '@/components/map/DropPopup';
import MarkerPopupCard from '@/components/MarkerPopupCard';
import MusicDropPopup from '@/components/music/MusicDropPopup';
import PhotoDropPopup from '@/components/photo/PhotoDropPopup';
import MarkerDropPopup from '@/components/marker/MarkerDropPopup';
import DirectMessaging from '@/components/DirectMessaging';
import { uploadImageToImgBB } from '@/lib/services/imgbb';
import { saveDropToFirestore, loadAllDrops } from '@/lib/firebase/drops';
import CrewChatPanel from '@/components/chat/CrewChatPanel';

import { ProfilePanel } from '@/components/profile/ProfilePanel';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useMarkers } from '@/hooks/useMarkers';
import { PerformanceSettingsPanel } from '@/src/components/ui/PerformanceSettingsPanel';
import { CrewId } from '@/constants/markers';
import { CREWS } from '@/data/crews';
import { useGPSTracker } from '@/hooks/useGPSTracker';
import { EnhancedErrorBoundary } from '@/src/components/ui/EnhancedErrorBoundary';
import { ErrorRecoveryPanel } from '@/src/components/ui/ErrorRecoveryPanel';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';
import ErrorTest from '@/components/ui/ErrorTest';
import { HIPHOP_TRACKS } from '@/constants/tracks';
import { MarkerName, MarkerDescription, Gender, MARKER_COLORS, MARKER_NAMES, MARKER_DESCRIPTIONS } from '@/constants/markers';
import { NEW_ZEALAND_LOCATIONS, NZ_BOUNDS, NZ_CENTER, NZ_DEFAULT_ZOOM, GPS_DEFAULT_ZOOM } from '@/constants/locations';
import { detectDevicePerformance, panelStyle } from '@/utils';
import {
  UserProfile,
  TopPlayer,
  SoundCloudTrack,
  CrewData,
  Comment,
  UserMarker,
  Drop,
  NearbyCrewMember,
  CrewChatMessage,
  DirectMessage,
  DirectChat
} from '@/types';

// 🔧 PERFORMANCE: Enable SoundCloud for music playback functionality
const ENABLE_SOUNDCLOUD = true;

// PERFORMANCE OPTIMIZATIONS:
// - Component splitting: CrewChatPanel, MusicPlayer, ProfilePanel extracted
// - State management: useMemo, useCallback, React.memo implemented
// - Memory cleanup: Proper event listener cleanup in useEffect
// - Bundle reduction: Separated concerns into modular components

// Helper function to calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// REP Calculation Functions
const calculateRepForMarker = (distanceFromCenter: number | null, markerDescription: MarkerDescription): number => {
  let rep = 10; // Base REP for placing any marker
  
  if (distanceFromCenter && distanceFromCenter <= 50) {
    rep += 5;
  }
  
  switch (markerDescription) {
    case 'Piece/Bombing':
    case 'Burner/Heater':
      rep += 15;
      break;
    case 'Throw-Up':
    case 'Roller/Blockbuster':
      rep += 10;
      break;
    case 'Stencil/Brand/Stamp':
    case 'Paste-Up/Poster':
      rep += 8;
      break;
    case 'Tag/Signature':
      rep += 5;
      break;
    default:
      rep += 3;
  }
  
  return rep;
};

const calculateRank = (rep: number): string => {
  if (rep >= 300) return 'WRITER';
  if (rep >= 100) return 'VANDAL';
  return 'TOY';
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

// Helper function to get track name from URL
const getTrackNameFromUrl = (url: string): string => {
  if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
  if (url.includes('soundcloud.com')) {
    // Extract track name from SoundCloud URL
    const segments = url.split('/');
    const trackSegment = segments[segments.length - 1];
    return trackSegment.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  return 'Unknown Track';
};

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

// Updated avatar generator function with gender-specific avatars
const generateAvatarUrl = (userId: string, username: string, gender?: Gender): string => {
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
    '4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316',
    '3b82f6', '06b6d4', '8b5cf6', 'ef4444', '84cc16', '14b8a6'
  ];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Construct URL based on style
  let url = '';
  
  switch (avatarStyle) {
    case 'adventurer': // Male (boyish)
      url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      // Optional: Add some male-specific options
      break;
      
    case 'avataaars': // Female (girlish)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      // Optional: Add some female-specific options
      break;
      
    case 'bottts': // Other (alien/robot)
      url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      // Add some robot/alien features
      break;
      
    case 'identicon': // Prefer not to say (android/geometric)
      url = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      // Geometric/android style
      break;
      
    default: // open-peeps as fallback
      url = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  }
  
  return url;
};

// Dynamically import leaflet only on client side
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

// Firestore Marker Interface
interface FirestoreMarker {
  position: [number, number];
  name: string;
  description: MarkerDescription;
  color: string;
  timestamp: Timestamp;
  userId: string;
  username: string;
  userProfilePic: string;
  createdAt: Timestamp;
  distanceFromCenter: number | null;
  repEarned: number;
}

// Custom hook for performance monitoring
const usePerformanceMonitor = () => {
  const renderCount = useRef(0);
  
  

  useEffect(() => {
    renderCount.current += 1;
    
    if (renderCount.current > 50) {
      console.warn('High render count detected. Check for infinite loops.');
    }
  });
  
  const logPerformance = useCallback((operation: string, startTime: number) => {
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`Slow operation (${operation}): ${duration.toFixed(2)}ms`);
    }
  }, []);
  
  return { logPerformance };
};

// Custom hook for loading state management
const useLoadingManager = () => {
  const [loadingStates, setLoadingStates] = useState({
    markers: false,
    profile: false,
    drops: false,
    topPlayers: false,
    gps: false,
    auth: true
  });
  
  const setLoading = useCallback((key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const isLoading = useMemo(() => {
    return Object.values(loadingStates).some(state => state);
  }, [loadingStates]);
  
  return { loadingStates, setLoading, isLoading };
};

// Custom hook for safe operations with error handling
const useSafeOperation = (errorHandler: any) => {
  const safeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await operation();
    } catch (error) {
      console.error('Operation failed:', error);
      return fallback;
    }
  }, []);
  
  return { safeOperation };
};

// Memoized Marker Component

const MemoizedMarker = React.memo(({ marker, user, onClick }: {
  marker: UserMarker,
  user: FirebaseUser | null,
  onClick: (marker: UserMarker) => void
}) => {
  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    
    const markerColor = marker.color || '#ff6b6b';
    return createSprayCanIcon(markerColor, 36);
  }, [marker.color]);
  
  return (
    <Marker 
      position={marker.position}
      icon={customIcon}
      eventHandlers={{ click: () => onClick(marker) }}
    />
  );
});

MemoizedMarker.displayName = 'MemoizedMarker';


const HomeComponent = () => {
  const { hasRecentErrors } = useErrorHandler();
  const { logPerformance } = usePerformanceMonitor();
  const { loadingStates, setLoading, isLoading } = useLoadingManager();
  const { safeOperation } = useSafeOperation(useErrorHandler());
  
  // ========== STATE DECLARATIONS ==========
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState<number>(4);
  
  const [showStoryPanel, setShowStoryPanel] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [show50mRadius, setShow50mRadius] = useState(true);
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);
  const [nextMarkerNumber, setNextMarkerNumber] = useState(1);
  
  // Offline/Online mode states
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastKnownPosition, setLastKnownPosition] = useState<[number, number] | null>(null);
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);
  
  // User profile states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileGender, setProfileGender] = useState<Gender>('prefer-not-to-say');
  const [profileLoading, setProfileLoading] = useState(false);
  const [showCrewChat, setShowCrewChat] = useState(false);
  const [profileCrewChoice, setProfileCrewChoice] = useState<'crew' | 'solo'>('crew');
  const [profileCrewName, setProfileCrewName] = useState('');
  
  // Marker color states
  const [selectedMarkerColor, setSelectedMarkerColor] = useState('#10b981');

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [unlockedTracks, setUnlockedTracks] = useState<string[]>(['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1']);
  
  // SoundCloud states
  const [soundCloudTracks, setSoundCloudTracks] = useState<SoundCloudTrack[]>([]);
  const [isSoundCloudLoading, setIsSoundCloudLoading] = useState(false);
  
  // REP Notification state
  const [repNotification, setRepNotification] = useState<{ show: boolean, amount: number, message: string } | null>(null);
  
  // Drop states
  const [drops, setDrops] = useState<Drop[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDropTypeModal, setShowDropTypeModal] = useState(false);
  const [pendingDropPosition, setPendingDropPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState<MarkerDescription>('Tag/Signature');
  const [selectedTrackForMusicDrop, setSelectedTrackForMusicDrop] = useState<string | null>(null);

  // Crew states
  const [nearbyCrewMembers, setNearbyCrewMembers] = useState<NearbyCrewMember[]>([]);
  const [expandedRadius, setExpandedRadius] = useState(50);
  
  // Last marker date for streak bonus
  const [lastMarkerDate, setLastMarkerDate] = useState<string | null>(null);
  
  // Top players state
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [showTopPlayers, setShowTopPlayers] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showPerformanceSettings, setShowPerformanceSettings] = useState(false);
  
  // Filter toggle
  const [showOnlyMyDrops, setShowOnlyMyDrops] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [showErrorRecovery, setShowErrorRecovery] = useState(false);
  const [recoveryError, setRecoveryError] = useState<Error | null>(null);
  
  // Selected marker state
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null);
  
  // Panel control states
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showPhotosPanel, setShowPhotosPanel] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [showMusicPanel, setShowMusicPanel] = useState(false);

  
  // 🆕 Mission notification state
  const [missionNotification, setMissionNotification] = useState<{
    show: boolean;
    title: string;
    description: string;
    reward: number;
  } | null>(null);

  // Refreshing state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Crew selection state
  const [selectedCrew, setSelectedCrew] = useState<CrewId | ''>('');
  const [crewChoice, setCrewChoice] = useState<'crew' | 'solo'>('crew');
  
  // ========== PERFORMANCE SETTINGS ==========
  const [crewDetectionEnabled, setCrewDetectionEnabled] = useState(true);
  const [markerQuality, setMarkerQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Dynamic quality settings
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>(
    detectDevicePerformance()
  );

  // Marker limits based on quality
  const markerLimit = graphicsQuality === 'low' ? 12 : graphicsQuality === 'medium' ? 25 : 50;
  
  // ========== PERFORMANCE MEMOIZATION ==========
  // Memoize markers by user
  const markersByUser = useMemo(() => {
    const byUser = userMarkers.reduce((acc, marker) => {
      if (!acc[marker.userId]) {
        acc[marker.userId] = [];
      }
      acc[marker.userId].push(marker);
      return acc;
    }, {} as Record<string, UserMarker[]>);
    
    return byUser;
  }, [userMarkers]);

  // Memoize filtered markers
  const filteredMarkers = useMemo(() => {
    if (showOnlyMyDrops && user) {
      return markersByUser[user.uid] || [];
    }
    return userMarkers.slice(0, markerLimit);
  }, [userMarkers, showOnlyMyDrops, user, markerLimit, markersByUser]);

  // Memoize marker bounds
  const markerBounds = useMemo(() => {
    return calculateBoundsFromMarkers(userMarkers);
  }, [userMarkers]);
  
  // ========== REFS ==========
  const mapRef = useRef<L.Map | null>(null);
  
  // 🆕 Story Manager Context
  const [storyManagerInitialized, setStoryManagerInitialized] = useState(false);

  // ========== HOOKS ==========
const {
  position: gpsPosition,
  accuracy,
  speed,
  heading,
  error: gpsError,
  isTracking,
  isLoading: gpsLoading,
  startTracking,
  stopTracking
} = useGPSTracker();

  // 🆕 MISSION TRIGGERS HOOK
  const {
    triggerDisappearance,
    checkMissionCompletion,
    triggerMissionEvent,
    triggerMessagingEvent,
    activeMissions,
    completedMissions
  } = useMissionTriggers({
    userMarkers,
    gpsPosition,
    userProfile
  });

  // 🆕 TIME OF DAY HOOK - Day/Night weather system
  const { 
    hour, 
    isNight, 
    timeString, 
    sunPosition,
    theme 
  } = useTimeOfDay();

  // Derive GPS status from state
  const gpsStatus = gpsLoading ? 'acquiring' : gpsError ? 'error' : isTracking ? 'tracking' : 'idle';

  // ========== CLEANUP EFFECT ==========
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    // Clean up crew detection interval
    if (crewDetectionEnabled && userProfile?.crewId) {
      const crewInterval = setInterval(() => {
        detectNearbyCrewMembers();
      }, 30000);
      intervals.push(crewInterval);
    }
    
    // Clean up map listeners
    const mapInstance = mapRef.current;
    
    return () => {
      // Clear all intervals
      intervals.forEach(clearInterval);
      
      // Clean up map listeners
      if (mapInstance) {
        mapInstance.off('click');
      }
      
      // Clean up SoundCloud iframes
      const soundCloudIframes = document.querySelectorAll('iframe[src*="soundcloud.com"]');
      soundCloudIframes.forEach(iframe => {
        iframe.remove();
      });
    };
  }, [crewDetectionEnabled, userProfile?.crewId]);

  // Initialize selected marker color from user profile on mount
  useEffect(() => {
    if (userProfile?.favoriteColor) {
      setSelectedMarkerColor(userProfile.favoriteColor);
    }
  }, [userProfile?.favoriteColor]);

  // Fix marker colors on page refresh - ensure all markers use correct colors
  useEffect(() => {
    if (userProfile?.favoriteColor && userMarkers.length > 0) {
      // Update any markers that might have wrong colors
      const updatedMarkers = userMarkers.map(marker => {
        // Only update markers that belong to the current user and have wrong color
        if (marker.userId === user?.uid && marker.color !== userProfile.favoriteColor) {
          return {
            ...marker,
            color: userProfile.favoriteColor || '#10b981'
          };
        }
        return marker;
      });
      
      if (updatedMarkers.some((marker, index) => marker.color !== userMarkers[index].color)) {
        setUserMarkers(updatedMarkers);
      }
    }
  }, [userProfile?.favoriteColor, userMarkers, user?.uid]);
  
  useEffect(() => {
    const initializeSoundCloudTracks = async () => {
      const soundCloudUrls = unlockedTracks.filter(track => track.includes('soundcloud.com'));
      
      if (soundCloudUrls.length === 0) return;
      
      setIsSoundCloudLoading(true);
      
      const tracks = soundCloudUrls.map((url, index) => ({
        url,
        title: getTrackNameFromUrl(url),
        isLoaded: false,
        iframeId: `soundcloud-player-${Date.now()}-${index}`
      }));
      
      setSoundCloudTracks(tracks);
      setIsSoundCloudLoading(false);
    };

    initializeSoundCloudTracks();
  }, [unlockedTracks]);

  useEffect(() => {
    if (repNotification) {
      const timer = setTimeout(() => {
        setRepNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [repNotification]);

  const togglePlay = () => {
    if (unlockedTracks.length === 0) return;
    
    setIsPlaying(!isPlaying);
  };

  const playNextTrack = () => {
    if (unlockedTracks.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % unlockedTracks.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const playPreviousTrack = () => {
    if (unlockedTracks.length === 0) return;
    
    const prevIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : unlockedTracks.length - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  const getCurrentTrackName = () => {
    if (unlockedTracks.length === 0) return 'No tracks unlocked';
    
    const track = unlockedTracks[currentTrackIndex];
    if (track.includes('soundcloud.com')) {
      const soundCloudTrack = soundCloudTracks.find(t => t.url === track);
      return soundCloudTrack?.title || getTrackNameFromUrl(track);
    }
    
    return getTrackNameFromUrl(track);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const calculateStreakBonus = (): number => {
    const today = new Date().toDateString();
    if (lastMarkerDate === today) {
      return 0;
    }
    setLastMarkerDate(today);
    return 25;
  };

  const loadAllMarkers = async (): Promise<void> => {
    const startTime = performance.now();
    setLoadingMarkers(true);
    try {
      // 🔧 PERFORMANCE: Dynamic limit based on marker quality
      const markerLimit = markerQuality === 'low' ? 12 : markerQuality === 'medium' ? 25 : 50;
      const q = query(
        collection(db, 'markers'),
        orderBy('createdAt', 'desc'),
        limit(markerLimit)
      );
      
      const querySnapshot = await getDocs(q);
      const loadedMarkers: UserMarker[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirestoreMarker;
        loadedMarkers.push({
          id: `marker-${doc.id}`,
          firestoreId: doc.id,
          position: data.position,
          name: data.name,
          description: data.description,
          color: data.color || '#10b981',
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          userId: data.userId,
          username: data.username || 'Anonymous',
          userProfilePic: data.userProfilePic || generateAvatarUrl(data.userId, data.username),
          distanceFromCenter: data.distanceFromCenter,
          repEarned: data.repEarned || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
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
  };

  const loadTopPlayers = async (): Promise<void> => {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const allUsers: TopPlayer[] = [];
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        allUsers.push({
          uid: data.uid,
          username: data.username,
          profilePicUrl: data.profilePicUrl,
          rank: data.rank,
          rep: data.rep || 0,
          level: data.level || 1,
          totalMarkers: data.totalMarkers || 0,
          lastActive: data.lastActive?.toDate() || new Date()
        });
      });
      
      const sortedUsers = allUsers
        .filter(user => user.username && user.rep > 0)
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
              const latestMarker = markersSnapshot.docs[0].data();
              return {
                ...player,
                position: latestMarker.position
              };
            }
          } catch (error) {
            console.error(`Error getting position for ${player.username}:`, error);
          }
          
          return player;
        })
      );
      
      setTopPlayers(playersWithPositions);
    } catch (error) {
      console.error('Error loading top players:', error);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!user || !profileUsername.trim()) {
      alert('Please enter a username');
      return;
    }
    
    setProfileLoading(true);
    
    try {
      const profilePicUrl = generateAvatarUrl(user.uid, profileUsername.trim(), profileGender);
      
      let crewId: CrewId | null = null;
      let crewName: string | null = null;
      const isSolo = profileCrewChoice === 'solo';
      
      if (!isSolo && selectedCrew) {
        // Validate selectedCrew is a valid crew ID
        const validCrewIds = ['bqc', 'sps', 'lzt', 'dgc'];
        if (!validCrewIds.includes(selectedCrew)) {
          throw new Error('Invalid crew selection');
        }
        
        crewId = selectedCrew;
        const selectedCrewData = CREWS.find(c => c.id === selectedCrew);
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
      
      const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        username: profileUsername.trim(),
        gender: profileGender,
        profilePicUrl: profilePicUrl,
        rep: 0,
        level: 1,
        rank: 'TOY',
        totalMarkers: 0,
        favoriteColor: selectedMarkerColor,
        unlockedTracks: ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'],
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
        kaiTiakiEvaluationsReceived: 0
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
      const defaultTrack = 'https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1';
      setUnlockedTracks([defaultTrack]);
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
        alert(`🎉 Welcome to Blackout NZ, ${profileUsername}!\n\n🎵 Your music is now playing: Blackout - Classic\n\nThe city awaits your tags. Get out there and make your mark!`);
      }, 500);
      
    } catch (error: any) {
      console.error('Error creating profile:', error);
      alert(`Failed to create profile: ${error.message}`);
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleSignup = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setShowSignup(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setIsPlaying(false);
      
      await signOut(auth);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const saveFavoriteColor = async (color: string): Promise<void> => {
    if (!user || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        favoriteColor: color,
        lastActive: Timestamp.now()
      });
      
      setUserProfile(prev => prev ? {
        ...prev,
        favoriteColor: color
      } : null);
      
    } catch (error) {
      console.error('Error saving favorite color:', error);
    }
  };

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        setMapReady(true);
      });
    }
  }, []);

  const loadDrops = useCallback(async (): Promise<void> => {
    try {
      const loadedDrops = await loadAllDrops();
      // 🔧 PERFORMANCE: Ultra aggressive drop limiting
      const dropLimit = markerQuality === 'low' ? 30 : markerQuality === 'medium' ? 75 : 150;
      const limitedDrops = (loadedDrops as Drop[]).slice(0, dropLimit);
      setDrops(limitedDrops);
    } catch (error) {
      console.error('Error loading drops:', error);
    }
  }, [markerQuality]);

const loadUserProfile = async (currentUser: FirebaseUser): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      
      let profilePicUrl = data.profilePicUrl;
      if (!profilePicUrl || profilePicUrl === '') {
        profilePicUrl = generateAvatarUrl(currentUser.uid, data.username, data.gender);
      }
      
      const favoriteColor = data.favoriteColor || '#10b981';
      setSelectedMarkerColor(favoriteColor);

      const userUnlockedTracks = data.unlockedTracks || ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'];
      setUnlockedTracks(userUnlockedTracks);

      const userProfileData: UserProfile = {
        uid: data.uid || currentUser.uid,
        email: data.email || currentUser.email || '',
        username: data.username || 'Anonymous',
        gender: data.gender || 'prefer-not-to-say',
        profilePicUrl: profilePicUrl,
        rep: data.rep || 0,
        level: data.level || 1,
        rank: data.rank || 'TOY',
        totalMarkers: data.totalMarkers || 0,
        favoriteColor: favoriteColor,
        unlockedTracks: userUnlockedTracks,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastActive: data.lastActive?.toDate() || new Date(),
        // Make sure crewId is a short code, not Firestore ID
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
        kaiTiakiEvaluationsReceived: data.kaiTiakiEvaluationsReceived || 0
      };
      
      // Set profile first, then start data loading
      setUserProfile(userProfileData);
      setShowProfileSetup(false);
      
      // Load additional data after profile is set to avoid race conditions
      try {
        await Promise.all([
          loadTopPlayers(),
          loadAllMarkers(),
          loadDrops()
        ]);
      } catch (loadError) {
        console.error('Error loading additional data:', loadError);
        // Don't fail profile loading if other data fails
      }
      
      return true;
    } else {
      setShowProfileSetup(true);
      setUserProfile(null);
      return false;
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    setShowProfileSetup(true);
    setUserProfile(null);
    return false;
  }
};

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      if (currentUser) {
        setLoadingUserProfile(true);
        try {
          const hasProfile = await loadUserProfile(currentUser);
          if (hasProfile) {
            // Load all data
            await Promise.all([
              loadTopPlayers(),
              loadAllMarkers(),
              loadDrops()
            ]);
          }
        } catch (error) {
          console.error('Error during initialization:', error);
        } finally {
          setLoadingUserProfile(false);
        }
      } else {
        setUserProfile(null);
        setUserMarkers([]);
        setDrops([]);
        setTopPlayers([]);
        setShowProfileSetup(false);
        setNextMarkerNumber(1);
        setLoadingUserProfile(false);
        setIsPlaying(false);

      }
    });
    
    return () => unsubscribe();
  }, [loadDrops]);

  // Initialize Story Manager when user is authenticated
  useEffect(() => {
    if (user && userProfile) {
      setStoryManagerInitialized(true);
    } else {
      setStoryManagerInitialized(false);
    }
  }, [user, userProfile]);

  

  useEffect(() => {
    loadDrops();
  }, [loadDrops]);

  // Crew detection function
  const detectNearbyCrewMembers = useCallback(async () => {
    if (!gpsPosition || !userProfile || !user || userProfile.isSolo || !userProfile.crewId) {
      setExpandedRadius(50);
      setNearbyCrewMembers([]);
      return;
    }

    try {
      const crewDoc = await getDoc(doc(db, 'crews', userProfile.crewId!));
      if (!crewDoc.exists()) {
        setExpandedRadius(50);
        setNearbyCrewMembers([]);
        return;
      }

      const crewData = crewDoc.data();
      const crewMemberIds = crewData.members || [];
      
      const otherMemberIds = crewMemberIds.filter((uid: string) => uid !== user.uid);
      
      if (otherMemberIds.length === 0) {
        setExpandedRadius(50);
        setNearbyCrewMembers([]);
        return;
      }

      const nearbyMembers: NearbyCrewMember[] = [];
      
      topPlayers.forEach((player) => {
        if (otherMemberIds.includes(player.uid) && player.position) {
          const distance = calculateDistance(
            gpsPosition[0],
            gpsPosition[1],
            player.position[0],
            player.position[1]
          );
          
          if (distance <= 200) {
            nearbyMembers.push({
              uid: player.uid,
              username: player.username,
              distance: Math.round(distance)
            });
          }
        }
      });

      const newRadius = 50 + (nearbyMembers.length * 50);
      setExpandedRadius(newRadius);
      setNearbyCrewMembers(nearbyMembers);
    } catch (error) {
      console.error('Error detecting nearby crew members:', error);
      setExpandedRadius(50);
      setNearbyCrewMembers([]);
    }
  }, [gpsPosition, userProfile, user, topPlayers]);

  useEffect(() => {
    if (!gpsPosition || !userProfile || !user || userProfile.isSolo || !userProfile.crewId) {
      setExpandedRadius(50);
      setNearbyCrewMembers([]);
      return;
    }

    // Run immediately
    detectNearbyCrewMembers();
    
    // 🔧 PERFORMANCE: Increase interval to 30 seconds (was 20s)
    const detectionInterval = crewDetectionEnabled ? 30000 : 60000;
    const interval = setInterval(detectNearbyCrewMembers, detectionInterval);
    
    return () => clearInterval(interval);
  }, [gpsPosition, userProfile, user, topPlayers, crewDetectionEnabled, detectNearbyCrewMembers]);
  
  useEffect(() => {
    if (gpsPosition && !mapCenter) {
      const [lat, lng] = gpsPosition;
      const withinNZ = lat >= NZ_BOUNDS[0][0] && lat <= NZ_BOUNDS[1][0] &&
                      lng >= NZ_BOUNDS[0][1] && lng <= NZ_BOUNDS[1][1];

      if (withinNZ) {
        setMapCenter(gpsPosition);
        setZoom(GPS_DEFAULT_ZOOM);
        console.log('Map centered on GPS location within NZ');
      } else {
        setMapCenter(NZ_CENTER);
        setZoom(NZ_DEFAULT_ZOOM);
        setError('🏝️ Kia ora! Blackout is NZ-only. Your location appears to be outside Aotearoa. The map has been centered on New Zealand for the best street art experience! 🗺️');
        console.log('GPS outside NZ bounds, centering on NZ');
      }
    }
  }, [gpsPosition, mapCenter]);

  useEffect(() => {
    if (gpsPosition && isTracking && mapRef.current) {
      setMapCenter(gpsPosition);
      mapRef.current.setView(gpsPosition, zoom);
    }
  }, [gpsPosition, isTracking, zoom]);

  const centerMap = useCallback((coords: [number, number], zoomLevel: number = 15) => {
    setMapCenter(coords);
    setZoom(zoomLevel);
    
    if (mapRef.current) {
      mapRef.current.setView(coords, zoomLevel);
    }
  }, []);

  const saveMarkerToFirestore = async (marker: UserMarker): Promise<string | null> => {
    if (!user || !userProfile) return null;
    
    try {
      const repEarned = calculateRepForMarker(marker.distanceFromCenter || null, marker.description);
      const streakBonus = calculateStreakBonus();
      const totalRep = repEarned + streakBonus;
      
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
        repEarned: totalRep
      };
      
      const docRef = await addDoc(collection(db, 'markers'), markerData);
      
      const newRep = userProfile.rep + totalRep;
      const newRank = calculateRank(newRep);
      const newLevel = calculateLevel(newRep);
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        rep: newRep,
        rank: newRank,
        level: newLevel,
        totalMarkers: userProfile.totalMarkers + 1,
        lastActive: Timestamp.now()
      });
      
      setUserProfile(prev => prev ? {
        ...prev,
        rep: newRep,
        rank: newRank,
        level: newLevel,
        totalMarkers: prev.totalMarkers + 1
      } : null);
      
      await loadTopPlayers();
      
      let message = 'Marker placed!';
      if (streakBonus > 0) {
        message = '🔥 Daily Streak Bonus!';
      } else if (marker.description === 'Piece/Bombing' || marker.description === 'Burner/Heater') {
        message = '🔥 BOMBING REP!';
      }
      
      setRepNotification({
        show: true,
        amount: totalRep,
        message: message
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving marker to Firestore:', error);
      return null;
    }
  };

  // UPDATED: Handle photo selection with GPS extraction
  const handlePhotoSelect = useCallback(async (photoData: { 
    url: string; 
    file: File; 
    location?: { lat: number; lng: number } 
  }) => {
    if (!user || !userProfile) {
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const photoUrl = photoData.url;
      
      // Determine where to place the drop
      let dropLat: number, dropLng: number;
      let usePhotoLocation = false;

      if (photoData.location) {
        // Use the photo's GPS location
        dropLat = photoData.location.lat;
        dropLng = photoData.location.lng;
        usePhotoLocation = true;
        
        // Check if photo location is within New Zealand bounds
        const withinNZ = dropLat >= NZ_BOUNDS[0][0] && dropLat <= NZ_BOUNDS[1][0] &&
                        dropLng >= NZ_BOUNDS[0][1] && dropLng <= NZ_BOUNDS[1][1];
        
        if (!withinNZ) {
          alert('⚠️ This photo was taken outside New Zealand.\n\nThe drop will be placed at your current location instead.');
          if (gpsPosition) {
            dropLat = gpsPosition[0];
            dropLng = gpsPosition[1];
            usePhotoLocation = false;
          } else {
            throw new Error('Photo location outside NZ and no GPS available');
          }
        }
      } else {
        // Use pending drop position (manual placement)
        if (!pendingDropPosition) {
          throw new Error('No drop position available');
        }
        dropLat = pendingDropPosition.lat;
        dropLng = pendingDropPosition.lng;
      }

      const newDrop: Drop = {
        lat: dropLat,
        lng: dropLng,
        photoUrl,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
        photoMetadata: {
          hasLocation: usePhotoLocation,
          originalLat: photoData.location?.lat,
          originalLng: photoData.location?.lng,
          timestamp: new Date(photoData.file.lastModified)
        }
      };

      const dropId = await saveDropToFirestore(newDrop);
      
      if (dropId) {
        console.log('📸 Photo drop created:', {
          dropId,
          photoUrl: newDrop.photoUrl,
          hasGPSLocation: usePhotoLocation,
          location: usePhotoLocation ? `${dropLat}, ${dropLng}` : 'Manual placement'
        });
        
        // Reward for GPS-tagged photos
        const repEarned = usePhotoLocation ? 15 : 10;
        const newRep = (userProfile.rep || 0) + repEarned;
        const newRank = calculateRank(newRep);
        const newLevel = calculateLevel(newRep);

        const currentTracks = userProfile.unlockedTracks || ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'];
        const newTracks = unlockRandomTrack(currentTracks);

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          rep: newRep,
          rank: newRank,
          level: newLevel,
          unlockedTracks: newTracks,
          lastActive: Timestamp.now(),
          photosTaken: (userProfile.photosTaken || 0) + 1
        });

        setUserProfile(prev => prev ? {
          ...prev,
          rep: newRep,
          rank: newRank,
          level: newLevel,
          unlockedTracks: newTracks,
          photosTaken: (prev.photosTaken || 0) + 1
        } : prev);

        setUnlockedTracks(newTracks);

        setDrops(prev => [{ ...newDrop, firestoreId: dropId, id: `drop-${dropId}` }, ...prev]);
        
        setShowPhotoModal(false);
        setPendingDropPosition(null);

        const trackUnlocked = newTracks.length > currentTracks.length;
        const unlockedTrackName = trackUnlocked ? getTrackNameFromUrl(newTracks[newTracks.length - 1]) : '';

        const message = usePhotoLocation
          ? trackUnlocked
            ? `🎵 NEW TRACK UNLOCKED! 🎵\n\n${unlockedTrackName}\n\n📍 GPS Photo Drop Placed!\n+${repEarned} REP (GPS Bonus!)\nNew Rank: ${newRank}`
            : `📍 GPS Photo Drop Placed!\n\n+${repEarned} REP (GPS Bonus!)\nNew Rank: ${newRank}`
          : trackUnlocked
            ? `🎵 NEW TRACK UNLOCKED! 🎵\n\n${unlockedTrackName}\n\n📸 Photo Drop Placed!\n+${repEarned} REP\nNew Rank: ${newRank}`
            : `📸 Photo Drop Placed!\n\n+${repEarned} REP\nNew Rank: ${newRank}`;

        alert(message);

        // Center map on the drop location
        if (mapRef.current) {
          mapRef.current.setView([dropLat, dropLng], 17);
        }
      } else {
        throw new Error('Failed to save drop');
      }
    } catch (error) {
      console.error('Error creating drop:', error);
      alert(`Failed to create drop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [user, userProfile, pendingDropPosition, gpsPosition, loadDrops]);

  const handleMarkerDrop = useCallback(async () => {
    if (!user || !userProfile || !pendingDropPosition) {
      return;
    }

    try {
      const newDrop: Drop = {
        lat: pendingDropPosition.lat,
        lng: pendingDropPosition.lng,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
      };

      const dropId = await saveDropToFirestore(newDrop);

      const markerData: UserMarker = {
        id: `temp-${Date.now()}`,
        position: [pendingDropPosition.lat, pendingDropPosition.lng],
        name: 'Pole',
        description: selectedMarkerType,
        color: selectedMarkerColor, // USE SELECTED COLOR HERE
        timestamp: new Date(),
        userId: user.uid,
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
      };

      const markerId = await saveMarkerToFirestore(markerData);

      if (dropId && markerId) {
        const repEarned = 5;
        const newRep = (userProfile.rep || 0) + repEarned;
        const newRank = calculateRank(newRep);
        const newLevel = calculateLevel(newRep);

        const currentTracks = userProfile.unlockedTracks || ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1'];
        const newTracks = unlockRandomTrack(currentTracks);

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          rep: newRep,
          level: newLevel,
          rank: newRank,
          unlockedTracks: newTracks,
        });

        setUserProfile(prev => prev ? {
          ...prev,
          rep: newRep,
          level: newLevel,
          rank: newRank,
          unlockedTracks: newTracks
        } : null);

        setUnlockedTracks(newTracks);

        const trackUnlocked = newTracks.length > currentTracks.length;
        const unlockedTrackName = trackUnlocked ? getTrackNameFromUrl(newTracks[newTracks.length - 1]) : '';

        const notificationMessage = trackUnlocked
          ? `🎵 ${unlockedTrackName} Unlocked! 🎵\n${selectedMarkerType} marker placed!`
          : `${selectedMarkerType} marker placed!`;

        setRepNotification({ show: true, amount: repEarned, message: notificationMessage });

        await loadDrops();
        await loadAllMarkers();
      }

      setShowDropTypeModal(false);
      setPendingDropPosition(null);

    } catch (error) {
      console.error('Error creating marker drop:', error);
      alert(`Failed to create marker drop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, userProfile, pendingDropPosition, selectedMarkerType, selectedMarkerColor, loadDrops, loadAllMarkers]);

  const handlePhotoDrop = useCallback(() => {
    setShowDropTypeModal(false);
    setShowPhotoModal(true);
  }, []);

  const handleMusicDrop = useCallback(async () => {
    if (!user || !userProfile || !pendingDropPosition) return;
    const tracks = userProfile.unlockedTracks ?? unlockedTracks;
    if (tracks.length === 0) return;

    const trackToDrop = selectedTrackForMusicDrop || tracks[0];
    try {
      const newDrop: Drop = {
        lat: pendingDropPosition.lat,
        lng: pendingDropPosition.lng,
        trackUrl: trackToDrop,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
      };

      const dropId = await saveDropToFirestore(newDrop);
      if (!dropId) throw new Error('Failed to save drop');

      const newTracks = tracks.filter((t) => t !== trackToDrop);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        unlockedTracks: newTracks,
        lastActive: Timestamp.now(),
      });

      setUserProfile((prev) =>
        prev ? { ...prev, unlockedTracks: newTracks } : null
      );
      setUnlockedTracks(newTracks);
      setSelectedTrackForMusicDrop(null);

      setRepNotification({
        show: true,
        amount: 0,
        message: `Music drop placed! You gave away "${getTrackNameFromUrl(trackToDrop)}". ${newTracks.length === 0 ? "You have no songs left." : `${newTracks.length} track(s) remaining.`}`,
      });

      await loadDrops();
      setShowDropTypeModal(false);
      setPendingDropPosition(null);
    } catch (e) {
      console.error('Error creating music drop:', e);
      alert(`Failed to place music drop: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }, [user, userProfile, pendingDropPosition, selectedTrackForMusicDrop, unlockedTracks, loadDrops]);

  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    if (isOfflineMode) {
      alert('Cannot place markers in offline mode. Switch to online mode to place drops.');
      return;
    }

    if (!user) {
      alert('Please sign in first!');
      return;
    }

    if (loadingUserProfile) {
      //alert('Loading your profile—try again in a moment.');
      return;
    }

    if (showProfileSetup || !userProfile) {
      alert('Please complete your profile first!');
      return;
    }

    const { lat, lng } = e.latlng;

    // Check if click is within the radius circle
    if (!gpsPosition) {
      alert('GPS location not available. Enable location services to place drops.');
      return;
    }

    const distanceFromGPS = calculateDistance(
      gpsPosition[0],
      gpsPosition[1],
      lat,
      lng
    );

    if (distanceFromGPS > expandedRadius) {
      //alert(`❌ Too far! You can only place drops within ${expandedRadius}m of your location.\n\nDistance: ${Math.round(distanceFromGPS)}m`);
      return;
    }

    setPendingDropPosition({ lat, lng });
    setShowDropTypeModal(true);
  }, [user, userProfile, loadingUserProfile, showProfileSetup, isOfflineMode, gpsPosition, expandedRadius]);

  // Memoized map click handler for performance
  const memoizedHandleMapClick = useMemo(() => handleMapClick, [handleMapClick]);

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const centerOnGPS = useCallback(() => {
    if (gpsPosition && mapRef.current) {
      setMapCenter(gpsPosition);
      setZoom(17);
      mapRef.current.setView(gpsPosition, 17);
    } else {
      alert('GPS location not available. Please enable location services.');
    }
  }, [gpsPosition]);

  const updateMarker = (id: string, updates: Partial<UserMarker>) => {
    setUserMarkers(prev => 
      prev.map(marker => 
        marker.id === id ? { ...marker, ...updates } : marker
      )
    );
  };

  const deleteMarker = async (id: string): Promise<void> => {
    const markerToDelete = userMarkers.find(marker => marker.id === id);
    
    if (markerToDelete?.firestoreId) {
      try {
        await deleteDoc(doc(db, 'markers', markerToDelete.firestoreId));
        
        if (markerToDelete.userId === user?.uid && userProfile && user) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            totalMarkers: userProfile.totalMarkers - 1
          });
          
          setUserProfile(prev => prev ? {
            ...prev,
            totalMarkers: prev.totalMarkers - 1
          } : null);
        }
      } catch (error) {
        console.error('Error deleting marker from Firestore:', error);
      }
    }
    
    setUserMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  const deleteAllMarkers = async (): Promise<void> => {
    if (userMarkers.length > 0 && window.confirm(`Are you sure you want to delete all ${userMarkers.length} markers?`)) {
      const userMarkerIds = userMarkers
        .filter(marker => marker.userId === user?.uid && marker.firestoreId)
        .map(marker => marker.firestoreId);
      
      const deletePromises = userMarkerIds.map(id => 
        id ? deleteDoc(doc(db, 'markers', id)) : Promise.resolve()
      );
      
      await Promise.all(deletePromises);
      
      if (user && userProfile) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          totalMarkers: 0
        });
        
        setUserProfile(prev => prev ? {
          ...prev,
          totalMarkers: 0
        } : null);
      }
      
      setUserMarkers([]);
      setNextMarkerNumber(1);
    }
  };

  const goToMarker = (marker: UserMarker) => {
    centerMap(marker.position, 18);
  };

  const newZealandLocations = NEW_ZEALAND_LOCATIONS;

  const handleRefreshAll = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await loadAllMarkers();
      await loadTopPlayers();
      await loadDrops();
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ========== MISSION TRIGGERS ==========
  // Trigger missions when markers are placed
  useEffect(() => {
    try {
      if (userProfile && userProfile.markersPlaced && triggerMissionEvent) {
        // Trigger missions based on markers placed
        if (userProfile.markersPlaced >= 3) {
          triggerMissionEvent('place_3_markers', {
            count: userProfile.markersPlaced,
            timestamp: new Date()
          });
        }
        
        if (userProfile.markersPlaced >= 10) {
          triggerMissionEvent('place_10_markers', {
            count: userProfile.markersPlaced,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Mission trigger error:', error);
    }
  }, [userProfile?.markersPlaced, triggerMissionEvent]);

  // Trigger missions when REP increases
  useEffect(() => {
    try {
      if (userProfile?.rep && triggerMissionEvent) {
        if (userProfile.rep >= 50) {
          triggerMissionEvent('reach_50_rep', {
            rep: userProfile.rep,
            timestamp: new Date()
          });
        }
        
        if (userProfile.rep >= 100) {
          triggerMissionEvent('reach_100_rep', {
            rep: userProfile.rep,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Mission trigger error:', error);
    }
  }, [userProfile?.rep, triggerMissionEvent]);

  // The useMissionTriggers hook should be integrated
  // with marker placement and REP gains
  useEffect(() => {
    try {
      if (userProfile?.markersPlaced) {
        triggerMissionEvent('markers_placed', {
          count: userProfile.markersPlaced
        });
      }
    } catch (error) {
      console.error('Mission trigger error:', error);
    }
  }, [userProfile?.markersPlaced]);

  // ========== AUTH LOADING CHECK ==========
  if (loadingAuth) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #4dabf7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '18px', color: '#374151' }}>
          Loading...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Login/Signup overlay
  if (!user) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(78, 205, 196, 0.1) 0%, transparent 20%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3)',
          backgroundSize: '400% 400%',
          animation: 'gradientBG 15s ease infinite',
          opacity: 0.08,
          zIndex: 1
        }}></div>
        
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '15px 20px',
          borderRadius: '15px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 2,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: '280px',
          maxWidth: '400px',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <button
              onClick={togglePlay}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                backgroundColor: isPlaying ? '#ef4444' : '#10b981',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                🎵 {getCurrentTrackName()}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                Track {currentTrackIndex + 1} of {unlockedTracks.length} unlocked
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                {isPlaying ? '● Now Playing' : 'Paused'}
              </div>
            </div>
            <button
              onClick={playNextTrack}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#4dabf7',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              }}
              title="Next Track"
            >
              ⏭️
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: '#cbd5e1' }}>🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                background: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)',
                outline: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: '12px', color: 'white', minWidth: '40px', textAlign: 'right' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          <div style={{ 
            marginTop: '15px',
            minHeight: '166px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {isSoundCloudLoading ? (
              <div style={{ padding: '20px', color: '#cbd5e1', fontSize: '12px' }}>
                Loading SoundCloud track...
              </div>
            ) : unlockedTracks.length > 0 ? (
              <iframe
                id="soundcloud-login-player"
                src={createSoundCloudIframeUrl(unlockedTracks[currentTrackIndex])}
                width="100%"
                height="166"
                frameBorder="no"
                scrolling="no"
                style={{ border: 'none', backgroundColor: 'transparent' }}
                title="SoundCloud Player"
                allow="autoplay"
              />
            ) : (
              <div style={{ padding: '20px', color: '#cbd5e1', fontSize: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎵</div>
                No tracks available
              </div>
            )}
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '450px',
          textAlign: 'center',
          zIndex: 2,
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          margin: '20px'
        }}>
          
          <div style={{
            height: '30vh',
            width: '80vw',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url(/BOBackground.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            <p style={{ 
              color: '#cbd5e1', 
              fontSize: '15px', 
              marginTop: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Sign in</span> to access the ultimate graffiti GPS tracking experience with live music vibe
            </p>
          </div>

          {showLogin ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontSize: '22px', color: 'white', marginBottom: '5px', textAlign: 'left' }}>Sign In</h2>
              
              <input
                type="email"
                placeholder="📧 Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '14px 18px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  outline: 'none'
                }}
              />
              
              <input
                type="password"
                placeholder="🔒 Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  padding: '14px 18px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  outline: 'none'
                }}
              />
              
              {authError && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  ⚠️ {authError}
                </div>
              )}
              
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                🚀 Sign In & Start Tagging
              </button>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setShowSignup(true);
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                >
                  Create Account
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setEmail('');
                    setPassword('');
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : showSignup ? (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontSize: '22px', color: 'white', marginBottom: '5px', textAlign: 'left' }}>Create Account</h2>
              
              <input
                type="email"
                placeholder="📧 Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '14px 18px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  outline: 'none'
                }}
              />
              
              <input
                type="password"
                placeholder="🔒 Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  padding: '14px 18px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  fontSize: '15px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  outline: 'none'
                }}
              />
              
              {authError && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  ⚠️ {authError}
                </div>
              )}
              
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                🎨 Create Graffiti Profile
              </button>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignup(false);
                    setShowLogin(true);
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                >
                  Already have account?
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowSignup(false);
                    setEmail('');
                    setPassword('');
                    setAuthError(null);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
                padding: '20px',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#cbd5e1',
                marginBottom: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'left'
              }}>
                <strong style={{ color: '#f59e0b', fontSize: '16px', display: 'block', marginBottom: '10px' }}>🎯 Features:</strong>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>📍 <strong>Live GPS tracking</strong> with accuracy circle</li>
                  <li style={{ marginBottom: '8px' }}>🎨 <strong>Place custom markers</strong> with different colors</li>
                  <li style={{ marginBottom: '8px' }}>📏 <strong>50-meter radius visualization</strong></li>
                  <li style={{ marginBottom: '8px' }}>🏙️ <strong>East Auckland location presets</strong></li>
                  <li>👤 <strong>See ALL players' drops</strong> in real-time</li>
                  <li>🎵 <strong>SoundCloud music player</strong> built into app</li>
                </ul>
              </div>
              
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                🚀 Sign In
              </button>
              
              <button
                onClick={() => setShowSignup(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                Create Account
              </button>
              
              <div style={{ 
                marginTop: '15px', 
                padding: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                  <div style={{ marginBottom: '5px' }}>🎵 Music: <strong>Blackout - Classic</strong></div>
                  <div>SoundCloud tracks play directly in app! 🎧</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    );
  }

  

  // ========== PROFILE SETUP UI ==========
  if (showProfileSetup && user) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(78, 205, 196, 0.1) 0%, transparent 20%)'
      }}>
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '500px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #4dabf7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '10px'
            }}>
              🎨 BLACKOUT NZ
            </div>
            <div style={{
              color: '#cbd5e1',
              fontSize: '16px',
              marginBottom: '5px'
            }}>
              Create Your Graffiti Profile
            </div>
            <div style={{
              fontSize: '14px',
              color: '#94a3b8',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginTop: '15px'
            }}>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Choose your crew</span> and begin the street art journey across Aotearoa
            </div>
          </div>
          
          <form onSubmit={handleProfileSetup}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#f3f4f6',
                margin: '0 auto 10px',
                overflow: 'hidden',
                position: 'relative',
                border: '3px solid #4dabf7',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {profileUsername ? (
                  <img 
                    src={generateAvatarUrl(user?.uid || 'default', profileUsername, profileGender)}
                    alt="Avatar Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#6b7280',
                    fontSize: '24px'
                  }}>
                    👤
                  </div>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Custom avatar generated from your username
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Choose a username *"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                maxLength={20}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '10px', textAlign: 'left' }}>
                Gender:
              </div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {(['male', 'female', 'other', 'prefer-not-to-say'] as const).map((option) => (
                  <label 
                    key={option}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '8px 12px',
                      backgroundColor: profileGender === option ? '#e0f2fe' : '#f9fafb',
                      borderRadius: '8px',
                      border: `1px solid ${profileGender === option ? '#4dabf7' : '#e5e7eb'}`
                    }}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={profileGender === option}
                      onChange={() => setProfileGender(option)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                      {option === 'prefer-not-to-say' ? 'Prefer not to say' : 
                      option === 'male' ? '👨 Male' :
                      option === 'female' ? '👩 Female' : 'Other'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '10px', textAlign: 'left' }}>
                Choose Your Path:
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button
                  type="button"
                  onClick={() => setProfileCrewChoice('crew')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: profileCrewChoice === 'crew' ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '8px',
                    border: `2px solid ${profileCrewChoice === 'crew' ? '#4dabf7' : '#e5e7eb'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <div style={{ fontSize: '20px' }}>👥</div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    Join a Story Crew
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Team up with a pre-defined crew
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileCrewChoice('solo')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: profileCrewChoice === 'solo' ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '8px',
                    border: `2px solid ${profileCrewChoice === 'solo' ? '#4dabf7' : '#e5e7eb'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <div style={{ fontSize: '20px' }}>🎯</div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    Go Solo
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Play independently
                  </div>
                </button>
              </div>
              
              {profileCrewChoice === 'crew' && (
                <div>
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px', textAlign: 'left' }}>
                    Select Your Story Crew:
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                    {CREWS.map((crew) => (
                      <div
                        key={crew.id}
                        onClick={() => {
                          setSelectedCrew(crew.id as CrewId | '');
                          setProfileCrewName(crew.name);
                        }}
                        style={{
                          padding: '12px',
                          backgroundColor: selectedCrew === crew.id ? `${crew.colors.primary}20` : '#f9fafb',
                          border: `2px solid ${selectedCrew === crew.id ? crew.colors.primary : '#e5e7eb'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: crew.colors.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                            {crew.name.charAt(0)}
                          </div>
                          <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: crew.colors.primary, fontSize: '13px' }}>
                              {crew.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {crew.leader}
                            </div>
                          </div>
                        </div>
                        
                        {selectedCrew === crew.id && (
                          <div style={{ 
                            marginTop: '10px', 
                            padding: '8px',
                            backgroundColor: `${crew.colors.primary}10`,
                            borderRadius: '6px',
                            borderLeft: `3px solid ${crew.colors.primary}`
                          }}>
                            <div style={{ fontSize: '11px', color: '#374151', fontWeight: '500' }}>
                              {crew.description}
                            </div>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                              Bonus: {crew.bonus}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {selectedCrew && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      backgroundColor: '#f0f9ff',
                      padding: '12px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      marginTop: '15px'
                    }}>

                    </div>
                  )}
                </div>
              )}
              
              {profileCrewChoice === 'solo' && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  textAlign: 'left',
                  marginTop: '10px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
                    🎯 Solo Path Selected
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    You can join a crew later from your profile. 
                    Play at your own pace and choose when to team up.
                    <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                      Note: Some story missions require crew membership.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={profileLoading || (profileCrewChoice === 'crew' && !selectedCrew)}
              style={{
                backgroundColor: '#4dabf7',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (profileLoading || (profileCrewChoice === 'crew' && !selectedCrew)) ? 'not-allowed' : 'pointer',
                width: '100%',
                opacity: (profileLoading || (profileCrewChoice === 'crew' && !selectedCrew)) ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!profileLoading && !(profileCrewChoice === 'crew' && !selectedCrew)) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {profileLoading 
                ? 'Creating Profile...' 
                : profileCrewChoice === 'crew' 
                  ? selectedCrew 
                    ? `Join ${CREWS.find(c => c.id === selectedCrew)?.name || 'Crew'}! 👥` 
                    : 'Select a Crew'
                  : 'Start Solo Journey! 🎯'
              }
            </button>
            
            <div style={{ 
              marginTop: '20px', 
              fontSize: '12px', 
              color: '#6b7280',
              textAlign: 'left',
              backgroundColor: '#f0f9ff',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
                👁️ You'll see ALL drops
              </div>
              <div style={{ fontSize: '11px' }}>
                Every writer's tags will appear on your map in real-time!
                <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
                  The Blackout story begins after your first 3 markers...
                </div>
              </div>
            </div>
          </form>
</div>
      
      {/* Performance Settings Panel */}
      <PerformanceSettingsPanel 
        isOpen={showPerformanceSettings}
        onClose={() => setShowPerformanceSettings(false)}
      />

      {/* Error Recovery Panel */}
      <ErrorRecoveryPanel 
        isOpen={showErrorRecovery}
        error={recoveryError || undefined}
        onClose={() => setShowErrorRecovery(false)}
        onRetry={() => {
          // Retry logic here if needed
        }}
      />
    </div>
  );
  }

  // ========== MAP LOADING CHECK ==========
  if (!isClient || !mapReady || gpsLoading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #4dabf7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '18px', color: '#374151' }}>
          {gpsLoading ? 'Getting your location...' : 'Loading map...'}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <StoryManagerProvider user={user} userProfile={userProfile}>
      <div style={{ height: '100vh', width: '100vw', position: 'relative' as const }}>
        {/* REP Notification */}
        {repNotification && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            padding: '20px 30px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: 2000,
            textAlign: 'center',
            animation: 'popIn 0.5s ease-out'
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
              🎉 +{repNotification.amount} REP!
            </div>
            <div style={{ fontSize: '16px' }}>
              {repNotification.message}
            </div>
            <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.8 }}>
              Total: {userProfile?.rep || 0} REP • Rank: {userProfile?.rank || 'TOY'}
            </div>
          </div>
        )}

      {/* Top-Left Logo - Changes color based on day/night */}
      <div style={{
        position: 'fixed',
        top: '15px',
        left: '15px',
        zIndex: 1100,
        pointerEvents: 'none'
      }}>
        <img 
          src="/botoplogo1.svg" 
          alt="Blackout NZ Logo"
          style={{
            width: '120px',
            height: 'auto',
            filter: isNight 
              ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5)) brightness(0) invert(1)'  // White at night
              : 'drop-shadow(0 2px 4px rgba(255,255,255,0.3)) brightness(0) saturate(0)',  // Black in day
            opacity: 0.9,
            transition: 'filter 0.5s ease'
          }}
        />
      </div>
      
      {/* 🆕 Day/Night Time Indicator */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '145px',
        zIndex: 1100,
        background: isNight ? 'rgba(30, 41, 59, 0.9)' : 'rgba(248, 250, 252, 0.9)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: isNight ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease'
      }}>
        {/* Sun/Moon Icon */}
        <div style={{
          fontSize: '20px',
          animation: isNight ? 'pulse 2s infinite' : 'spin 10s linear infinite'
        }}>
          {isNight ? '🌙' : '☀️'}
        </div>
        
        {/* Time Display */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: isNight ? '#e2e8f0' : '#1e293b',
            fontFamily: 'monospace'
          }}>
            {timeString}
          </div>
          <div style={{
            fontSize: '10px',
            color: isNight ? '#94a3b8' : '#64748b',
            textTransform: 'capitalize'
          }}>
            {isNight ? 'Night' : 'Day'} Mode
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
          
      <MapContainer
        center={
          isOfflineMode && lastKnownPosition ? lastKnownPosition :
          mapCenter || NZ_CENTER
        }
        zoom={mapCenter ? zoom : NZ_DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        maxBounds={NZ_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={5}
        maxZoom={18}
        ref={(mapInstance: L.Map | null) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
            mapInstance.setMaxBounds(NZ_BOUNDS);
            
            // Clean up previous listener
            mapInstance.off('click');
            
            // Use memoized click handler
            if (!isOfflineMode) {
              const clickHandler = (e: L.LeafletMouseEvent) => {
                handleMapClick(e);
              };
              mapInstance.on('click', clickHandler);
            }
          }
        }}
      >
        {/* 🆕 Day/Night Tile Layer - Switches based on time */}
        {isNight ? (
          // Night mode - Dark tiles
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          // Day mode - Light tiles
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        
        {/* User GPS Marker */}
        {gpsPosition && (
          <>
            <Marker position={gpsPosition}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '200px' }}>
                  <strong>📍 Your Location</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    <div>Lat: {gpsPosition[0].toFixed(6)}</div>
                    <div>Lng: {gpsPosition[1].toFixed(6)}</div>
                    {accuracy && <div>GPS Accuracy: ~{Math.round(accuracy)}m</div>}
                    <div>50m Radius: {show50mRadius ? 'Visible' : 'Hidden'}</div>
                    <div>Click anywhere on map to add a marker!</div>
                    {isTracking && speed !== null && speed > 0 && (
                      <div>Speed: {(speed * 3.6).toFixed(1)} km/h</div>
                    )}
                    {isTracking && heading !== null && (
                      <div>Heading: {Math.round(heading)}°</div>
                    )}
                    <div style={{ 
                      color: isTracking ? '#10b981' : '#f59e0b', 
                      marginTop: '5px',
                      fontWeight: 'bold'
                    }}>
                      {isTracking ? '✅ Live GPS Tracking Active' : '⚠️ GPS not actively tracking'}
                    </div>
                    <div style={{ 
                      marginTop: '10px',
                      padding: '8px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}>
                      <strong>👥 {userMarkers.length} drops visible</strong>
                      <div style={{ marginTop: '4px' }}>
                        ({userMarkers.filter(m => m.userId === user?.uid).length} yours)
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Radius circle (expands with crew members) */}
            {show50mRadius && (
              <Circle
                center={isOfflineMode && lastKnownPosition ? lastKnownPosition : gpsPosition}
                radius={expandedRadius}
                pathOptions={{
                  color: isOfflineMode ? '#ef4444' : '#10b981',
                  fillColor: isOfflineMode ? '#ef4444' : '#10b981',
                  fillOpacity: 0.1,
                  weight: 2,
                  opacity: 0.7
                }}
                eventHandlers={{
                  click: isOfflineMode ? undefined : (e) => handleMapClick(e)
                }}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>
                      {isOfflineMode
                        ? `🔴 Offline Mode: ${expandedRadius}m Radius`
                        : `🟢 Online Mode: ${expandedRadius}m Radius`}
                    </strong>
                    {isOfflineMode && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '5px', fontWeight: 'bold' }}>
                        📍 GPS tracking paused (Offline Mode)
                      </div>
                    )}
                    {!isOfflineMode && nearbyCrewMembers.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px', fontWeight: 'bold' }}>
                        👥 {nearbyCrewMembers.length} crew member{nearbyCrewMembers.length > 1 ? 's' : ''} nearby!
                        <br />
                        <span style={{ fontSize: '11px', fontWeight: 'normal' }}>
                          Radius expanded to {expandedRadius}m
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {isOfflineMode
                        ? 'Use joystick to explore the map'
                        : 'Click inside this circle to place drops within ' + expandedRadius + 'm'
                      }
                    </div>
                    {nearbyCrewMembers.length > 0 && !isOfflineMode && (
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '8px', textAlign: 'left' }}>
                        <strong>Nearby crew:</strong>
                        {nearbyCrewMembers.map((member, idx) => (
                          <div key={member.uid} style={{ marginTop: '4px' }}>
                            👤 {member.username} ({member.distance}m away)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </Circle>
            )}

            {/* GPS Accuracy Circle */}
            {accuracy && accuracy > 50 && (
              <Circle
                center={gpsPosition}
                radius={accuracy}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#f59e0b',
                  fillOpacity: 0.05,
                  weight: 1,
                  opacity: 0.3,
                  dashArray: '5, 5'
                }}
                eventHandlers={{
                  click: (e) => {
                    handleMapClick(e);
                  }
                }}
              >
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <strong>🎯 GPS Accuracy</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      Your location is accurate to ~{Math.round(accuracy)} meters
                    </div>
                  </div>
                </Popup>
              </Circle>
            )}
          </>
        )}

        {/* Top Players Markers */}
        {showTopPlayers && topPlayers.map((player, index) => {
          if (!player.position) return null;
          
          const customIcon = typeof window !== 'undefined' ? 
            new (require('leaflet').DivIcon)({
              html: `
                <div style="
                  position: relative;
                  width: 40px;
                  height: 40px;
                  background-color: ${index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706'};
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 14px;
                  color: ${index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12'};
                  overflow: hidden;
                ">
                  <div style="
                    position: absolute;
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706'};
                    color: ${index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12'};
                    font-size: 10px;
                    padding: 1px 6px;
                    border-radius: 10px;
                    white-space: nowrap;
                    font-weight: bold;
                    border: 1px solid white;
                  ">
                    #${index + 1}
                  </div>
                  ${player.username?.charAt(0).toUpperCase() || 'P'}
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
              popupAnchor: [0, -20]
            }) : undefined;

          return (
            <Marker 
              key={`top-player-${player.uid}`}
              position={player.position}
              icon={customIcon}
            >
              <Popup>
                <div style={{ 
                  textAlign: 'center', 
                  minWidth: '220px',
                  padding: '10px'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706',
                    color: index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap'
                  }}>
                    {index === 0 ? '🥇 TOP WRITER' : index === 1 ? '🥈 RUNNER-UP' : '🥉 CONTENDER'}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '15px',
                    marginBottom: '15px'
                  }}>
                    <img
                      src={player.profilePicUrl}
                      alt={player.username}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        border: `3px solid ${index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706'}`
                      }}
                    />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        color: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706'
                      }}>
                        {player.username}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {player.rank}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    marginBottom: '15px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      background: '#f8f9fa',
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                        {player.rep}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666' }}>REP</div>
                    </div>
                    
                    <div style={{
                      background: '#f8f9fa',
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7' }}>
                        {player.level}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666' }}>LVL</div>
                    </div>
                    
                    <div style={{
                      background: '#f8f9fa',
                      padding: '8px 4px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {player.totalMarkers}
                      </div>
                      <div style={{ fontSize: '10px', color: '#666' }}>TAGS</div>
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    backgroundColor: '#f1f5f9',
                    padding: '6px',
                    borderRadius: '4px',
                    marginTop: '10px'
                  }}>
                    Last active: {player.lastActive.toLocaleDateString()}
                  </div>
                  
                  <button
                    onClick={() => {
                      centerMap(player.position!, 15);
                    }}
                    style={{
                      backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706',
                      color: index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      width: '100%',
                      marginTop: '10px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    🚀 Go to Writer
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ALL USER MARKERS (including other players') */}
        {filteredMarkers
          .filter(marker => !showOnlyMyDrops || marker.userId === user?.uid)
          .map((marker) => (
            <MemoizedMarker
              key={marker.id}
              marker={marker}
              user={user}
              onClick={setSelectedMarker}
            />
          ))
        }

        {/* Marker Popup Card */}
        {selectedMarker && (
          <MarkerPopupCard
            marker={selectedMarker}
            onClose={() => setSelectedMarker(null)}
            user={user}
            userProfile={userProfile}
            mapRef={mapRef}
            expandedRadius={expandedRadius}
          />
        )}

        {/* Drops with photos */}
        {drops.filter(drop => drop.photoUrl).map((drop) => {
          const dropIcon = typeof window !== 'undefined' ?
            new (require('leaflet').DivIcon)({
              html: `
                <div style="
                  width: 32px;
                  height: 32px;
                  background-color: #ef4444;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: 18px;
                  position: relative;
                ">
                  📸
                  ${drop.likes && drop.likes.length > 0 ? `
                    <div style="
                      position: absolute;
                      top: -5px;
                      right: -5px;
                      background-color: #ef4444;
                      color: white;
                      border-radius: 50%;
                      width: 18px;
                      height: 18px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 10px;
                      font-weight: bold;
                      border: 2px solid white;
                    ">
                      ${drop.likes.length}
                    </div>
                  ` : ''}
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16]
            }) : undefined;

          return (
            <Marker
              key={drop.id || drop.firestoreId}
              position={[drop.lat, drop.lng]}
              icon={dropIcon}
            >
              <Popup>
                <PhotoDropPopup
                  drop={drop}
                  user={user}
                  onLikeUpdate={(dropId, newLikes) => {
                    setDrops(prev =>
                      prev.map(d =>
                        d.firestoreId === dropId ? { ...d, likes: newLikes } : d
                      )
                    );
                  }}
                />
              </Popup>
            </Marker>
          );
        })}

        {/* Music drops (trackUrl, no photo) */}
        {drops.filter(drop => drop.trackUrl && !drop.photoUrl).map((drop) => {
          const musicIcon = typeof window !== 'undefined' ?
            new (require('leaflet').DivIcon)({
              html: `
                <div style="
                  width: 28px;
                  height: 28px;
                  background-color: #8a2be2;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justifyContent: 'center';
                ">
                  🎵
                </div>`,
              className: 'music-marker-icon',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              popupAnchor: [0, -14]
            }) : undefined;

          return (
            <Marker
              key={drop.id || drop.firestoreId}
              position={[drop.lat, drop.lng]}
              icon={musicIcon}
            >
              <Popup>
                <MusicDropPopup
                  drop={drop}
                  user={user}
                  onLikeUpdate={(dropId: string, newLikes: string[]) => {
                    setDrops(prev =>
                      prev.map((d: any) =>
                        d.firestoreId === dropId ? { ...d, likes: newLikes } : d
                      )
                    );
                  }}
                />
              </Popup>
            </Marker>
          );
        })}

        {/* Marker drops (no photo, no track) */}
        {drops.filter(drop => !drop.photoUrl && !drop.trackUrl).map((drop) => {
          const markerIcon = typeof window !== 'undefined' ?
            new (require('leaflet').DivIcon)({
              html: `
                <div style="
                  width: 28px;
                  height: 28px;
                  background-color: #10b981;
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justifyContent: 'center';
                  color: white;
                  font-weight: bold;
                  font-size: 16px;
                  position: relative;
                ">
                  📍
                  ${drop.likes && drop.likes.length > 0 ? `
                    <div style="
                      position: absolute;
                      top: -5px;
                      right: -5px;
                      background-color: #10b981;
                      color: white;
                      border-radius: 50%;
                      width: 16px;
                      height: 16px;
                      display: flex;
                      align-items: center;
                      justifyContent: 'center';
                      font-size: 9px;
                      font-weight: bold;
                      border: 2px solid white;
                    ">
                      ${drop.likes.length}
                    </div>
                  ` : ''}
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              popupAnchor: [0, -14]
            }) : undefined;

          return (
            <Marker
              key={drop.id || drop.firestoreId}
              position={[drop.lat, drop.lng]}
              icon={markerIcon}
            >
              <Popup>
                <MarkerDropPopup
                  drop={drop}
                  user={user}
                  onLikeUpdate={(dropId, newLikes) => {
                    setDrops(prev =>
                      prev.map(d =>
                        d.firestoreId === dropId ? { ...d, likes: newLikes } : d
                      )
                    );
                  }}
                />
              </Popup>
            </Marker>
          );
        })}

        {/* East Auckland location markers */}
        {(!gpsPosition || !isTracking) && Object.entries(newZealandLocations).map(([name, info]) => (
          <Marker 
            key={name} 
            position={info.coords as [number, number]}
            opacity={gpsPosition ? 0.7 : 1}
          >
            <Popup>
              <div style={{ textAlign: 'center', minWidth: '150px' }}>
                <strong>{name}</strong>
                <br />
                <small style={{ color: '#666' }}>
                  {info.description}
                </small>
                <br />
                <button
                  onClick={() => {
                    centerMap(info.coords as [number, number], 15);
                  }}
                  style={{
                    marginTop: '8px',
                    backgroundColor: '#4dabf7',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Go Here
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Drop Type Selection Modal */}
      {showDropTypeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => {
            setShowDropTypeModal(false);
            setPendingDropPosition(null);
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '400px',
              width: '90%',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
              animation: 'popIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              color: '#f1f5f9',
              fontSize: '24px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🚀 Drop Type
            </h3>
            <p style={{
              color: '#94a3b8',
              textAlign: 'center',
              marginBottom: '30px',
              fontSize: '14px'
            }}>
              Choose what type of drop you want to place
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Marker Type Selection */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  color: '#f1f5f9',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  🎨 Marker Type:
                </label>
                <select
                  value={selectedMarkerType}
                  onChange={(e) => setSelectedMarkerType(e.target.value as MarkerDescription)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  {MARKER_DESCRIPTIONS.map((desc) => (
                    <option key={desc} value={desc} style={{ backgroundColor: '#1e293b' }}>
                      {desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marker Option */}
              <button
                onClick={handleMarkerDrop}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '18px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
                }}
              >
                <span style={{ fontSize: '24px' }}>📍</span>
                <div style={{ textAlign: 'left' }}>
                  <div>Place {selectedMarkerType} Marker</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                    Custom marker drop (+5 REP)
                  </div>
                </div>
              </button>

              {/* Photo Option */}
              <button
                onClick={handlePhotoDrop}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '18px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)';
                }}
              >
                <span style={{ fontSize: '24px' }}>📸</span>
                <div style={{ textAlign: 'left' }}>
                  <div>Place Photo</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                    Upload a photo (+10 REP, +15 REP with GPS!)
                  </div>
                </div>
              </button>

              {/* Music Drop Option */}
              {unlockedTracks.length > 0 ? (
                <>
                  <label style={{
                    color: '#f1f5f9',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    display: 'block'
                  }}>
                    MUSIC Drop (you lose this song):
                  </label>
                  <select
                    value={selectedTrackForMusicDrop ?? unlockedTracks[0]}
                    onChange={(e) => setSelectedTrackForMusicDrop(e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '2px solid rgba(138, 43, 226, 0.4)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      color: '#f1f5f9',
                      fontSize: '13px',
                      cursor: 'pointer',
                      marginBottom: '4px'
                    }}
                  >
                    {unlockedTracks.map((url) => (
                      <option key={url} value={url} style={{ backgroundColor: '#1e293b' }}>
                        {getTrackNameFromUrl(url)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleMusicDrop}
                    style={{
                      background: 'linear-gradient(135deg, #8a2be2, #6a1bb2)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '18px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(138, 43, 226, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(138, 43, 226, 0.3)';
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>MUSIC</span>
                    <div style={{ textAlign: 'left' }}>
                      <div>Place Music Drop</div>
                      <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                        Save song on map – you lose it from your collection
                      </div>
                    </div>
                  </button>
                </>
              ) : (
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(138, 43, 226, 0.15)',
                  border: '1px dashed rgba(138, 43, 226, 0.4)',
                  color: '#a78bfa',
                  fontSize: '13px',
                  textAlign: 'center'
                }}>
                  MUSIC Drop – unlock tracks first (place marker or photo drops)
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowDropTypeModal(false);
                setPendingDropPosition(null);
              }}
              style={{
                marginTop: '20px',
                background: 'none',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                padding: '10px 20px',
                color: '#94a3b8',
                cursor: 'pointer',
                width: '100%',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Photo Selection Modal */}
      <PhotoSelectionModal
        isVisible={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setPendingDropPosition(null);
        }}
        onPhotoSelect={handlePhotoSelect}
      />

      {/* Offline/Online Mode Toggle */}
      <button
        onClick={() => {
          if (!isOfflineMode) {
            if (gpsPosition) {
              setLastKnownPosition(gpsPosition);
              console.log('Switched to offline mode');
              alert('Switched to offline mode! GPS tracking paused.');
            } else {
              alert('No GPS position available. Please get GPS location first before going offline.');
              return;
            }
            setIsOfflineMode(true);
            stopTracking();
          } else {
            setIsOfflineMode(false);
            if (!isTracking) {
              startTracking();
            }
            console.log('Switched to online mode');
          }
        }}
        style={{
          position: 'absolute',
          bottom: 80,
          left: 300,
          backgroundColor: isOfflineMode ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 1001,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        {isOfflineMode ? '🔴 OFFLINE' : '🟢 ONLINE'}
      </button>

      {/* Profile Stats Display - Top Right */}
      {userProfile && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(0,0,0,0.85)',
          color: '#e0e0e0',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 1001,
          minWidth: '200px',
          backdropFilter: 'blur(4px)',
          paddingTop: '18px' // Added padding to make room for plate
        }}>
          {/* License Plate - Shows ONE for solo, crew initials for crew */}
          <div style={{
            position: 'absolute',
            top: '-12px', // Moved up slightly
            right: '15px', // Moved in from edge
            width: '55px', // Slightly smaller
            height: '24px', // Slightly shorter
            zIndex: 1002
          }}>
            <svg 
              width="55" 
              height="24" 
              viewBox="0 0 55 24"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
            >
              {/* License plate base - smaller */}
              <rect 
                x="2" y="2" 
                width="51" height="20" 
                rx="3" ry="3"
                fill="#1e293b"
                stroke={userProfile.isSolo ? '#f59e0b' : 
                        userProfile.crewId === 'bqc' ? '#ef4444' : 
                        userProfile.crewId === 'sps' ? '#4dabf7' : 
                        userProfile.crewId === 'lzt' ? '#10b981' : 
                        userProfile.crewId === 'dgc' ? '#8b5cf6' : '#9ca3af'}
                strokeWidth="1.5"
              />
              
              {/* Inner shine effect */}
              <rect 
                x="4" y="4" 
                width="47" height="16" 
                rx="2" ry="2"
                fill="url(#plateGradient)"
                opacity="0.8"
              />
              
              {/* Text: ONE for solo, crew initials for crew */}
              <text
                x="27.5"
                y="16"
                textAnchor="middle"
                fill="white"
                fontSize="12" // Smaller font
                fontWeight="bold"
                fontFamily="monospace"
                style={{ 
                  textTransform: 'uppercase',
                  letterSpacing: userProfile.isSolo ? '0.5px' : 'normal'
                }}
              >
                {userProfile.isSolo ? 'ONE' : userProfile.crewId?.toUpperCase() || 'SOLO'}
              </text>
              
              {/* Simple border highlight */}
              <rect 
                x="3" y="3" 
                width="49" height="18" 
                rx="2.5" ry="2.5"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
              
              <defs>
                <linearGradient id="plateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Tiny status dot */}
            <div style={{
              position: 'absolute',
              top: '26px',
              right: '5px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: userProfile.isSolo ? '#f59e0b' :
                    userProfile.crewId === 'bqc' ? '#ffffff' : 
                    userProfile.crewId === 'sps' ? '#4dabf7' : 
                    userProfile.crewId === 'lzt' ? '#10b981' : 
                    userProfile.crewId === 'dgc' ? '#8b5cf6' : '#9ca3af',
              boxShadow: '0 0 4px currentColor'
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <img
              src={userProfile.profilePicUrl}
              alt="Profile"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `2px solid ${userProfile.isSolo ? '#f59e0b' : '#ff6b6b'}`,
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                color: userProfile.isSolo ? '#f59e0b' : '#ff6b6b'
              }}>
                {userProfile.username}
              </div>
              <div style={{ 
                color: userProfile.isSolo ? '#f59e0b' : '#ff6b6b', 
                fontSize: '12px' 
              }}>
                {userProfile.rank} • Lv {userProfile.level}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px'
          }}>
            <div style={{ color: '#4dabf7' }}>
              REP: {userProfile.rep || 0}
            </div>
            <div style={{ color: '#10b981' }}>
              {userMarkers.filter(m => m.userId === user?.uid).length} drops
            </div>
          </div>
          
          {/* Crew/Solo status indicator - more subtle */}
          <div style={{
            marginTop: '8px',
            fontSize: '9px',
            color: userProfile.isSolo ? '#f59e0b' : '#10b981',
            textAlign: 'center',
            backgroundColor: userProfile.isSolo ? 
              'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            padding: '2px 4px',
            borderRadius: '3px',
            border: userProfile.isSolo ? 
              '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            {userProfile.isSolo ? '🎯 SOLO' : `👥 ${userProfile.crewName || 'CREW'}`}
          </div>
        </div>
      )}

      {/* ========== DUAL CONTROL PANELS ========== */}
<div style={{
            position: 'absolute' as const,
            top: 80,
            left: 0,
            display: 'flex',
            gap: '15px',
            zIndex: 1200,
            maxHeight: '80vh'
          }}>
        {/* Left Panel - Profile & Stats (Blackbook) */}
        {showProfilePanel && (
          <div style={{
            ...panelStyle,
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInLeft 0.3s ease-out',
            position: 'relative' as const
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(255,107,107,0.3)'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#ff6b6b', 
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📓</span>
                BLACKBOOK — {userProfile?.username?.toUpperCase() || 'PROFILE'}
              </h3>
              <button
                onClick={() => setShowProfilePanel(false)}
                style={{
                  background: 'rgba(255,107,107,0.2)',
                  border: '1px solid rgba(255,107,107,0.3)',
                  color: '#ff6b6b',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Profile Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '6px'
            }}>
              <img
                src={userProfile?.profilePicUrl}
                alt="Profile"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '2px solid #ff6b6b',
                  objectFit: 'cover'
                }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{userProfile?.username}</div>
                <div style={{ color: '#ff6b6b', fontSize: '13px' }}>{userProfile?.rank} • Lv {userProfile?.level}</div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>REP: {userProfile?.rep || 0}</div>
                <div style={{ fontSize: '11px', color: '#4dabf7', marginTop: '4px' }}>
                  {userMarkers.filter(m => m.userId === user?.uid).length} drops • {userMarkers.length} total visible
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                padding: '12px 8px',
                borderRadius: '8px',
                border: '1px solid #444'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff6b6b' }}>
                  {userMarkers.filter(m => m.userId === user?.uid).length}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>Your Tags</div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.06)',
                padding: '12px 8px',
                borderRadius: '8px',
                border: '1px solid #444',
                position: 'relative'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#4ecdc4' }}>
                  {userProfile?.rep || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>REP</div>
                
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '8px',
                  right: '8px',
                  height: '3px',
                  background: '#333',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min((userProfile?.rep || 0) % 100, 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4ecdc4, #10b981)',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <div style={{
                  fontSize: '9px',
                  color: '#888',
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px'
                }}>
                  Next: {100 - ((userProfile?.rep || 0) % 100)}
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.06)',
                padding: '12px 8px',
                borderRadius: '8px',
                border: '1px solid #444'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>
                  {userProfile?.rank || 'TOY'}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>Rank</div>
              </div>
            </div>

            {/* Crew Status */}
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #444',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#4dabf7',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {userProfile?.isSolo ? '🎯 Solo Player' : userProfile?.crewName ? `👥 ${userProfile.crewName}` : '👥 No Crew'}
              </div>
              
              {nearbyCrewMembers.length > 0 && (
                <div style={{
                  fontSize: '11px',
                  color: '#10b981',
                  marginBottom: '8px',
                  padding: '6px',
                  background: 'rgba(16,185,129,0.1)',
                  borderRadius: '4px'
                }}>
                  ✨ {nearbyCrewMembers.length} crew member{nearbyCrewMembers.length > 1 ? 's' : ''} nearby!
                  <br />
                  <span style={{ fontSize: '10px', color: '#aaa' }}>
                    Radius expanded to {expandedRadius}m
                  </span>
                </div>
              )}

              {userProfile?.isSolo && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter crew name to join"
                    id="joinCrewInput"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#e0e0e0',
                      fontSize: '12px',
                      marginBottom: '6px'
                    }}
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById('joinCrewInput') as HTMLInputElement;
                      const crewName = input?.value.trim();
                      if (!crewName || !user) return;
                      
                      try {
                        const crewNameLower = crewName.toLowerCase();
                        const crewsRef = collection(db, 'crews');
                        const crewQuery = query(crewsRef, where('nameLower', '==', crewNameLower));
                        const crewSnapshot = await getDocs(crewQuery);
                        
                        let crewId: string;
                        let finalCrewName: string;
                        
                        if (crewSnapshot.empty) {
                          // For new crews, use a generated ID
                          const newCrewRef = doc(crewsRef);
                          crewId = newCrewRef.id;
                          finalCrewName = crewName;
                          await setDoc(newCrewRef, {
                            name: crewName,
                            nameLower: crewNameLower,
                            members: [user.uid],
                            createdAt: Timestamp.now(),
                            createdBy: user.uid
                          });
                        } else {
                          const crewDoc = crewSnapshot.docs[0];
                          crewId = crewDoc.id;
                          finalCrewName = crewDoc.data().name;
                          const currentMembers = crewDoc.data().members || [];
                          if (!currentMembers.includes(user.uid)) {
                            await updateDoc(doc(db, 'crews', crewId), {
                              members: [...currentMembers, user.uid]
                            });
                          }
                        }
                        
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, {
                          crewId: crewId,
                          crewName: finalCrewName,
                          isSolo: false
                        });
                        
                        setUserProfile(prev => prev ? {
                          ...prev,
                          crewId: crewId as CrewId,
                          crewName: finalCrewName,
                          isSolo: false
                        } : null);
                        
                        if (input) input.value = '';
                        alert(`Joined crew: ${finalCrewName}! 👥`);
                      } catch (error: any) {
                        alert(`Failed to join crew: ${error.message}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#4dabf7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Join Crew 👥
                  </button>
                </div>
              )}

              {/* 🆕 Crew Chat Button */}
              {userProfile?.crewId && !userProfile.isSolo && (
                <button
                  onClick={() => {
                    setShowCrewChat(true);
                    setShowProfilePanel(false);
                    setShowPhotosPanel(false);
                    setShowMessagesPanel(false);
                    setShowMapPanel(false);
                    setShowMusicPanel(false);
                    setShowStoryPanel(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  💬 Open Crew Chat
                </button>
              )}

              {userProfile?.crewName && !userProfile?.isSolo && (
                <button
                  onClick={async () => {
                    if (!user || !userProfile?.crewId) return;
                    if (!confirm(`Leave ${userProfile.crewName}?`)) return;
                    
                    try {
                      const crewDoc = await getDoc(doc(db, 'crews', userProfile.crewId));
                      if (crewDoc.exists()) {
                        const currentMembers = crewDoc.data().members || [];
                        const updatedMembers = currentMembers.filter((uid: string) => uid !== user.uid);
                        await updateDoc(doc(db, 'crews', userProfile.crewId), {
                          members: updatedMembers
                        });
                      }
                      
                      const userRef = doc(db, 'users', user.uid);
                      await updateDoc(userRef, {
                        crewId: null,
                        crewName: null,
                        isSolo: true
                      });
                      
                      setUserProfile(prev => prev ? {
                        ...prev,
                        crewId: null,
                        crewName: null,
                        isSolo: true
                      } : null);
                      
                      alert('Left crew. You are now solo. 🎯');
                    } catch (error: any) {
                      alert(`Failed to leave crew: ${error.message}`);
                    }
                  }}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginTop: '8px'
                  }}
                >
                  Leave Crew 🎯
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowOnlyMyDrops(!showOnlyMyDrops)}
              style={{
                background: showOnlyMyDrops ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '12px',
                width: '100%',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {showOnlyMyDrops ? '👤 Showing Only YOUR Drops' : '🌍 Showing ALL Drops'}
            </button>

            {/* Top Players Section */}
            {topPlayers.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  marginBottom: '8px',
                  borderBottom: '1px solid #444',
                  paddingBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>👑 TOP WRITERS</span>
                  <button
                    onClick={loadTopPlayers}
                    style={{
                      background: '#4dabf7',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    🔄
                  </button>
                </div>
                
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {topPlayers.map((player, index) => (
                    <div 
                      key={player.uid}
                      onClick={() => player.position && centerMap(player.position, 15)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        cursor: player.position ? 'pointer' : 'default',
                        opacity: player.position ? 1 : 0.6
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12'
                      }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                          {player.username}
                        </div>
                        <div style={{ fontSize: '10px', color: '#aaa' }}>
                          {player.rank} • {player.rep} REP • {player.totalMarkers} tags
                        </div>
                      </div>
                      {player.position && (
                        <div style={{ fontSize: '10px', color: '#4ecdc4' }}>
                          🗺️
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {/* Refresh All Button */}
              <button
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                style={{
                  background: '#4dabf7',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: isRefreshing ? 0.7 : 1
                }}
              >
                {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh All Drops'}
              </button>

              {/* Top Players Toggle */}
              <button
                onClick={() => setShowTopPlayers(!showTopPlayers)}
                style={{
                  background: showTopPlayers ? '#10b981' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px'
                }}
              >
                {showTopPlayers ? '👑 Hide Top Players' : '👑 Show Top Players'}
              </button>

              {/* Performance Settings Toggle */}
              <button
                onClick={() => setShowPerformanceSettings(!showPerformanceSettings)}
                style={{
                  background: showPerformanceSettings ? '#f59e0b' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px'
                }}
              >
                {showPerformanceSettings ? '⚡ Hide Settings' : '⚡ Performance'}
              </button>

              <button
                onClick={handleLogout}
                style={{
                  background: '#444',
                  color: '#ff6b6b',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Sign Out
              </button>

                {/* Reset Profile Button - Updated to sign out after reset */}
              <button
                onClick={async () => {
                  if (!window.confirm('Reset ALL your markers and stats permanently?\n\nThis will:\n• Delete all your markers\n• Reset REP to 0\n• Reset Rank to TOY\n• Reset Level to 1\n• Sign you out immediately')) return;
                  if (!user || !userProfile) return;
                  
                  try {
                    if (!user) return;
                    const userMarkersQuery = query(
                      collection(db, 'markers'),
                      where('userId', '==', user.uid)
                    );
                    const userMarkersSnapshot = await getDocs(userMarkersQuery);
                    
                    const deletePromises = userMarkersSnapshot.docs.map(doc => 
                      deleteDoc(doc.ref)
                    );
                    
                    await Promise.all(deletePromises);
                    
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, {
                      totalMarkers: 0,
                      rep: 0,
                      rank: 'TOY',
                      level: 1,
                      unlockedTracks: ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1']
                    });
                    
                    setUserProfile(prev => prev ? {
                      ...prev,
                      totalMarkers: 0,
                      rep: 0,
                      rank: 'TOY',
                      level: 1,
                      unlockedTracks: ['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1']
                    } : null);
                    
                    // Also reset local unlocked tracks state
                    setUnlockedTracks(['https://soundcloud.com/e-u-g-hdub-connected/blackout-classic-at-western-1']);
                    setCurrentTrackIndex(0);
                    
                    // Stop music
                    setIsPlaying(false);
                    
                    await loadAllMarkers();
                    
                    // Show success message first
                    alert('✅ Profile reset successful!\n\n• All markers deleted\n• Stats reset to zero\n• Signing out now...');
                    
                    // Sign out after a short delay
                    setTimeout(async () => {
                      await handleLogout();
                    }, 1000);
                    
                  } catch (err: any) {
                    console.error(err);
                    alert('❌ Reset failed: ' + err.message);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginTop: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
                }}
              >
                <span style={{ fontSize: '16px' }}>🔄</span>
                Reset & Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Right Panel - Photos & Gallery (Camera) */}
        {showPhotosPanel && (
          <div style={{
            ...panelStyle,
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out',
            position: 'relative' as const
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(59,130,246,0.3)'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#4dabf7', 
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📸</span>
                PHOTO GALLERY
              </h3>
              <button
                onClick={() => setShowPhotosPanel(false)}
                style={{
                  background: 'rgba(59,130,246,0.2)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#4dabf7',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Upload Section */}
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ fontSize: '16px', color: '#4dabf7', fontWeight: 'bold', marginBottom: '10px' }}>
                📤 Upload New Photo
              </div>
              <input
                type="file"
                accept="image/*"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed #4dabf7',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  marginBottom: '10px'
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    alert(`Photo "${file.name}" selected (upload coming soon)`);
                  }
                }}
              />
              <button
                onClick={() => alert('Photo upload functionality coming soon!')}
                style={{
                  background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'bold'
                }}
              >
                📲 Upload to Cloud
              </button>
            </div>

            {/* Gallery Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '16px',
                color: '#10b981',
                fontWeight: 'bold',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🖼️ Recent Photos</span>
                <span style={{ fontSize: '12px', color: '#aaa' }}>0/∞</span>
              </div>
              
              {/* Empty State */}
              <div style={{
                textAlign: 'center',
                padding: '30px 20px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px dashed #444'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
                <div style={{ color: '#aaa', marginBottom: '15px' }}>
                  No photos yet
                </div>
                <button
                  onClick={() => alert('Take a photo first using the camera button below!')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Take Your First Photo
                </button>
              </div>
            </div>

            {/* Photo Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #444'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4dabf7' }}>0</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>Photos Taken</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #444'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>0</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>Markers with Photos</div>
              </div>
            </div>

            {/* Camera Controls */}
            <div>
              <div style={{
                fontSize: '16px',
                color: '#fbbf24',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                📱 Camera Settings
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => alert('Switch to front camera')}
                  style={{
                    background: 'rgba(251, 191, 36, 0.1)',
                    color: '#fbbf24',
                    border: '1px solid #fbbf24',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📱</span>
                  Switch Camera
                </button>
                
                <button
                  onClick={() => alert('Toggle flash mode')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#e0e0e0',
                    border: '1px solid #666',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>⚡</span>
                  Flash: Auto
                </button>
                
                <button
                  onClick={() => alert('Open photo gallery')}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#8b5cf6',
                    border: '1px solid #8b5cf6',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🖼️</span>
                  Browse Gallery
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #444' }}>
              <div style={{
                fontSize: '14px',
                color: '#ec4899',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}>
                ⚡ Quick Actions
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => alert('Share your gallery')}
                  style={{
                    background: 'rgba(236, 72, 153, 0.1)',
                    color: '#ec4899',
                    border: '1px solid #ec4899',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🔗 Share
                </button>
                
                <button
                  onClick={() => alert('Export all photos')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px' }}>
                  📤 Export
                </button>
                
                <button
                  onClick={() => alert('Print photos')}
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#4dabf7',
                    border: '1px solid #4dabf7',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  🖨️ Print
                </button>
                
                <button
                  onClick={() => alert('Photo settings')}
                  style={{
                    background: 'rgba(107, 114, 128, 0.1)',
                    color: '#9ca3af',
                    border: '1px solid #6b7280',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ⚙️ Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map Control Panel */}
        {showMapPanel && (
          <div style={{
            ...panelStyle,
            animation: 'slideInLeft 0.3s ease-out',
            position: 'relative' as 'relative'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '12px'
            }}>
              <h3 style={{ margin: 0, color: '#4dabf7', fontSize: '18px' }}>🗺️ MAP CONTROLS</h3>
              <button
                onClick={() => setShowMapPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* Legend Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  style={{
                    backgroundColor: showLegend ? 'rgba(77, 171, 247, 0.2)' : 'rgba(75, 85, 99, 0.5)',
                    border: showLegend ? '1px solid #4dabf7' : '1px solid #6b7280',
                    color: showLegend ? '#4dabf7' : '#cbd5e1',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📋 Legend {showLegend ? 'ON' : 'OFF'}
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                  Show/hide map legend
                </span>
              </div>

              {/* 50m Radius Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShow50mRadius(!show50mRadius)}
                  style={{
                    backgroundColor: show50mRadius ? 'rgba(77, 171, 247, 0.2)' : 'rgba(75, 85, 99, 0.5)',
                    border: show50mRadius ? '1px solid #4dabf7' : '1px solid #6b7280',
                    color: show50mRadius ? '#4dabf7' : '#cbd5e1',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🎯 50m Radius {show50mRadius ? 'ON' : 'OFF'}
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                  Show/hide 50m action radius
                </span>
              </div>

              {/* Top Players Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowTopPlayers(!showTopPlayers)}
                  style={{
                    backgroundColor: showTopPlayers ? 'rgba(77, 171, 247, 0.2)' : 'rgba(75, 85, 99, 0.5)',
                    border: showTopPlayers ? '1px solid #4dabf7' : '1px solid #6b7280',
                    color: showTopPlayers ? '#4dabf7' : '#cbd5e1',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🏆 Top Players {showTopPlayers ? 'ON' : 'OFF'}
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                  Show/hide leaderboard markers
                </span>
              </div>

              {/* Color Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '15px', color: '#ff6b6b', marginBottom: '8px', fontWeight: 'bold' }}>
                🎨 MARKER COLOR
              </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(5, 1fr)', 
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 107, 107, 0.2)',
                  width: '100%'
                }}>
                {MARKER_COLORS.map((color) => (
                  <div 
                    key={color.value}
                    onClick={() => {
                      setSelectedMarkerColor(color.value);
                      saveFavoriteColor(color.value);
                    }}
                    style={{
                      position: 'relative',
                      width: '36px',  // Larger size
                      height: '36px', // Larger size
                      backgroundColor: color.value,
                      border: selectedMarkerColor === color.value ? 
                        '3px solid #ff6b6b' : '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: selectedMarkerColor === color.value ? 
                        '0 0 12px rgba(255, 107, 107, 0.5)' : '0 2px 6px rgba(0,0,0,0.3)',
                      transform: selectedMarkerColor === color.value ? 'scale(1.1)' : 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedMarkerColor !== color.value) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 0 8px rgba(255,255,255,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMarkerColor !== color.value) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                      }
                    }}
                  >
                      {/* Selected indicator */}
                      {selectedMarkerColor === color.value && (
                        <div style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '16px',
                          height: '16px',
                          backgroundColor: '#ff6b6b',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: 'white',
                          fontWeight: 'bold',
                          border: '2px solid rgba(0,0,0,0.5)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          ✓
                        </div>
                      )}
                      
                      {/* Color name tooltip on hover */}
                      <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        opacity: 0,
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s',
                        marginBottom: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        zIndex: 1
                      }} className="color-tooltip">
                        {color.name}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Current color display */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '8px',
                  padding: '10px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  width: '100%'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: selectedMarkerColor,
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }} />
                  <div style={{
                    fontSize: '12px',
                    color: '#e0e0e0',
                    fontWeight: 'bold'
                  }}>
                    {MARKER_COLORS.find(c => c.value === selectedMarkerColor)?.name || 'Custom'}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>
                    {selectedMarkerColor}
                  </div>
                </div>
                
                <span style={{ 
                  fontSize: '11px', 
                  color: '#94a3b8', 
                  textAlign: 'center',
                  marginTop: '4px'
                }}>
                  Click to choose marker color
                </span>
              </div>

              {/* Refresh Drops */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleRefreshAll}
                  disabled={isRefreshing}
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    opacity: isRefreshing ? 0.7 : 1
                  }}
                >
                  {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Drops'}
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                  Reload all markers & players
                </span>
              </div>

              {/* Center on GPS */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={centerOnGPS}
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid #f59e0b',
                    color: '#f59e0b',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📍 Center on GPS
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                  Zoom to your location
                </span>
              </div>

              {/* Show All Drops */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (userMarkers.length > 0 && mapRef.current) {
                      const bounds = calculateBoundsFromMarkers(userMarkers);
                      if (bounds) {
                        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
                      }
                    }
                  }}
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid #8b5cf6',
                    color: '#8b5cf6',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  👁️ Show All Drops
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                  Fit map to all markers
                </span>
              </div>

            </div>

            {/* ⚙️ PERFORMANCE SETTINGS SECTION */}
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fbbf24',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚙️ PERFORMANCE
              </div>

              {/* Crew Detection Toggle */}
              <div style={{
                marginBottom: '15px',
                padding: '12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid #444'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    👥 Crew Detection
                    <input
                      type="checkbox"
                      checked={crewDetectionEnabled}
                      onChange={(e) => setCrewDetectionEnabled(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </label>
                  <span style={{
                    fontSize: '11px',
                    color: crewDetectionEnabled ? '#10b981' : '#ef4444'
                  }}>
                    {crewDetectionEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {crewDetectionEnabled 
                    ? '✓ Scans crew members every 10s'
                    : '✗ Disabled (faster, less CPU)'}
                </div>
              </div>

              {/* Marker Quality Selector */}
              <div style={{
                marginBottom: '15px',
                padding: '12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid #444'
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#cbd5e1',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎨 Marker Quality
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['low', 'medium', 'high'] as const).map((quality) => (
                    <button
                      key={quality}
                      onClick={() => setMarkerQuality(quality)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: markerQuality === quality 
                          ? 'rgba(77, 171, 247, 0.3)' 
                          : 'rgba(255,255,255,0.05)',
                        border: markerQuality === quality 
                          ? '1px solid #4dabf7' 
                          : '1px solid #555',
                        color: markerQuality === quality ? '#4dabf7' : '#cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase'
                      }}
                    >
                      {quality === 'low' ? '⚡ Low' : quality === 'medium' ? '⭐ Med' : '🔥 Max'}
                    </button>
                  ))}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #444'
                }}>
                  {markerQuality === 'low' && '⚡ 25 markers (fastest)'}
                  {markerQuality === 'medium' && '⭐ 50 markers (balanced)'}
                  {markerQuality === 'high' && '🔥 100+ markers (slower)'}
                </div>
              </div>

              {/* Performance Status */}
              <div style={{
                padding: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#10b981'
              }}>
                <strong>💚 Performance Status</strong>
                <div style={{ marginTop: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                  {crewDetectionEnabled ? '✓' : '✗'} Crew detection {crewDetectionEnabled ? 'ON' : 'OFF'}<br/>
                  {markerQuality === 'low' ? '⚡' : markerQuality === 'medium' ? '⭐' : '🔥'} {markerQuality.charAt(0).toUpperCase() + markerQuality.slice(1)} quality mode
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#cbd5e1'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Drops visible:</span>
                <span style={{ color: '#4dabf7' }}>{userMarkers.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Top players:</span>
                <span style={{ color: '#f59e0b' }}>{topPlayers.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>GPS status:</span>
                <span style={{
                  color: gpsStatus === 'tracking' ? '#10b981' :
                        gpsStatus === 'acquiring' ? '#f59e0b' : '#ef4444'
                }}>
                  {gpsStatus === 'tracking' ? 'Active' :
                  gpsStatus === 'acquiring' ? 'Acquiring...' :
                  gpsStatus === 'error' ? 'Error' : 'Initializing'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Music tracks:</span>
                <span style={{ color: '#8a2be2' }}>{unlockedTracks.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Music Panel */}
            {showMusicPanel && (
<div style={{
            ...panelStyle,
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out',
            minWidth: '350px',
            position: 'absolute' as const
          }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(138, 43, 226, 0.3)'
                }}>
                  <h3 style={{
                    margin: 0,
                    color: '#8a2be2',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🎵</span>
                    MUSIC COLLECTION
                  </h3>
                  <button
                    onClick={() => setShowMusicPanel(false)}
                    style={{
                      background: 'rgba(138, 43, 226, 0.2)',
                      border: '1px solid rgba(138, 43, 226, 0.3)',
                      color: '#8a2be2',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {/* Music Player Section */}
                <div style={{
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {/* Now Playing Info */}
                  <div style={{
                    background: 'rgba(138, 43, 226, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(138, 43, 226, 0.2)'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: isPlaying ? '#10b981' : '#ef4444',
                        animation: isPlaying ? 'pulse 1s infinite' : 'none'
                      }}></div>
                      Now Playing: {getCurrentTrackName()}
                      {isPlaying && <span style={{ fontSize: '11px', color: '#10b981' }}>● LIVE</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                      {unlockedTracks[currentTrackIndex]?.includes('soundcloud.com') ? 
                        '🎧 Playing via SoundCloud' : 
                        `Track ${currentTrackIndex + 1} of ${unlockedTracks.length}`
                      }
                    </div>
                  </div>

                  {/* SoundCloud Player */}
                  {unlockedTracks[currentTrackIndex]?.includes('soundcloud.com') && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #444',
                      minHeight: '166px',
position: 'relative' as 'relative'
                    }}>
                      {isSoundCloudLoading ? (
                        <div style={{ 
                          padding: '30px', 
                          color: '#cbd5e1', 
                          fontSize: '12px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{ fontSize: '24px' }}>⏳</div>
                          Loading SoundCloud track...
                        </div>
                      ) : (
                        <div style={{ position: 'relative', width: '100%' }}>
                          <iframe
                            id="soundcloud-music-panel"
                            src={createSoundCloudIframeUrl(unlockedTracks[currentTrackIndex])}
                            width="100%"
                            height="166"
                            frameBorder="no"
                            scrolling="no"
                            style={{ 
                              border: 'none',
                              backgroundColor: 'transparent'
                            }}
                            title="SoundCloud Player"
                            allow="autoplay"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Local Audio Player */}
                  {!unlockedTracks[currentTrackIndex]?.includes('soundcloud.com') && unlockedTracks[currentTrackIndex] && (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '15px',
                      border: '1px solid #444',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>💿</div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                        Local Audio File
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>
                        Using browser audio player
                      </div>
                    </div>
                  )}
                </div>

                {/* Unlocked Tracks List */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '10px', fontWeight: 'bold' }}>
                    🎵 Your Collection ({unlockedTracks.length} tracks)
                  </div>

                  {unlockedTracks.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '30px 20px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '8px',
                      border: '1px dashed #444'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎵</div>
                      <div style={{ color: '#aaa' }}>
                        No tracks unlocked yet
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        Place drops to unlock music!
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {unlockedTracks.map((track, index) => {
                        const trackName = getTrackNameFromUrl(track);
                        const isSoundCloud = track.includes('soundcloud.com');
                        const isCurrentlyPlaying = index === currentTrackIndex;

                        return (
                          <div
                            key={index}
                            onClick={() => {
                              if (isCurrentlyPlaying) {
                                togglePlay();
                              } else {
                                setCurrentTrackIndex(index);
                                setIsPlaying(true);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px',
                              background: isCurrentlyPlaying ? 'rgba(138, 43, 226, 0.2)' : 'rgba(255,255,255,0.03)',
                              borderRadius: '6px',
                              border: isCurrentlyPlaying ? '1px solid rgba(138, 43, 226, 0.4)' : '1px solid #333',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              fontSize: '18px',
                              minWidth: '24px',
                              textAlign: 'center'
                            }}>
                              {isSoundCloud ? '🎵' : '💿'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: isCurrentlyPlaying ? 'bold' : 'normal',
                                color: isCurrentlyPlaying ? '#8a2be2' : 'white'
                              }}>
                                {trackName}
                                {isCurrentlyPlaying && (
                                  <span style={{
                                    marginLeft: '8px',
                                    fontSize: '11px',
                                    color: '#10b981',
                                    animation: 'pulse 1s infinite'
                                  }}>
                                    ● NOW PLAYING
                                  </span>
                                )}
                              </div>
                              <div style={{
                                fontSize: '11px',
                                color: isSoundCloud ? '#ff6b6b' : '#10b981',
                                marginTop: '2px'
                              }}>
                                {isSoundCloud ? 'SoundCloud' : 'Local Audio'}
                              </div>
                            </div>
                            {isSoundCloud && (
                              <div style={{
                                fontSize: '12px',
                                color: '#ff6b6b'
                              }}>
                                🎧
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Music Controls */}
                {unlockedTracks.length > 0 && (
                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(138, 43, 226, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* Playback Controls */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <button
                        onClick={playPreviousTrack}
                        style={{
                          background: 'rgba(138, 43, 226, 0.2)',
                          border: '1px solid rgba(138, 43, 226, 0.3)',
                          color: '#8a2be2',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ⏮️
                      </button>

                      <button
                        onClick={togglePlay}
                        style={{
                          background: 'rgba(138, 43, 226, 0.2)',
                          border: '1px solid rgba(138, 43, 226, 0.3)',
                          color: '#8a2be2',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isPlaying ? '⏸️' : '▶️'}
                      </button>

                      <button
                        onClick={playNextTrack}
                        style={{
                          background: 'rgba(138, 43, 226, 0.2)',
                          border: '1px solid rgba(138, 43, 226, 0.3)',
                          color: '#8a2be2',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ⏭️
                      </button>
                    </div>



                  </div>
                )}
              </div>
            )}
      </div>

      {/* ========== END DUAL CONTROL PANELS ========== */}



        {/* Direct Messaging Panel */}
        {showMessagesPanel && userProfile && (
          <DirectMessaging
            isOpen={showMessagesPanel}
            onClose={() => setShowMessagesPanel(false)}
            userProfile={userProfile}
            gpsPosition={gpsPosition}
          />
        )}

        {/* Crew Chat Panel */}
        {showCrewChat && userProfile?.crewId && user && (
          <CrewChatPanel 
            crewId={userProfile.crewId} 
            onClose={() => setShowCrewChat(false)}
            userProfile={userProfile}
          />
        )}

        {/* Story Panel - Separate from other panels */}
        {showStoryPanel && (
          <div style={{
            ...panelStyle,
            position: 'absolute',
            top: 80,
            left: 0,
            border: '1px solid #8b5cf6',
            animation: 'slideInLeft 0.3s ease-out',
            minWidth: '350px',
            maxHeight: '80vh',
            zIndex: 1300
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(139, 92, 246, 0.3)'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#8b5cf6', 
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📖</span>
                BLACKOUT STORY
              </h3>
              <button
                onClick={() => setShowStoryPanel(false)}
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#8b5cf6',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ maxHeight: 'calc(80vh - 60px)', overflowY: 'auto' }}>
              <StoryPanel />
            </div>
          </div>
        )}

                      {/* Blur Effect Layer Behind SVG */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        zIndex: 1099, // Behind the navigation
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }} />

      {/* Bottom Navigation Container */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        zIndex: 1100, // On top of blur layer
        overflow: 'hidden',
      }}>
        
        {/* White Glow Layer - Behind SVG only */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          // White glow effect
          boxShadow: `
            0 0 40px rgba(255, 255, 255, 0.8),
            0 0 80px rgba(255, 255, 255, 0.6),
            0 0 120px rgba(255, 255, 255, 0.4),
            inset 0 0 60px rgba(255, 255, 255, 0.7)
          `,
          filter: `drop-shadow(0 0 25px rgba(255, 255, 255, 1))`,
          animation: 'whiteGlowPulse 3s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        
        {/* Crew Color Glow Layer - For selected button */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          {/* Map Button Glow Section */}
          <div style={{
            opacity: showMapPanel ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
          
          {/* Blackbook Button Glow Section */}
          <div style={{
            opacity: showProfilePanel ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
          
          {/* Camera Button Glow Section */}
          <div style={{
            opacity: showPhotosPanel ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
          
          {/* Crew Chat Glow Section */}
          <div style={{
            opacity: showCrewChat ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: 'radial-gradient(circle at center, rgba(77, 171, 247, 1) 0%, rgba(77, 171, 247, 0.7) 50%, transparent 85%)',
            boxShadow: `
              inset 0 0 80px rgba(77, 171, 247, 0.9),
              0 0 120px rgba(77, 171, 247, 0.8),
              0 0 180px rgba(77, 171, 247, 0.6)
            `,
            filter: 'blur(1px)',
          }} />
        </div>

        {/* SVG Background - White glow shows through transparent areas */}
        <img 
          src="bobottomnav1.svg" 
          alt="Bottom Navigation"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
        
        {/* Interactive Buttons Layer - Only clickable areas, no text/emoji */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          alignItems: 'center',
          zIndex: 3,
        }}>
          
          {/* Map Button - Empty, just clickable */}
          <button
            onClick={() => {
              setShowMapPanel(!showMapPanel);
              setShowProfilePanel(false);
              setShowPhotosPanel(false);
              setShowCrewChat(false);
              setShowMusicPanel(false);
              setShowStoryPanel(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Map"
          >
            {/* Empty button - icon/text should be in SVG */}
          </button>

          {/* Blackbook Button - Empty, just clickable */}
          <button
            onClick={() => {
              setShowProfilePanel(!showProfilePanel);
              setShowPhotosPanel(false);
              setShowCrewChat(false);
              setShowMapPanel(false);
              setShowMusicPanel(false);
              setShowStoryPanel(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Blackbook"
          >
            {/* Empty button - icon/text should be in SVG */}
          </button>

          {/* Camera Button - Empty, just clickable */}
          <button
            onClick={() => {
              setShowPhotosPanel(!showPhotosPanel);
              setShowProfilePanel(false);
              setShowCrewChat(false);
              setShowMapPanel(false);
              setShowMusicPanel(false);
              setShowStoryPanel(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Camera"
          >
            {/* Empty button - icon/text should be in SVG */}
          </button>

          {/* Crew Chat Button - Empty, just clickable */}
          <button
            onClick={() => {
              setShowCrewChat(!showCrewChat);
              setShowProfilePanel(false);
              setShowPhotosPanel(false);
              setShowMapPanel(false);
              setShowMusicPanel(false);
              setShowStoryPanel(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 0',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              height: '100%',
              width: '100%',
              borderRadius: '0',
              position: 'relative',
            }}
            aria-label="Crew Chat"
          >
            {/* Empty button - icon/text should be in SVG */}
          </button>
        </div>
      </div>

      {/* Secondary Controls - Under Online Button */}
      <div style={{
        position: 'fixed',
        bottom: '68px', // Positioned above the main nav bar
        left: '0px', // Aligned with the Online button
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        zIndex: 1100
      }}>
        {/* Story Button */}
        <button
          onClick={() => {
            setShowStoryPanel(!showStoryPanel);
            setShowProfilePanel(false);
            setShowPhotosPanel(false);
            setShowMessagesPanel(false);
            setShowMapPanel(false);
            setShowMusicPanel(false);
          }}
          style={{
            background: showStoryPanel ? 'rgba(139, 92, 246, 0.2)' : 'rgba(15, 23, 42, 0.9)',
            border: showStoryPanel ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: showStoryPanel ? '#8b5cf6' : '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            gap: '3px',
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            minWidth: '60px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{
            fontSize: '20px',
            transform: showStoryPanel ? 'scale(1.1)' : 'scale(1)'
          }}>
            📖
          </div>
          Story
        </button>

        {/* Music - Toggles Music Panel */}
        <button
          onClick={() => {
            setShowMusicPanel(!showMusicPanel);
            setShowProfilePanel(false);
            setShowPhotosPanel(false);
            setShowMessagesPanel(false);
            setShowMapPanel(false);
            setShowStoryPanel(false);
          }}
          style={{
            background: showMusicPanel ? 'rgba(138, 43, 226, 0.2)' : 'rgba(15, 23, 42, 0.9)',
            border: showMusicPanel ? '1px solid rgba(138, 43, 226, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: showMusicPanel ? '#8a2be2' : '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            gap: '3px',
            padding: '8px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            minWidth: '60px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{
            fontSize: '20px',
            transform: showMusicPanel ? 'scale(1.1)' : 'scale(1)'
          }}>
            🎵
          </div>
          Music
        </button>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="legend" style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0,0,0,0.65)',
          color: 'white',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 13,
          zIndex: 900,
          backdropFilter: 'blur(4px)',
          maxWidth: '250px'
        }}>
          <div>📍 Your location {isOfflineMode ? '(Offline)' : '(NZ only)'}</div>
          <div style={{color: selectedMarkerColor}}>● All drops (blue dot = yours)</div>
          <div>{isOfflineMode ? '🔴' : '🟢'} 50m radius {isOfflineMode ? '(Offline Mode)' : '(Online Mode)'}</div>
          <div>🎯 GPS accuracy {isOfflineMode ? '(Disabled)' : ''}</div>
          <div style={{fontSize: '10px', color: isOfflineMode ? '#ef4444' : '#60a5fa', marginTop: '4px'}}>
            {isOfflineMode ? '🎮 Offline Mode' : '🗺️ Blackout NZ - Street art across Aotearoa'}
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '11px',
            color: gpsStatus === 'tracking' ? '#10b981' :
                  gpsStatus === 'acquiring' ? '#f59e0b' :
                  gpsStatus === 'error' ? '#ef4444' : '#6b7280'
          }}>
            📡 GPS: {
              isOfflineMode ? 'Offline Mode' :
              gpsStatus === 'tracking' ? 'Active' :
              gpsStatus === 'acquiring' ? 'Acquiring...' :
              gpsStatus === 'error' ? 'Error' : 'Initializing'
            }
            {gpsPosition && (
              <div style={{ fontSize: '9px', marginTop: '2px', opacity: 0.8 }}>
                {gpsPosition[0].toFixed(4)}, {gpsPosition[1].toFixed(4)}
              </div>
            )}
            {gpsError && (
              <div style={{
                fontSize: '9px',
                marginTop: '2px',
                color: '#ef4444',
                maxWidth: '200px',
                wordWrap: 'break-word'
              }}>
                {gpsError}
              </div>
            )}
          </div>
          {showTopPlayers && (
            <>
              <div style={{marginTop: '8px', color: '#fbbf24'}}>🥇 Top Writer</div>
              <div style={{color: '#cbd5e1'}}>🥈 Runner-up</div>
              <div style={{color: '#d97706'}}>🥉 Contender</div>
            </>
          )}
          <div style={{marginTop: '8px', fontSize: '11px', color: '#4dabf7'}}>
            Total drops: {userMarkers.length}
          </div>
          <div style={{marginTop: '8px', fontSize: '11px', color: '#8a2be2'}}>
            Music: {unlockedTracks.length} tracks unlocked
          </div>
          {/* 🆕 Add Crew Chat Status */}
          {userProfile?.crewId && !userProfile?.isSolo && (
            <div style={{marginTop: '8px', fontSize: '11px', color: '#10b981'}}>
              Crew: {userProfile.crewName} (Chat available)
            </div>
          )}
        </div>
      )}

      

      <style>{`
        @keyframes popIn {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          70% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        @keyframes slideInLeft {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInRight {
          0% { transform: translateX(20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideIn {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes progressPulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes buttonGlowPulse {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.9;
            transform: scale(1.02);
          }
        }

        @keyframes whiteGlowPulse {
          0%, 100% { 
            opacity: 1;
            box-shadow: 
              0 0 40px rgba(255, 255, 255, 0.8),
              0 0 80px rgba(255, 255, 255, 0.6),
              0 0 120px rgba(255, 255, 255, 0.4),
              inset 0 0 60px rgba(255, 255, 255, 0.7);
          }
          50% { 
            opacity: 0.9;
            boxShadow: 
              0 0 45px rgba(255, 255, 255, 0.9),
              0 0 90px rgba(255, 255, 255, 0.7),
              0 0 140px rgba(255, 255, 255, 0.5),
              inset 0 0 65px rgba(255, 255, 255, 0.8);
          }
        }
                    /* Hide Leaflet zoom controls */
        .leaflet-control-zoom {
          display: none !important;
        }

        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out {
          display: none !important;
        }

        .leaflet-control-zoom a {
          display: none !important;
        }
      `}
      </style>
    </div>
    </StoryManagerProvider>
  );
};

export default React.memo(() => {
  return (
    <EnhancedErrorBoundary
      onReset={() => {
        // Clear any cached errors and reload
        window.location.reload();
      }}
    >
      <HomeComponent />
    </EnhancedErrorBoundary>
  );
});