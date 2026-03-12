import { useCallback } from 'react';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import type { Dispatch, SetStateAction } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { calculateDistance } from '@/lib/utils/dropHelpers';
import { RepNotificationPayload } from '@/lib/utils/dropRewards';
import { UserProfile, UserMarker } from '@/lib/types/blackout';
import type * as L from 'leaflet';

interface UseMapActionsParams {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  userMarkers: UserMarker[];
  isCreatingDrop: boolean;
  isOfflineMode: boolean;
  loadingUserProfile: boolean;
  showProfileSetup: boolean;
  gpsPosition: [number, number] | null;
  expandedRadius: number;
  mapRef: React.MutableRefObject<L.Map | null>;
  musicScan: ((position: [number, number], radius: number) => any[] | null) | null;

  setUserMarkers: Dispatch<SetStateAction<UserMarker[]>>;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>;
  setNextMarkerNumber: Dispatch<SetStateAction<number>>;
  setMapCenter: Dispatch<SetStateAction<[number, number] | null>>;
  setZoom: Dispatch<SetStateAction<number>>;
  setIsScanning: Dispatch<SetStateAction<boolean>>;
  setIsRefreshing: Dispatch<SetStateAction<boolean>>;
  setPendingDropPosition: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>;
  setShowDropTypeModal: Dispatch<SetStateAction<boolean>>;
  setRepNotification: Dispatch<SetStateAction<RepNotificationPayload | null>>;

  loadAllMarkers: () => Promise<void>;
  loadTopPlayers: () => Promise<void>;
  loadDrops: () => Promise<void>;
}

export const useMapActions = ({
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
}: UseMapActionsParams) => {

  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    if (isOfflineMode) {
      alert('Cannot place markers in offline mode. Switch to online mode to place drops.');
      return;
    }
    if (!user) { alert('Please sign in first!'); return; }
    if (loadingUserProfile) return;
    if (showProfileSetup || !userProfile) { alert('Please complete your profile first!'); return; }
    if (isCreatingDrop) { alert('⏳ Please wait - creating drop...'); return; }

    const { lat, lng } = e.latlng;
    if (!gpsPosition) { alert('GPS location not available. Enable location services to place drops.'); return; }

    const distanceFromGPS = calculateDistance(gpsPosition[0], gpsPosition[1], lat, lng);
    if (distanceFromGPS > expandedRadius) return;

    setPendingDropPosition({ lat, lng });
    setShowDropTypeModal(true);
  }, [user, userProfile, loadingUserProfile, showProfileSetup, isOfflineMode, gpsPosition, expandedRadius, isCreatingDrop, setPendingDropPosition, setShowDropTypeModal]);

  const centerMap = useCallback((coords: [number, number], zoomLevel: number = 15) => {
    setMapCenter(coords);
    setZoom(zoomLevel);
    if (mapRef.current) mapRef.current.setView(coords, zoomLevel);
  }, [setMapCenter, setZoom, mapRef]);

  const centerOnGPS = useCallback(() => {
    if (!gpsPosition || !mapRef.current) {
      alert('GPS location not available. Please enable location services.');
      return;
    }
    setIsScanning(true);
    setMapCenter(gpsPosition);
    setZoom(18);
    mapRef.current.setView(gpsPosition, 18);

    if (musicScan) {
      const discovered = musicScan(gpsPosition, 150);
      setTimeout(() => {
        setRepNotification({
          show: true,
          amount: 0,
          message: discovered?.length
            ? `🎵 GPS Scan Complete: Found ${discovered.length} track${discovered.length > 1 ? 's' : ''}!`
            : '🎵 GPS Scan Complete: No tracks found in range.',
        });
        setIsScanning(false);
      }, 2500);
    } else {
      setTimeout(() => setIsScanning(false), 2500);
    }
  }, [gpsPosition, mapRef, musicScan, setIsScanning, setMapCenter, setZoom, setRepNotification]);

  const updateMarker = useCallback((id: string, updates: Partial<UserMarker>) => {
    setUserMarkers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, [setUserMarkers]);

  const deleteMarker = useCallback(async (id: string): Promise<void> => {
    const marker = userMarkers.find(m => m.id === id);
    if (marker?.firestoreId) {
      try {
        await deleteDoc(doc(db, 'markers', marker.firestoreId));
        if (marker.userId === user?.uid && userProfile && user) {
          await updateDoc(doc(db, 'users', user.uid), { totalMarkers: userProfile.totalMarkers - 1 });
          setUserProfile(prev => prev ? { ...prev, totalMarkers: prev.totalMarkers - 1 } : null);
        }
      } catch (error) {
        console.error('Error deleting marker from Firestore:', error);
      }
    }
    setUserMarkers(prev => prev.filter(m => m.id !== id));
  }, [userMarkers, user, userProfile, setUserMarkers, setUserProfile]);

  const deleteAllMarkers = useCallback(async (): Promise<void> => {
    if (!userMarkers.length || !window.confirm(`Are you sure you want to delete all ${userMarkers.length} markers?`)) return;

    const idsToDelete = userMarkers
      .filter(m => m.userId === user?.uid && m.firestoreId)
      .map(m => m.firestoreId);

    await Promise.all(idsToDelete.map(id => id ? deleteDoc(doc(db, 'markers', id)) : Promise.resolve()));

    if (user && userProfile) {
      await updateDoc(doc(db, 'users', user.uid), { totalMarkers: 0 });
      setUserProfile(prev => prev ? { ...prev, totalMarkers: 0 } : null);
    }
    setUserMarkers([]);
    setNextMarkerNumber(1);
  }, [userMarkers, user, userProfile, setUserMarkers, setUserProfile, setNextMarkerNumber]);

  const goToMarker = useCallback((marker: UserMarker) => {
    centerMap(marker.position, 18);
  }, [centerMap]);

  const handleRefreshAll = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadAllMarkers(), loadTopPlayers(), loadDrops()]);
      console.log('All data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [setIsRefreshing, loadAllMarkers, loadTopPlayers, loadDrops]);

  return {
    handleMapClick,
    centerMap,
    centerOnGPS,
    updateMarker,
    deleteMarker,
    deleteAllMarkers,
    goToMarker,
    handleRefreshAll,
  };
};
