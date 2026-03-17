/**
 * useBoundsBasedLoading.ts
 * Hook for loading markers and drops within map bounds to reduce Firestore reads
 */

import { useCallback, useRef } from 'react';
import { LatLngBounds } from 'leaflet';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserMarker, Drop } from '@/lib/types/blackout';

interface UseBoundsBasedLoadingParams {
  user: any; // Firebase User
  userProfile: any; // UserProfile
  markerQuality: 'low' | 'medium' | 'high';
  onMarkersLoaded?: (markers: UserMarker[]) => void;
  onDropsLoaded?: (drops: Drop[]) => void;
}

export const useBoundsBasedLoading = ({
  user,
  userProfile,
  markerQuality,
  onMarkersLoaded,
  onDropsLoaded
}: UseBoundsBasedLoadingParams) => {
  const lastBoundsRef = useRef<LatLngBounds | null>(null);
  const loadingRef = useRef({
    markers: false,
    drops: false
  });

  // Helper function to get map bounds
  const getMapBounds = useCallback((map: any): LatLngBounds | null => {
    if (!map || !map.getBounds) return null;
    return map.getBounds();
  }, []);

  // Load markers within bounds
  const loadMarkersInBounds = useCallback(async (bounds?: LatLngBounds) => {
    if (!user || !userProfile || loadingRef.current.markers) return;

    const actualBounds = bounds || lastBoundsRef.current;
    if (!actualBounds) return;

    // Check if bounds haven't changed significantly to avoid redundant loads
    if (lastBoundsRef.current && actualBounds.equals(lastBoundsRef.current)) {
      return;
    }

    loadingRef.current.markers = true;
    
    const startTime = performance.now();
    try {
      const markerLimit = markerQuality === 'low' ? 12 : markerQuality === 'medium' ? 25 : 50;
      
      const q = query(
        collection(db, 'markers'),
        where('lat', '>=', actualBounds.getSouth()),
        where('lat', '<=', actualBounds.getNorth()),
        where('lng', '>=', actualBounds.getWest()),
        where('lng', '<=', actualBounds.getEast()),
        orderBy('createdAt', 'desc'),
        limit(markerLimit)
      );

      const querySnapshot = await getDocs(q);
      const markers: UserMarker[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        markers.push({
          id: doc.id,
          position: [data.lat, data.lng],
          name: data.name,
          description: data.description,
          color: data.color,
          timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          distanceFromCenter: data.distanceFromCenter,
          userId: data.userId,
          username: data.username,
          userProfilePic: data.userProfilePic,
          styleId: data.styleId,
          surface: data.surface,
          graffitiType: data.graffitiType,
          repEarned: data.repEarned,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          likes: data.likes || [],
          comments: data.comments || []
        });
      });

      lastBoundsRef.current = actualBounds;
      onMarkersLoaded?.(markers);
      
      const loadTime = performance.now() - startTime;
      console.log(`Loaded ${markers.length} markers in bounds in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Error loading markers in bounds:', error);
    } finally {
      loadingRef.current.markers = false;
    }
  }, [user, userProfile, markerQuality, onMarkersLoaded]);

  // Load drops within bounds
  const loadDropsInBounds = useCallback(async (bounds?: LatLngBounds) => {
    if (!user || !userProfile || loadingRef.current.drops) return;

    const actualBounds = bounds || lastBoundsRef.current;
    if (!actualBounds) return;

    // Check if bounds haven't changed significantly to avoid redundant loads
    if (lastBoundsRef.current && actualBounds.equals(lastBoundsRef.current)) {
      return;
    }

    loadingRef.current.drops = true;
    
    const startTime = performance.now();
    try {
      const q = query(
        collection(db, 'drops'),
        where('lat', '>=', actualBounds.getSouth()),
        where('lat', '<=', actualBounds.getNorth()),
        where('lng', '>=', actualBounds.getWest()),
        where('lng', '<=', actualBounds.getEast()),
        orderBy('timestamp', 'desc'),
        limit(50) // Limit drops to 50 for performance
      );

      const querySnapshot = await getDocs(q);
      const drops: Drop[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Load photo metadata if it exists
        let photoMetadata: Drop['photoMetadata'] = undefined;
        if (data.photoMetadata) {
          photoMetadata = {
            hasLocation: data.photoMetadata.hasLocation || false,
            originalLat: data.photoMetadata.originalLat || undefined,
            originalLng: data.photoMetadata.originalLng || undefined,
            timestamp: data.photoMetadata.timestamp?.toDate ? data.photoMetadata.timestamp.toDate() : undefined,
          };
        }
        
        drops.push({
          id: `drop-${doc.id}`,
          firestoreId: doc.id,
          lat: data.lat,
          lng: data.lng,
          photoUrl: data.photoUrl || undefined,
          trackUrl: data.trackUrl || undefined,
          createdBy: data.createdBy,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          likes: data.likes || [],
          username: data.username,
          userProfilePic: data.userProfilePic,
          photoMetadata: photoMetadata,
        });
      });

      lastBoundsRef.current = actualBounds;
      onDropsLoaded?.(drops);
      
      const loadTime = performance.now() - startTime;
      console.log(`Loaded ${drops.length} drops in bounds in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Error loading drops in bounds:', error);
    } finally {
      loadingRef.current.drops = false;
    }
  }, [user, userProfile, onDropsLoaded]);

  // Combined function to load both markers and drops
  const loadAllInBounds = useCallback(async (bounds?: LatLngBounds) => {
    await Promise.all([
      loadMarkersInBounds(bounds),
      loadDropsInBounds(bounds)
    ]);
  }, [loadMarkersInBounds, loadDropsInBounds]);

  // Function to attach map move listener
  const attachMapMoveListener = useCallback((map: any) => {
    if (!map) return;

    const handleMoveEnd = () => {
      const bounds = getMapBounds(map);
      if (bounds) {
        loadAllInBounds(bounds);
      }
    };

    map.on('moveend', handleMoveEnd);
    
    // Return cleanup function
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [getMapBounds, loadAllInBounds]);

  return {
    loadMarkersInBounds,
    loadDropsInBounds,
    loadAllInBounds,
    attachMapMoveListener,
    getMapBounds,
    loading: loadingRef.current
  };
};