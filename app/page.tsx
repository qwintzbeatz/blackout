'use client';

import CrewBioPanel from '@/components/CrewBioPanel';
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
} from 'firebase/firestore';
import { auth, db, realtimeDb } from '@/lib/firebase/config';
import { ref, onValue } from 'firebase/database';
import { characters } from '@/data/characters';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

// Extracted components
import LoginScreen from '@/components/auth/LoginScreen';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import ProfileStats from '@/components/profile/ProfileStats';
import DropTypeModal from '@/components/modals/DropTypeModal';
import SongSelectionModal from '@/components/modals/SongSelectionModal';
import LegendPanel from '@/components/ui/LegendPanel';
import OfflineJoystick from '@/components/ui/OfflineJoystick';

// Panel Components
import PhotosPanel from '@/components/panels/PhotosPanel';
import MapControlPanel from '@/components/panels/MapControlPanel';
import MusicPanel from '@/components/panels/MusicPanel';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import React, { memo } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

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
import MessengerHeads from '@/components/MessengerHeads';

import { BlackbookPanel } from '@/components/blackbook/BlackbookPanel';
import { useMarkers } from '@/hooks/useMarkers';
import { useMusicPlayer, getRandomStartTrack } from '@/hooks/useMusicPlayer';
import { useDropCreation } from '@/hooks/useDropCreation';
import { PerformanceSettingsPanel } from '@/src/components/ui/PerformanceSettingsPanel';
import SpotifyPlayer from '@/components/music/SpotifyPlayer';
import SoundCloudPlayer from '@/components/music/SoundCloudPlayer';
import { CREWS } from '@/data/crews';
import { useGPSTracker } from '@/hooks/useGPSTracker';
import { useMusicDrops } from '@/hooks/useMusicDrops';
import { EnhancedErrorBoundary } from '@/src/components/ui/EnhancedErrorBoundary';
import { ErrorRecoveryPanel } from '@/src/components/ui/ErrorRecoveryPanel';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';
import ProfileSetupSticker from '@/components/ProfileSetupSticker';
import { SurfaceGraffitiSelector } from '@/components/ui/SurfaceGraffitiSelector';
import { RepNotification } from '@/components/ui/RepNotification';
import DMNotification from '@/components/ui/DMNotification';
import SongUnlockModal from '@/components/ui/SongUnlockModal';
import VideoUnlockModal from '@/components/ui/VideoUnlockModal';
import RadarScanner from '@/components/map/RadarScanner';
import { SPOTIFY_TRACKS, UNLOCKABLE_TRACKS, DEFAULT_TRACK, isSpotifyUrl, getSpotifyTrackName } from '@/constants/all_tracks';
import { FACEBOOK_VIDEOS, getVideoName, getFacebookEmbedUrl, getRandomVideo } from '@/constants/videos';
import { HIPHOP_TRACKS } from '@/constants/tracks';
import { fullScreenStyle, loadingSpinnerStyle, panelBaseStyle, buttonBaseStyle, primaryButtonStyle, secondaryButtonStyle, successButtonStyle, dangerButtonStyle, inputBaseStyle, flexCenterStyle, flexBetweenStyle, flexColumnStyle, titleTextStyle, subtitleTextStyle, colors, gradients } from './pageStyles';
import { MarkerName, MarkerDescription, Gender, MARKER_COLORS, MARKER_NAMES, MARKER_DESCRIPTIONS, CrewId } from '@/constants/markers';
import { SurfaceType, GraffitiType, UserProfile, TopPlayer, TopCrew, Drop, UserMarker } from '@/types';
import { SURFACES } from '@/constants/surfaces';
import { GRAFFITI_TYPES } from '@/constants/graffitiTypes';
import { createSprayCanDivIcon } from '@/components/map/SprayCanIcon';
import MemoizedMarker from '@/components/map/MemoizedMarker';
import { getCrewColor } from '@/utils/crewTheme';
import {
  migrateMarkerNameToSurface,
  migrateMarkerDescriptionToGraffiti,
  getSurfaceOptions,
  getGraffitiTypeOptions,
  SURFACE_TO_MARKER_NAME,
  GRAFFITI_TO_MARKER_DESCRIPTION,
} from '@/utils/typeMapping';
import { calculateRep, RepResult, calculateEnhancedRank, getRankColor, getRankProgress } from '@/utils/repCalculator';
import { initializeUnlockedColors, getDefaultColorForCrew, ALL_COLORS } from '@/utils/colorUnlocks';
import { GRAFFITI_STYLES } from '@/utils/graffitiUnlocks';
import { calculateDistance as calculateDistanceHelper, getTrackNameFromUrl as getTrackNameFromUrlHelper, getTrackSource, getTrackThemeColor } from '@/lib/utils/dropHelpers';
import { unlockRandomSpotifyTrack, unlockRandomSoundCloudTrack, unlockRandomTrack } from '@/lib/utils/musicUnlocks';
import { NEW_ZEALAND_LOCATIONS, NZ_BOUNDS, NZ_CENTER, NZ_DEFAULT_ZOOM, GPS_DEFAULT_ZOOM } from '@/constants/locations';
import { detectDevicePerformance, panelStyle } from '@/utils';

// Import extracted utilities and hooks
import { calculateRepForMarker, calculateRank, calculateLevel, calculateBoundsFromMarkers, createSoundCloudIframeUrl, generateAvatarUrl } from '@/utils/homeHelpers';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { FirestoreMarker } from '@/lib/types/firestoreTypes';
import { useFirebaseDataLoaders } from '@/hooks/useFirebaseDataLoaders';
import { useAuthHandlers } from '@/hooks/useAuthHandlers';
import { useMusicPlayerControls } from '@/hooks/useMusicPlayerControls';
import { useSaveMarker } from '@/hooks/useSaveMarker';
import { useMusicDropReplacement } from '@/hooks/useMusicDropReplacement';
import { useMapActions } from '@/hooks/useMapActions';
import {
  SoundCloudTrack,
  CrewData,
  Comment,
  NearbyCrewMember,
  CrewChatMessage,
  DirectMessage,
  DirectChat,
  CrewChatUnreadStatus,
} from '@/lib/types/blackout';

// Dynamically import leaflet only on client side
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((mod) => mod.Circle), { ssr: false });

