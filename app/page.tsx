'use client';

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
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

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import PhotoSelectionModal from '@/components/ui/PhotoSelectionModal';
import DropPopup from '@/components/map/DropPopup';
import { uploadImageToImgBB } from '@/lib/services/imgbb';
import { saveDropToFirestore, loadAllDrops } from '@/lib/firebase/drops';
import { Drop, NEW_ZEALAND_LOCATIONS } from '@/lib/utils/types';

const HIPHOP_TRACKS = [
  "https://soundcloud.com/90s-hiphopclassics/2pac-california-love",
  "https://soundcloud.com/biggie-smalls-official/big-poppa",
  "https://soundcloud.com/nas/nas-ny-state-of-mind",
  "https://soundcloud.com/wutangclan/wu-tang-clan-c-r-e-a-m",
  "https://soundcloud.com/jayz/official-jay-z-hard-knock-life",
  "https://soundcloud.com/dr-dre/still-dre-feat-snoop-dogg",
  "https://soundcloud.com/outkast/ms-jackson",
  "https://soundcloud.com/kendrick-lamar/kendrick-lamar-humble",
];

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

// Marker name options
const MARKER_NAMES = ['Pole', 'Sign', 'E.Box', 'Fence', 'Wall', 'Shutter', 'Sewer', 'Rooftop', 'Ground', 'Train', 'Bridge', 'Traffic Light', 'Truck', 'Van', 'Post Box', 'Speed Camera', 'ATM Machine', 'Bus Stop'] as const;
type MarkerName = typeof MARKER_NAMES[number];

// Marker description options
const MARKER_DESCRIPTIONS = ['Sticker/Slap', 'Stencil/Brand/Stamp', 'Tag', 'TAG', 'Etch/Scribe/Scratch', 'Throw-Up', 'Paste-Up/Poster', 'Piece/Bombing', 'Burner/Heater', 'Roller/Blockbuster', 'Extinguisher', 'Mural'] as const;
type MarkerDescription = typeof MARKER_DESCRIPTIONS[number];

