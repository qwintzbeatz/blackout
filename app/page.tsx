'use client';

import { StoryManagerProvider } from '@/components/story/StoryManager';
import StoryPanel from '@/components/story/StoryPanel';
import { useMissionTriggers } from '@/hooks/useMissionTriggers';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import useCrewChatUnreadTracker from '@/hooks/useCrewChatUnreadTracker';
import useStoryNotificationTracker from '@/hooks/useStoryNotificationTracker';
import useLoadingManager from '@/hooks/useLoadingManager';
import useSafeOperation from '@/hooks/useSafeOperation';

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
import { auth, db } from '@/lib/firebase/config';
import { characters } from '@/data/characters'; // New import
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// Import extracted components
import LoginScreen from '@/components/auth/LoginScreen';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import ProfileStats from '@/components/profile/ProfileStats';
import DropTypeModal from '@/components/modals/DropTypeModal';
import SongSelectionModal from '@/components/modals/SongSelectionModal';
import LegendPanel from '@/components/ui/LegendPanel';
import ColorPickerPanel from '@/components/ui/ColorPickerPanel';

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
import { saveDropToFirestore, loadAllDrops, deleteUserDrops } from '@/lib/firebase/drops';
import CrewChatPanel from '@/components/chat/CrewChatPanel';

import { BlackbookPanel } from '@/components/blackbook/BlackbookPanel';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useMarkers } from '@/hooks/useMarkers';
import { useMusicPlayer, getRandomStartTrack } from '@/hooks/useMusicPlayer';
import { useDropCreation } from '@/hooks/useDropCreation';
import { PerformanceSettingsPanel } from '@/src/components/ui/PerformanceSettingsPanel';
import SpotifyPlayer from '@/components/music/SpotifyPlayer';
import SoundCloudPlayer from '@/components/music/SoundCloudPlayer';
import { CREWS } from '@/data/crews';
import { useGPSTracker } from '@/hooks/useGPSTracker';
import { EnhancedErrorBoundary } from '@/src/components/ui/EnhancedErrorBoundary';
import { ErrorRecoveryPanel } from '@/src/components/ui/ErrorRecoveryPanel';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';
import ErrorTest from '@/components/ui/ErrorTest';
import ProfileSetupSticker from '@/components/ProfileSetupSticker';
import { SurfaceGraffitiSelector } from '@/components/ui/SurfaceGraffitiSelector';
import { RepNotification } from '@/components/ui/RepNotification';
import SongUnlockModal from '@/components/ui/SongUnlockModal';
import { SPOTIFY_TRACKS, UNLOCKABLE_TRACKS, DEFAULT_TRACK, isSpotifyUrl, getTrackName, getSpotifyTrackName } from '@/constants/all_tracks';
import { HIPHOP_TRACKS } from '@/constants/tracks';
import { fullScreenStyle, loadingSpinnerStyle, panelBaseStyle, buttonBaseStyle, primaryButtonStyle, secondaryButtonStyle, successButtonStyle, dangerButtonStyle, inputBaseStyle, flexCenterStyle, flexBetweenStyle, flexColumnStyle, titleTextStyle, subtitleTextStyle, colors, gradients } from './pageStyles';
import { MarkerName, MarkerDescription, Gender, MARKER_COLORS, MARKER_NAMES, MARKER_DESCRIPTIONS, CrewId } from '@/constants/markers';
import { SurfaceType, GraffitiType } from '@/types';
import { 
  migrateMarkerNameToSurface, 
  migrateMarkerDescriptionToGraffiti,
  getSurfaceOptions,
  getGraffitiTypeOptions,
  SURFACE_TO_MARKER_NAME,
  GRAFFITI_TO_MARKER_DESCRIPTION
} from '@/utils/typeMapping';
import { calculateRep, RepResult, calculateEnhancedRank, getRankColor, getRankProgress } from '@/utils/repCalculator';
import { initializeUnlockedColors, getDefaultColorForCrew, ALL_COLORS } from '@/utils/colorUnlocks';
import { GRAFFITI_STYLES } from '@/utils/graffitiUnlocks';
import { calculateDistance as calculateDistanceHelper, getTrackNameFromUrl as getTrackNameFromUrlHelper, getTrackSource, getTrackThemeColor } from '@/lib/utils/dropHelpers';
import { generateAvatarUrl as generateAvatarUrlHelper } from '@/lib/utils/avatarGenerator';
import { getTrackName as getTrackNameHelper } from '@/constants/all_tracks';
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
  DirectChat,
  CrewChatUnreadStatus
} from '@/lib/types/blackout';

// 🔧 PERFORMANCE: Enable SoundCloud for music playback functionality
const ENABLE_SOUNDCLOUD = false;

// PERFORMANCE OPTIMIZATIONS:
// - Component splitting: CrewChatPanel, MusicPlayer, ProfilePanel extracted
// - State management: useMemo, useCallback, React.memo implemented
// - Memory cleanup: Proper event listener cleanup in useEffect
// - Bundle reduction: Separated concerns into modular components

// Advanced REP Calculation Functions
const calculateRepForMarker = (
  markerName: MarkerName, 
  markerDescription: MarkerDescription,
  distanceFromCenter: number | null,
  surface?: SurfaceType,
  graffitiType?: GraffitiType
): { rep: number; breakdown?: RepResult['breakdown'] } => {
  // Use new system if surface and graffiti type are provided
  if (surface && graffitiType) {
    const options = {
      isHeaven: ['rooftop', 'bridge'].includes(surface),
      isMovingTarget: ['train', 'truck', 'van'].includes(surface),
      isHighRisk: ['speed_camera', 'traffic_light'].includes(surface),
      hasStreakBonus: distanceFromCenter !== null && distanceFromCenter <= 50
    };
    
    const result = calculateRep(surface, graffitiType, options);
    return { rep: result.rep, breakdown: result.breakdown };
  }
  
  // Fallback to old system for backward compatibility
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
  
  return { rep };
};

const calculateRank = (rep: number): string => {
  // Use the enhanced rank calculation from repCalculator
  return calculateEnhancedRank(rep);
};

const calculateLevel = (rep: number): number => {
  return Math.floor(rep / 100) + 1;
};