const HomeComponent = () => {
  const { hasRecentErrors } = useErrorHandler();
  const { logPerformance } = usePerformanceMonitor();
  const { loadingStates, setLoading, isLoading } = useLoadingManager();
  const { safeOperation } = useSafeOperation();

  // ========== STATE DECLARATIONS ==========
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState<number>(5);

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

  // NPC Welcome Notification State
  const [npcWelcomeNotification, setNpcWelcomeNotification] = useState<{
    show: boolean;
    leaderName: string;
    message: string;
  } | null>(null);

  // User profile states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // Use ref to always get current userProfile in callbacks (avoids stale closure)
  const userProfileRef = useRef<UserProfile | null>(null);
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);
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
  const [selectedSpecialType, setSelectedSpecialType] = useState<'rainbow' | 'glow' | 'metallic' | null>(null);

  // Surface and graffiti type states (new)
  const [selectedSurface, setSelectedSurface] = useState<SurfaceType>('wall');
  const [selectedGraffitiType, setSelectedGraffitiType] = useState<GraffitiType>('tag');

  // Radius expansion state
  const [expandedRadius, setExpandedRadius] = useState(50);

  // Audio player states - Spotify only
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showSpotifyWidget, setShowSpotifyWidget] = useState(false);
  const [unlockedTracks, setUnlockedTracks] = useState<string[]>(getRandomStartTrack());
  const startupAudioRef = useRef<HTMLAudioElement | null>(null);
  const startupAutoplayAttemptedRef = useRef(false);

  // REP Notification state
  const [repNotification, setRepNotification] = useState<{
    show: boolean;
    amount: number;
    message: string;
    breakdown?: RepResult['breakdown'];
  } | null>(null);

  // DM Notification state
  const [dmNotification, setDmNotification] = useState<{
    show: boolean;
    senderName: string;
    senderPic: string;
    message: string;
    senderId: string;
  } | null>(null);

  // Drop states
  const [drops, setDrops] = useState<Drop[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDropTypeModal, setShowDropTypeModal] = useState(false);
  const [pendingDropPosition, setPendingDropPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState<MarkerDescription>('Tag/Signature');
  const [selectedTrackForMusicDrop, setSelectedTrackForMusicDrop] = useState<string | null>(null);

  // Last marker date for streak bonus
  const [lastMarkerDate, setLastMarkerDate] = useState<string | null>(null);

  // Top players state
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [showTopPlayers, setShowTopPlayers] = useState(false);

  // Top crews state
  const [topCrews, setTopCrews] = useState<TopCrew[]>([]);
  const [showTopCrews, setShowTopCrews] = useState(false);
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
  const [showSatelliteView, setShowSatelliteView] = useState(false);
  const [initialChatTarget, setInitialChatTarget] = useState<{ uid: string; username: string; profilePicUrl: string } | null>(null);
  const [messengerConversations, setMessengerConversations] = useState<{
    chatId: string;
    participantId: string;
    participantName: string;
    participantProfilePic: string;
    unreadCount: number;
  }[]>([]);

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(166);

  // Mission notification state
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

  // Selected Music Drop for full-screen modal
  const [selectedMusicDrop, setSelectedMusicDrop] = useState<Drop | null>(null);

  // Drop replacement state
  const [replacingDropId, setReplacingDropId] = useState<string | null>(null);

  // Selected Photo Drop for full-screen modal
  const [selectedPhotoDrop, setSelectedPhotoDrop] = useState<Drop | null>(null);

  // Radar Scanner State
  const [showRadarScanner, setShowRadarScanner] = useState(false);

  // Song Unlock Modal state
  const [songUnlockModal, setSongUnlockModal] = useState<{
    isOpen: boolean;
    trackUrl: string;
    trackName: string;
    source: string;
  } | null>(null);

  // Video Unlock Modal state
  const [videoUnlockModal, setVideoUnlockModal] = useState<{
    isOpen: boolean;
    videoUrl: string;
    source: string;
  } | null>(null);

  // Recently unlocked track state
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<{
    url: string;
    name: string;
    source: 'Spotify' | 'SoundCloud';
  } | null>(null);

  // Loading state for drop creation (prevents rapid clicks)
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);

  // Song selection modal state
  const [showSongSelection, setShowSongSelection] = useState(false);

  // GPS Scan animation state
  const [isScanning, setIsScanning] = useState(false);

  // Music drop scanning state
  const [isMusicScanning, setIsMusicScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [discoveredTracks, setDiscoveredTracks] = useState<
    Array<{
      trackUrl: string;
      trackName: string;
      source: string;
      position: [number, number];
    }>
  >([]);

  // Story data (missions)
  const [storyData, setStoryData] = useState<{
    activeMissions: string[];
    completedMissions: string[];
    storyProgress: number;
    currentAct: number;
  } | null>(null);

  // isMounted ref to prevent state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ========== UNIFIED PANEL TOGGLE FUNCTION ==========
  const togglePanel = useCallback(
    (panel: 'profile' | 'photos' | 'messages' | 'map' | 'music' | 'story' | 'crewchat' | 'none') => {
      // First, close all panels
      setShowProfilePanel(false);
      setShowPhotosPanel(false);
      setShowMessagesPanel(false);
      setShowMapPanel(false);
      setShowMusicPanel(false);
      setShowStoryPanel(false);
      setShowCrewChat(false);

      // Then open the requested panel (if not 'none')
      if (panel !== 'none') {
        switch (panel) {
          case 'profile':
            setShowProfilePanel(true);
            break;
          case 'photos':
            setShowPhotosPanel(true);
            break;
          case 'messages':
            setShowMessagesPanel(true);
            break;
          case 'map':
            setShowMapPanel(true);
            break;
          case 'music':
            if (startupAudioRef.current) {
              startupAudioRef.current.pause();
              startupAudioRef.current.currentTime = 0;
            }
            setShowMusicPanel(true);
            break;
          case 'story':
            setShowStoryPanel(true);
            break;
          case 'crewchat':
            setShowCrewChat(true);
            break;
        }
      }
    },
    []
  );

  const closeAllPanels = useCallback(() => {
    togglePanel('none');
  }, [togglePanel]);

  // ========== PROFILE PICTURE UPLOAD ==========
  const handleProfilePicUpload = async (file: File) => {
    if (!user || !userProfile) {
      alert('Please sign in first!');
      return;
    }

    try {
      const profilePicUrl = await uploadImageToImgBB(file);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profilePicUrl: profilePicUrl,
        lastActive: Timestamp.now(),
      });

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              profilePicUrl: profilePicUrl,
            }
          : null
      );

      alert('✅ Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  // ========== PERFORMANCE SETTINGS ==========
  const [crewDetectionEnabled, setCrewDetectionEnabled] = useState(false);
  const [markerQuality, setMarkerQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Dynamic quality settings
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>(detectDevicePerformance());

  // Marker limits based on quality
  const markerLimit = graphicsQuality === 'low' ? 12 : graphicsQuality === 'medium' ? 25 : 50;

  // ========== PERFORMANCE MEMOIZATION ==========
  const markersByUser = useMemo(() => {
    return userMarkers.reduce(
      (acc, marker) => {
        const userId = marker.userId || 'unknown';
        if (!acc[userId]) acc[userId] = [];
        acc[userId].push(marker);
        return acc;
      },
      {} as Record<string, UserMarker[]>
    );
  }, [userMarkers]);

  const filteredMarkers = useMemo(() => {
    if (showOnlyMyDrops && user) {
      return markersByUser[user.uid] || [];
    }
    return userMarkers.slice(0, markerLimit);
  }, [userMarkers, showOnlyMyDrops, user, markerLimit, markersByUser]);

  const markerBounds = useMemo(() => {
    return calculateBoundsFromMarkers(userMarkers);
  }, [userMarkers]);

  // ========== REFS ==========
  const mapRef = useRef<L.Map | null>(null);

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
    stopTracking,
  } = useGPSTracker();

  const {
    musicDrops,
    activeMusicDrops,
    discoveredMusicDrops,
    isScanning: musicDropsScanning,
    scanResults,
    musicScan,
    unlockMusicTrack,
    discoverMusicDrop,
    replaceMusicDropWithDropType,
  } = useMusicDrops(user, gpsPosition);

  // ========== DATA LOADING FUNCTIONS (defined early) ==========
  const loadAllMarkers = useCallback(async (): Promise<void> => {
    const startTime = performance.now();
    setLoadingMarkers(true);
    try {
      const markerLimit = markerQuality === 'low' ? 12 : markerQuality === 'medium' ? 25 : 50;
      const q = query(collection(db, 'markers'), orderBy('createdAt', 'desc'), limit(markerLimit));

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
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          specialType: data.specialType || null,
          // Use stored values, fallback to defaults if missing
          surface: data.surface || ('wall' as SurfaceType),
          graffitiType: data.graffitiType || ('tag' as GraffitiType),
          styleId: data.styleId || undefined,
        });
      });

      loadedMarkers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (isMounted.current) setUserMarkers(loadedMarkers);
    } catch (error) {
      console.error('Error loading all markers:', error);
    } finally {
      setLoadingMarkers(false);
      logPerformance('loadAllMarkers', startTime);
    }
  }, [markerQuality, logPerformance, isMounted]);

  const loadTopPlayers = useCallback(async (): Promise<void> => {
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
          lastActive: data.lastActive?.toDate() || new Date(),
        });
      });

      const sortedUsers = allUsers
        .filter((user) => user.username && user.rep > 0)
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
                position: latestMarker.position,
              };
            }
          } catch (error) {
            console.error(`Error getting position for ${player.username}:`, error);
          }
          return player;
        })
      );

      if (isMounted.current) setTopPlayers(playersWithPositions);
    } catch (error) {
      console.error('Error loading top players:', error);
    }
  }, [isMounted]);

  const loadTopCrews = useCallback(async (): Promise<void> => {
    try {
      const crewsRef = collection(db, 'crews');
      const crewsSnapshot = await getDocs(crewsRef);

      const allCrews: TopCrew[] = [];

      crewsSnapshot.forEach((doc) => {
        const data = doc.data();
        allCrews.push({
          crewId: data.id || doc.id,
          name: data.name,
          totalRep: data.rep || 0,
          memberCount: data.members ? data.members.length : 0,
          color: data.color || '#4dabf7',
          accentColor: data.accentColor || '#339af0',
          description: data.description || '',
          leaderName: data.leader || 'Unknown',
          leaderUsername: data.leaderUsername || 'Unknown',
          leaderProfilePicUrl: data.leaderProfilePicUrl || generateAvatarUrl(doc.id, data.leader || 'Unknown'),
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date(),
        });
      });

      const sortedCrews = allCrews
        .filter((crew) => crew.name && crew.totalRep > 0)
        .sort((a, b) => b.totalRep - a.totalRep)
        .slice(0, 3);

      if (isMounted.current) setTopCrews(sortedCrews);
    } catch (error) {
      console.error('Error loading top crews:', error);
    }
  }, [isMounted]);

  const loadDrops = useCallback(async (): Promise<void> => {
    try {
      const loadedDrops = await loadAllDrops();
      const dropLimit = markerQuality === 'low' ? 30 : markerQuality === 'medium' ? 75 : 150;
      const limitedDrops = (loadedDrops as Drop[]).slice(0, dropLimit).map((drop) => ({
        ...drop,
        id: drop.id || drop.firestoreId || `drop-${Date.now()}-${Math.random()}`,
        firestoreId: drop.firestoreId || drop.id,
      }));
      if (isMounted.current) setDrops(limitedDrops);
    } catch (error) {
      console.error('Error loading drops:', error);
    }
  }, [markerQuality, isMounted]);

  // ========== SAVE MARKER HOOK (depends on loadTopPlayers) ==========
  const { saveMarkerToFirestore, calculateStreakBonus } = useSaveMarker({
    user,
    userProfile,
    lastMarkerDate,
    setLastMarkerDate,
    setUserProfile,
    setRepNotification,
    setNpcWelcomeNotification,
    loadTopPlayers,
  });

  // ========== MUSIC DROP REPLACEMENT HOOK (depends on saveMarkerToFirestore, loadDrops, loadAllMarkers) ==========
  const { handleMusicDropReplacement } = useMusicDropReplacement({
    user,
    userProfile,
    userProfileRef,
    isCreatingDrop,
    drops,
    musicDrops,
    unlockedTracks,
    selectedMarkerType,
    selectedMarkerColor,
    selectedSurface,
    selectedGraffitiType,
    selectedSpecialType,
    setIsCreatingDrop,
    setDrops,
    setUserProfile,
    setUnlockedTracks,
    setSelectedMusicDrop,
    setShowDropTypeModal,
    setPendingDropPosition,
    setRepNotification,
    setRecentlyUnlocked,
    setSongUnlockModal,
    setVideoUnlockModal,
    replaceMusicDropWithDropType,
    saveMarkerToFirestore,
    loadDrops,
    loadAllMarkers,
  });

  const handleMusicDropUnlock = useCallback(
    async (drop: any) => {
      if (!drop.discovered) return false;

      try {
        const success = await unlockMusicTrack(drop);

        if (success && user && userProfile) {
          const currentTracks = userProfile.unlockedTracks || [];
          const newTracks = [...currentTracks, drop.trackUrl || ''];

          setUserProfile((prev) =>
            prev
              ? {
                  ...prev,
                  unlockedTracks: newTracks,
                }
              : null
          );
          setUnlockedTracks(newTracks);

          setRepNotification({
            show: true,
            amount: drop.repReward || 15,
            message: `🎵 Music Drop Unlocked: ${drop.trackName || 'Unknown Track'}!`,
          });

          console.log('🎵 Music drop unlocked and synced:', newTracks);
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error handling music drop unlock:', error);
        return false;
      }
    },
    [user, userProfile, unlockMusicTrack]
  );

  const { hour, isNight, timeString, sunPosition, theme } = useTimeOfDay();
  const { hasUnreadMessages, unreadCount, markCrewChatAsRead } = useCrewChatUnreadTracker();
  const { hasNewStoryContent, activeMissionCount, markStoryContentAsViewed } = useStoryNotificationTracker();

  const gpsStatus = gpsLoading ? 'acquiring' : gpsError ? 'error' : isTracking ? 'tracking' : 'idle';

  // ========== CLEANUP EFFECT ==========
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    const mapInstance = mapRef.current;

    return () => {
      intervals.forEach(clearInterval);
      if (mapInstance) {
        mapInstance.off('click');
      }
      const soundCloudIframes = document.querySelectorAll('iframe[src*="soundcloud.com"]');
      soundCloudIframes.forEach((iframe) => iframe.remove());
    };
  }, []);

  useEffect(() => {
    console.log('Map component initialized');
  }, []);

  // ========== MOBILE DETECTION & RESPONSIVE IFRAME ==========
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
      setIsMobile(isMobileDevice);

      if (window.innerWidth < 480) {
        setIframeHeight(120);
      } else if (window.innerWidth < 768) {
        setIframeHeight(140);
      } else {
        setIframeHeight(166);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // ========== AUTOPLAY MUSIC ON MAP LOAD ==========
  useEffect(() => {
    if (unlockedTracks.length > 0 && !isPlaying) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const delay = isMobile ? 2000 : 1000;

      const autoplayTimer = setTimeout(() => {
        setIsPlaying(true);
        console.log('Attempting autoplay...');
      }, delay);

      return () => clearTimeout(autoplayTimer);
    }
  }, [unlockedTracks.length]);

  // ========== STARTUP AUTOPLAY: LOCAL CLASSIC TRACK ==========
  useEffect(() => {
    if (startupAutoplayAttemptedRef.current || typeof window === 'undefined') {
      return;
    }

    startupAutoplayAttemptedRef.current = true;
    const startupAudio = new Audio('/blackout-classic.mp3');
    startupAudio.preload = 'auto';
    startupAudio.volume = volume;
    startupAudioRef.current = startupAudio;

    startupAudio.play().catch((error) => {
      console.log('Startup autoplay blocked:', error);
    });

    return () => {
      startupAudio.pause();
      startupAudio.currentTime = 0;
      if (startupAudioRef.current === startupAudio) {
        startupAudioRef.current = null;
      }
    };
  }, []);

  // Initialize selected marker color from user profile on mount
  useEffect(() => {
    if (userProfile?.favoriteColor) {
      setSelectedMarkerColor(userProfile.favoriteColor);
    }
  }, [userProfile?.favoriteColor]);

  // Fix marker colors on page refresh - only apply favoriteColor to markers without an explicit color
  useEffect(() => {
    if (userProfile?.favoriteColor && userMarkers.length > 0) {
      const updatedMarkers = userMarkers.map((marker) => {
        if (marker.userId === user?.uid && !marker.color) {
          return {
            ...marker,
            color: userProfile.favoriteColor || '#10b981',
          };
        }
        return marker;
      });

      if (updatedMarkers.some((marker, index) => marker.color !== userMarkers[index].color)) {
        setUserMarkers(updatedMarkers);
      }
    }
  }, [userProfile?.favoriteColor, user?.uid]);

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
    return getTrackNameFromUrlHelper(track);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
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
        const selectedCrewData = CREWS.find((c) => c.id === data.selectedCrew);
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
            description: selectedCrewData?.description || '',
          });
        } else {
          const crewDoc = crewSnapshot.docs[0];
          const currentMembers = crewDoc.data().members || [];
          if (!currentMembers.includes(user.uid)) {
            await updateDoc(doc(db, 'crews', crewDoc.id), {
              members: [...currentMembers, user.uid],
            });
          }
        }
      }

      const initialUnlockedColors = initializeUnlockedColors(crewId);
      const initialFavoriteColor = getDefaultColorForCrew(crewId);

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
            unlockedGraffitiTypes: ['tag'],
            activeGraffitiStyle: 'tag',
            unlockedVideos: [],
            // Story fields
            activeMissions: [],
            completedMissions: [],
          };

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...userProfileData,
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now(),
        crewJoinedAt: crewId ? Timestamp.now() : null,
      });

          // Initialize story document
          const storyRef = doc(db, 'story', user.uid);
          await setDoc(storyRef, {
            userId: user.uid,
            currentAct: 1,
            storyProgress: 0,
            completedMissions: [],
            activeMissions: ['act1_intro'],
            crewTrust: { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
            plotRevealed: false,
            lastUpdated: Timestamp.now(),
          });

          setUserProfile(userProfileData);
          setStoryData({
            activeMissions: ['act1_intro'],
            completedMissions: [],
            storyProgress: 0,
            currentAct: 1,
          });

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
          closeAllPanels();
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
            lastActive: Timestamp.now(),
          });

          setUserProfile((prev) =>
            prev
              ? {
                  ...prev,
                  favoriteColor: color,
                }
              : null
          );
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

            const userUnlockedTracks = data.unlockedTracks && data.unlockedTracks.length > 0 ? data.unlockedTracks : getRandomStartTrack();
            setUnlockedTracks(userUnlockedTracks);

            const userUnlockedColors = data.unlockedColors || initializeUnlockedColors(data.crewId);

            // Load story data
            const storyDoc = await getDoc(doc(db, 'story', currentUser.uid));
            let storyFields = {};
            if (storyDoc.exists()) {
              const story = storyDoc.data();
              storyFields = {
                activeMissions: story.activeMissions || [],
                completedMissions: story.completedMissions || [],
                storyProgress: story.storyProgress || 0,
                currentAct: story.currentAct || 1,
              };
              setStoryData(storyFields as any);
            } else {
              // Initialize story if missing
          const defaultStory = {
            activeMissions: ['act1_intro'],
            completedMissions: [],
            storyProgress: 0,
            currentAct: 1,
          };
          setStoryData(defaultStory);
          storyFields = defaultStory;
            }

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
              crewId: data.crewId || null,
              crewName: data.crewName || null,
              isSolo: data.isSolo !== undefined ? data.isSolo : true,
              crewJoinedAt: data.crewJoinedAt?.toDate() || null,
              crewRank: data.crewRank || 'RECRUIT',
              crewRep: data.crewRep || 0,
              currentAct: (storyFields as any).currentAct || 1,
              storyProgress: (storyFields as any).storyProgress || 0,
              markersPlaced: data.markersPlaced || 0,
              photosTaken: data.photosTaken || 0,
              collaborations: data.collaborations || 0,
              blackoutEventsInvestigated: data.blackoutEventsInvestigated || 0,
              kaiTiakiEvaluationsReceived: data.kaiTiakiEvaluationsReceived || 0,
              hasReceivedCrewWelcomeMessage: data.hasReceivedCrewWelcomeMessage || false,
              unlockedVideos: data.unlockedVideos || [],
              unlockedGraffitiTypes: data.unlockedGraffitiTypes || ['tag'],
              activeGraffitiStyle: data.activeGraffitiStyle || 'tag',
              selectedGraffitiStyle: data.selectedGraffitiStyle,
              selectedStyleVariant: data.selectedStyleVariant,
              // Story fields
              activeMissions: (storyFields as any).activeMissions,
              completedMissions: (storyFields as any).completedMissions,
            };

            setUserProfile(userProfileData);
            setShowProfileSetup(false);

            try {
              await Promise.all([loadTopPlayers(), loadAllMarkers(), loadDrops()]);
            } catch (loadError) {
              console.error('Error loading additional data:', loadError);
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
            closeAllPanels();
          }
        });

        return () => unsubscribe();
      }, []); // loadDrops is now defined above, but this effect runs once on mount

      // Sync unlocked tracks from userProfile when profile loads
      useEffect(() => {
        if (userProfile?.unlockedTracks && userProfile.unlockedTracks.length > 0) {
          setUnlockedTracks(userProfile.unlockedTracks);
        }
      }, [userProfile?.unlockedTracks]);

      // Listen to direct messages for messenger heads
      useEffect(() => {
        if (!user) return;

        const chatsRef = ref(realtimeDb, `direct-chats/${user.uid}`);
        const unsubscribe = onValue(chatsRef, (snapshot) => {
          const conversations: {
            chatId: string;
            participantId: string;
            participantName: string;
            participantProfilePic: string;
            unreadCount: number;
          }[] = [];

          if (snapshot.exists()) {
            snapshot.forEach((child) => {
              const chatData = child.val();
              const participantIds = chatData.participantIds || [];
              const participantNames = chatData.participantNames || [];
              const participantProfilePics = chatData.participantProfilePics || [];
              
              // Find the other participant (not the current user)
              const otherIndex = participantIds.findIndex((id: string) => id !== user.uid);
              
              if (otherIndex !== -1) {
                conversations.push({
                  chatId: child.key || '',
                  participantId: participantIds[otherIndex] || '',
                  participantName: participantNames[otherIndex] || 'Unknown',
                  participantProfilePic: participantProfilePics[otherIndex] || '',
                  unreadCount: chatData.unreadCount || 0
                });
              }
            });

            // Filter to only show conversations with unread messages
            const unreadConversations = conversations.filter(c => c.unreadCount > 0);
            setMessengerConversations(unreadConversations);
          } else {
            setMessengerConversations([]);
          }
        });

        return () => unsubscribe();
      }, [user]);

      // Listen to new DM messages for notifications
      useEffect(() => {
        if (!user || !userProfile) return;

        // Keep track of the last message timestamp we've seen
        let lastSeenTimestamp = Date.now();

        // Listen to all direct message threads for the user
        const chatsRef = ref(realtimeDb, `direct-chats/${user.uid}`);
        
        const unsubscribe = onValue(chatsRef, (snapshot) => {
          if (snapshot.exists()) {
            snapshot.forEach((child) => {
              const chatData = child.val();
              const participantIds = chatData.participantIds || [];
              const participantNames = chatData.participantNames || [];
              const participantProfilePics = chatData.participantProfilePics || [];
              const lastMessageTime = chatData.lastMessageTime || 0;
              
              // If there's a new message (timestamp > last seen) and it's not from us
              const otherIndex = participantIds.findIndex((id: string) => id !== user.uid);
              if (otherIndex !== -1 && lastMessageTime > lastSeenTimestamp && chatData.lastMessage) {
                // Show notification
                setDmNotification({
                  show: true,
                  senderName: participantNames[otherIndex] || 'Unknown',
                  senderPic: participantProfilePics[otherIndex] || '',
                  message: chatData.lastMessage || 'New message',
                  senderId: participantIds[otherIndex] || ''
                });
              }
              
              // Update last seen timestamp
              if (lastMessageTime > lastSeenTimestamp) {
                lastSeenTimestamp = lastMessageTime;
              }
            });
          }
        });

        return () => unsubscribe();
      }, [user, userProfile]);

  const handleCollectTrack = useCallback(
    async (trackUrl: string, trackName: string) => {
      if (!user || !userProfile) {
        alert('Please sign in first!');
        return;
      }

      const currentTracks = userProfile.unlockedTracks || [];
      if (currentTracks.includes(trackUrl)) {
        alert('🎵 This track is already in your collection!');
        return;
      }

      try {
        const newTracks = [...currentTracks, trackUrl];

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          unlockedTracks: newTracks,
          lastActive: Timestamp.now(),
        });

        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                unlockedTracks: newTracks,
              }
            : null
        );
        setUnlockedTracks(newTracks);

        setRepNotification({
          show: true,
          amount: 0,
          message: `🎵 Track Collected: ${trackName}!`,
        });

        console.log('🎵 Track collected successfully:', trackName);
      } catch (error) {
        console.error('Error collecting track:', error);
        alert('Failed to collect track. Please try again.');
      }
    },
    [user, userProfile]
  );

  const getLogoSrc = (crewId: CrewId | null | undefined): string => {
    switch (crewId) {
      case 'bqc':
        return '/botoplogo1.svg';
      case 'sps':
        return '/botoplogo2.svg';
      case 'lzt':
        return '/botoplogo3.svg';
      case 'dgc':
        return '/botoplogo4.svg';
      default:
        return '/botoplogo.svg';
    }
  };

  const getLogoAltText = (crewId: CrewId | null | undefined): string => {
    switch (crewId) {
      case 'bqc':
        return 'Blaqwt Crew Logo';
      case 'sps':
        return 'Spontaneous Crew Logo';
      case 'lzt':
        return 'Luzunt Crew Logo';
      case 'dgc':
        return "Don't Get Capped Crew Logo";
      default:
        return 'Blackout NZ Logo';
    }
  };

  useEffect(() => {
    loadDrops();
  }, [loadDrops]);

  useEffect(() => {
    if (gpsPosition && !mapCenter) {
      const [lat, lng] = gpsPosition;
      const withinNZ =
        lat >= NZ_BOUNDS[0][0] &&
        lat <= NZ_BOUNDS[1][0] &&
        lng >= NZ_BOUNDS[0][1] &&
        lng <= NZ_BOUNDS[1][1];

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

  // UPDATED: Handle photo selection with GPS extraction and ImgBB upload
  const handlePhotoSelect = useCallback(
    async (photoData: { url: string; file: File; location?: { lat: number; lng: number } }) => {
      if (!user || !userProfile) return;
      if (isCreatingDrop) return;

      setIsCreatingDrop(true);
      setIsUploadingPhoto(true);
      try {
        let photoUrl: string;

        try {
          photoUrl = await uploadImageToImgBB(photoData.file);
        } catch (uploadError: any) {
          console.error('ImgBB upload failed:', uploadError);
          alert(`Photo upload failed: ${uploadError.message}. Please try a smaller image.`);
          setIsUploadingPhoto(false);
          return;
        }

        let dropLat: number, dropLng: number;
        let usePhotoLocation = false;

        if (photoData.location) {
          dropLat = photoData.location.lat;
          dropLng = photoData.location.lng;
          usePhotoLocation = true;

          const withinNZ =
            dropLat >= NZ_BOUNDS[0][0] &&
            dropLat <= NZ_BOUNDS[1][0] &&
            dropLng >= NZ_BOUNDS[0][1] &&
            dropLng <= NZ_BOUNDS[1][1];

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
          if (!pendingDropPosition) {
            throw new Error('No drop position available');
          }
          dropLat = pendingDropPosition.lat;
          dropLng = pendingDropPosition.lng;
        }

        const newDrop: Drop = {
          id: `drop-${Date.now()}-${Math.random()}`,
          firestoreId: '',
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
            timestamp: new Date(photoData.file.lastModified),
          },
        };

        const dropId = await saveDropToFirestore(newDrop);

        if (dropId) {
          console.log('📸 Photo drop created:', {
            dropId,
            photoUrl: newDrop.photoUrl,
            hasGPSLocation: usePhotoLocation,
            location: usePhotoLocation ? `${dropLat}, ${dropLng}` : 'Manual placement',
          });

          const repEarned = usePhotoLocation ? 15 : 10;
          const newRep = (userProfile.rep || 0) + repEarned;
          const newRank = calculateRank(newRep);
          const newLevel = calculateLevel(newRep);

          const currentTracks = userProfile.unlockedTracks && userProfile.unlockedTracks.length > 0 ? userProfile.unlockedTracks : getRandomStartTrack();
          const unlockResult = unlockRandomSoundCloudTrack(currentTracks);
          const newTracks = unlockResult.newTracks;

          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            rep: newRep,
            rank: newRank,
            level: newLevel,
            unlockedTracks: newTracks,
            lastActive: Timestamp.now(),
            photosTaken: (userProfile.photosTaken || 0) + 1,
          });

          setUserProfile((prev) =>
            prev
              ? {
                  ...prev,
                  rep: newRep,
                  rank: newRank,
                  level: newLevel,
                  unlockedTracks: newTracks,
                  photosTaken: (prev.photosTaken || 0) + 1,
                }
              : prev
          );

          console.log('📸 PHOTO DROP: Saved newTracks to state:', newTracks);
          setUnlockedTracks(newTracks);

          setDrops((prev) => [{ ...newDrop, firestoreId: dropId, id: dropId }, ...prev]);

          if ((selectedMusicDrop as any)?.discovered && selectedMusicDrop?.id) {
            replaceMusicDropWithDropType(selectedMusicDrop.id, 'photo');
            setSelectedMusicDrop(null);
          }
          setShowPhotoModal(false);
          setPendingDropPosition(null);

          const trackUnlocked = newTracks.length > currentTracks.length;
          const unlockedTrackName = trackUnlocked ? getTrackNameFromUrlHelper(newTracks[newTracks.length - 1]) : '';
          const unlockedTrackUrl = trackUnlocked ? newTracks[newTracks.length - 1] : '';

          if (trackUnlocked) {
            setSongUnlockModal({
              isOpen: true,
              trackUrl: unlockedTrackUrl,
              trackName: unlockedTrackName,
              source: 'GPS PHOTO DROP',
            });

            const isSpotifyTrack = unlockedTrackUrl.includes('open.spotify.com');
            setRecentlyUnlocked({
              url: unlockedTrackUrl,
              name: unlockedTrackName,
              source: isSpotifyTrack ? 'Spotify' : 'SoundCloud',
            });
          }

          const trackUnlockedMessage = trackUnlocked ? `🎵 NEW TRACK UNLOCKED! 🎵\n\n${unlockedTrackName}` : null;

          setRepNotification({
            show: true,
            amount: repEarned,
            message: trackUnlockedMessage || `📸 Photo Drop Placed! +${repEarned} REP`,
          });

          if (mapRef.current) {
            mapRef.current.setView([dropLat, dropLng], 17);
          }

          if (userProfile.crewId && !userProfile.hasReceivedCrewWelcomeMessage) {
            const crewLeaderName = CREWS.find((c) => c.id === userProfile.crewId)?.leader;
            const leaderCharacter = characters.find((char) => char.name.includes(crewLeaderName || ''));

            if (leaderCharacter) {
              const greetingMessage = `${leaderCharacter.name.replace('👑 ', '')}: Your photo drops are lighting up the city, ${userProfile.username}! Keep snapping and making history. 📸`;

              setNpcWelcomeNotification({
                show: true,
                leaderName: leaderCharacter.name.replace('👑 ', ''),
                message: greetingMessage,
              });

              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                hasReceivedCrewWelcomeMessage: true,
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      hasReceivedCrewWelcomeMessage: true,
                    }
                  : null
              );
            }
          }

          const newTotalMarkers = (userProfile.totalMarkers || 0) + 1;
          if (newTotalMarkers === 3 && storyData?.activeMissions?.includes('act1_intro')) {
            const storyRef = doc(db, 'story', user.uid);
            await updateDoc(storyRef, {
              activeMissions: (storyData.activeMissions || []).filter((id) => id !== 'act1_intro'),
              completedMissions: [...(storyData.completedMissions || []), 'act1_intro'],
              storyProgress: (storyData.storyProgress || 0) + 1,
              lastUpdated: Timestamp.now(),
            });

            setStoryData((prev) =>
              prev
                ? {
                    ...prev,
                    activeMissions: prev.activeMissions.filter((id) => id !== 'act1_intro'),
                    completedMissions: [...prev.completedMissions, 'act1_intro'],
                    storyProgress: prev.storyProgress + 1,
                  }
                : null
            );

            setUserProfile((prev) =>
              prev
                ? {
                    ...prev,
                    activeMissions: prev.activeMissions?.filter((id) => id !== 'act1_intro') || [],
                    completedMissions: [...(prev.completedMissions || []), 'act1_intro'],
                    storyProgress: (prev.storyProgress || 0) + 1,
                  }
                : null
            );

            setRepNotification({
              show: true,
              amount: 0,
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
        setIsCreatingDrop(false);
      }
    },
    [user, userProfile, pendingDropPosition, gpsPosition, loadDrops, isCreatingDrop, selectedMusicDrop, replaceMusicDropWithDropType, storyData]
  );

  const handleMarkerDrop = useCallback(async () => {
    if (!user || !userProfile || !pendingDropPosition) return;
    if (isCreatingDrop) return;

    if (selectedMusicDrop && (selectedMusicDrop as any).discovered) {
      if (selectedMusicDrop.id) {
        await handleMusicDropReplacement(selectedMusicDrop.id, 'marker');
      }
      setSelectedMusicDrop(null);
      setShowDropTypeModal(false);
      return;
    }

    setIsCreatingDrop(true);
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout: Resetting isCreatingDrop (marker)');
      setIsCreatingDrop(false);
    }, 10000);

    try {
      const newDrop: Drop = {
        id: `drop-${Date.now()}-${Math.random()}`,
        firestoreId: '',
        lat: pendingDropPosition.lat,
        lng: pendingDropPosition.lng,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
      };

      const dropId = await saveDropToFirestore(newDrop);

      const currentUserProfile = userProfileRef.current;
      const isFirstTag = (currentUserProfile?.totalMarkers || 0) === 0;
      const forcedFirstTagStyleId = `${currentUserProfile?.crewId || 'bqc'}-tag-svg-2`;
      const currentStyleId = isFirstTag ? forcedFirstTagStyleId : currentUserProfile?.selectedGraffitiStyle;

      console.log('🎨 Creating marker with styleId:', currentStyleId);

      const markerData: UserMarker = {
        id: `temp-${Date.now()}`,
        position: [pendingDropPosition.lat, pendingDropPosition.lng],
        name: SURFACE_TO_MARKER_NAME[selectedSurface] as MarkerName,
        description: GRAFFITI_TO_MARKER_DESCRIPTION[selectedGraffitiType] as MarkerDescription,
        color: selectedMarkerColor,
        timestamp: new Date(),
        userId: user.uid,
        username: currentUserProfile?.username,
        userProfilePic: currentUserProfile?.profilePicUrl,
        surface: selectedSurface,
        graffitiType: selectedGraffitiType,
        specialType: selectedSpecialType,
        styleId: currentStyleId,
      };

      const markerId = await saveMarkerToFirestore(markerData);

      if (dropId && markerId) {
        const repEarned = 5;
        const newRep = (userProfile.rep || 0) + repEarned;
        const newRank = calculateRank(newRep);
        const newLevel = calculateLevel(newRep);

        const currentTracks = userProfile.unlockedTracks && userProfile.unlockedTracks.length > 0 ? userProfile.unlockedTracks : getRandomStartTrack();
        const unlockResult = unlockRandomSpotifyTrack(currentTracks);
        const newTracks = unlockResult.newTracks;

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          rep: newRep,
          level: newLevel,
          rank: newRank,
          unlockedTracks: newTracks,
          ...(isFirstTag
            ? {
                selectedGraffitiStyle: forcedFirstTagStyleId,
                selectedStyleVariant: forcedFirstTagStyleId,
                activeGraffitiStyle: 'tag',
              }
            : {}),
        });

        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                rep: newRep,
                level: newLevel,
                rank: newRank,
                unlockedTracks: newTracks,
                ...(isFirstTag
                  ? {
                      selectedGraffitiStyle: forcedFirstTagStyleId,
                      selectedStyleVariant: forcedFirstTagStyleId,
                      activeGraffitiStyle: 'tag',
                    }
                  : {}),
              }
            : null
        );

        console.log('📍 MARKER DROP: Saved newTracks to state:', newTracks);
        setUnlockedTracks(newTracks);

        const trackUnlocked = newTracks.length > currentTracks.length;
        const unlockedTrackName = trackUnlocked ? getTrackNameFromUrlHelper(newTracks[newTracks.length - 1]) : '';
        const unlockedTrackUrl = trackUnlocked ? newTracks[newTracks.length - 1] : '';

        if (trackUnlocked) {
          setSongUnlockModal({
            isOpen: true,
            trackUrl: unlockedTrackUrl,
            trackName: unlockedTrackName,
            source: 'MARKER DROP',
          });

          const isSpotifyTrack = unlockedTrackUrl.includes('open.spotify.com');
          setRecentlyUnlocked({
            url: unlockedTrackUrl,
            name: unlockedTrackName,
            source: isSpotifyTrack ? 'Spotify' : 'SoundCloud',
          });
        }

        const notificationMessage = trackUnlocked
          ? `🎵 ${unlockedTrackName} Unlocked! 🎵\n${selectedMarkerType} marker placed!`
          : `${selectedMarkerType} marker placed!`;

        setRepNotification({ show: true, amount: repEarned, message: notificationMessage });

        await loadDrops();
        await loadAllMarkers();
        await loadTopPlayers();
      }

      setShowDropTypeModal(false);
      setPendingDropPosition(null);
    } catch (error) {
      console.error('Error creating marker drop:', error);
      alert(`Failed to create marker drop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      clearTimeout(safetyTimeout);
      setIsCreatingDrop(false);
    }
  }, [
    user,
    userProfile,
    pendingDropPosition,
    selectedMarkerType,
    selectedMarkerColor,
    selectedSurface,
    selectedGraffitiType,
    selectedSpecialType,
    loadDrops,
    loadAllMarkers,
    loadTopPlayers,
    isCreatingDrop,
    selectedMusicDrop,
    handleMusicDropReplacement,
  ]);

  const handlePhotoDrop = useCallback(() => {
    if (isCreatingDrop) return;
    setShowDropTypeModal(false);
    setShowPhotoModal(true);
  }, [isCreatingDrop]);

  const handleMusicDrop = useCallback(
    async (trackUrl?: string) => {
      if (!user || !userProfile || !pendingDropPosition) return;
      if (isCreatingDrop) return;

      if (selectedMusicDrop && (selectedMusicDrop as any).discovered) {
        if (selectedMusicDrop.id) {
          await handleMusicDropReplacement(selectedMusicDrop.id, 'music');
        }
        setSelectedMusicDrop(null);
        setShowDropTypeModal(false);
        return;
      }

      const tracks = userProfile.unlockedTracks ?? unlockedTracks;
      if (tracks.length === 0) return;

      setIsCreatingDrop(true);

      const trackToDrop = trackUrl || selectedTrackForMusicDrop || tracks[0];
      try {
        const newDrop: Drop = {
          id: `drop-${Date.now()}-${Math.random()}`,
          firestoreId: '',
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
          prev
            ? {
                ...prev,
                unlockedTracks: newTracks,
              }
            : null
        );
        setUnlockedTracks(newTracks);
        setSelectedTrackForMusicDrop(null);

        setRepNotification({
          show: true,
          amount: 0,
          message: `Music drop placed! You gave away "${getTrackNameFromUrlHelper(trackToDrop)}". ${
            newTracks.length === 0 ? 'You have no songs left.' : `${newTracks.length} track(s) remaining.`
          }`,
        });

        if (userProfile.crewId && !userProfile.hasReceivedCrewWelcomeMessage) {
          const crewLeaderName = CREWS.find((c) => c.id === userProfile.crewId)?.leader;
          const leaderCharacter = characters.find((char) => char.name.includes(crewLeaderName || ''));

          if (leaderCharacter) {
            const greetingMessage = `${leaderCharacter.name.replace('👑 ', '')}: Your beats are dropping hard, ${
              userProfile.username
            }! Keep the soundtrack fresh and the streets vibrant. 🎶`;

            setNpcWelcomeNotification({
              show: true,
              leaderName: leaderCharacter.name.replace('👑 ', ''),
              message: greetingMessage,
            });

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              hasReceivedCrewWelcomeMessage: true,
              lastActive: Timestamp.now(),
            });

            setUserProfile((prev) =>
              prev
                ? {
                    ...prev,
                    hasReceivedCrewWelcomeMessage: true,
                  }
                : null
            );
          }
        }

        const newTotalMarkers = (userProfile.totalMarkers || 0) + 1;
        if (newTotalMarkers === 3 && storyData?.activeMissions?.includes('act1_intro')) {
          const storyRef = doc(db, 'story', user.uid);
          await updateDoc(storyRef, {
            activeMissions: (storyData.activeMissions || []).filter((id) => id !== 'act1_intro'),
            completedMissions: [...(storyData.completedMissions || []), 'act1_intro'],
            storyProgress: (storyData.storyProgress || 0) + 1,
            lastUpdated: Timestamp.now(),
          });

          setStoryData((prev) =>
            prev
              ? {
                  ...prev,
                  activeMissions: prev.activeMissions.filter((id) => id !== 'act1_intro'),
                  completedMissions: [...prev.completedMissions, 'act1_intro'],
                  storyProgress: prev.storyProgress + 1,
                }
              : null
          );

          setUserProfile((prev) =>
            prev
              ? {
                  ...prev,
                  activeMissions: prev.activeMissions?.filter((id) => id !== 'act1_intro') || [],
                  completedMissions: [...(prev.completedMissions || []), 'act1_intro'],
                  storyProgress: (prev.storyProgress || 0) + 1,
                }
              : null
          );

          setRepNotification({
            show: true,
            amount: 0,
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
        setIsCreatingDrop(false);
      }
    },
    [
      user,
      userProfile,
      pendingDropPosition,
      selectedTrackForMusicDrop,
      unlockedTracks,
      loadDrops,
      selectedMusicDrop,
      handleMusicDropReplacement,
      isCreatingDrop,
      storyData,
    ]
  );

  // Use useMapActions hook for map and marker operations
  const {
    handleMapClick,
    centerMap,
    centerOnGPS,
    updateMarker,
    deleteMarker,
    deleteAllMarkers,
    goToMarker,
    handleRefreshAll,
  } = useMapActions({
    user,
    userProfile,
    userMarkers,
    isCreatingDrop,
    isOfflineMode,
    loadingUserProfile,
    showProfileSetup,
    gpsPosition,
    expandedRadius,
    mapRef,
    musicScan,
    setUserMarkers,
    setUserProfile,
    setNextMarkerNumber,
    setMapCenter,
    setZoom,
    setIsScanning,
    setIsRefreshing,
    setPendingDropPosition,
    setShowDropTypeModal,
    setRepNotification,
    loadAllMarkers,
    loadTopPlayers,
    loadDrops,
  });

  // Memoized map click handler for performance
  const memoizedHandleMapClick = useMemo(() => handleMapClick, [handleMapClick]);

  // Effect to attach map click listener when dependencies change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || isOfflineMode) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      memoizedHandleMapClick(e);
    };
    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [memoizedHandleMapClick, isOfflineMode]);

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // ========== AUTH LOADING CHECK ==========
  if (loadingAuth) {
    return (
      <div
        style={{
          ...fullScreenStyle,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #4dabf7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
        <div style={{ fontSize: '18px', color: '#374151' }}>Loading...</div>
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

  // ========== PROFILE SETUP UI ==========
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
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #4dabf7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
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
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* REP Notification */}
      <RepNotification
        show={repNotification?.show || false}
        amount={repNotification?.amount || 0}
        message={repNotification?.message || ''}
        breakdown={repNotification?.breakdown}
        onClose={() => setRepNotification(null)}
      />

      {/* DM Notification */}
      <DMNotification
        show={dmNotification?.show || false}
        senderName={dmNotification?.senderName || ''}
        senderPic={dmNotification?.senderPic || ''}
        message={dmNotification?.message || ''}
        onClose={() => setDmNotification(null)}
        onClick={() => {
          if (dmNotification?.senderId) {
            setInitialChatTarget({
              uid: dmNotification.senderId,
              username: dmNotification.senderName,
              profilePicUrl: dmNotification.senderPic
            });
            setShowMessagesPanel(true);
            setDmNotification(null);
          }
        }}
      />

      {/* 🎵 Song Unlock Modal */}
      {songUnlockModal && (
        <SongUnlockModal
          trackUrl={songUnlockModal.trackUrl}
          trackName={songUnlockModal.trackName}
          isOpen={songUnlockModal.isOpen}
          onClose={() => setSongUnlockModal(null)}
          unlockSource={songUnlockModal.source}
        />
      )}

      {/* 🎬 Video Unlock Modal */}
      {videoUnlockModal && (
        <VideoUnlockModal
          videoUrl={videoUnlockModal.videoUrl}
          isOpen={videoUnlockModal.isOpen}
          onClose={() => setVideoUnlockModal(null)}
          unlockSource={videoUnlockModal.source}
        />
      )}

      {/* NPC Welcome Notification */}
      {npcWelcomeNotification?.show && (
        <div
          style={{
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
            animation: 'popIn 0.3s ease-out',
          }}
        >
          <h3
            style={{
              fontSize: '24px',
              color: '#10b981',
              marginBottom: '10px',
            }}
          >
            Welcome to the Crew!
          </h3>
          <p
            style={{
              fontSize: '16px',
              marginBottom: '20px',
            }}
          >
            <strong style={{ color: '#4dabf7' }}>{npcWelcomeNotification.leaderName}:</strong>{' '}
            {npcWelcomeNotification.message}
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
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Got it!
          </button>
          <style>{`
            @keyframes popIn {
              from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
          `}</style>
        </div>
      )}

      {/* Top-Left Logo */}
      <div
        style={{
          position: 'fixed',
          top: '15px',
          left: '15px',
          zIndex: 1100,
          pointerEvents: 'none',
        }}
      >
        <img
          src={getLogoSrc(userProfile?.crewId as CrewId | null | undefined)}
          alt={getLogoAltText(userProfile?.crewId as CrewId | null | undefined)}
          style={{
            width: '120px',
            height: 'auto',
            filter: isNight
              ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5)) brightness(0) invert(1)'
              : 'drop-shadow(0 2px 4px rgba(255,255,255,0.3)) brightness(0) saturate(0)',
            opacity: 0.9,
            transition: 'filter 0.5s ease',
          }}
        />
      </div>

      <MapContainer
        center={isOfflineMode && lastKnownPosition ? lastKnownPosition : mapCenter || NZ_CENTER}
        zoom={mapCenter ? zoom : NZ_DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        maxBounds={NZ_BOUNDS}
        maxBoundsViscosity={1.0}
        minZoom={4}
        maxZoom={18}
        ref={(mapInstance: L.Map | null) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
            mapInstance.setMaxBounds(NZ_BOUNDS);
          }
        }}
      >
        {/* Tile Layer - Satellite, Day, or Night */}
        {showSatelliteView ? (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : isNight ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* User GPS Marker */}
        {gpsPosition && (
          <>
            <Marker
              position={gpsPosition}
              icon={(() => {
                if (typeof window === 'undefined') return undefined;
                const crewColor = getCrewColor(userProfile?.crewId);
                return new (require('leaflet').DivIcon)({
                  html: `
                    <div style="
                      position: relative;
                      width: 24px;
                      height: 24px;
                    ">
                      <div style="
                        position: absolute;
                        width: 24px;
                        height: 24px;
                        background-color: ${crewColor};
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 0 10px ${crewColor}, 0 2px 8px rgba(0,0,0,0.4);
                        animation: gpsPulse 2s infinite;
                      "></div>
                      <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 8px;
                        height: 8px;
                        background-color: white;
                        border-radius: 50%;
                      "></div>
                    </div>
                    <style>
                      @keyframes gpsPulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.2); opacity: 0.8; }
                      }
                    </style>
                  `,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                  popupAnchor: [0, -12],
                });
              })()}
            >
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
                    {isTracking && heading !== null && <div>Heading: {Math.round(heading)}°</div>}
                    <div
                      style={{
                        color: isTracking ? '#10b981' : '#f59e0b',
                        marginTop: '5px',
                        fontWeight: 'bold',
                      }}
                    >
                      {isTracking ? '✅ Live GPS Tracking Active' : '⚠️ GPS not actively tracking'}
                    </div>
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '8px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                    >
                      <strong>👥 {userMarkers.length} drops visible</strong>
                      <div style={{ marginTop: '4px' }}>
                        ({userMarkers.filter((m) => m.userId === user?.uid).length} yours)
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Radius GRID pattern */}
            {show50mRadius &&
              (() => {
                const circleCenter = isOfflineMode && lastKnownPosition ? lastKnownPosition : gpsPosition;
                const gridColor = isOfflineMode ? '#ef4444' : '#10b981';
                const gridFillOpacity = isOfflineMode ? 0.12 : 0.08;
                const gridOpacity = isOfflineMode ? 0.7 : 0.6;

                return (
                  <>
                    <Circle
                      center={circleCenter}
                      radius={expandedRadius}
                      pathOptions={{
                        color: gridColor,
                        fillColor: gridColor,
                        fillOpacity: gridFillOpacity,
                        weight: 2,
                        opacity: gridOpacity,
                      }}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center' }}>
                          <strong style={{ color: gridColor }}>
                            {isOfflineMode
                              ? `🔴 Offline Mode: ${expandedRadius}m Radius`
                              : `🟢 Online Mode: ${expandedRadius}m Radius`}
                          </strong>
                          {isOfflineMode && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#ef4444',
                                marginTop: '5px',
                                fontWeight: 'bold',
                              }}
                            >
                              📍 GPS tracking paused (Offline Mode)
                            </div>
                          )}
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            {isOfflineMode
                              ? 'Use joystick to explore the map'
                              : 'Click inside this circle to place drops within ' + expandedRadius + 'm'}
                          </div>
                        </div>
                      </Popup>
                    </Circle>

                    {[10, 20, 30, 40, 50].map(
                      (radius) =>
                        radius <= expandedRadius && (
                          <Circle
                            key={`grid-circle-${radius}`}
                            center={circleCenter}
                            radius={radius}
                            pathOptions={{
                              color: gridColor,
                              fillColor: 'transparent',
                              fillOpacity: 0,
                              weight: 1,
                              opacity: gridOpacity * 0.5,
                            }}
                            interactive={false}
                          />
                        )
                    )}
                  </>
                );
              })()}

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
                  dashArray: '5, 5',
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
        {showTopPlayers &&
          topPlayers.map((player, index) => {
            if (!player.position) return null;

            const cardColor = index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706';
            const textColor = index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12';
            const sprayCanEmoji = '🎨';

            const customIcon =
              typeof window !== 'undefined'
                ? new (require('leaflet').DivIcon)({
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
                    popupAnchor: [0, -20],
                  })
                : undefined;

            return (
              <Marker key={`top-player-${player.uid}`} position={player.position} icon={customIcon}>
                <Popup>
                  <div
                    style={{
                      textAlign: 'center',
                      minWidth: '220px',
                      padding: '10px',
                    }}
                  >
                    <div
                      style={{
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
                        zIndex: 10,
                      }}
                    >
                      {index === 0 ? '🥇 TOP WRITER' : index === 1 ? '🥈 RUNNER-UP' : '🥉 CONTENDER'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '15px',
                        marginBottom: '15px',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '60px',
                          height: '60px',
                          borderRadius: '0',
                          border: `3px solid ${cardColor}`,
                          overflow: 'visible',
                        }}
                      >
                        <img
                          src={player.profilePicUrl}
                          alt={player.username}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '-8px',
                            width: '20px',
                            height: '20px',
                            zIndex: 5,
                            fontSize: '16px',
                            lineHeight: '1',
                          }}
                        >
                          {sprayCanEmoji}
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: cardColor,
                          }}
                        >
                          {player.username}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>{player.rank}</div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        marginBottom: '15px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          background: '#f8f9fa',
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{player.rep}</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>REP</div>
                      </div>

                      <div
                        style={{
                          background: '#f8f9fa',
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7' }}>{player.level}</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>LVL</div>
                      </div>

                      <div
                        style={{
                          background: '#f8f9fa',
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                          {player.totalMarkers}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>TAGS</div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        backgroundColor: '#f1f5f9',
                        padding: '6px',
                        borderRadius: '4px',
                        marginTop: '10px',
                      }}
                    >
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
                        transition: 'transform 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      🚀 Go to Writer
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Top Crews Markers */}
        {showTopCrews &&
          topCrews.map((crew, index) => {
            if (!crew.leaderProfilePicUrl) return null;

            const cardColor = index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706';
            const textColor = index === 0 ? '#7c2d12' : index === 1 ? '#1f2937' : '#7c2d12';
            const accentColor = index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#b45309';
            const sprayCanEmoji = '🎨';

            const customIcon =
              typeof window !== 'undefined'
                ? new (require('leaflet').DivIcon)({
                    html: `
                      <div style="
                        position: relative;
                        width: 45px;
                        height: 45px;
                        background: linear-gradient(135deg, ${cardColor}, ${accentColor});
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
                          #${index + 1} CREW
                        </div>
                        <div style="
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          font-size: 16px;
                          font-weight: bold;
                          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
                        ">
                          ${crew.name.charAt(0)}
                        </div>
                      </div>
                    `,
                    iconSize: [45, 45],
                    iconAnchor: [22, 22],
                    popupAnchor: [0, -22],
                  })
                : undefined;

            return (
              <Marker key={`top-crew-${crew.crewId}`} position={NZ_CENTER} icon={customIcon}>
                <Popup>
                  <div
                    style={{
                      textAlign: 'center',
                      minWidth: '240px',
                      padding: '10px',
                    }}
                  >
                    <div
                      style={{
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
                        zIndex: 10,
                      }}
                    >
                      {index === 0 ? '🥇 TOP CREW' : index === 1 ? '🥈 RUNNER-UP' : '🥉 CONTENDER'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '15px',
                        marginBottom: '15px',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: '60px',
                          height: '60px',
                          borderRadius: '0',
                          border: `3px solid ${cardColor}`,
                          overflow: 'visible',
                        }}
                      >
                        <img
                          src={crew.leaderProfilePicUrl}
                          alt={crew.leaderName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-8px',
                            left: '-8px',
                            width: '20px',
                            height: '20px',
                            zIndex: 5,
                            fontSize: '16px',
                            lineHeight: '1',
                          }}
                        >
                          {sprayCanEmoji}
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: cardColor,
                          }}
                        >
                          {crew.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {crew.leaderName} • {crew.memberCount} members
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        marginBottom: '15px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          background: '#f8f9fa',
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                          {crew.totalRep}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>CREW REP</div>
                      </div>

                      <div
                        style={{
                          background: '#f8f9fa',
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dabf7' }}>
                          {crew.memberCount}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>MEMBERS</div>
                      </div>

                      <div
                        style={{
                          background: '#f8f9fa',
                          padding: '8px 4px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                          {crew.description || 'No description'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666' }}>CREW INFO</div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        backgroundColor: '#f1f5f9',
                        padding: '6px',
                        borderRadius: '4px',
                        marginTop: '10px',
                      }}
                    >
                      Created: {crew.createdAt ? crew.createdAt.toLocaleDateString() : 'Unknown'}
                    </div>

                    <button
                      onClick={() => {
                        alert('Crew leader location not available yet');
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
                        transition: 'transform 0.2s',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                      🚀 Go to Crew
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* ALL USER MARKERS */}
        {filteredMarkers
          .filter((marker) => !showOnlyMyDrops || marker.userId === user?.uid)
          .map((marker) => (
            <MemoizedMarker
              key={marker.id}
              marker={marker}
              user={user}
              onClick={setSelectedMarker}
              crewId={userProfile?.crewId}
              activeStyleId={userProfile?.selectedGraffitiStyle || userProfile?.selectedStyleVariant}
              activeUsername={userProfile?.username}
            />
          ))}

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
        {drops
          .filter((drop) => drop.photoUrl)
          .map((drop) => {
            const dropIcon =
              typeof window !== 'undefined'
                ? new (require('leaflet').DivIcon)({
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
                        ${drop.likes && drop.likes.length > 0
                          ? `
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
                          `
                          : ''}
                      </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                    popupAnchor: [0, -16],
                  })
                : undefined;

            return (
              <Marker
                key={drop.id}
                position={[drop.lat, drop.lng]}
                icon={dropIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedPhotoDrop(drop);
                    if (mapRef.current) {
                      mapRef.current.closePopup();
                    }
                  },
                }}
              />
            );
          })}

        {/* Full-Screen Photo Drop Modal */}
        {selectedPhotoDrop && (
          <>
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
                justifyContent: 'center',
              }}
              onClick={() => setSelectedPhotoDrop(null)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <PhotoDropPopup
                  drop={selectedPhotoDrop}
                  user={user}
                  onLikeUpdate={(dropId, newLikes) => {
                    setDrops((prev) =>
                      prev.map((d) => (d.firestoreId === dropId ? { ...d, likes: newLikes } : d))
                    );
                  }}
                  onDelete={async (dropId) => {
                    setDrops((prev) => prev.filter((d) => d.firestoreId !== dropId));
                    setSelectedPhotoDrop(null);

                    if (user && userProfile && selectedPhotoDrop?.createdBy === user.uid) {
                      try {
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, {
                          photosTaken: Math.max(0, (userProfile.photosTaken || 1) - 1),
                          lastActive: Timestamp.now(),
                        });

                        setUserProfile((prev) =>
                          prev
                            ? {
                                ...prev,
                                photosTaken: Math.max(0, (prev.photosTaken || 1) - 1),
                              }
                            : null
                        );
                      } catch (error) {
                        console.error('Error updating photosTaken:', error);
                      }
                    }
                  }}
                  onEditComplete={async (updates) => {
                    if (updates) {
                      setDrops((prev) =>
                        prev.map((d) =>
                          d.firestoreId === selectedPhotoDrop?.firestoreId ? { ...d, ...updates } : d
                        )
                      );
                      setSelectedPhotoDrop((prev) => (prev ? { ...prev, ...updates } : prev));
                    }
                    await loadDrops();
                  }}
                  onClose={() => setSelectedPhotoDrop(null)}
                />
              </div>
            </div>
          </>
        )}

        {/* Music drops (trackUrl, no photo) */}
        {drops
          .filter((drop) => drop.trackUrl && !drop.photoUrl)
          .map((drop) => {
            const musicIcon =
              typeof window !== 'undefined'
                ? new (require('leaflet').DivIcon)({
                    html: `
                      <div style="position:relative;width:32px;height:32px;">
                        <div style="position:absolute;top:2px;left:2px;width:28px;height:28px;background:linear-gradient(135deg,#9333ea,#8b5cf6);border:3px solid white;border-radius:50%;box-shadow:0 0 15px rgba(147,51,234,0.8),0 0 30px rgba(147,51,234,0.5);display:flex;align-items:center;justify-content:center;z-index:10;animation:musicPulse 1.5s ease-in-out infinite;">
                          <span style="filter:brightness(0) invert(1);font-size:14px;">🎵</span>
                        </div>
                        <div style="position:absolute;top:16px;left:16px;width:24px;height:24px;border:3px solid rgba(147,51,234,0.8);border-radius:50%;box-shadow:0 0 10px rgba(147,51,234,0.6);animation:radioWave1 2s ease-out infinite;pointer-events:none;"></div>
                        <div style="position:absolute;top:16px;left:16px;width:40px;height:40px;border:3px solid rgba(147,51,234,0.6);border-radius:50%;box-shadow:0 0 15px rgba(147,51,234,0.4);animation:radioWave2 2s ease-out infinite;pointer-events:none;"></div>
                        <div style="position:absolute;top:16px;left:16px;width:56px;height:56px;border:3px solid rgba(147,51,234,0.4);border-radius:50%;box-shadow:0 0 20px rgba(147,51,234,0.3);animation:radioWave3 2s ease-out infinite;pointer-events:none;"></div>
                      </div>`,
                    className: 'music-marker-icon',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                    popupAnchor: [0, -16],
                  })
                : undefined;

            return (
              <Marker
                key={drop.id}
                position={[drop.lat, drop.lng]}
                icon={musicIcon}
                eventHandlers={{
                  click: () => {
                    setSelectedMusicDrop(drop);
                    if (mapRef.current) {
                      mapRef.current.closePopup();
                    }
                  },
                }}
              />
            );
          })}

        {/* Full-Screen Music Drop Modal */}
        {selectedMusicDrop && selectedMusicDrop.trackUrl && (
          <MusicDropPopup
            drop={{
              id: selectedMusicDrop.id || selectedMusicDrop.firestoreId || '',
              lat: selectedMusicDrop.lat || (selectedMusicDrop as any)?.position?.[0] || 0,
              lng: selectedMusicDrop.lng || (selectedMusicDrop as any)?.position?.[1] || 0,
              trackUrl: selectedMusicDrop.trackUrl,
              trackName: selectedMusicDrop.trackName || getTrackNameFromUrlHelper(selectedMusicDrop.trackUrl),
              source: selectedMusicDrop.source || getTrackSource(selectedMusicDrop.trackUrl),
              createdBy: user?.uid || '',
              timestamp: selectedMusicDrop.timestamp || (selectedMusicDrop as any)?.discoveredAt || new Date(),
              likes: [],
              username: userProfile?.username || 'Unknown',
              userProfilePic: userProfile?.profilePicUrl || generateAvatarUrl(user?.uid || '', userProfile?.username || 'Unknown'),
              discovered: true,
              discoveredAt: (selectedMusicDrop as any)?.discoveredAt || new Date(),
              repReward: (selectedMusicDrop as any)?.repReward || 15,
              spawnTime: (selectedMusicDrop as any)?.spawnTime || new Date(),
              expiresAt: (selectedMusicDrop as any)?.expiresAt || new Date(Date.now() + 30 * 60 * 1000),
            }}
            onUnlockTrack={async (drop) => {
              let musicDrop: any;

              if ('lat' in drop) {
                musicDrop = {
                  id: drop.id || '',
                  position: [drop.lat, drop.lng],
                  trackUrl: drop.trackUrl || '',
                  trackName: drop.trackName || '',
                  source: drop.source || 'Spotify',
                  discovered: true,
                  discoveredAt: new Date(),
                  repReward: 15,
                  spawnTime: drop.timestamp || new Date(),
                  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                };
              } else {
                musicDrop = drop;
              }

              const success = await unlockMusicTrack(musicDrop);

              if (success && userProfile) {
                const newTracks = [...(userProfile.unlockedTracks || []), musicDrop.trackUrl || ''];
                setUserProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        unlockedTracks: newTracks,
                      }
                    : null
                );
                setUnlockedTracks(newTracks);

                setRepNotification({
                  show: true,
                  amount: musicDrop.repReward || 15,
                  message: `🎵 Music Drop Unlocked: ${musicDrop.trackName || 'Unknown Track'}!`,
                });
              }
            }}
            onCollectTrack={handleCollectTrack}
            isTrackCollected={userProfile?.unlockedTracks?.includes(selectedMusicDrop.trackUrl) || false}
            onReplaceWithDropType={handleMusicDropReplacement}
            onClose={() => setSelectedMusicDrop(null)}
          />
        )}

        {/* Marker drops (no photo, no track) */}
        {drops
          .filter((drop) => !drop.photoUrl && !drop.trackUrl)
          .map((drop) => {
            const markerIcon =
              typeof window !== 'undefined'
                ? new (require('leaflet').DivIcon)({
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
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 16px;
                        position: relative;
                      ">
                        📍
                        ${drop.likes && drop.likes.length > 0
                          ? `
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
                              justify-content: center;
                              font-size: 9px;
                              font-weight: bold;
                              border: 2px solid white;
                            ">
                              ${drop.likes.length}
                            </div>
                          `
                          : ''}
                      </div>
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                    popupAnchor: [0, -14],
                  })
                : undefined;

            return (
              <Marker key={drop.id} position={[drop.lat, drop.lng]} icon={markerIcon}>
                <Popup>
                  <MarkerDropPopup
                    drop={drop}
                    user={user}
                    onLikeUpdate={(dropId, newLikes) => {
                      setDrops((prev) =>
                        prev.map((d) => (d.firestoreId === dropId ? { ...d, likes: newLikes } : d))
                      );
                    }}
                    onEditComplete={async (updates) => {
                      if (updates) {
                        setDrops((prev) =>
                          prev.map((d) => (d.firestoreId === drop.firestoreId ? { ...d, ...updates } : d))
                        );
                      }
                      await loadDrops();
                    }}
                  />
                </Popup>
              </Marker>
            );
          })}

        {/* Random Music Drops */}
        {musicDrops.map((drop) => (
          <Marker
            key={drop.id}
            position={[drop.position[0], drop.position[1]]}
            icon={(() => {
              return new (require('leaflet').DivIcon)({
                html: `
                  <div style="
                    position: relative;
                    width: 36px;
                    height: 36px;
                    background: ${drop.discovered
                      ? 'radial-gradient(circle, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)'
                      : 'radial-gradient(circle, #64748b 0%, #475569 50%, #334155 100%)'};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: ${drop.discovered
                      ? '0 4px 15px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.3)'
                      : '0 4px 15px rgba(100, 116, 139, 0.6), 0 0 20px rgba(100, 116, 139, 0.3)'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: ${drop.discovered ? 'pulseGlow 2s ease-in-out infinite' : 'none'};
                    cursor: pointer;
                    filter: ${drop.discovered ? 'grayscale(0%)' : 'grayscale(100%) brightness(0.5)'};
                  ">
                    <span style="font-size: 18px; ${drop.discovered ? '' : 'filter: brightness(0.5);'}">🎵</span>
                    ${drop.discovered
                      ? `
                      <div style="
                        position: absolute;
                        top: -8px;
                        right: -8px;
                        width: 16px;
                        height: 16px;
                        background: #10b981;
                        border: 2px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 10px;
                        font-weight: bold;
                      ">
                        ✓
                      </div>
                    `
                      : ''}
                  </div>
                  <style>
                    @keyframes pulseGlow {
                      0%, 100% { 
                        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.3);
                      }
                      50% { 
                        box-shadow: 0 6px 25px rgba(139, 92, 246, 0.8), 0 0 35px rgba(139, 92, 246, 0.5);
                      }
                    }
                  </style>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18],
              });
            })()}
            eventHandlers={{
              click: () => {
                if (drop.discovered) {
                  setPendingDropPosition({
                    lat: drop.position[0],
                    lng: drop.position[1],
                  });
                  setSelectedMusicDrop({
                    id: drop.id,
                    lat: drop.position[0],
                    lng: drop.position[1],
                    trackUrl: drop.trackUrl,
                    trackName: drop.trackName,
                    source: drop.source,
                    createdBy: user?.uid || '',
                    timestamp: new Date(),
                    likes: [],
                    username: userProfile?.username || 'Unknown',
                    userProfilePic: userProfile?.profilePicUrl || generateAvatarUrl(user?.uid || '', userProfile?.username || 'Unknown'),
                    discovered: true,
                    discoveredAt: drop.discoveredAt || new Date(),
                    repReward: drop.repReward,
                    spawnTime: drop.spawnTime,
                    expiresAt: drop.expiresAt,
                  } as any);
                  setShowDropTypeModal(true);

                  if (mapRef.current) {
                    mapRef.current.closePopup();
                  }
                }
              },
            }}
          />
        ))}
        {(!gpsPosition || !isTracking) &&
          Object.entries(NEW_ZEALAND_LOCATIONS).map(([name, info]) => (
            <Marker key={name} position={info.coords as [number, number]} opacity={gpsPosition ? 0.7 : 1}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                  <strong>{name}</strong>
                  <br />
                  <small style={{ color: '#666' }}>{info.description}</small>
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
                      fontSize: '12px',
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
          setShowSongSelection(false);
          await handleMusicDrop(trackUrl);
        }}
        getTrackNameFromUrl={getTrackNameFromUrlHelper}
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

      {isCreatingDrop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 10050,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              border: '4px solid rgba(255,255,255,0.25)',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
            }}
          />
          <div style={{ marginTop: '14px', color: '#f1f5f9', fontWeight: 'bold' }}>Creating drop...</div>
          <div style={{ marginTop: '6px', color: '#94a3b8', fontSize: '12px' }}>Please wait</div>
        </div>
      )}

      {/* Profile Stats Display - Top Right */}
      <ProfileStats
        userProfile={userProfile}
        user={user}
        userMarkersCount={userMarkers.length}
        myMarkersCount={userMarkers.filter((m) => m.userId === user?.uid).length}
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
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      rep: newRep,
                      rank: newRank,
                      level: newLevel,
                    }
                  : null
              );

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
              const allColorIds = ALL_COLORS.map((c) => c.id);

              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedColors: allColorIds,
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      unlockedColors: allColorIds,
                    }
                  : null
              );

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
              const allGraffitiIds = GRAFFITI_STYLES.map((g) => g.id);

              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedGraffitiTypes: allGraffitiIds,
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      unlockedGraffitiTypes: allGraffitiIds,
                    }
                  : null
              );

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
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      unlockedTracks: result.newTracks,
                    }
                  : null
              );

              setUnlockedTracks(result.newTracks);

              setSongUnlockModal({
                isOpen: true,
                trackUrl: result.newlyUnlocked!.url,
                trackName: result.newlyUnlocked!.name,
                source: 'CHEAT MENU',
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
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      unlockedTracks: result.newTracks,
                    }
                  : null
              );

              setUnlockedTracks(result.newTracks);

              setSongUnlockModal({
                isOpen: true,
                trackUrl: result.newlyUnlocked!.url,
                trackName: result.newlyUnlocked!.name,
                source: 'CHEAT MENU',
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
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      unlockedTracks: defaultTracks,
                    }
                  : null
              );

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
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      rep: maxRep,
                      rank: newRank,
                      level: newLevel,
                    }
                  : null
              );

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
              const allColorIds = ALL_COLORS.map((c) => c.id);
              const allGraffitiIds = GRAFFITI_STYLES.map((g) => g.id);
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
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      rep: maxRep,
                      rank: newRank,
                      level: newLevel,
                      unlockedColors: allColorIds,
                      unlockedGraffitiTypes: allGraffitiIds,
                      unlockedTracks: allTracks,
                    }
                  : null
              );

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
          if (
            !window.confirm(
              'Reset ALL your markers, drops and stats permanently?\n\nThis will:\n• Delete all your markers\n• Delete all your drops\n• Reset REP to 0\n• Reset Rank to TOY\n• Sign you out immediately'
            )
          )
            return;
          if (!user || !userProfile) return;

          try {
            const userMarkersQuery = query(collection(db, 'markers'), where('userId', '==', user.uid));
            const userMarkersSnapshot = await getDocs(userMarkersQuery);
            await Promise.all(userMarkersSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

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
              kaiTiakiEvaluationsReceived: 0,
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
        onUnlockRandomVideo={() => {
          if (!user || !userProfile) return;
          const unlockVideoAsync = async () => {
            try {
              const currentVideos = userProfile.unlockedVideos || [];
              const availableVideos = FACEBOOK_VIDEOS.filter((v) => !currentVideos.includes(v));

              if (availableVideos.length === 0) {
                alert('⚠️ All videos already unlocked!');
                return;
              }

              const randomVideo = availableVideos[Math.floor(Math.random() * availableVideos.length)];
              const newVideos = [...currentVideos, randomVideo];

              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedVideos: newVideos,
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      unlockedVideos: newVideos,
                    }
                  : null
              );

              setVideoUnlockModal({
                isOpen: true,
                videoUrl: randomVideo,
                source: 'CHEAT MENU',
              });
            } catch (error) {
              console.error('Cheat unlock video error:', error);
              alert('Failed to unlock video');
            }
          };
          unlockVideoAsync();
        }}
        onUnlockAllVideos={() => {
          if (!user || !userProfile) return;
          const unlockAllVideosAsync = async () => {
            try {
              const allVideoUrls = [...FACEBOOK_VIDEOS];

              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                unlockedVideos: allVideoUrls,
                lastActive: Timestamp.now(),
              });

              setUserProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      unlockedVideos: allVideoUrls,
                    }
                  : null
              );

              alert('✅ All videos unlocked!');
            } catch (error) {
              console.error('Cheat unlock all videos error:', error);
              alert('Failed to unlock all videos');
            }
          };
          unlockAllVideosAsync();
        }}
      />

      {/* ========== DUAL CONTROL PANELS ========== */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          zIndex: 1200,
          maxHeight: '80vh',
          width: 'min(95vw, 420px)',
        }}
      >
        {showProfilePanel && userProfile && (
          <div
            style={{
              animation: 'slideInLeft 0.3s ease-out',
            }}
          >
            <BlackbookPanel
              userProfile={userProfile}
              userMarkers={userMarkers}
              drops={drops}
              topPlayers={topPlayers}
              onClose={() => togglePanel('none')}
              onProfileUpdate={(updatedProfile) => setUserProfile(updatedProfile)}
              onCenterMap={centerMap}
              onRefreshAll={handleRefreshAll}
              isRefreshing={isRefreshing}
              showTopPlayers={showTopPlayers}
              onToggleTopPlayers={() => setShowTopPlayers(!showTopPlayers)}
              showOnlyMyDrops={showOnlyMyDrops}
              onToggleFilter={() => setShowOnlyMyDrops(!showOnlyMyDrops)}
              onLogout={handleLogout}
              expandedRadius={expandedRadius}
              onOpenCrewChat={() => {
                togglePanel('crewchat');
              }}
              selectedColor={selectedMarkerColor}
              selectedSpecialType={selectedSpecialType}
              unlockedColors={userProfile.unlockedColors || []}
              onColorSelect={(colorId, colorHex, specialType) => {
                setSelectedMarkerColor(colorHex);
                setSelectedSpecialType(specialType || null);
                saveFavoriteColor(colorHex);
              }}
            />
          </div>
        )}

        {/* Photos Panel */}
        {showPhotosPanel && (
          <PhotosPanel
            user={user}
            userProfile={userProfile}
            drops={drops}
            gpsPosition={gpsPosition}
            mapRef={mapRef}
            panelStyle={panelStyle}
            togglePanel={togglePanel}
            handleProfilePicUpload={handleProfilePicUpload}
            setPendingDropPosition={setPendingDropPosition}
            setShowPhotoModal={setShowPhotoModal}
            setSelectedPhotoDrop={setSelectedPhotoDrop}
            handleRefreshAll={handleRefreshAll}
          />
        )}

        {/* Map Control Panel */}
        {showMapPanel && (
          <div
            style={{
              ...panelStyle,
              animation: 'slideInLeft 0.3s ease-out',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0, color: '#4dabf7', fontSize: '18px' }}>🗺️ MAP CONTROL</h3>
              <button
                onClick={() => togglePanel('none')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '4px',
                  borderRadius: '4px',
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
                    transition: 'all 0.2s ease',
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
                    transition: 'all 0.2s ease',
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
                    transition: 'all 0.2s ease',
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
                    opacity: isRefreshing ? 0.7 : 1,
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
                    transition: 'all 0.2s ease',
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
                    transition: 'all 0.2s ease',
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
            <div
              style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ⚙️ PERFORMANCE
              </div>

              {/* Crew Detection Toggle */}
              <div
                style={{
                  marginBottom: '15px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid #444',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <label
                    style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    👥 Crew Detection
                    <input
                      type="checkbox"
                      checked={crewDetectionEnabled}
                      onChange={(e) => setCrewDetectionEnabled(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </label>
                  <span
                    style={{
                      fontSize: '11px',
                      color: crewDetectionEnabled ? '#10b981' : '#ef4444',
                    }}
                  >
                    {crewDetectionEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {crewDetectionEnabled ? '✓ Scans crew members every 10s' : '✗ Disabled (faster, less CPU)'}
                </div>
              </div>

              {/* Marker Quality Selector */}
              <div
                style={{
                  marginBottom: '15px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid #444',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 'bold',
                    color: '#cbd5e1',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
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
                        background: markerQuality === quality ? 'rgba(77, 171, 247, 0.3)' : 'rgba(255,255,255,0.05)',
                        border: markerQuality === quality ? '1px solid #4dabf7' : '1px solid #555',
                        color: markerQuality === quality ? '#4dabf7' : '#cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                      }}
                    >
                      {quality === 'low' ? '⚡ Low' : quality === 'medium' ? '⭐ Med' : '🔥 Max'}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #444',
                  }}
                >
                  {markerQuality === 'low' && '⚡ 25 markers (fastest)'}
                  {markerQuality === 'medium' && '⭐ 50 markers (balanced)'}
                  {markerQuality === 'high' && '🔥 100+ markers (slower)'}
                </div>
              </div>

              {/* Performance Status */}
              <div
                style={{
                  padding: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#10b981',
                }}
              >
                <strong>💚 Performance Status</strong>
                <div style={{ marginTop: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                  {crewDetectionEnabled ? '✓' : '✗'} Crew detection {crewDetectionEnabled ? 'ON' : 'OFF'}
                  <br />
                  {markerQuality === 'low' ? '⚡' : markerQuality === 'medium' ? '⭐' : '🔥'}{' '}
                  {markerQuality.charAt(0).toUpperCase() + markerQuality.slice(1)} quality mode
                </div>
              </div>
            </div>

            {/* Status Info */}
            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#cbd5e1',
              }}
            >
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
                <span
                  style={{
                    color:
                      gpsStatus === 'tracking'
                        ? '#10b981'
                        : gpsStatus === 'acquiring'
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                >
                  {gpsStatus === 'tracking' ? 'Active' : gpsStatus === 'acquiring' ? 'Acquiring...' : gpsStatus === 'error' ? 'Error' : 'Initializing'}
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
        <div
          key={`music-panel-${userProfile?.unlockedTracks?.length || unlockedTracks.length}`}
          ref={(el) => {
            if (el && userProfile?.unlockedTracks) {
              console.log('🎵 Music Panel rendering with tracks:', userProfile.unlockedTracks);
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
            position: 'absolute',
            zIndex: showMusicPanel ? 1500 : 900,
            opacity: showMusicPanel ? 1 : 0,
            pointerEvents: showMusicPanel ? 'auto' : 'none',
            transition: 'opacity 0.3s ease, z-index 0s',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(138, 43, 226, 0.3)',
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#8a2be2',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🎵</span>
              MUSIC COLLECTION
            </h3>
            <button
              onClick={() => togglePanel('none')}
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
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Music Player Section */}
          <div
            style={{
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          ></div>

          {/* Unlocked Videos Section */}
          <div style={{ marginBottom: '15px' }}>
            <div
              style={{
                fontSize: '14px',
                color: '#ec4899',
                marginBottom: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🎬</span>
              VIDEO COLLECTION
              <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                ({userProfile?.unlockedVideos?.length || 0}/{FACEBOOK_VIDEOS.length})
              </span>
            </div>

            {(userProfile?.unlockedVideos?.length || 0) === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px dashed #444',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎬</div>
                <div style={{ color: '#aaa', fontSize: '12px' }}>No videos unlocked yet</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  Use cheat menu to unlock videos!
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(userProfile?.unlockedVideos || []).map((videoUrl, index) => {
                  const videoName = getVideoName(videoUrl);
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setVideoUnlockModal({
                          isOpen: true,
                          videoUrl: videoUrl,
                          source: 'COLLECTION',
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: 'rgba(236, 72, 153, 0.1)',
                        borderRadius: '6px',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '18px',
                          minWidth: '24px',
                          textAlign: 'center',
                        }}
                      >
                        🎬
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: '#ec4899',
                          }}
                        >
                          {videoName}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#1877f2',
                            marginTop: '2px',
                          }}
                        >
                          Facebook Video
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#ec4899',
                        }}
                      >
                        ▶️
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unlocked Tracks List */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '10px', fontWeight: 'bold' }}>
              🎵 Your Collection
            </div>

            {unlockedTracks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px dashed #444',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎵</div>
                <div style={{ color: '#aaa' }}>No tracks unlocked yet</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Place drops to unlock music!
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(Array.isArray(userProfile?.unlockedTracks) ? userProfile.unlockedTracks : (Array.isArray(unlockedTracks) ? unlockedTracks : [])).map(
                  (track, index) => {
                    const trackName = getTrackNameFromUrlHelper(track);
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
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '18px',
                            minWidth: '24px',
                            textAlign: 'center',
                          }}
                        >
                          🎵
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: isCurrentlyPlaying ? 'bold' : 'normal',
                              color: isCurrentlyPlaying ? '#8a2be2' : 'white',
                            }}
                          >
                            {trackName}
                            {isCurrentlyPlaying && (
                              <span
                                style={{
                                  marginLeft: '8px',
                                  fontSize: '11px',
                                  color: '#10b981',
                                  animation: 'pulse 1s infinite',
                                }}
                              >
                                ● NOW PLAYING
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: track.includes('soundcloud.com') ? '#ff6b6b' : '#1DB954',
                              marginTop: '2px',
                            }}
                          >
                            {track.includes('soundcloud.com') ? 'SoundCloud' : 'Spotify'}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#ff6b6b',
                          }}
                        >
                          🎧
                        </div>
                      </div>
                    );
                  }
                )}
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
          onClose={() => {
            togglePanel('none');
            setInitialChatTarget(null);
          }}
          userProfile={userProfile}
          gpsPosition={gpsPosition}
          initialChatTarget={initialChatTarget}
        />
      )}

      {/* Messenger Heads - Floating Chat Bubbles */}
      {!showMessagesPanel && messengerConversations.length > 0 && (
        <MessengerHeads
          conversations={messengerConversations}
          onSelectConversation={(chatId, participantId) => {
            setInitialChatTarget({
              uid: participantId,
              username: messengerConversations.find(c => c.chatId === chatId)?.participantName || 'Unknown',
              profilePicUrl: messengerConversations.find(c => c.chatId === chatId)?.participantProfilePic || ''
            });
            setShowMessagesPanel(true);
          }}
          onCloseConversation={(chatId) => {
            setMessengerConversations(prev => prev.filter(c => c.chatId !== chatId));
          }}
        />
      )}

      {/* Crew Chat Panel */}
      {showCrewChat && userProfile?.crewId && user && (
        <CrewChatPanel
          crewId={userProfile.crewId}
          onClose={() => {
            togglePanel('none');
            markCrewChatAsRead();
          }}
          userProfile={userProfile}
          markMessagesAsRead={markCrewChatAsRead}
          onStartDirectMessage={(targetUserId, targetUsername, targetProfilePic) => {
            setInitialChatTarget({
              uid: targetUserId,
              username: targetUsername,
              profilePicUrl: targetProfilePic
            });
            togglePanel('none');
            setShowCrewChat(false);
            setTimeout(() => {
              setShowMessagesPanel(true);
            }, 100);
          }}
        />
      )}

      {/* Story/Crew Bio Panel */}
      {showStoryPanel && (
        <CrewBioPanel
          userCrewId={userProfile?.crewId}
          onClose={() => togglePanel('none')}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation
        showMapPanel={showMapPanel}
        showProfilePanel={showProfilePanel}
        showPhotosPanel={showPhotosPanel}
        showCrewChat={showCrewChat}
        onToggleMapPanel={() => togglePanel('map')}
        onToggleProfilePanel={() => togglePanel('profile')}
        onTogglePhotosPanel={() => togglePanel('photos')}
        onToggleCrewChat={() => togglePanel('crewchat')}
        onCloseAllPanels={() => togglePanel('none')}
        hasUnreadMessages={hasUnreadMessages}
        unreadCount={unreadCount}
        crewId={userProfile?.crewId}
      />

      {/* Secondary Controls */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          zIndex: 1100,
        }}
      >
        {/* Story Button */}
        <button
          onClick={() => {
            togglePanel('story');
            markStoryContentAsViewed();
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
            position: 'relative',
          }}
        >
          {hasNewStoryContent && !showStoryPanel && (
            <div
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                backgroundColor: '#ef4444',
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
                boxShadow: '0 0 5px rgba(239, 68, 68, 0.7)',
              }}
            />
          )}
          <div
            style={{
              fontSize: '20px',
              transform: showStoryPanel ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            📖
          </div>
          Story
        </button>

        {/* Music - Toggles Music Panel */}
        <button
          onClick={() => togglePanel('music')}
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              transform: showMusicPanel ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            🎵
          </div>
          Music
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              fontSize: '20px',
            }}
          >
            📍
          </div>
          GPS
        </button>

        {/* Time/Weather */}
        <button
          onClick={() => {
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              fontSize: '20px',
            }}
          >
            {isNight ? '🌙' : '☀️'}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{timeString}</div>
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              fontSize: '20px',
            }}
          >
            {isOfflineMode ? '🔴' : '🟢'}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{isOfflineMode ? 'OFFLINE' : 'ONLINE'}</div>
        </button>
      </div>

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

      {/* Offline Joystick - Only show when in offline mode */}
      {isOfflineMode && (
        <OfflineJoystick
          onMove={(direction: 'up' | 'down' | 'left' | 'right') => {
            if (mapRef.current && lastKnownPosition) {
              const [lat, lng] = lastKnownPosition;
              const moveDistance = 0.001; // ~111 meters per 0.001 degrees
              
              let newLat = lat;
              let newLng = lng;
              
              switch (direction) {
                case 'up':
                  newLat += moveDistance;
                  break;
                case 'down':
                  newLat -= moveDistance;
                  break;
                case 'left':
                  newLng -= moveDistance;
                  break;
                case 'right':
                  newLng += moveDistance;
                  break;
              }
              
              // Ensure new position stays within NZ bounds
              const clampedLat = Math.max(NZ_BOUNDS[0][0], Math.min(NZ_BOUNDS[1][0], newLat));
              const clampedLng = Math.max(NZ_BOUNDS[0][1], Math.min(NZ_BOUNDS[1][1], newLng));
              
              setLastKnownPosition([clampedLat, clampedLng]);
              setMapCenter([clampedLat, clampedLng]);
              mapRef.current.setView([clampedLat, clampedLng], zoom);
            }
          }}
          onCenter={() => {
            if (mapRef.current && lastKnownPosition) {
              mapRef.current.setView(lastKnownPosition, zoom);
            }
          }}
        />
      )}

      {/* 🔮 FUTURISTIC GPS SCAN ANIMATION */}
      {isScanning && gpsPosition && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Grid Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                linear-gradient(rgba(0, 255, 200, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 200, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              animation: 'gridMove 2s linear infinite',
            }}
          />

          {/* Expanding Rings */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: `2px solid rgba(0, 255, 200, ${0.5 - i * 0.08})`,
                width: `${i * 80}px`,
                height: `${i * 80}px`,
                animation: `expandRing 2s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
                boxShadow: `0 0 20px rgba(0, 255, 200, 0.3), inset 0 0 20px rgba(0, 255, 200, 0.1)`,
              }}
            />
          ))}

          {/* Rotating Scanner */}
          <div
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              animation: 'rotateScanner 3s linear infinite',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '150px',
                height: '3px',
                background: 'linear-gradient(90deg, transparent, rgba(0, 255, 200, 0.8), rgba(0, 255, 200, 1))',
                transformOrigin: 'left center',
                boxShadow: '0 0 20px rgba(0, 255, 200, 0.8), 0 0 40px rgba(0, 255, 200, 0.4)',
              }}
            />
          </div>

          {/* Center Crosshair */}
          <div
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '60px',
                height: '2px',
                background: 'rgba(0, 255, 200, 0.6)',
                boxShadow: '0 0 10px rgba(0, 255, 200, 0.8)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '2px',
                height: '60px',
                background: 'rgba(0, 255, 200, 0.6)',
                boxShadow: '0 0 10px rgba(0, 255, 200, 0.8)',
              }}
            />
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: 'rgba(0, 255, 200, 0.9)',
                boxShadow: '0 0 20px rgba(0, 255, 200, 1), 0 0 40px rgba(0, 255, 200, 0.6)',
                animation: 'pulseGlow 0.5s ease-in-out infinite',
              }}
            />
          </div>

          {/* HUD Text */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'rgba(0, 255, 200, 0.9)',
              textShadow: '0 0 10px rgba(0, 255, 200, 0.8)',
              textAlign: 'center',
              animation: 'flicker 0.1s infinite',
            }}
          >
            <div style={{ fontSize: '12px', opacity: 0.7 }}>▶ SCANNING</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px' }}>
              {gpsPosition[0].toFixed(6)}, {gpsPosition[1].toFixed(6)}
            </div>
          </div>

          {/* Corner Brackets */}
          {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map((corner) => {
            const positions: Record<string, React.CSSProperties> = {
              topLeft: { top: '20%', left: '15%' },
              topRight: { top: '20%', right: '15%', transform: 'scaleX(-1)' },
              bottomLeft: { bottom: '20%', left: '15%', transform: 'scaleY(-1)' },
              bottomRight: { bottom: '20%', right: '15%', transform: 'scale(-1, -1)' },
            };
            return (
              <div
                key={corner}
                style={{
                  position: 'absolute',
                  ...positions[corner],
                  width: '40px',
                  height: '40px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '20px',
                    height: '3px',
                    background: 'rgba(0, 255, 200, 0.8)',
                    boxShadow: '0 0 10px rgba(0, 255, 200, 0.6)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '20px',
                    background: 'rgba(0, 255, 200, 0.8)',
                    boxShadow: '0 0 10px rgba(0, 255, 200, 0.6)',
                  }}
                />
              </div>
            );
          })}

          <style>{`
            @keyframes expandRing {
              0% {
                transform: scale(0.5);
                opacity: 1;
              }
              100% {
                transform: scale(2);
                opacity: 0;
              }
            }
            
            @keyframes rotateScanner {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            @keyframes gridMove {
              0% { transform: translate(0, 0); }
              100% { transform: translate(40px, 40px); }
            }
            
            @keyframes pulseGlow {
              0%, 100% { 
                transform: scale(1);
                box-shadow: 0 0 20px rgba(0, 255, 200, 1), 0 0 40px rgba(0, 255, 200, 0.6);
              }
              50% { 
                transform: scale(1.2);
                box-shadow: 0 0 30px rgba(0, 255, 200, 1), 0 0 60px rgba(0, 255, 200, 0.8);
              }
            }
            
            @keyframes flicker {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.95; }
            }
          `}</style>
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
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.8), 0 0 80px rgba(255, 255, 255, 0.6), 0 0 120px rgba(255, 255, 255, 0.4), inset 0 0 60px rgba(255, 255, 255, 0.7);
          }
          50% { 
            opacity: 0.9;
            box-shadow: 0 0 45px rgba(255, 255, 255, 0.9), 0 0 90px rgba(255, 255, 255, 0.7), 0 0 140px rgba(255, 255, 255, 0.5), inset 0 0 65px rgba(255, 255, 255, 0.8);
          }
        }
        
        /* Music marker pulse animation */
        @keyframes musicPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(147,51,234,0.8), 0 0 30px rgba(147,51,234,0.5); }
          50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(147,51,234,0.9), 0 0 40px rgba(147,51,234,0.6); }
        }
        
        /* Radio wave animations for music markers */
        @keyframes radioWave1 {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        @keyframes radioWave2 {
          0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0.8; }
          33% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        @keyframes radioWave3 {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.6; }
          66% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
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
      `}</style>

      {/* ========== UNIFIED MUSIC PLAYER ========== */}
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
  );
};

export default React.memo(() => {
  return (
    <EnhancedErrorBoundary
      onReset={() => {
        window.location.reload();
      }}
    >
      <HomeComponent />
    </EnhancedErrorBoundary>
  );
});