// Avatar generator function
const generateAvatarUrl = (userId: string, username: string, gender?: string): string => {
  const seed = username || userId;
  const colors = ['4dabf7', '10b981', '8b5cf6', 'f59e0b', 'ec4899', 'f97316'];
  const selectedColor = colors[Math.floor(Math.random() * colors.length)];
  
  let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${selectedColor}`;
  
  if (gender === 'male' && Math.random() > 0.5) {
    url += '&facialHair=beard';
  }
  
  return url;
};

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
    case 'Tag':
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

// Custom hook for GPS tracking
const useGPSTracker = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<'initializing' | 'acquiring' | 'tracking' | 'error'>('initializing');
  const watchIdRef = useRef<number | null>(null);

  // Check GPS permission status
  const checkGPSPermission = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('GPS permission status:', permission.state);
        return permission.state;
      } catch (error) {
        console.log('Could not check GPS permission:', error);
        return 'unknown';
      }
    }
    return 'unknown';
  }, []);

  const getInitialLocation = useCallback(async () => {
    console.log('getInitialLocation called');
    console.log('navigator.geolocation available:', !!navigator.geolocation);
    console.log('protocol:', window.location.protocol);
    console.log('hostname:', window.location.hostname);

    // Check permission status first
    const permissionStatus = await checkGPSPermission();
    console.log('GPS permission status:', permissionStatus);

    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.';
      console.error(errorMsg);
      setError(errorMsg);
      setGpsStatus('error');
      setIsLoading(false);
      return;
    }

    if (window.location.protocol === 'http:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1') {
      const httpsError = 'GPS requires HTTPS. For local development, use http://localhost or http://127.0.0.1. For production, the site must be served over HTTPS.';
      console.error('HTTPS required for GPS:', httpsError);
      setError(httpsError);
      setGpsStatus('error');
      setIsLoading(false);
      return;
    }

    // Check if we already have a cached position
    if (position && accuracy) {
      console.log('Using cached GPS position');
      setGpsStatus('tracking');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors
    setGpsStatus('acquiring');

    // Show NZ-specific loading message
    setError('🗺️ Finding your location in Aotearoa... GPS acquiring satellites may take 30-60 seconds.');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('GPS position acquired:', pos.coords);
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
        setError(null); // Clear any errors on success
        setGpsStatus('tracking');
        setIsLoading(false);

        // Check if within NZ bounds
        const [lat, lng] = [pos.coords.latitude, pos.coords.longitude];
        const withinNZ = lat >= NZ_BOUNDS[0][0] && lat <= NZ_BOUNDS[1][0] &&
                        lng >= NZ_BOUNDS[0][1] && lng <= NZ_BOUNDS[1][1];

        if (!withinNZ) {
          setError('🏝️ Welcome to Blackout NZ! Your current location is outside New Zealand. Feel free to explore the map and plan your next NZ adventure! 🗺️');
        }
      },
      (err) => {
        console.error('GPS initial error:', err);

        // Handle empty error objects (most common case for permission denied)
        if (!err || (err.code === undefined && !err.message)) {
          console.warn('GPS initial request failed with empty error - likely permission denied or GPS disabled');
          const errorMessage = 'Location access blocked. Please enable location services in your browser settings and refresh the page.';
          setError(errorMessage);
          setGpsStatus('error');
          setIsLoading(false);
          return;
        }

        let errorMessage = 'Failed to get location';

        if (err.message) {
          errorMessage = err.message;
        } else if (err.code !== undefined) {
          switch(err.code) {
            case 1:
              errorMessage = 'Location permission denied. Please click "Allow" when your browser asks for location access.';
              break;
            case 2:
              errorMessage = 'Location information unavailable. Check your GPS signal or try moving outdoors.';
              break;
            case 3:
              errorMessage = 'Location request timed out. GPS signal may be weak.';
              break;
            default:
              errorMessage = `GPS error (code: ${err.code}). Please check your device settings.`;
          }
        } else {
          errorMessage = 'Could not access location. Please ensure location services are enabled.';
        }

        setError(errorMessage);
        setGpsStatus('error');
        setIsLoading(false);

        // For timeout errors, offer to retry
        if (err.code === 3) {
          setTimeout(() => {
            const retry = window.confirm(
              'GPS request timed out. This usually means:\n\n' +
              '• Weak GPS signal (try moving outdoors)\n' +
              '• GPS still acquiring satellites (wait 30-60 seconds)\n' +
              '• Device GPS is disabled\n\n' +
              'Would you like to try again?'
            );
            if (retry) {
              setError(null);
              setGpsStatus('initializing');
              getInitialLocation();
            }
          }, 1000);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased to 20 seconds for better GPS acquisition
        maximumAge: 10000  // Allow cached positions up to 10 seconds old
      }
    );
  }, [position, accuracy]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser. Please use a modern browser.');
      return;
    }

    if (window.location.protocol === 'http:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1') {
      setError('GPS requires HTTPS. Use localhost for development or deploy to production.');
      return;
    }

    // Check if already tracking
    if (isTracking && watchIdRef.current !== null) {
      console.log('GPS tracking already active');
      return;
    }

    setIsTracking(true);
    setError(null);
    setGpsStatus('acquiring');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
        
        const watchId = navigator.geolocation.watchPosition(
          (watchPos) => {
            console.log('GPS watch update:', watchPos.coords);
            setPosition([watchPos.coords.latitude, watchPos.coords.longitude]);
            setAccuracy(watchPos.coords.accuracy);
            setSpeed(watchPos.coords.speed || null);
            setHeading(watchPos.coords.heading || null);
            setError(null); // Clear any errors when position updates successfully
            setGpsStatus('tracking');
          },
          (err) => {
            console.error('GPS watch error:', err);

            // Handle empty error objects
            if (!err || (err.code === undefined && !err.message)) {
              console.warn('GPS watch failed with empty error object - likely permission denied or GPS unavailable');
              const errorMessage = 'Location access blocked or unavailable. Please check your browser permissions and GPS settings.';
              setError(errorMessage);
              setGpsStatus('error');
              stopTracking();
              return;
            }

            let errorMessage = 'GPS tracking failed';

            if (err.message) {
              errorMessage = err.message;
            } else if (err.code !== undefined) {
              switch(err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable. Check your GPS signal or try moving outdoors.';
                  break;
                case err.TIMEOUT:
                  errorMessage = 'Location request timed out. GPS signal may be weak or blocked.';
                  break;
                default:
                  errorMessage = `GPS error (code: ${err.code})`;
              }
            }

            // Only stop tracking for critical errors, not timeouts
            if (err.code === err.PERMISSION_DENIED) {
              setError(errorMessage);
              setGpsStatus('error');
              stopTracking();
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              setError(errorMessage);
              setGpsStatus('error');
              // Try to restart tracking after a delay for position unavailable
              setTimeout(() => {
                if (!gpsPosition) { // Only try restart if we don't have a position
                  console.log('Attempting to restart GPS tracking...');
                  stopTracking();
                  setTimeout(() => startTracking(), 2000);
                }
              }, 5000);
            } else if (err.code === err.TIMEOUT) {
              // For timeouts, just log and continue watching
              console.warn('GPS timeout, continuing to watch for position updates');
              setGpsStatus('acquiring');
            } else {
              // For other errors, set error status
              setError(errorMessage);
              setGpsStatus('error');
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 20000, // Increased to 20 seconds for better acquisition
            maximumAge: 10000  // Allow cached positions up to 10 seconds old
          }
        );
        
        watchIdRef.current = watchId;
      },
      (err) => {
        console.error('GPS initial error:', err);
        let errorMessage = 'Failed to get location';
        
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err && err.code) {
          switch(err.code) {
            case 1:
              errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
              break;
            case 2:
              errorMessage = 'Location information unavailable. Check your GPS signal or network connection.';
              break;
            case 3:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Unable to get your location. Please check your device settings.';
          }
        } else {
          errorMessage = 'Could not access location. Please ensure location services are enabled and try refreshing the page.';
        }

        setError(errorMessage);
        setIsTracking(false);

        // For timeout errors, offer to retry
        if (err && err.code === 3) {
          setTimeout(() => {
            const retry = window.confirm(
              'GPS tracking timed out. This usually means:\n\n' +
              '• Temporary loss of GPS signal\n' +
              '• Moving between areas with poor coverage\n' +
              '• Device entering power-saving mode\n\n' +
              'Would you like to restart GPS tracking?'
            );
            if (retry) {
              setError(null);
              startTracking();
            }
          }, 1000);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased to 20 seconds for better GPS acquisition
        maximumAge: 10000  // Allow cached positions up to 10 seconds old
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setSpeed(null);
    setHeading(null);
    setGpsStatus(position ? 'tracking' : 'error'); // Keep status if we have a position
  }, [position]);

  useEffect(() => {
    console.log('GPS useEffect triggered, calling getInitialLocation');
    getInitialLocation();

    setTimeout(() => {
      console.log('Starting GPS tracking after 1 second delay');
      startTracking();
    }, 1000);

    return () => {
      if (watchIdRef.current !== null) {
        console.log('Cleaning up GPS watch');
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [getInitialLocation, startTracking]);

  return {
    position,
    accuracy,
    speed,
    heading,
    error,
    isTracking,
    isLoading,
    gpsStatus,
    startTracking,
    stopTracking
  };
};

// Type for user-placed markers
interface UserMarker {
  id: string;
  position: [number, number];
  name: MarkerName;
  description: MarkerDescription;
  color: string;
  timestamp: Date;
  distanceFromCenter?: number;
  userId?: string;
  firestoreId?: string;
  username?: string;
  userProfilePic?: string;
  repEarned?: number;
  createdAt?: Date;
}

// User profile interface
interface UserProfile {
  uid: string;
  email: string;
  username: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  profilePicUrl: string;
  rep: number;
  level: number;
  rank: string;
  totalMarkers: number;
  favoriteColor?: string;
  createdAt: Date;
  lastActive: Date;
  isSolo?: boolean;      // Add this
  crewName?: string;    // Add this
  crewId?: string;      // Add this
  isLeader?: boolean;   // Add this
}

// Top Player interface
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

export default function Home() {
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState<number>(15);
  // New Zealand bounds and center
  const NZ_BOUNDS: [[number, number], [number, number]] = [
    [-47.5, 165.0], // Southwest corner (South Island)
    [-34.0, 179.0]  // Northeast corner (North Island)
  ];
  const NZ_CENTER: [number, number] = [-40.9006, 174.8860]; // Center of New Zealand
  const NZ_DEFAULT_ZOOM = 6; // Zoom level to show all of NZ
  const GPS_DEFAULT_ZOOM = 15; // Zoom level for GPS location

  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [show50mRadius, setShow50mRadius] = useState(true);
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);
  const [nextMarkerNumber, setNextMarkerNumber] = useState(1);
  const mapRef = useRef<any>(null);

  // Offline/Online mode states
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastKnownPosition, setLastKnownPosition] = useState<[number, number] | null>(null);
  const [joystickPosition, setJoystickPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickRef = useRef<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  
  // User profile states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileGender, setProfileGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileCrewChoice, setProfileCrewChoice] = useState<'crew' | 'solo'>('crew');
  const [profileCrewName, setProfileCrewName] = useState('');
  
  // Marker color states
  const [selectedMarkerColor, setSelectedMarkerColor] = useState('#10b981');
  
  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // REP Notification state
  const [repNotification, setRepNotification] = useState<{ show: boolean, amount: number, message: string } | null>(null);
  
  // Drop states
  const [drops, setDrops] = useState<Drop[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDropTypeModal, setShowDropTypeModal] = useState(false);
  const [pendingDropPosition, setPendingDropPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Crew states
  const [nearbyCrewMembers, setNearbyCrewMembers] = useState<Array<{ uid: string; username: string; distance: number }>>([]);
  const [expandedRadius, setExpandedRadius] = useState(50); // Base 50m, expands by 50m per crew member
  
  // Last marker date for streak bonus
  const [lastMarkerDate, setLastMarkerDate] = useState<string | null>(null);
  
  // Top players state
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [showTopPlayers, setShowTopPlayers] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  
  // Filter toggle
  const [showOnlyMyDrops, setShowOnlyMyDrops] = useState(false);
  
  // NEW: Panel control states
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showPhotosPanel, setShowPhotosPanel] = useState(false);
  const [showMessagesPanel, setShowMessagesPanel] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/blackout-classic.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(err => {
        console.error('Autoplay failed:', err);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // REP Notification effect
  useEffect(() => {
    if (repNotification) {
      const timer = setTimeout(() => {
        setRepNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [repNotification]);

  // Audio control functions
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    setIsPlaying(!isPlaying);
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

  // Function to load ALL markers from Firestore
  const loadAllMarkers = async () => {
    setLoadingMarkers(true);
    try {
      const q = query(
        collection(db, 'markers'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      const loadedMarkers: UserMarker[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
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
      
      console.log(`Loaded ${loadedMarkers.length} markers from all players`);
      
    } catch (error) {
      console.error('Error loading all markers:', error);
    } finally {
      setLoadingMarkers(false);
    }
  };

  // Function to load top players
  const loadTopPlayers = async () => {
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

  // Function to handle profile creation
  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profileUsername.trim()) {
      alert('Please enter a username');
      return;
    }
    
    setProfileLoading(true);
    
    try {
      const profilePicUrl = generateAvatarUrl(user.uid, profileUsername.trim(), profileGender);
      
      // Handle crew creation or solo choice
      let crewId: string | null = null;
      let crewName: string | null = null;
      const isSolo = profileCrewChoice === 'solo';
      
      if (!isSolo && profileCrewName.trim()) {
        // Create or join crew
        const crewNameLower = profileCrewName.trim().toLowerCase();
        const crewsRef = collection(db, 'crews');
        const crewQuery = query(crewsRef, where('nameLower', '==', crewNameLower));
        const crewSnapshot = await getDocs(crewQuery);
        
        if (crewSnapshot.empty) {
          // Create new crew
          const newCrewRef = doc(crewsRef);
          crewId = newCrewRef.id;
          await setDoc(newCrewRef, {
            name: profileCrewName.trim(),
            nameLower: crewNameLower,
            members: [user.uid],
            createdAt: Timestamp.now(),
            createdBy: user.uid
          });
          crewName = profileCrewName.trim();
        } else {
          // Join existing crew
          const crewDoc = crewSnapshot.docs[0];
          crewId = crewDoc.id;
          crewName = crewDoc.data().name;
          const currentMembers = crewDoc.data().members || [];
          if (!currentMembers.includes(user.uid)) {
            await updateDoc(doc(db, 'crews', crewId), {
              members: [...currentMembers, user.uid]
            });
          }
        }
      }
      
      const userProfileData = {
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
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now(),
        crewId: crewId,
        crewName: crewName,
        isSolo: isSolo
      };
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, userProfileData);
      
      setUserProfile({
        ...userProfileData,
        createdAt: new Date(),
        lastActive: new Date()
      } as UserProfile);
      
      setShowProfileSetup(false);
      setProfileUsername('');
      
      await loadTopPlayers();
      await loadAllMarkers(); // Load all markers after profile creation
      
    } catch (error: any) {
      console.error('Error creating profile:', error);
      alert(`Failed to create profile: ${error.message}`);
    } finally {
      setProfileLoading(false);
    }
  };

  // Function to load user profile
  const loadUserProfile = async (currentUser: any): Promise<boolean> => {
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
        
        setUserProfile({
          uid: data.uid,
          email: data.email,
          username: data.username,
          gender: data.gender || 'prefer-not-to-say',
          profilePicUrl: profilePicUrl,
          rep: data.rep || 0,
          level: data.level || 1,
          rank: data.rank || 'TOY',
          totalMarkers: data.totalMarkers || 0,
          favoriteColor: favoriteColor,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date(),
          crewId: data.crewId || null,
          crewName: data.crewName || null,
          isSolo: data.isSolo || false
        });
        setShowProfileSetup(false);
        return true;
      } else {
        setShowProfileSetup(true);
        setUserProfile(null);
        return false;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      return false;
    }
  };
  
  const {
    position: gpsPosition,
    accuracy,
    speed,
    heading,
    error: gpsError,
    isTracking,
    isLoading: gpsLoading,
    gpsStatus,
    startTracking,
    stopTracking
  } = useGPSTracker();

  // ========== AUTH FUNCTIONS ==========
  
  const handleLogin = async (e: React.FormEvent) => {
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

  const handleSignup = async (e: React.FormEvent) => {
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  // Function to save favorite color to user profile
  const saveFavoriteColor = async (color: string) => {
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

  // Initialize Leaflet icons only on client side
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

  // Load drops from Firestore
  const loadDrops = useCallback(async () => {
    try {
      const loadedDrops = await loadAllDrops();
      setDrops(loadedDrops);
      console.log(`Loaded ${loadedDrops.length} drops`);
    } catch (error) {
      console.error('Error loading drops:', error);
    }
  }, []);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      if (currentUser) {
        setLoadingUserProfile(true);
        try {
          const hasProfile = await loadUserProfile(currentUser);
          await loadTopPlayers();

          if (hasProfile) {
            await loadAllMarkers(); // Load ALL markers
            await loadDrops(); // Load ALL drops
          }
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
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Load drops on component mount (for all users)
  useEffect(() => {
    loadDrops();
  }, [loadDrops]);

  // Detect nearby crew members and calculate expanded radius
  useEffect(() => {
    if (!gpsPosition || !userProfile || !user || userProfile.isSolo || !userProfile.crewId) {
      setExpandedRadius(50);
      setNearbyCrewMembers([]);
      return;
    }

    const detectNearbyCrewMembers = async () => {
      try {
        // Get all members of the same crew
        const crewDoc = await getDoc(doc(db, 'crews', userProfile.crewId!));
        if (!crewDoc.exists()) {
          setExpandedRadius(50);
          setNearbyCrewMembers([]);
          return;
        }

        const crewData = crewDoc.data();
        const crewMemberIds = crewData.members || [];
        
        // Filter out current user
        const otherMemberIds = crewMemberIds.filter((uid: string) => uid !== user.uid);
        
        if (otherMemberIds.length === 0) {
          setExpandedRadius(50);
          setNearbyCrewMembers([]);
          return;
        }

        // Get positions of other crew members from topPlayers (they have position data)
        const nearbyMembers: Array<{ uid: string; username: string; distance: number }> = [];
        
        topPlayers.forEach((player) => {
          if (otherMemberIds.includes(player.uid) && player.position) {
            const distance = calculateDistance(
              gpsPosition[0],
              gpsPosition[1],
              player.position[0],
              player.position[1]
            );
            
            // If within 200m, consider them "nearby" for radius expansion
            if (distance <= 200) {
              nearbyMembers.push({
                uid: player.uid,
                username: player.username,
                distance: Math.round(distance)
              });
            }
          }
        });

        // Calculate expanded radius: base 50m + 50m per nearby crew member
        const newRadius = 50 + (nearbyMembers.length * 50);
        setExpandedRadius(newRadius);
        setNearbyCrewMembers(nearbyMembers);
      } catch (error) {
        console.error('Error detecting nearby crew members:', error);
        setExpandedRadius(50);
        setNearbyCrewMembers([]);
      }
    };

    detectNearbyCrewMembers();
    
    // Check every 5 seconds
    const interval = setInterval(detectNearbyCrewMembers, 5000);
    return () => clearInterval(interval);
  }, [gpsPosition, userProfile, user, topPlayers]);

  // Set initial map center to GPS position when available (within NZ bounds)
  useEffect(() => {
    if (gpsPosition && !mapCenter) {
      // Check if GPS position is within NZ bounds
      const [lat, lng] = gpsPosition;
      const withinNZ = lat >= NZ_BOUNDS[0][0] && lat <= NZ_BOUNDS[1][0] &&
                      lng >= NZ_BOUNDS[0][1] && lng <= NZ_BOUNDS[1][1];

      if (withinNZ) {
        setMapCenter(gpsPosition);
        setZoom(GPS_DEFAULT_ZOOM);
        console.log('Map centered on GPS location within NZ');
      } else {
        // GPS outside NZ - center on NZ and show message
        setMapCenter(NZ_CENTER);
        setZoom(NZ_DEFAULT_ZOOM);
        setError('🏝️ Kia ora! Blackout is NZ-only. Your location appears to be outside Aotearoa. The map has been centered on New Zealand for the best street art experience! 🗺️');
        console.log('GPS outside NZ bounds, centering on NZ');
      }
    }
  }, [gpsPosition, mapCenter]);

  // Center map when GPS position updates during tracking
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

  // Save a marker to Firestore
  const saveMarkerToFirestore = async (marker: UserMarker) => {
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
        createdAt: serverTimestamp(), // Use server timestamp
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

  // Handle photo upload and drop creation
  const handlePhotoSelected = useCallback(async (file: File) => {
    if (!user || !userProfile || !pendingDropPosition) {
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Upload photo to ImgBB
      const photoUrl = await uploadImageToImgBB(file);

      // Create drop
      const newDrop: Drop = {
        lat: pendingDropPosition.lat,
        lng: pendingDropPosition.lng,
        photoUrl,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
      };

      // Save to Firestore
      const dropId = await saveDropToFirestore(newDrop);
      
      if (dropId) {
        // Award REP for placing a photo drop (simpler fixed REP for now)
        const repEarned = 10;
        const newRep = (userProfile.rep || 0) + repEarned;
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
        } : prev);

        // Add to local state
        setDrops(prev => [{ ...newDrop, firestoreId: dropId, id: `drop-${dropId}` }, ...prev]);
        
        // Close modal and reset
        setShowPhotoModal(false);
        setPendingDropPosition(null);

        // Notify player
        alert(`Drop placed successfully! 📸\n\n+${repEarned} REP\nNew Rank: ${newRank}`);
      } else {
        throw new Error('Failed to save drop');
      }
    } catch (error) {
      console.error('Error creating drop:', error);
      alert(`Failed to create drop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [user, userProfile, pendingDropPosition]);

  // Handle marker-only drop placement
  const handleMarkerDrop = useCallback(async () => {
    if (!user || !userProfile || !pendingDropPosition) {
      return;
    }

    try {
      // Create marker drop (no photo)
      const newDrop: Drop = {
        lat: pendingDropPosition.lat,
        lng: pendingDropPosition.lng,
        createdBy: user.uid,
        timestamp: new Date(),
        likes: [],
        username: userProfile.username,
        userProfilePic: userProfile.profilePicUrl,
      };

      // Save to Firestore
      const dropId = await saveDropToFirestore(newDrop);

      if (dropId) {
        // Award REP for placing a marker drop
        const repEarned = 5; // Less REP than photo drops
        const newRep = (userProfile.rep || 0) + repEarned;
        const newRank = calculateRank(newRep);
        const newLevel = calculateLevel(newRep);

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          rep: newRep,
          level: newLevel,
          rank: newRank,
        });

        // Update local state
        setUserProfile(prev => prev ? { ...prev, rep: newRep, level: newLevel, rank: newRank } : null);

        // Show REP notification
        setRepNotification({ show: true, amount: repEarned, message: 'Marker placed!' });

        // Reload drops
        await loadDrops();
      }

      // Close modal and reset state
      setShowDropTypeModal(false);
      setPendingDropPosition(null);

    } catch (error) {
      console.error('Error creating marker drop:', error);
      alert(`Failed to create marker drop: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, userProfile, pendingDropPosition]);

  // Handle photo drop selection
  const handlePhotoDrop = useCallback(() => {
    setShowDropTypeModal(false);
    setShowPhotoModal(true);
  }, []);

  // Handle map click to add drop
  const handleMapClick = useCallback(async (e: any) => {
    if (isOfflineMode) {
      alert('Cannot place markers in offline mode. Switch to online mode to place drops.');
      return;
    }

    if (!user) {
      alert('Please sign in first!');
      return;
    }

    if (loadingUserProfile) {
      alert('Loading your profile—try again in a moment.');
      return;
    }

    if (showProfileSetup || !userProfile) {
      alert('Please complete your profile first!');
      return;
    }

    const { lat, lng } = e.latlng;

    // Store the clicked position and show drop type selection modal
    setPendingDropPosition({ lat, lng });
    setShowDropTypeModal(true);
  }, [user, userProfile, loadingUserProfile, showProfileSetup, isOfflineMode]);

  const toggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Function to manually center on GPS position
  const centerOnGPS = useCallback(() => {
    if (gpsPosition && mapRef.current) {
      setMapCenter(gpsPosition);
      setZoom(17); // Higher zoom for better location visibility
      mapRef.current.setView(gpsPosition, 17);
    } else {
      alert('GPS location not available. Please enable location services.');
    }
  }, [gpsPosition]);

  // Function to update a marker's info
  const updateMarker = (id: string, updates: Partial<UserMarker>) => {
    setUserMarkers(prev => 
      prev.map(marker => 
        marker.id === id ? { ...marker, ...updates } : marker
      )
    );
  };

  // Function to delete a marker
  const deleteMarker = async (id: string) => {
    const markerToDelete = userMarkers.find(marker => marker.id === id);
    
    if (markerToDelete?.firestoreId) {
      try {
        await deleteDoc(doc(db, 'markers', markerToDelete.firestoreId));
        
        // Update user stats if it's their marker
        if (markerToDelete.userId === user?.uid && userProfile) {
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

  // Function to delete all markers
  const deleteAllMarkers = async () => {
    if (userMarkers.length > 0 && window.confirm(`Are you sure you want to delete all ${userMarkers.length} markers?`)) {
      // Delete only user's markers from Firestore
      const userMarkerIds = userMarkers
        .filter(marker => marker.userId === user?.uid && marker.firestoreId)
        .map(marker => marker.firestoreId);
      
      const deletePromises = userMarkerIds.map(id => 
        id ? deleteDoc(doc(db, 'markers', id)) : Promise.resolve()
      );
      
      await Promise.all(deletePromises);
      
      // Update user stats
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
      
      // Clear all markers from view (including others')
      setUserMarkers([]);
      setNextMarkerNumber(1);
    }
  };

  // Function to go to a marker
  const goToMarker = (marker: UserMarker) => {
    centerMap(marker.position, 18);
  };

  // New Zealand locations for the game
  const newZealandLocations = NEW_ZEALAND_LOCATIONS;

  // Default fallback center (East Auckland)
 const defaultCenter: [number, number] | null = null;

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
        {/* Animated background elements */}
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
        
        {/* Audio Player */}
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
                🎵 Blackout - Classic
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                #Classic at Western Heights Rotovegas
              </div>
              <div style={{ fontSize: '11px', color: isPlaying ? '#10b981' : '#94a3b8', marginTop: '4px' }}>
                {isPlaying ? '● Now Playing' : 'Paused'}
              </div>
            </div>
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
        </div>

        {/* Main login card */}
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

          {/* Login Form */}
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
                  <div>Ver. 1.0 Alpha | See all writers' drops live!</div>
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
          
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid #4dabf7;
            transition: all 0.2s ease;
          }
          
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            boxShadow: 0 6px 15px rgba(0,0,0,0.4);
          }
          
          input[type="range"]::-moz-range-thumb {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 2px solid #4dabf7;
            boxShadow: 0 4px 10px rgba(0,0,0,0.3);
          }
          
          ::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
          
          ::selection {
            background-color: rgba(59, 130, 246, 0.5);
            color: white;
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
        backgroundColor: '#f0f0f0',
        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Create Your Profile</h2>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '30px' }}>
            Join the crew and see everyone's drops
          </p>
          
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

            {/* Crew Selection */}
            <div style={{ marginBottom: '25px' }}>
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '10px', textAlign: 'left' }}>
                Choose Your Path:
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <label 
                  style={{ 
                    flex: 1,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: profileCrewChoice === 'crew' ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '8px',
                    border: `2px solid ${profileCrewChoice === 'crew' ? '#4dabf7' : '#e5e7eb'}`
                  }}
                >
                  <input
                    type="radio"
                    name="crewChoice"
                    value="crew"
                    checked={profileCrewChoice === 'crew'}
                    onChange={() => setProfileCrewChoice('crew')}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>
                    👥 Join/Create Crew
                  </span>
                </label>
                <label 
                  style={{ 
                    flex: 1,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: profileCrewChoice === 'solo' ? '#e0f2fe' : '#f9fafb',
                    borderRadius: '8px',
                    border: `2px solid ${profileCrewChoice === 'solo' ? '#4dabf7' : '#e5e7eb'}`
                  }}
                >
                  <input
                    type="radio"
                    name="crewChoice"
                    value="solo"
                    checked={profileCrewChoice === 'solo'}
                    onChange={() => setProfileCrewChoice('solo')}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>
                    🎯 Go Solo
                  </span>
                </label>
              </div>
              
              {profileCrewChoice === 'crew' && (
                <div>
                  <input
                    type="text"
                    placeholder="Enter crew name (or join existing)"
                    value={profileCrewName}
                    onChange={(e) => setProfileCrewName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    maxLength={30}
                  />
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px', textAlign: 'left' }}>
                    💡 Tip: If crew exists, you'll join it. Otherwise, a new crew is created.
                  </div>
                </div>
              )}
              
              {profileCrewChoice === 'solo' && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  padding: '10px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  textAlign: 'left'
                }}>
                  🎯 Solo players can join a crew later from their profile.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={profileLoading || (profileCrewChoice === 'crew' && !profileCrewName.trim())}
              style={{
                backgroundColor: '#4dabf7',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (profileLoading || (profileCrewChoice === 'crew' && !profileCrewName.trim())) ? 'not-allowed' : 'pointer',
                width: '100%',
                opacity: (profileLoading || (profileCrewChoice === 'crew' && !profileCrewName.trim())) ? 0.7 : 1
              }}
            >
              {profileLoading ? 'Creating Profile...' : profileCrewChoice === 'crew' ? 'Join the Crew! 👥' : 'Go Solo! 🎯'}
            </button>
            
            <div style={{ 
              marginTop: '20px', 
              fontSize: '12px', 
              color: '#6b7280',
              textAlign: 'left',
              backgroundColor: '#f0f9ff',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <strong>👁️ You'll see ALL drops</strong>
              <div style={{ marginTop: '5px' }}>
                Every writer's tags will appear on your map in real-time!
              </div>
            </div>
          </form>
        </div>
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

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
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
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
          // Set initial bounds to prevent panning outside NZ
          mapInstance.setMaxBounds(NZ_BOUNDS);
        }}
        eventHandlers={{
          click: isOfflineMode ? undefined : handleMapClick // Disable map clicks in offline mode
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
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
                  color: isOfflineMode ? '#ef4444' : '#10b981', // Green for online, red for offline
                  fillColor: isOfflineMode ? '#ef4444' : '#10b981',
                  fillOpacity: 0.1,
                  weight: 2,
                  opacity: 0.7
                }}
                eventHandlers={{
                  click: isOfflineMode ? undefined : (e) => handleMapClick(e) // Disable in offline mode
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
                        📍 Using last known location
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
                        border: `3px solid ${index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706'}`,
                        objectFit: 'cover'
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
        {userMarkers
          .filter(marker => !showOnlyMyDrops || marker.userId === user?.uid)
          .map((marker) => {
            const customIcon = typeof window !== 'undefined' ? 
              new (require('leaflet').DivIcon)({
                html: `
                  <div style="
                    width: 24px;
                    height: 24px;
                    background-color: ${marker.color};
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 10px;
                    position: relative;
                  ">
                    ${marker.username?.charAt(0).toUpperCase() || 'U'}
                    ${marker.userId === user?.uid ? `
                      <div style="
                        position: absolute;
                        top: -3px;
                        right: -3px;
                        width: 8px;
                        height: 8px;
                        background-color: #4dabf7;
                        border-radius: 50%;
                        border: 1px solid white;
                      "></div>
                    ` : ''}
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12]
              }) : undefined;

            return (
              <Marker 
                key={marker.id}
                position={marker.position}
                icon={customIcon}
              >
                <Popup>
                  <div style={{ textAlign: 'center', minWidth: '300px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: marker.color,
                        border: '2px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}></div>
                      <strong style={{ color: marker.color }}>📍 {marker.name}</strong>
                      {marker.userId === user?.uid && (
                        <span style={{
                          fontSize: '10px',
                          background: '#4dabf7',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          marginLeft: 'auto'
                        }}>
                          YOURS
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      <div>By: <strong>{marker.username || 'Anonymous'}</strong></div>
                      <div>Lat: {marker.position[0].toFixed(6)}</div>
                      <div>Lng: {marker.position[1].toFixed(6)}</div>
                      <div style={{ fontWeight: 'bold', marginTop: '5px', color: '#4dabf7' }}>
                        Type: {marker.description}
                      </div>
                      <div style={{ marginTop: '5px', fontSize: '11px', color: marker.color }}>
                        Marker Color: {marker.color}
                      </div>
                      
                      {marker.repEarned && (
                        <div style={{ 
                          color: '#10b981',
                          marginTop: '5px',
                          fontWeight: 'bold'
                        }}>
                          🎉 +{marker.repEarned} REP Earned
                        </div>
                      )}
                      
                      {marker.distanceFromCenter && gpsPosition && (
                        <div style={{ 
                          color: marker.distanceFromCenter <= expandedRadius ? '#10b981' : '#f59e0b',
                          marginTop: '5px'
                        }}>
                          Distance from you: {Math.round(marker.distanceFromCenter)}m
                          {marker.distanceFromCenter <= expandedRadius && ` (within ${expandedRadius}m radius ✓)`}
                        </div>
                      )}
                      
                      {marker.createdAt && (
                        <div style={{ marginTop: '5px', fontSize: '10px', color: '#999' }}>
                          Tagged: {marker.createdAt.toLocaleDateString()} {marker.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      
                      {marker.userId === user?.uid && (
                        <div style={{ marginTop: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
                          <div style={{ fontSize: '11px', marginBottom: '5px', color: '#666' }}>
                            Select Marker Type:
                          </div>
                          <select
                            value={marker.name}
                            onChange={(e) => updateMarker(marker.id, { name: e.target.value as MarkerName })}
                            style={{
                              width: '100%',
                              padding: '6px',
                              marginBottom: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: 'white'
                            }}
                          >
                            {MARKER_NAMES.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          
                          <div style={{ fontSize: '11px', marginBottom: '5px', color: '#666' }}>
                            Select Description:
                          </div>
                          <select
                            value={marker.description}
                            onChange={(e) => updateMarker(marker.id, { description: e.target.value as MarkerDescription })}
                            style={{
                              width: '100%',
                              padding: '6px',
                              marginBottom: '10px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              backgroundColor: 'white'
                            }}
                          >
                            {MARKER_DESCRIPTIONS.map((desc) => (
                              <option key={desc} value={desc}>
                                {desc}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button
                          onClick={() => goToMarker(marker)}
                          style={{
                            backgroundColor: '#4dabf7',
                            color: 'white',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            flex: 1
                          }}
                        >
                          Go Here
                        </button>
                        {marker.userId === user?.uid && (
                          <button
                            onClick={() => deleteMarker(marker.id)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              flex: 1
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: '#999', marginTop: '8px' }}>
                        Created: {marker.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        }

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
              <DropPopup
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
            </Marker>
          );
        })}

        {/* Marker drops (no photos) */}
        {drops.filter(drop => !drop.photoUrl).map((drop) => {
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
                  justify-content: center;
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
                      justify-content: center;
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
              <DropPopup
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
                  <div>Place Marker</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, fontWeight: 'normal' }}>
                    Quick marker drop (+5 REP)
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
                    Upload a photo (+10 REP)
                  </div>
                </div>
              </button>
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
        isOpen={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setPendingDropPosition(null);
        }}
        onPhotoSelected={handlePhotoSelected}
        isUploading={isUploadingPhoto}
      />

      {/* Offline/Online Mode Toggle */}
      <button
        onClick={() => {
          if (!isOfflineMode) {
            // Switching to offline mode - save current position
            if (gpsPosition) {
              setLastKnownPosition(gpsPosition);
              console.log('Switching to offline mode, saved position:', gpsPosition);
              alert('Switched to offline mode! Use the joystick at bottom-right to explore.');
            } else {
              alert('No GPS position available. Please get GPS location first before going offline.');
              return;
            }
            setIsOfflineMode(true);
            stopTracking(); // Stop GPS tracking
          } else {
            // Switching to online mode - resume GPS
            setIsOfflineMode(false);
            setJoystickPosition({ x: 0, y: 0 }); // Reset joystick
            if (!isTracking) {
              startTracking(); // Resume GPS tracking
            }
            console.log('Switching to online mode');
          }
        }}
        style={{
          position: 'absolute',
          top: 25,
          left: 50,
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
        {isOfflineMode ? 'OFFLINE' : 'ONLINE'}
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
          backdropFilter: 'blur(4px)'
        }}>
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
                border: '2px solid #ff6b6b',
                objectFit: 'cover'
              }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{userProfile.username}</div>
              <div style={{ color: '#ff6b6b', fontSize: '12px' }}>{userProfile.rank} • Lv {userProfile.level}</div>
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
        </div>
      )}

      {/* Joystick for Offline Mode */}
      {isOfflineMode && (
        <div
          ref={joystickRef}
          style={{
            position: 'absolute',
            bottom: 120,
            right: 20,
            width: 100,
            height: 100,
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: '50%',
            border: '2px solid #ef4444',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const rect = joystickRef.current?.getBoundingClientRect();
            if (!rect) return;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - centerX;
              const deltaY = moveEvent.clientY - centerY;
              const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
              const maxDistance = 35; // Maximum joystick movement

              if (distance > maxDistance) {
                const angle = Math.atan2(deltaY, deltaX);
                setJoystickPosition({
                  x: Math.cos(angle) * maxDistance,
                  y: Math.sin(angle) * maxDistance
                });
              } else {
                setJoystickPosition({ x: deltaX, y: deltaY });
              }

              // Move map based on joystick position
              if (lastKnownPosition && mapRef.current) {
                const moveSpeed = 0.00001; // Adjust movement speed
                const newLat = lastKnownPosition[0] + (joystickPosition.y * moveSpeed);
                const newLng = lastKnownPosition[1] + (joystickPosition.x * moveSpeed);

                // Keep within NZ bounds
                const clampedLat = Math.max(NZ_BOUNDS[0][0], Math.min(NZ_BOUNDS[1][0], newLat));
                const clampedLng = Math.max(NZ_BOUNDS[0][1], Math.min(NZ_BOUNDS[1][1], newLng));

                setLastKnownPosition([clampedLat, clampedLng]);
                mapRef.current.setView([clampedLat, clampedLng], mapRef.current.getZoom());
              }
            };

            const handleMouseUp = () => {
              setJoystickPosition({ x: 0, y: 0 });
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joystickRef.current?.getBoundingClientRect();
            if (!rect) return;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const handleTouchMove = (moveEvent: TouchEvent) => {
              moveEvent.preventDefault();
              const moveTouch = moveEvent.touches[0];
              const deltaX = moveTouch.clientX - centerX;
              const deltaY = moveTouch.clientY - centerY;
              const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
              const maxDistance = 35;

              if (distance > maxDistance) {
                const angle = Math.atan2(deltaY, deltaX);
                setJoystickPosition({
                  x: Math.cos(angle) * maxDistance,
                  y: Math.sin(angle) * maxDistance
                });
              } else {
                setJoystickPosition({ x: deltaX, y: deltaY });
              }

              // Move map based on joystick position
              if (lastKnownPosition && mapRef.current) {
                const moveSpeed = 0.001; // Increased movement speed for better responsiveness
                const newLat = lastKnownPosition[0] + (joystickPosition.y * moveSpeed);
                const newLng = lastKnownPosition[1] + (joystickPosition.x * moveSpeed);

                const clampedLat = Math.max(NZ_BOUNDS[0][0], Math.min(NZ_BOUNDS[1][0], newLat));
                const clampedLng = Math.max(NZ_BOUNDS[0][1], Math.min(NZ_BOUNDS[1][1], newLng));

                console.log('Touch joystick move:', { x: joystickPosition.x, y: joystickPosition.y, newLat, newLng, clampedLat, clampedLng });
                setLastKnownPosition([clampedLat, clampedLng]);
                mapRef.current.setView([clampedLat, clampedLng], mapRef.current.getZoom());
              }
            };

            const handleTouchEnd = () => {
              setJoystickPosition({ x: 0, y: 0 });
              document.removeEventListener('touchmove', handleTouchMove);
              document.removeEventListener('touchend', handleTouchEnd);
            };

            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
          }}
        >
          {/* Joystick Handle */}
          <div
            style={{
              width: 30,
              height: 30,
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
              transition: 'none',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          />
          {/* Joystick Base */}
          <div style={{
            width: 20,
            height: 20,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '50%',
            position: 'absolute'
          }} />
        </div>
      )}

      {/* ========== DUAL CONTROL PANELS ========== */}
      <div style={{
        position: 'absolute',
        top: 70,
        left: 70,
        display: 'flex',
        gap: '15px',
        zIndex: 1000,
        maxHeight: '80vh'
      }}>
        {/* Left Panel - Profile & Stats (Blackbook) */}
        {showProfilePanel && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#e0e0e0',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            width: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInLeft 0.3s ease-out'
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
                          // Create new crew
                          const newCrewRef = doc(crewsRef);
                          crewId = newCrewRef.id;
                          await setDoc(newCrewRef, {
                            name: crewName,
                            nameLower: crewNameLower,
                            members: [user.uid],
                            createdAt: Timestamp.now(),
                            createdBy: user.uid
                          });
                          finalCrewName = crewName;
                        } else {
                          // Join existing crew
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
                        
                        // Update user profile
                        const userRef = doc(db, 'users', user.uid);
                        await updateDoc(userRef, {
                          crewId: crewId,
                          crewName: finalCrewName,
                          isSolo: false
                        });
                        
                        setUserProfile(prev => prev ? {
                          ...prev,
                          crewId: crewId,
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

              {userProfile?.crewName && !userProfile?.isSolo && (
                <button
                  onClick={async () => {
                    if (!user || !userProfile?.crewId) return;
                    if (!confirm(`Leave ${userProfile.crewName}?`)) return;
                    
                    try {
                      // Remove from crew
                      const crewDoc = await getDoc(doc(db, 'crews', userProfile.crewId));
                      if (crewDoc.exists()) {
                        const currentMembers = crewDoc.data().members || [];
                        const updatedMembers = currentMembers.filter((uid: string) => uid !== user.uid);
                        await updateDoc(doc(db, 'crews', userProfile.crewId), {
                          members: updatedMembers
                        });
                      }
                      
                      // Update user profile
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
                    width: '100%',
                    padding: '8px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
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
              {/* Refresh All Markers Button */}
              <button
                onClick={loadAllMarkers}
                style={{
                  background: '#4dabf7',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '5px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🔄 Refresh All Drops
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

              {/* Color Picker */}
              <div>
                <div style={{ fontSize: '14px', color: '#ff6b6b', marginBottom: '8px' }}>
                  Marker Color
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {MARKER_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => {
                        setSelectedMarkerColor(color.value);
                        saveFavoriteColor(color.value);
                      }}
                      style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        backgroundColor: color.value,
                        border: selectedMarkerColor === color.value ? '3px solid #ff6b6b' : '1px solid #444',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

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

              <button
                onClick={async () => {
                  if (!window.confirm('Delete ALL your markers permanently?')) return;
                  try {
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
                      level: 1
                    });
                    
                    setUserProfile(prev => prev ? {
                      ...prev,
                      totalMarkers: 0,
                      rep: 0,
                      rank: 'TOY',
                      level: 1
                    } : null);
                    
                    await loadAllMarkers();
                    alert('All your markers deleted and stats reset!');
                  } catch (err) {
                    console.error(err);
                    alert('Delete failed');
                  }
                }}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Reset My Profile
              </button>
            </div>
          </div>
        )}

        {/* Right Panel - Photos & Gallery (Camera) */}
        {showPhotosPanel && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#e0e0e0',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            width: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out'
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
                    fontSize: '12px'
                  }}
                >
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

        {/* Messages Panel */}
        {showMessagesPanel && (
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#e0e0e0',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            width: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <h3 style={{
                margin: 0,
                color: '#10b981',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📱</span>
                MESSAGES
              </h3>
              <button
                onClick={() => setShowMessagesPanel(false)}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
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

            {/* Crew Members Section */}
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
                <span>👥 Crew Members</span>
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  {nearbyCrewMembers.length}/{nearbyCrewMembers.length}
                </span>
              </div>

              {nearbyCrewMembers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {nearbyCrewMembers.map((member) => (
                    <div
                      key={member.uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px'
                        }}>
                          👤
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {member.username}
                          </div>
                          <div style={{ fontSize: '11px', color: '#aaa' }}>
                            {member.distance}m away
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Message ${member.username} (coming soon!)`)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid #10b981',
                          color: '#10b981',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        💬
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px dashed #444'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>👥</div>
                  <div style={{ color: '#aaa', marginBottom: '15px' }}>
                    No crew members nearby
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Get within 200m of other writers to see them here
                  </div>
                </div>
              )}
            </div>


            {/* Recent Messages */}
            <div>
              <div style={{
                fontSize: '16px',
                color: '#f59e0b',
                fontWeight: 'bold',
                marginBottom: '12px'
              }}>
                💬 Recent Messages
              </div>

              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
                <div style={{ color: '#aaa' }}>
                  No messages yet
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Start chatting with crew members!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Control Panel */}
      {showMapPanel && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '70px',
          backgroundColor: 'rgba(0,0,0,0.85)',
          color: '#e0e0e0',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 1200,
          width: '320px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '12px'
          }}>
            <h3 style={{ margin: 0, color: '#4dabf7', fontSize: '18px' }}>🗺️ Map Controls</h3>
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
                onClick={() => {
                  // Refresh all markers/drops
                  loadMarkers();
                  loadTopPlayers();
                  console.log('Refreshing all drops and players...');
                }}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  width: '100%',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Refresh Drops
              </button>
              <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                Reload all markers & players
              </span>
            </div>

            {/* Center on GPS */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  if (gpsPosition) {
                    centerMap(gpsPosition, 17);
                  } else {
                    alert('GPS location not available');
                  }
                }}
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
                  // This would show all drops - maybe zoom out to show all
                  if (userMarkers.length > 0) {
                    // Calculate bounds of all markers and fit map to them
                    const bounds = userMarkers.reduce((bounds, marker) => {
                      return bounds.extend([marker.position.lat, marker.position.lng]);
                    }, mapRef.current.getBounds());
                    mapRef.current.fitBounds(bounds, { padding: [20, 20] });
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
                 gpsStatus === 'acquiring' ? 'Acquiring...' : 'Error'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========== END DUAL CONTROL PANELS ========== */}

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68px',
        background: 'rgba(15, 23, 42, 0.94)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)'
      }}>

        {/* Map - Toggle Map Control Panel */}
        <button
          onClick={() => {
            setShowMapPanel(!showMapPanel);
            // Close other panels when opening map panel
            if (!showMapPanel) {
              setShowProfilePanel(false);
              setShowPhotosPanel(false);
              setShowMessagesPanel(false);
            }
          }}
          style={{
            background: showMapPanel ? 'rgba(77, 171, 247, 0.2)' : 'none',
            border: showMapPanel ? '1px solid rgba(77, 171, 247, 0.3)' : 'none',
            color: showMapPanel ? '#4dabf7' : '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            gap: '3px',
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            fontSize: '24px',
            transform: showMapPanel ? 'scale(1.1)' : 'scale(1)'
          }}>
            🗺️
          </div>
          Map
        </button>

        {/* Blackbook - Toggles Profile Panel */}
        <button
          onClick={() => {
            setShowProfilePanel(!showProfilePanel);
            // Close other panels when opening profile panel
            if (!showProfilePanel) {
              setShowPhotosPanel(false);
              setShowMessagesPanel(false);
            }
          }}
          style={{
            background: showProfilePanel ? 'rgba(255, 107, 107, 0.2)' : 'none',
            border: showProfilePanel ? '1px solid rgba(255, 107, 107, 0.3)' : 'none',
            color: showProfilePanel ? '#ff6b6b' : '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            gap: '3px',
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            fontSize: '24px',
            transform: showProfilePanel ? 'scale(1.1)' : 'scale(1)'
          }}>
            📓
          </div>
          Blackbook
        </button>

        {/* Camera - Toggles Photos Panel */}
        <button
          onClick={() => {
            setShowPhotosPanel(!showPhotosPanel);
            // Close other panels when opening photos panel
            if (!showPhotosPanel) {
              setShowProfilePanel(false);
              setShowMessagesPanel(false);
            }
          }}
          style={{
            background: showPhotosPanel ? 'rgba(77, 171, 247, 0.2)' : 'none',
            border: showPhotosPanel ? '1px solid rgba(77, 171, 247, 0.3)' : 'none',
            color: showPhotosPanel ? '#4dabf7' : '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            gap: '3px',
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            fontSize: '24px',
            transform: showPhotosPanel ? 'scale(1.1)' : 'scale(1)'
          }}>
            📸
          </div>
          Camera
        </button>

        {/* Messages - Crew & Friends */}
        <button
          onClick={() => {
            setShowMessagesPanel(!showMessagesPanel);
            // Close other panels when opening messages
            if (!showMessagesPanel) {
              setShowProfilePanel(false);
              setShowPhotosPanel(false);
            }
          }}
          style={{
            background: showMessagesPanel ? 'rgba(16, 185, 129, 0.2)' : 'none',
            border: showMessagesPanel ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
            color: showMessagesPanel ? '#10b981' : '#cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: '11px',
            gap: '3px',
            padding: '6px 12px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{
            fontSize: '24px',
            transform: showMessagesPanel ? 'scale(1.1)' : 'scale(1)'
          }}>
            📱
          </div>
          Messages
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
          {isOfflineMode ? '🎮 Offline Mode - Explore with joystick' : '🗺️ Blackout NZ - Street art across Aotearoa'}
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
      `}</style>
    </div>
  );
}