// Helper function to unlock a random SPOTIFY track only
// Used for: Tag/Marker drops
const unlockRandomSpotifyTrack = (currentUnlocked: string[]): { newTracks: string[], newlyUnlocked: { url: string; name: string; source: 'Spotify' | 'SoundCloud' } | null } => {
  // Spotify tracks only
  const availableTracks = SPOTIFY_TRACKS.filter(track =>
    !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) return { newTracks: currentUnlocked, newlyUnlocked: null };

  // Pick random Spotify track
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

// Helper function to unlock a random SOUNDCLOUD track only
// Used for: Photo drops
const unlockRandomSoundCloudTrack = (currentUnlocked: string[]): { newTracks: string[], newlyUnlocked: { url: string; name: string; source: 'Spotify' | 'SoundCloud' } | null } => {
  // SoundCloud tracks only (HIPHOP_TRACKS are SoundCloud URLs)
  const availableTracks = HIPHOP_TRACKS.filter(track =>
    !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) return { newTracks: currentUnlocked, newlyUnlocked: null };

  // Pick random SoundCloud track
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

// Keep original function for backward compatibility (combines both)
const unlockRandomTrack = (currentUnlocked: string[]): { newTracks: string[], newlyUnlocked: { url: string; name: string; source: 'Spotify' | 'SoundCloud' } | null } => {
  // Combine Spotify and SoundCloud tracks
  const ALL_TRACKS = [...SPOTIFY_TRACKS, ...HIPHOP_TRACKS];
  
  // Get tracks that haven't been unlocked yet
  const availableTracks = ALL_TRACKS.filter(track =>
    !currentUnlocked.includes(track)
  );

  if (availableTracks.length === 0) return { newTracks: currentUnlocked, newlyUnlocked: null };

  // Pick random track
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

// Helper function to get track name from URL
const getTrackNameFromUrl = (url: string): string => {
  if (url === 'blackout-classic.mp3') return 'Blackout (Default)';
  if (url.includes('open.spotify.com/')) {
    // Use the getTrackName function from all_tracks
    return getTrackName(url);
  }
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
      break;
      
    case 'avataaars': // Female (girlish)
      url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'bottts': // Other (alien/robot)
      url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${selectedColor}`;
      break;
      
    case 'identicon': // Prefer not to say (android/geometric)
      url = `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&backgroundColor=${selectedColor}`;
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
  }, []);
  
  const logPerformance = useCallback((operation: string, startTime: number) => {
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`Slow operation (${operation}): ${duration.toFixed(2)}ms`);
    }
  }, []);
  
  return { logPerformance };
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
  const { safeOperation } = useSafeOperation();
  
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
  
  // NPC Welcome Notification State
  const [npcWelcomeNotification, setNpcWelcomeNotification] = useState<{
    show: boolean;
    leaderName: string;
    message: string;
  } | null>(null);
  
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
  
  // Surface and graffiti type states (new)
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>('wall');
  const [selectedGraffitiType, setSelectedGraffitiType] = useState<GraffitiType>('tag');

  // Audio player states - Spotify only
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showSpotifyWidget, setShowSpotifyWidget] = useState(false);
  const [unlockedTracks, setUnlockedTracks] = useState<string[]>(getRandomStartTrack());
  
  // REP Notification state
  const [repNotification, setRepNotification] = useState<{ 
    show: boolean, 
    amount: number, 
    message: string, 
    breakdown?: RepResult['breakdown'] 
  } | null>(null);
  
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
  const [showBlackbookPanel, setShowBlackbookPanel] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSatelliteView, setShowSatelliteView] = useState(false);

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(166);

  
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
  
  // 🆕 Selected Music Drop for full-screen modal
  const [selectedMusicDrop, setSelectedMusicDrop] = useState<Drop | null>(null);
  
  // 🆕 Selected Photo Drop for full-screen modal
  const [selectedPhotoDrop, setSelectedPhotoDrop] = useState<Drop | null>(null);
  
  // 🆕 Song Unlock Modal state
  const [songUnlockModal, setSongUnlockModal] = useState<{
    isOpen: boolean;
    trackUrl: string;
    trackName: string;
    source: string;
  } | null>(null);
  
  // 🆕 Recently unlocked track state - displayed prominently in music panel
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<{
    url: string;
    name: string;
    source: 'Spotify' | 'SoundCloud';
  } | null>(null);
  
  // 🆕 Loading state for drop creation (prevents rapid clicks)
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);
  
  // 🆕 Song selection modal state
  const [showSongSelection, setShowSongSelection] = useState(false);
  
  // ========== PROFILE PICTURE UPLOAD ==========
  const handleProfilePicUpload = async (file: File) => {
    if (!user || !userProfile) {
      alert('Please sign in first!');
      return;
    }

    try {
      // Upload to ImgBB
      const profilePicUrl = await uploadImageToImgBB(file);
      
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePicUrl: profilePicUrl,
        lastActive: Timestamp.now()
      });
      
      // Update local state
      setUserProfile(prev => prev ? {
        ...prev,
        profilePicUrl: profilePicUrl
      } : null);
      
      alert('✅ Profile picture updated successfully!');
      
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

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
      const userId = marker.userId || 'unknown';
      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(marker);
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

  // 🆕 CREW CHAT UNREAD TRACKER HOOK
  const { hasUnreadMessages, unreadCount, markCrewChatAsRead } = useCrewChatUnreadTracker();
  // 🆕 STORY NOTIFICATION TRACKER HOOK
  const { hasNewStoryContent, activeMissionCount, markStoryContentAsViewed } = useStoryNotificationTracker();

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

  // ========== MOBILE DETECTION & RESPONSIVE IFRAME ==========
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                             window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      // Set iframe height based on screen size
      if (window.innerWidth < 480) {
        setIframeHeight(120); // Small phones
      } else if (window.innerWidth < 768) {
        setIframeHeight(140); // Tablets/large phones
      } else {
        setIframeHeight(166); // Desktop
      }
    };
    
    // Check on mount
    checkMobile();
    
    // Listen for resize and orientation changes
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // ========== AUTOPLAY MUSIC ON MAP LOAD ==========
  useEffect(() => {
    // Only try autoplay if we have tracks and haven't attempted yet
    if (unlockedTracks.length > 0 && !isPlaying) {
      // Small delay to ensure iframe is mounted
      const autoplayTimer = setTimeout(() => {
        setIsPlaying(true);
        console.log('Attempting autoplay...');
      }, 1000);
      
      return () => clearTimeout(autoplayTimer);
    }
  }, [unlockedTracks.length]); // Run when tracks change

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
          name: data.name as MarkerName,
          description: data.description as MarkerDescription,
          color: data.color || '#10b981',
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          userId: data.userId,
          username: data.username || 'Anonymous',
          userProfilePic: data.userProfilePic || generateAvatarUrl(data.userId, data.username),
          distanceFromCenter: data.distanceFromCenter ?? undefined,
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
      const profilePicUrl = generateAvatarUrl(user.uid, data.username.trim(), data.gender as Gender);
      
      let crewId: CrewId | null = null;
      let crewName: string | null = null;
      const isSolo = data.crewChoice === 'solo';
      
      if (!isSolo && data.selectedCrew) {
        crewId = data.selectedCrew as CrewId;
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
      const initialUnlockedColors = initializeUnlockedColors(crewId);
      const initialFavoriteColor = getDefaultColorForCrew(crewId);
      
      // Set the selected marker color to the crew's default
      setSelectedMarkerColor(initialFavoriteColor);
      
      const userProfileData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        username: data.username.trim(),
        gender: data.gender as Gender,
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
        // Initialize graffiti styles
        unlockedGraffitiTypes: ['sticker', 'tag'],
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
  
  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setAuthError(null);
    
    // 🎵 Start playing on user interaction
    setIsPlaying(true);
    
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
    
    // 🎵 Start playing on user interaction
    setIsPlaying(true);
    
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

      const userUnlockedTracks = data.unlockedTracks && data.unlockedTracks.length > 0 
  ? data.unlockedTracks 
  : getRandomStartTrack();
      setUnlockedTracks(userUnlockedTracks);

      // Initialize unlockedColors if not present (for existing users)
      const userUnlockedColors = data.unlockedColors || initializeUnlockedColors(data.crewId);
      
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
        unlockedColors: userUnlockedColors,
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
        kaiTiakiEvaluationsReceived: data.kaiTiakiEvaluationsReceived || 0,
        hasReceivedCrewWelcomeMessage: data.hasReceivedCrewWelcomeMessage || false // Initialize new field
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
          // loadUserProfile already fetches top players, markers, and drops internally.
          // We only call it once here to avoid double-loading data on login.
          await loadUserProfile(currentUser);
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

  // 🎵 Sync unlocked tracks from userProfile when profile loads
  useEffect(() => {
    if (userProfile?.unlockedTracks && userProfile.unlockedTracks.length > 0) {
      // Sync unlocked tracks from user profile
      setUnlockedTracks(userProfile.unlockedTracks);
    }
  }, [userProfile]);

  // 🎵 Also sync when userProfile is updated with new tracks
  useEffect(() => {
    if (userProfile?.unlockedTracks && userProfile.unlockedTracks.length > 0) {
      console.log('🔄 Syncing unlockedTracks from userProfile:', userProfile.unlockedTracks);
      setUnlockedTracks(userProfile.unlockedTracks);
    }
  }, [userProfile?.unlockedTracks]);

  

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
          const distance = calculateDistanceHelper(
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
      try {
        mapRef.current.setView(gpsPosition, zoom);
      } catch (e) {
        // Map may be unmounted
      }
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
      // Use new advanced REP calculation
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
        // New surface and graffiti type fields
        surface: (marker.surface ?? migrateMarkerNameToSurface(marker.name)) as SurfaceType | undefined,
        graffitiType: (marker.graffitiType ?? migrateMarkerDescriptionToGraffiti(marker.description)) as GraffitiType | undefined,
        repBreakdown: repResult.breakdown
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
        message: message,
        breakdown: repResult.breakdown
      });

      // Check if user just placed their first drop and send welcome message if needed
      if (userProfile.crewId && !userProfile.hasReceivedCrewWelcomeMessage) {
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

          // Update user profile in Firestore to mark message as sent
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            hasReceivedCrewWelcomeMessage: true,
            lastActive: Timestamp.now()
          });

                      // Update local userProfile state
                      setUserProfile(prev => prev ? {
                        ...prev,
                        hasReceivedCrewWelcomeMessage: true
                      } : null);
                    }
                  }
          
                  // Check for mission completion: "First Tags" (act1_intro) after 3rd drop
                  const newTotalMarkers = (userProfile.totalMarkers || 0) + 1;
                  if (newTotalMarkers === 3 && userProfile.activeMissions?.includes('act1_intro')) {
                    const storyRef = doc(db, 'story', user.uid);
                    await updateDoc(storyRef, {
                      activeMissions: (userProfile.activeMissions || []).filter(id => id !== 'act1_intro'),
                      completedMissions: [...(userProfile.completedMissions || []), 'act1_intro'],
                      storyProgress: (userProfile.storyProgress || 0) + 1, // Increment story progress
                      lastUpdated: Timestamp.now()
                    });
          
                    // Update local userProfile state for active/completed missions and story progress
                    setUserProfile(prev => prev ? {
                      ...prev,
                      activeMissions: prev.activeMissions?.filter(id => id !== 'act1_intro') || [],
                      completedMissions: [...(prev.completedMissions || []), 'act1_intro'],
                      storyProgress: (prev.storyProgress || 0) + 1,
                    } : null);
          
                    // Optional: Show a notification for mission completion
                    setRepNotification({
                      show: true,
                      amount: 0, // No direct REP from mission completion here, handled by mission rewards
                      message: 'MISSION COMPLETE: First Tags! 🎉',
                    });
                  }
                
                return docRef.id;
              } catch (error) {
                console.error('Error saving marker to Firestore:', error);
                return null;
              }
            };
  // UPDATED: Handle photo selection with GPS extraction and ImgBB upload
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
      // First, upload the photo to ImgBB to get a proper URL
      let photoUrl: string;
      
      try {
        photoUrl = await uploadImageToImgBB(photoData.file);
      } catch (uploadError: any) {
        console.error('ImgBB upload failed:', uploadError);
        alert(`Photo upload failed: ${uploadError.message}. Please try a smaller image.`);
        setIsUploadingPhoto(false);
        return;
      }
      
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

        const currentTracks = userProfile.unlockedTracks && userProfile.unlockedTracks.length > 0 
          ? userProfile.unlockedTracks 
          : getRandomStartTrack();
        // 📸 PHOTO DROP: Unlocks SoundCloud tracks only
        const unlockResult = unlockRandomSoundCloudTrack(currentTracks);
        const newTracks = unlockResult.newTracks;

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

        console.log('📸 PHOTO DROP: Saved newTracks to state:', newTracks);
        setUnlockedTracks(newTracks);

        setDrops(prev => [{ ...newDrop, firestoreId: dropId, id: `drop-${dropId}` }, ...prev]);
        
        setShowPhotoModal(false);
        setPendingDropPosition(null);

        const trackUnlocked = newTracks.length > currentTracks.length;
        const unlockedTrackName = trackUnlocked ? getTrackNameFromUrl(newTracks[newTracks.length - 1]) : '';
        const unlockedTrackUrl = trackUnlocked ? newTracks[newTracks.length - 1] : '';

        if (trackUnlocked) {
          // Show full-screen celebration modal
          setSongUnlockModal({
            isOpen: true,
            trackUrl: unlockedTrackUrl,
            trackName: unlockedTrackName,
            source: 'GPS PHOTO DROP'
          });
          
          // 🆕 Set recently unlocked track for music panel display
          const isSpotifyTrack = unlockedTrackUrl.includes('open.spotify.com');
          setRecentlyUnlocked({
            url: unlockedTrackUrl,
            name: unlockedTrackName,
            source: isSpotifyTrack ? 'Spotify' : 'SoundCloud'
          });
        }

        const trackUnlockedMessage = trackUnlocked 
          ? `🎵 NEW TRACK UNLOCKED! 🎵\n\n${unlockedTrackName}`
          : null;

        setRepNotification({
          show: true,
          amount: repEarned,
          message: trackUnlockedMessage || `📸 Photo Drop Placed! +${repEarned} REP`
        });

        // Center map on the drop location
        if (mapRef.current) {
          mapRef.current.setView([dropLat, dropLng], 17);
        }

        // Check if user just placed their first drop and send welcome message if needed
        if (userProfile.crewId && !userProfile.hasReceivedCrewWelcomeMessage) {
          const crewLeaderName = CREWS.find(c => c.id === userProfile.crewId)?.leader;
          const leaderCharacter = characters.find(char => char.name.includes(crewLeaderName || ''));

          if (leaderCharacter) {
            const greetingMessage = 
              `${leaderCharacter.name.replace('👑 ', '')}: Your photo drops are lighting up the city, ${userProfile.username}! Keep snapping and making history. 📸`;
            
            setNpcWelcomeNotification({
              show: true,
              leaderName: leaderCharacter.name.replace('👑 ', ''),
              message: greetingMessage,
            });

            // Update user profile in Firestore to mark message as sent
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              hasReceivedCrewWelcomeMessage: true,
              lastActive: Timestamp.now()
            });

            // Update local userProfile state
            setUserProfile(prev => prev ? {
              ...prev,
              hasReceivedCrewWelcomeMessage: true
            } : null);
          }
        }

        // Check for mission completion: "First Tags" (act1_intro) after 3rd drop
        const newTotalMarkers = (userProfile.totalMarkers || 0) + 1;
        if (newTotalMarkers === 3 && userProfile.activeMissions?.includes('act1_intro')) {
          const storyRef = doc(db, 'story', user.uid);
          await updateDoc(storyRef, {
            activeMissions: (userProfile.activeMissions || []).filter(id => id !== 'act1_intro'),
            completedMissions: [...(userProfile.completedMissions || []), 'act1_intro'],
            storyProgress: (userProfile.storyProgress || 0) + 1, // Increment story progress
            lastUpdated: Timestamp.now()
          });

          // Update local userProfile state for active/completed missions and story progress
          setUserProfile(prev => prev ? {
            ...prev,
            activeMissions: prev.activeMissions?.filter(id => id !== 'act1_intro') || [],
            completedMissions: [...(prev.completedMissions || []), 'act1_intro'],
            storyProgress: (prev.storyProgress || 0) + 1,
          } : null);

          // Optional: Show a notification for mission completion
          setRepNotification({
            show: true,
            amount: 0, // No direct REP from mission completion here, handled by mission rewards
            message: 'MISSION COMPLETE: First Tags! 🎉',
          });
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

    // 🚫 Rate limit: Set loading state with safety timeout
    setIsCreatingDrop(true);
    
    // 🛡️ Safety timeout: Auto-reset after 10 seconds in case of hangs
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout: Resetting isCreatingDrop (marker)');
      setIsCreatingDrop(false);
    }, 10000);
    
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
        name: SURFACE_TO_MARKER_NAME[selectedSurface],
        description: GRAFFITI_TO_MARKER_DESCRIPTION[selectedGraffitiType],
        color: selectedMarkerColor,
        timestamp: new Date(),
        userId: user.uid,
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
        // New surface and graffiti type fields
        surface: selectedSurface,
        graffitiType: selectedGraffitiType,
      };

      const markerId = await saveMarkerToFirestore(markerData);

      if (dropId && markerId) {
        const repEarned = 5;
        const newRep = (userProfile.rep || 0) + repEarned;
        const newRank = calculateRank(newRep);
        const newLevel = calculateLevel(newRep);

        const currentTracks = userProfile.unlockedTracks && userProfile.unlockedTracks.length > 0 
          ? userProfile.unlockedTracks 
          : getRandomStartTrack();
        // 📍 MARKER DROP: Unlocks Spotify tracks only
        const unlockResult = unlockRandomSpotifyTrack(currentTracks);
        const newTracks = unlockResult.newTracks;

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

        console.log('📍 MARKER DROP: Saved newTracks to state:', newTracks);
        setUnlockedTracks(newTracks);

        const trackUnlocked = newTracks.length > currentTracks.length;
        const unlockedTrackName = trackUnlocked ? getTrackNameFromUrl(newTracks[newTracks.length - 1]) : '';
        const unlockedTrackUrl = trackUnlocked ? newTracks[newTracks.length - 1] : '';

        if (trackUnlocked) {
          // Show full-screen celebration modal
          setSongUnlockModal({
            isOpen: true,
            trackUrl: unlockedTrackUrl,
            trackName: unlockedTrackName,
            source: 'MARKER DROP'
          });
          
          // 🆕 Set recently unlocked track for music panel display
          const isSpotifyTrack = unlockedTrackUrl.includes('open.spotify.com');
          setRecentlyUnlocked({
            url: unlockedTrackUrl,
            name: unlockedTrackName,
            source: isSpotifyTrack ? 'Spotify' : 'SoundCloud'
          });
        }

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
    } finally {
      // Clear safety timeout
      clearTimeout(safetyTimeout);
      // 🚫 Rate limit: Reset loading state
      setIsCreatingDrop(false);
    }
  }, [user, userProfile, pendingDropPosition, selectedMarkerType, selectedMarkerColor, selectedSurface, selectedGraffitiType, loadDrops, loadAllMarkers]);

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
      setUserProfile((prev) => prev ? { ...prev, unlockedTracks: newTracks } : null);
      // Update local state IMMEDIATELY for instant UI feedback
      console.log('🎵 Updated local userProfile with new tracks:', newTracks);
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

      // Check if user just placed their first drop and send welcome message if needed
      if (userProfile.crewId && !userProfile.hasReceivedCrewWelcomeMessage) {
        const crewLeaderName = CREWS.find(c => c.id === userProfile.crewId)?.leader;
        const leaderCharacter = characters.find(char => char.name.includes(crewLeaderName || ''));

        if (leaderCharacter) {
          const greetingMessage = 
            `${leaderCharacter.name.replace('👑 ', '')}: Your beats are dropping hard, ${userProfile.username}! Keep the soundtrack fresh and the streets vibrant. 🎶`;
          
          setNpcWelcomeNotification({
            show: true,
            leaderName: leaderCharacter.name.replace('👑 ', ''),
            message: greetingMessage,
          });

          // Update user profile in Firestore to mark message as sent
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            hasReceivedCrewWelcomeMessage: true,
            lastActive: Timestamp.now()
          });

          // Update local userProfile state
          setUserProfile(prev => prev ? {
            ...prev,
            hasReceivedCrewWelcomeMessage: true
          } : null);
        }
      }

      // Check for mission completion: "First Tags" (act1_intro) after 3rd drop
      const newTotalMarkers = (userProfile.totalMarkers || 0) + 1;
      if (newTotalMarkers === 3 && userProfile.activeMissions?.includes('act1_intro')) {
        const storyRef = doc(db, 'story', user.uid);
        await updateDoc(storyRef, {
          activeMissions: (userProfile.activeMissions || []).filter(id => id !== 'act1_intro'),
          completedMissions: [...(userProfile.completedMissions || []), 'act1_intro'],
          storyProgress: (userProfile.storyProgress || 0) + 1, // Increment story progress
          lastUpdated: Timestamp.now()
        });

        // Update local userProfile state for active/completed missions and story progress
        setUserProfile(prev => prev ? {
          ...prev,
          activeMissions: prev.activeMissions?.filter(id => id !== 'act1_intro') || [],
          completedMissions: [...(prev.completedMissions || []), 'act1_intro'],
          storyProgress: (prev.storyProgress || 0) + 1,
        } : null);

        // Optional: Show a notification for mission completion
        setRepNotification({
          show: true,
          amount: 0, // No direct REP from mission completion here, handled by mission rewards
          message: 'MISSION COMPLETE: First Tags! 🎉',
        });
      }

      await loadDrops();
      setShowDropTypeModal(false);
      setPendingDropPosition(null);
    } catch (e) {
      console.error('Error creating music drop:', e);
      alert(`Failed to place music drop: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      // 🚫 Rate limit: Reset loading state
      setIsCreatingDrop(false);
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

    // 🚫 Rate limit: Prevent spam drops
    if (isCreatingDrop) {
      alert('⏳ Please wait - creating drop...');
      return;
    }

    const { lat, lng } = e.latlng;

    // Check if click is within the radius circle
    if (!gpsPosition) {
      alert('GPS location not available. Enable location services to place drops.');
      return;
    }

    const distanceFromGPS = calculateDistanceHelper(
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
  }, [user, userProfile, loadingUserProfile, showProfileSetup, isOfflineMode, gpsPosition, expandedRadius, isCreatingDrop]);

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
        ...fullScreenStyle,
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
      <LoginScreen
        showLogin={showLogin}
        showSignup={showSignup}
        email={email}
        password={password}
        authError={authError}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSetShowLogin={setShowLogin}
        onSetShowSignup={setShowSignup}
        onClearAuthError={() => setAuthError(null)}
        isPlaying={isPlaying}
        currentTrackIndex={currentTrackIndex}
        unlockedTracks={unlockedTracks}
        userProfileTracks={userProfile?.unlockedTracks}
        onTogglePlay={togglePlay}
        onPlayNext={playNextTrack}
        getCurrentTrackName={getCurrentTrackName}
      />
    );
  }

  

  // ========== PROFILE SETUP UI - HELLO MY NAME IS STICKER ==========
  if (showProfileSetup && user) {
    return (
      <ProfileSetupSticker
        user={user}
        onSubmit={handleProfileSetup}
        loading={profileLoading}
        crews={CREWS}
        onCrewSelect={setSelectedCrew}
        selectedCrew={selectedCrew}
        crewChoice={profileCrewChoice}
        onCrewChoiceChange={setProfileCrewChoice}
      />
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
        <RepNotification
          show={repNotification?.show || false}
          amount={repNotification?.amount || 0}
          message={repNotification?.message || ''}
          breakdown={repNotification?.breakdown}
          onClose={() => setRepNotification(null)}
        />

        {/* 🎵 Song Unlock Modal - Full screen celebration when unlocking tracks */}
        {songUnlockModal && (
          <SongUnlockModal
            trackUrl={songUnlockModal.trackUrl}
            trackName={songUnlockModal.trackName}
            isOpen={songUnlockModal.isOpen}
            onClose={() => setSongUnlockModal(null)}
            unlockSource={songUnlockModal.source}
          />
        )}

        {/* NPC Welcome Notification */}
        {npcWelcomeNotification?.show && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid #10b981',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            textAlign: 'center',
            color: '#e0e0e0',
            animation: 'popIn 0.3s ease-out'
          }}>
            <h3 style={{
              fontSize: '24px',
              color: '#10b981',
              marginBottom: '10px'
            }}>
              Welcome to the Crew!
            </h3>
            <p style={{
              fontSize: '16px',
              marginBottom: '20px'
            }}>
              <strong style={{ color: '#4dabf7' }}>{npcWelcomeNotification.leaderName}:</strong> {npcWelcomeNotification.message}
            </p>
            <button
              onClick={() => setNpcWelcomeNotification(null)}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              Got it!
            </button>
            <style>{`
              @keyframes popIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              }
            `}</style>
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
        {/* 🆕 Tile Layer - Satellite, Day, or Night based on settings */}
        {showSatelliteView ? (
          // Satellite view - Esri World Imagery
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : isNight ? (
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
          
          // Player card colors based on rank
          const cardColor = index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706';
          const textColor = index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12';
          
          // Spray can drip - using emoji for simplicity
          const sprayCanEmoji = '🎨';
          
          const customIcon = typeof window !== 'undefined' ? 
            new (require('leaflet').DivIcon)({
              html: `
                <div style="
                  position: relative;
                  width: 40px;
                  height: 40px;
                  background-color: ${cardColor};
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 14px;
                  color: ${textColor};
                  overflow: hidden;
                ">
                  <div style="
                    position: absolute;
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: ${cardColor};
                    color: ${textColor};
                    font-size: 10px;
                    padding: 1px 6px;
                    border-radius: 10px;
                    white-space: nowrap;
                    font-weight: bold;
                    border: 1px solid white;
                    z-index: 2;
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
                    background: cardColor,
                    color: textColor,
                    fontSize: '12px',
                    fontWeight: 'bold',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                    zIndex: 10
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
                    {/* Player Avatar with Rectangular Border */}
                    <div style={{
                      position: 'relative',
                      width: '60px',
                      height: '60px',
                      borderRadius: '0',
                      border: `3px solid ${cardColor}`,
                      overflow: 'visible'
                    }}>
                      <img
                        src={player.profilePicUrl}
                        alt={player.username}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      {/* Spray Can Drip in Bottom Left */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '-8px',
                        width: '20px',
                        height: '20px',
                        zIndex: 5,
                        fontSize: '16px',
                        lineHeight: '1'
                      }}>
                        {sprayCanEmoji}
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        color: cardColor
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
                      backgroundColor: cardColor,
                      color: textColor,
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

        {/* Drops with photos - Now opens full screen modal */}
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
              eventHandlers={{
                click: () => {
                  setSelectedPhotoDrop(drop);
                  if (mapRef.current) {
                    mapRef.current.closePopup();
                  }
                }
              }}
            />
          );
        })}

        {/* Full-Screen Photo Drop Modal */}
        {selectedPhotoDrop && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                zIndex: 1999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setSelectedPhotoDrop(null)}
            >
              {/* Popup content */}
              <div
                onClick={(e) => e.stopPropagation()}
              >
                <PhotoDropPopup
                  drop={selectedPhotoDrop}
                  user={user}
                  onLikeUpdate={(dropId, newLikes) => {
                    setDrops(prev =>
                      prev.map(d =>
                        d.firestoreId === dropId ? { ...d, likes: newLikes } : d
                      )
                    );
                  }}
                  onDelete={async (dropId) => {
                    // Remove drop from local state immediately
                    setDrops(prev => prev.filter(d => d.firestoreId !== dropId));
                    setSelectedPhotoDrop(null);
                    
                    // Decrement photosTaken in Firestore and local state
                    if (user && userProfile && selectedPhotoDrop?.createdBy === user.uid) {
                      try {
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, {
                          photosTaken: Math.max(0, (userProfile.photosTaken || 1) - 1),
                          lastActive: Timestamp.now()
                        });
                        
                        setUserProfile(prev => prev ? {
                          ...prev,
                          photosTaken: Math.max(0, (prev.photosTaken || 1) - 1)
                        } : null);
                      } catch (error) {
                        console.error('Error updating photosTaken:', error);
                      }
                    }
                  }}
                  onClose={() => setSelectedPhotoDrop(null)}
                />
              </div>
            </div>
          </>
        )}

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
              eventHandlers={{
                click: () => {
                  setSelectedMusicDrop(drop);
                  if (mapRef.current) {
                    mapRef.current.closePopup();
                  }
                }
              }}
            />
          );
        })}

        {/* Full-Screen Music Drop Modal */}
        {selectedMusicDrop && (
          <MusicDropPopup
            drop={selectedMusicDrop}
            user={user}
            onLikeUpdate={(dropId: string, newLikes: string[]) => {
              setDrops(prev =>
                prev.map((d: any) =>
                  d.firestoreId === dropId ? { ...d, likes: newLikes } : d
                )
              );
            }}
            onClose={() => setSelectedMusicDrop(null)}
          />
        )}

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
      <DropTypeModal
        isVisible={showDropTypeModal}
        onClose={() => {
          setShowDropTypeModal(false);
          setPendingDropPosition(null);
        }}
        onMarkerDrop={handleMarkerDrop}
        onPhotoDrop={handlePhotoDrop}
        onMusicDrop={() => {
          // Open song selection modal instead of direct drop
          setShowSongSelection(true);
        }}
        selectedMarkerType={selectedMarkerType}
        hasUnlockedTracks={unlockedTracks.length > 0}
        isLoading={isCreatingDrop}
      />

      {/* Song Selection Modal for Music Drops */}
      <SongSelectionModal
        isVisible={showSongSelection}
        onClose={() => setShowSongSelection(false)}
        tracks={unlockedTracks}
        onSelectTrack={async (trackUrl: string) => {
          setSelectedTrackForMusicDrop(trackUrl);
          setShowSongSelection(false);
          setIsCreatingDrop(true);
          try {
            await handleMusicDrop();
          } finally {
            setIsCreatingDrop(false);
          }
        }}
        getTrackNameFromUrl={getTrackNameFromUrl}
        isLoading={isCreatingDrop}
      />

      {/* Photo Selection Modal */}
      <PhotoSelectionModal
        isVisible={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setPendingDropPosition(null);
        }}
        onPhotoSelect={handlePhotoSelect}
      />


      {/* Profile Stats Display - Top Right */}
      <ProfileStats
        userProfile={userProfile}
        user={user}
        userMarkersCount={userMarkers.length}
        myMarkersCount={userMarkers.filter(m => m.userId === user?.uid).length}
        onProfileUpdate={(updatedProfile) => setUserProfile(updatedProfile)}
        onLogout={handleLogout}
        onAddRep={(amount: number) => {
          if (!user || !userProfile) return;
          const addRepAsync = async () => {
            try {
              const newRep = userProfile.rep + amount;
              const newRank = calculateRank(newRep);
              const newLevel = calculateLevel(newRep);
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                rep: newRep,
                rank: newRank,
                level: newLevel,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                rep: newRep,
                rank: newRank,
                level: newLevel
              } : null);
              
              alert(`✅ Added ${amount} REP! New total: ${newRep}`);
            } catch (error) {
              console.error('Cheat add REP error:', error);
              alert('Failed to add REP');
            }
          };
          addRepAsync();
        }}
        onUnlockAllColors={() => {
          if (!user || !userProfile) return;
          const unlockColorsAsync = async () => {
            try {
              const allColorIds = ALL_COLORS.map(c => c.id);
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedColors: allColorIds,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                unlockedColors: allColorIds
              } : null);
              
              alert('✅ All colors unlocked!');
            } catch (error) {
              console.error('Cheat unlock colors error:', error);
              alert('Failed to unlock colors');
            }
          };
          unlockColorsAsync();
        }}
        onUnlockAllGraffiti={() => {
          if (!user || !userProfile) return;
          const unlockGraffitiAsync = async () => {
            try {
              const allGraffitiIds = GRAFFITI_STYLES.map(g => g.id);
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedGraffitiTypes: allGraffitiIds,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                unlockedGraffitiTypes: allGraffitiIds
              } : null);
              
              alert('✅ All graffiti styles unlocked!');
            } catch (error) {
              console.error('Cheat unlock graffiti error:', error);
              alert('Failed to unlock graffiti styles');
            }
          };
          unlockGraffitiAsync();
        }}
        onUnlockRandomSpotify={() => {
          if (!user || !userProfile) return;
          const unlockSpotifyAsync = async () => {
            try {
              const currentTracks = userProfile.unlockedTracks || [];
              const result = unlockRandomSpotifyTrack(currentTracks);
              
              if (!result.newlyUnlocked) {
                alert('⚠️ All Spotify tracks already unlocked!');
                return;
              }
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedTracks: result.newTracks,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                unlockedTracks: result.newTracks
              } : null);
              
              setUnlockedTracks(result.newTracks);
              
              // Show unlock modal
              setSongUnlockModal({
                isOpen: true,
                trackUrl: result.newlyUnlocked!.url,
                trackName: result.newlyUnlocked!.name,
                source: 'CHEAT MENU'
              });
            } catch (error) {
              console.error('Cheat unlock Spotify error:', error);
              alert('Failed to unlock Spotify track');
            }
          };
          unlockSpotifyAsync();
        }}
        onUnlockRandomSoundCloud={() => {
          if (!user || !userProfile) return;
          const unlockSoundCloudAsync = async () => {
            try {
              const currentTracks = userProfile.unlockedTracks || [];
              const result = unlockRandomSoundCloudTrack(currentTracks);
              
              if (!result.newlyUnlocked) {
                alert('⚠️ All SoundCloud tracks already unlocked!');
                return;
              }
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedTracks: result.newTracks,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                unlockedTracks: result.newTracks
              } : null);
              
              setUnlockedTracks(result.newTracks);
              
              // Show unlock modal
              setSongUnlockModal({
                isOpen: true,
                trackUrl: result.newlyUnlocked!.url,
                trackName: result.newlyUnlocked!.name,
                source: 'CHEAT MENU'
              });
            } catch (error) {
              console.error('Cheat unlock SoundCloud error:', error);
              alert('Failed to unlock SoundCloud track');
            }
          };
          unlockSoundCloudAsync();
        }}
        onResetSongs={() => {
          if (!user || !userProfile) return;
          const resetSongsAsync = async () => {
            try {
              const defaultTracks = getRandomStartTrack();
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedTracks: defaultTracks,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                unlockedTracks: defaultTracks
              } : null);
              
              setUnlockedTracks(defaultTracks);
              setCurrentTrackIndex(0);
              
              alert('✅ Songs reset to default!');
            } catch (error) {
              console.error('Reset songs error:', error);
              alert('Failed to reset songs');
            }
          };
          resetSongsAsync();
        }}
        onMaxRep={() => {
          if (!user || !userProfile) return;
          const maxRepAsync = async () => {
            try {
              const maxRep = 99999;
              const newRank = calculateRank(maxRep);
              const newLevel = calculateLevel(maxRep);
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                rep: maxRep,
                rank: newRank,
                level: newLevel,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                rep: maxRep,
                rank: newRank,
                level: newLevel
              } : null);
              
              alert(`✅ MAX REP! Now at ${maxRep} REP!`);
            } catch (error) {
              console.error('Max REP error:', error);
              alert('Failed to max REP');
            }
          };
          maxRepAsync();
        }}
        onMaxEverything={() => {
          if (!user || !userProfile) return;
          const maxEverythingAsync = async () => {
            try {
              const allColorIds = ALL_COLORS.map(c => c.id);
              const allGraffitiIds = GRAFFITI_STYLES.map(g => g.id);
              const allTracks = [...SPOTIFY_TRACKS, ...HIPHOP_TRACKS];
              const maxRep = 99999;
              const newRank = calculateRank(maxRep);
              const newLevel = calculateLevel(maxRep);
              
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                rep: maxRep,
                rank: newRank,
                level: newLevel,
                unlockedColors: allColorIds,
                unlockedGraffitiTypes: allGraffitiIds,
                unlockedTracks: allTracks,
                lastActive: Timestamp.now()
              });
              
              setUserProfile(prev => prev ? {
                ...prev,
                rep: maxRep,
                rank: newRank,
                level: newLevel,
                unlockedColors: allColorIds,
                unlockedGraffitiTypes: allGraffitiIds,
                unlockedTracks: allTracks
              } : null);
              
              setUnlockedTracks(allTracks);
              
              alert('🚀 MAX EVERYTHING! All colors, all graffiti, all songs, max REP!');
            } catch (error) {
              console.error('Max everything error:', error);
              alert('Failed to max everything');
            }
          };
          maxEverythingAsync();
        }}
        onResetProfile={async () => {
          if (!window.confirm('Reset ALL your markers, drops and stats permanently?\n\nThis will:\n• Delete all your markers\n• Delete all your drops\n• Reset REP to 0\n• Reset Rank to TOY\n• Sign you out immediately')) return;
          if (!user || !userProfile) return;
          
          try {
            const userMarkersQuery = query(
              collection(db, 'markers'),
              where('userId', '==', user.uid)
            );
            const userMarkersSnapshot = await getDocs(userMarkersQuery);
            await Promise.all(userMarkersSnapshot.docs.map(doc => deleteDoc(doc.ref)));
            
            await deleteUserDrops(user.uid);
            
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              totalMarkers: 0,
              rep: 0,
              rank: 'TOY',
              level: 1,
              unlockedTracks: getRandomStartTrack(),
              photosTaken: 0,
              markersPlaced: 0,
              collaborations: 0,
              blackoutEventsInvestigated: 0,
              kaiTiakiEvaluationsReceived: 0
            });
            
            setUnlockedTracks(getRandomStartTrack());
            setCurrentTrackIndex(0);
            setIsPlaying(false);
            await loadAllMarkers();
            
            alert('✅ Profile reset! Signing out...');
            setTimeout(() => handleLogout(), 1000);
          } catch (err: any) {
            console.error(err);
            alert('❌ Reset failed: ' + err.message);
          }
        }}
      />

      {/* ========== DUAL CONTROL PANELS ========== */}
<div style={{
            position: 'absolute' as const,
            top: 0,
            left: 10,
            display: 'flex',
            gap: '15px',
            zIndex: 1200,
            maxHeight: '80vh'
          }}>
        {/* Left Panel - Blackbook (New Feed-Style Layout) */}
        {showProfilePanel && userProfile && (
          <BlackbookPanel
            userProfile={userProfile}
            userMarkers={userMarkers}
            drops={drops}
            topPlayers={topPlayers}
            onClose={() => setShowProfilePanel(false)}
            onProfileUpdate={(updatedProfile) => setUserProfile(updatedProfile)}
            onCenterMap={centerMap}
            onRefreshAll={handleRefreshAll}
            isRefreshing={isRefreshing}
            showTopPlayers={showTopPlayers}
            onToggleTopPlayers={() => setShowTopPlayers(!showTopPlayers)}
            showOnlyMyDrops={showOnlyMyDrops}
            onToggleFilter={() => setShowOnlyMyDrops(!showOnlyMyDrops)}
            onLogout={handleLogout}
            nearbyCrewMembers={nearbyCrewMembers}
            expandedRadius={expandedRadius}
            onOpenCrewChat={() => {
              setShowCrewChat(true);
              setShowProfilePanel(false);
              setShowPhotosPanel(false);
              setShowMessagesPanel(false);
              setShowMapPanel(false);
              setShowMusicPanel(false);
              setShowStoryPanel(false);
            }}
          />
        )}

        {/* Right Panel - Photos & Gallery (Camera) */}
        {showPhotosPanel && (() => {
          // Get user's photo drops
          const myPhotoDrops = drops.filter(drop => drop.photoUrl && drop.createdBy === user?.uid);
          const totalPhotosTaken = userProfile?.photosTaken || myPhotoDrops.length;
          
          return (
          <div style={{
            ...panelStyle,
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out',
            position: 'relative' as const,
            maxWidth: '350px',
            maxHeight: '80vh',
            overflowY: 'auto'
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

            {/* Upload Section - Profile Picture */}
            <div style={{
              marginBottom: '15px',
              padding: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <div style={{ fontSize: '14px', color: '#4dabf7', fontWeight: 'bold', marginBottom: '8px' }}>
                📤 Upload Profile Picture
              </div>
              <input
                type="file"
                accept="image/*"
                id="profilepic-upload"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed #4dabf7',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  marginBottom: '8px',
                  fontSize: '12px'
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleProfilePicUpload(file);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('profilepic-upload') as HTMLInputElement;
                  if (input?.files?.[0]) {
                    handleProfilePicUpload(input.files[0]);
                  } else {
                    alert('Please select an image first!');
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  width: '100%',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                📲 Update Profile Pic
              </button>
            </div>

            {/* Photo Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginBottom: '15px'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #444'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7' }}>{totalPhotosTaken}</div>
                <div style={{ fontSize: '10px', color: '#aaa' }}>Photos Taken</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #444'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{myPhotoDrops.length}</div>
                <div style={{ fontSize: '10px', color: '#aaa' }}>Photo Drops</div>
              </div>
            </div>

            {/* Gallery Section */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                fontSize: '14px',
                color: '#10b981',
                fontWeight: 'bold',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🖼️ Your Photos</span>
                <span style={{ fontSize: '11px', color: '#aaa' }}>{myPhotoDrops.length} total</span>
              </div>
              
              {myPhotoDrops.length === 0 ? (
                /* Empty State */
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px dashed #444'
                }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📸</div>
                  <div style={{ color: '#aaa', marginBottom: '10px', fontSize: '13px' }}>
                    No photos yet
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Tap on the map to place a photo drop!
                  </div>
                </div>
              ) : (
                /* Photo Grid */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {myPhotoDrops.slice(0, 12).map((drop, index) => (
                    <div
                      key={drop.id || drop.firestoreId || index}
                      onClick={() => {
                        setSelectedPhotoDrop(drop);
                        setShowPhotosPanel(false);
                        if (mapRef.current) {
                          mapRef.current.setView([drop.lat, drop.lng], 17);
                        }
                      }}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid #444'
                      }}
                    >
                      <img
                        src={drop.photoUrl}
                        alt={`Photo ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {drop.likes && drop.likes.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#ef4444',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}>
                          ❤️ {drop.likes.length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                fontSize: '14px',
                color: '#fbbf24',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                📱 Camera
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => {
                    // Open photo selection modal for dropping
                    if (!gpsPosition) {
                      alert('GPS location not available. Please enable location services.');
                      return;
                    }
                    setPendingDropPosition({ lat: gpsPosition[0], lng: gpsPosition[1] });
                    setShowPhotoModal(true);
                    setShowPhotosPanel(false);
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📸</span>
                  Take / Upload Photo
                </button>
                
                <button
                  onClick={() => {
                    // Browse all photo drops on map
                    const allPhotoDrops = drops.filter(d => d.photoUrl);
                    if (allPhotoDrops.length === 0) {
                      alert('No photo drops found on the map yet!');
                      return;
                    }
                    if (mapRef.current && allPhotoDrops.length > 0) {
                      const bounds = allPhotoDrops.map(d => [d.lat, d.lng] as [number, number]);
                      const minLat = Math.min(...bounds.map(b => b[0]));
                      const maxLat = Math.max(...bounds.map(b => b[0]));
                      const minLng = Math.min(...bounds.map(b => b[1]));
                      const maxLng = Math.max(...bounds.map(b => b[1]));
                      mapRef.current.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [50, 50] });
                    }
                    setShowPhotosPanel(false);
                  }}
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
                  <span style={{ fontSize: '18px' }}>🗺️</span>
                  View All Photo Drops
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ paddingTop: '10px', borderTop: '1px solid #444' }}>
              <div style={{
                fontSize: '12px',
                color: '#ec4899',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                ⚡ Quick Actions
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                <button
                  onClick={() => {
                    const photoCount = myPhotoDrops.length;
                    if (photoCount === 0) {
                      alert('You have no photos to share yet!');
                      return;
                    }
                    // Copy shareable text to clipboard
                    const shareText = `Check out my ${photoCount} photo${photoCount > 1 ? 's' : ''} on Blackout NZ! 📸`;
                    navigator.clipboard?.writeText(shareText);
                    alert('Share link copied to clipboard!');
                  }}
                  style={{
                    background: 'rgba(236, 72, 153, 0.1)',
                    color: '#ec4899',
                    border: '1px solid #ec4899',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  🔗 Share
                </button>
                
                <button
                  onClick={handleRefreshAll}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
          );
        })()}

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

              {/* Satellite View Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowSatelliteView(!showSatelliteView)}
                  style={{
                    backgroundColor: showSatelliteView ? 'rgba(34, 197, 94, 0.2)' : 'rgba(75, 85, 99, 0.5)',
                    border: showSatelliteView ? '1px solid #22c55e' : '1px solid #6b7280',
                    color: showSatelliteView ? '#22c55e' : '#cbd5e1',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🛰️ Satellite {showSatelliteView ? 'ON' : 'OFF'}
                </button>
                <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                  Toggle aerial imagery
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

{/* Music Panel - Always rendered, dynamic z-index */}
            <div
              key={`music-panel-${userProfile?.unlockedTracks?.length || unlockedTracks.length}`}
              ref={(el) => {
                // Force re-render when userProfile tracks change
                if (el && userProfile?.unlockedTracks) {
                  const tracks = userProfile.unlockedTracks;
                  console.log('🎵 Music Panel rendering with tracks:', tracks);
                }
              }}
              style={{
                ...panelStyle,
                border: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                animation: showMusicPanel ? 'slideInRight 0.3s ease-out' : 'none',
                minWidth: isMobile ? '280px' : '350px',
                maxWidth: isMobile ? '95vw' : '400px',
                position: 'absolute' as const,
                zIndex: showMusicPanel ? 1500 : 900,
                opacity: showMusicPanel ? 1 : 0,
                pointerEvents: showMusicPanel ? 'auto' : 'none',
                transition: 'opacity 0.3s ease, z-index 0s',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'auto'
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
                    gap: '8px',
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
                </div>


                {/* Unlocked Tracks List */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '10px', fontWeight: 'bold' }}>
                    🎵 Your Collection
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
                      {(Array.isArray(userProfile?.unlockedTracks) ? userProfile.unlockedTracks : (Array.isArray(unlockedTracks) ? unlockedTracks : [])).map((track, index) => {
                        const trackName = getTrackNameFromUrl(track);
                        const isCurrentlyPlaying = index === currentTrackIndex;

                        return (
                          <div
                            key={index}
                            onClick={() => {
                              if (isCurrentlyPlaying) {
                                togglePlay();
                              } else {
                                setCurrentTrackIndex(index);
                                setShowSpotifyWidget(true);
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
                              🎵
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
                                color: track.includes('soundcloud.com') ? '#ff6b6b' : '#1DB954',
                                marginTop: '2px'
                              }}>
                                {track.includes('soundcloud.com') ? 'SoundCloud' : 'Spotify'}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: '#ff6b6b'
                            }}>
                              🎧
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>


              </div>
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
            onClose={() => {
              setShowCrewChat(false);
              markCrewChatAsRead(); // Mark as read when closing
            }}
            userProfile={userProfile}
            markMessagesAsRead={markCrewChatAsRead} // Pass down the function
          />
        )}

        {/* Story Panel - Separate from other panels */}
        {showStoryPanel && (
          <div style={{
            ...panelStyle,
            position: 'absolute',
            top: 0,
            left: 10,
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
              <StoryPanel markStoryContentAsViewed={markStoryContentAsViewed} />
            </div>
          </div>
        )}

      {/* Bottom Navigation */}
      <BottomNavigation
        showMapPanel={showMapPanel}
        showProfilePanel={showProfilePanel}
        showPhotosPanel={showPhotosPanel}
        showCrewChat={showCrewChat}
        onToggleMapPanel={() => {
          setShowMapPanel(!showMapPanel);
          setShowProfilePanel(false);
          setShowPhotosPanel(false);
          setShowCrewChat(false);
          setShowMusicPanel(false);
          setShowStoryPanel(false);
        }}
        onToggleProfilePanel={() => {
          setShowProfilePanel(!showProfilePanel);
          setShowPhotosPanel(false);
          setShowCrewChat(false);
          setShowMapPanel(false);
          setShowMusicPanel(false);
          setShowStoryPanel(false);
        }}
        onTogglePhotosPanel={() => {
          setShowPhotosPanel(!showPhotosPanel);
          setShowProfilePanel(false);
          setShowCrewChat(false);
          setShowMapPanel(false);
          setShowMusicPanel(false);
          setShowStoryPanel(false);
        }}
        onToggleCrewChat={() => {
          setShowCrewChat(!showCrewChat);
          setShowProfilePanel(false);
          setShowPhotosPanel(false);
          setShowMapPanel(false);
          setShowMusicPanel(false);
          setShowStoryPanel(false);
        }}
        onCloseAllPanels={() => {}}
        hasUnreadMessages={hasUnreadMessages}
        unreadCount={unreadCount}
      />

      {/* Secondary Controls - Under Online Button */}
      <div style={{
        position: 'fixed',
        bottom: '80px', // Positioned above the main nav bar
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            position: 'relative' // Added for badge positioning
          }}
        >
          {/* Unread Story Notification Badge */}
          {hasNewStoryContent && !showStoryPanel && (
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#ef4444', // Red for notification
              color: 'white',
              borderRadius: '50%',
              width: '12px',
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              fontWeight: 'bold',
              zIndex: 1,
              boxShadow: '0 0 5px rgba(239, 68, 68, 0.7)'
            }} />
          )}
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
            setShowColorPicker(false);
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

        {/* Colors - Toggles Color Picker Panel */}
        <button
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowProfilePanel(false);
            setShowPhotosPanel(false);
            setShowMessagesPanel(false);
            setShowMapPanel(false);
            setShowStoryPanel(false);
            setShowMusicPanel(false);
          }}
          style={{
            background: showColorPicker ? 'rgba(255, 107, 107, 0.2)' : 'rgba(15, 23, 42, 0.9)',
            border: showColorPicker ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(255,255,255,0.1)',
            color: showColorPicker ? '#ff6b6b' : '#cbd5e1',
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
            transform: showColorPicker ? 'scale(1.1)' : 'scale(1)'
          }}>
            🎨
          </div>
          Colors
        </button>

        {/* GPS - Centers map on GPS location */}
        <button
          onClick={centerOnGPS}
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f59e0b',
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
            fontSize: '20px'
          }}>
            📍
          </div>
          GPS
        </button>

        {/* Time/Weather - Shows current time and day/night status */}
        <button
          onClick={() => {
            // Toggle satellite view as a quick day/night visual override
            setShowSatelliteView(!showSatelliteView);
          }}
          style={{
            background: isNight ? 'rgba(30, 41, 59, 0.9)' : 'rgba(254, 243, 199, 0.9)',
            border: isNight ? '1px solid rgba(100, 116, 139, 0.5)' : '1px solid rgba(251, 191, 36, 0.5)',
            color: isNight ? '#94a3b8' : '#92400e',
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
            fontSize: '20px'
          }}>
            {isNight ? '🌙' : '☀️'}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
            {timeString}
          </div>
        </button>

        {/* Online/Offline Mode Toggle */}
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
            background: isOfflineMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            border: isOfflineMode ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(16, 185, 129, 0.5)',
            color: isOfflineMode ? '#ef4444' : '#10b981',
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
            fontSize: '20px'
          }}>
            {isOfflineMode ? '🔴' : '🟢'}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
            {isOfflineMode ? 'OFFLINE' : 'ONLINE'}
          </div>
        </button>
      </div>

      {/* Color Picker Panel */}
      {showColorPicker && userProfile && (
        <ColorPickerPanel
          isOpen={showColorPicker}
          unlockedColors={userProfile.unlockedColors || []}
          selectedColor={selectedMarkerColor}
          onColorSelect={(colorId, colorHex) => {
            setSelectedMarkerColor(colorHex);
            saveFavoriteColor(colorHex);
          }}
          onClose={() => setShowColorPicker(false)}
          crewId={userProfile.crewId}
          isSolo={userProfile.isSolo}
        />
      )}

      {/* Legend */}
      <LegendPanel
        isVisible={showLegend}
        isOfflineMode={isOfflineMode}
        showTopPlayers={showTopPlayers}
        selectedMarkerColor={selectedMarkerColor}
        userMarkersCount={userMarkers.length}
        unlockedTracksCount={unlockedTracks.length}
        gpsStatus={gpsStatus}
        gpsPosition={gpsPosition}
        gpsError={gpsError}
        userProfile={userProfile}
      />

      

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

      {/* ========== UNIFIED MUSIC PLAYER - Shows Spotify or SoundCloud based on track ========== */}
      {showSpotifyWidget && unlockedTracks.length > 0 && (
        <>
          {isSpotifyUrl(unlockedTracks[currentTrackIndex]) ? (
            <SpotifyPlayer
              spotifyUrl={unlockedTracks[currentTrackIndex]}
              trackName={getCurrentTrackName()}
              onClose={() => {
                setShowSpotifyWidget(false);
              }}
            />
          ) : (
            <SoundCloudPlayer
              trackUrl={unlockedTracks[currentTrackIndex]}
              trackName={getCurrentTrackName()}
              onClose={() => {
                setShowSpotifyWidget(false);
              }}
            />
          )}
        </>
      )}
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