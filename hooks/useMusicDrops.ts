'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { UserMarker } from '@/lib/types/blackout';
import { calculateDistance } from '@/lib/utils';
import { SPOTIFY_TRACKS } from '@/constants/all_tracks';
import { getTrackNameFromUrl } from '@/lib/utils';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Music Drop interface
export interface MusicDrop {
  id: string;
  position: [number, number];
  trackUrl?: string;
  trackName?: string;
  source?: 'Spotify' | 'SoundCloud';
  discovered: boolean;
  discoveredAt?: Date;
  repReward: number;
  spawnTime: Date;
  expiresAt: Date;
}

// Music drop generation settings
const MUSIC_DROP_SETTINGS = {
  spawnInterval: 5 * 60 * 1000, // 5 minutes (background)
  maxActiveDrops: 10,
  scanRadius: 100, // meters for discovery (default)
  repReward: 15,
  expirationTime: 30 * 60 * 1000, // 30 minutes
  spawnChance: 0.3, // 30% chance per interval when not scanning
  scanSpawnChance: 0.6, // 60% chance to create a drop when scanning the area
  maxSpawnPerScan: 10, // at most this many drops can appear during a single scan
};

export const useMusicDrops = (user: User | null, gpsPosition: [number, number] | null) => {
  const [musicDrops, setMusicDrops] = useState<MusicDrop[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{
    discovered: MusicDrop[];
    newDrops: MusicDrop[];
  } | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [scanCooldown, setScanCooldown] = useState<number>(0);

  // Generate a random music drop
  const generateMusicDrop = useCallback((centerPosition: [number, number]): MusicDrop => {
    // Generate random position within 100-500m radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = 100 + Math.random() * 400; // 100-500m range
    
    // Calculate new coordinates
    const R = 6371000; // Earth's radius in meters
    const lat1 = centerPosition[0] * Math.PI / 180;
    const lng1 = centerPosition[1] * Math.PI / 180;
    const angularDistance = distance / R;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(angle)
    );
    const lng2 = lng1 + Math.atan2(
      Math.sin(angle) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );
    
    const newPosition: [number, number] = [
      (lat2 * 180) / Math.PI,
      (lng2 * 180) / Math.PI
    ];

    // Create drop WITHOUT a song initially (discovered songs should have no song to start with)
    return {
      id: `music-drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: newPosition,
      trackUrl: undefined, // No song initially
      trackName: undefined, // No song initially
      source: undefined, // No source initially
      discovered: false,
      repReward: MUSIC_DROP_SETTINGS.repReward,
      spawnTime: new Date(),
      expiresAt: new Date(Date.now() + MUSIC_DROP_SETTINGS.expirationTime)
    };
  }, []);

  // Spawn new music drops periodically
  useEffect(() => {
    if (!user || !gpsPosition) return;

    const spawnInterval = setInterval(() => {
      // Only spawn if we have fewer than max active drops
      const activeDrops = musicDrops.filter(drop => !drop.discovered && drop.expiresAt > new Date());
      
      if (activeDrops.length < MUSIC_DROP_SETTINGS.maxActiveDrops) {
        // Random chance to spawn
        if (Math.random() < MUSIC_DROP_SETTINGS.spawnChance) {
          const newDrop = generateMusicDrop(gpsPosition);
          setMusicDrops(prev => [...prev, newDrop]);
        }
      }
    }, MUSIC_DROP_SETTINGS.spawnInterval);

    return () => clearInterval(spawnInterval);
  }, [user, gpsPosition, musicDrops.length, generateMusicDrop]);

  // Discover a single music drop (for clicking undiscovered drops)
  const discoverMusicDrop = useCallback((dropId: string) => {
    setMusicDrops(prev => 
      prev.map(drop => 
        drop.id === dropId ? { ...drop, discovered: true, discoveredAt: new Date() } : drop
      )
    );
  }, []);

  // Clean up expired drops
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setMusicDrops(prev => prev.filter(drop => drop.expiresAt > now));
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Memoized expensive distance calculations for mobile performance
  const nearbyDrops = useMemo(() => {
    if (!gpsPosition || isScanning) return [];
    
    return musicDrops.filter(drop => {
      const distance = calculateDistance(
        gpsPosition[0],
        gpsPosition[1],
        drop.position[0],
        drop.position[1]
      );
      return distance <= 50; // Auto-discover within 50m
    });
  }, [gpsPosition, musicDrops, isScanning]);

  // Auto-discover music drops within 50m of GPS position
  useEffect(() => {
    if (nearbyDrops.length > 0) {
      nearbyDrops.forEach(drop => {
        if (!drop.discovered) {
          discoverMusicDrop(drop.id);
        }
      });
    }
  }, [nearbyDrops, discoverMusicDrop]);

  // Helper: spawn a few drops randomly within a radius around a center
  const spawnDropsInRadius = useCallback((center: [number, number], radius: number) => {
    const newDrops: MusicDrop[] = [];
    const currentActive = musicDrops.filter(d => !d.discovered && d.expiresAt > new Date()).length;
    const slots = Math.max(0, MUSIC_DROP_SETTINGS.maxActiveDrops - currentActive);
    const toSpawn = Math.min(slots, MUSIC_DROP_SETTINGS.maxSpawnPerScan);

    for (let i = 0; i < toSpawn; i++) {
      if (Math.random() < MUSIC_DROP_SETTINGS.scanSpawnChance) {
        // random point within circle
        const angle = Math.random() * 2 * Math.PI;
        const dist = Math.random() * radius;
        // compute offset using haversine similar to generateMusicDrop
        const R = 6371000;
        const lat1 = center[0] * Math.PI / 180;
        const lng1 = center[1] * Math.PI / 180;
        const angularDistance = dist / R;
        const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(angularDistance) +
          Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(angle)
        );
        const lng2 = lng1 + Math.atan2(
          Math.sin(angle) * Math.sin(angularDistance) * Math.cos(lat1),
          Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
        );
        const pos: [number, number] = [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI];
        
        // Create drop WITHOUT a song initially (discovered songs should have no song to start with)
        const newDrop: MusicDrop = {
          id: `music-drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          position: pos,
          trackUrl: undefined, // No song initially
          trackName: undefined, // No song initially
          source: undefined, // No source initially
          discovered: false,
          repReward: MUSIC_DROP_SETTINGS.repReward,
          spawnTime: new Date(),
          expiresAt: new Date(Date.now() + MUSIC_DROP_SETTINGS.expirationTime)
        };
        newDrops.push(newDrop);
      }
    }

    if (newDrops.length) {
      setMusicDrops(prev => [...prev, ...newDrops]);
    }

    return newDrops;
  }, [musicDrops]);

  // Scan for music drops within radius
  const scanForMusicDrops = useCallback((scanCenter: [number, number], radius: number = MUSIC_DROP_SETTINGS.scanRadius) => {
    if (!scanCenter) return [];

    setIsScanning(true);

    // spawn some drops as a result of scanning
    const spawned = spawnDropsInRadius(scanCenter, radius);
    
    // Find ONLY truly undiscovered drops within radius (excluding newly spawned ones to avoid duplicates)
    const undiscoveredDrops = musicDrops.filter(drop => 
      !drop.discovered && 
      drop.expiresAt > new Date() &&
      calculateDistance(scanCenter[0], scanCenter[1], drop.position[0], drop.position[1]) <= radius &&
      // Exclude newly spawned drops to prevent them from being marked as discovered immediately
      !spawned.some(spawnedDrop => spawnedDrop.id === drop.id)
    );

    // Mark drops as discovered
    const discoveredDrops = undiscoveredDrops.map(drop => ({
      ...drop,
      discovered: true,
      discoveredAt: new Date()
    }));

    // Update state - only update drops that were actually discovered
    setMusicDrops(prev => 
      prev.map(drop => {
        const discoveredDrop = discoveredDrops.find(d => d.id === drop.id);
        return discoveredDrop || drop;
      })
    );

    // Set scan results (include spawned drops as newDrops, discovered drops as discovered)
    setScanResults({
      discovered: discoveredDrops,
      newDrops: [...spawned, ...discoveredDrops]
    });

    // Reset scan state after animation
    setTimeout(() => {
      setIsScanning(false);
      setScanResults(null);
    }, 2000);

    return discoveredDrops;
  }, [musicDrops, spawnDropsInRadius]);

  // Quick scan (Button 5) - 50m radius
  const quickScan = useCallback((scanCenter?: [number, number]) => {
    if (!scanCenter) return [];
    return scanForMusicDrops(scanCenter, 50);
  }, [scanForMusicDrops]);

  // Music-specific scan (Button 6) - configurable radius
  const musicScan = useCallback((scanCenter?: [number, number], radius?: number) => {
    if (!scanCenter) return [];
    return scanForMusicDrops(scanCenter, radius || MUSIC_DROP_SETTINGS.scanRadius);
  }, [scanForMusicDrops]);

  // Photo scan (Button 7) - for future photo drop integration
  const photoScan = useCallback((scanCenter?: [number, number]) => {
    if (!scanCenter) return [];
    return scanForMusicDrops(scanCenter, 250);
  }, [scanForMusicDrops]);

  // Full area scan (Button 8) - scan entire map view
  const fullAreaScan = useCallback((mapBounds: [[number, number], [number, number]] | null) => {
    if (!mapBounds) return [];
    
    // Find drops within map bounds
    const dropsInBounds = musicDrops.filter(drop => 
      !drop.discovered && 
      drop.expiresAt > new Date() &&
      drop.position[0] >= mapBounds[0][0] && 
      drop.position[0] <= mapBounds[1][0] &&
      drop.position[1] >= mapBounds[0][1] && 
      drop.position[1] <= mapBounds[1][1]
    );

    // Mark as discovered
    const discoveredDrops = dropsInBounds.map(drop => ({
      ...drop,
      discovered: true,
      discoveredAt: new Date()
    }));

    setMusicDrops(prev => 
      prev.map(drop => 
        discoveredDrops.find(d => d.id === drop.id) || drop
      )
    );

    setScanResults({
      discovered: discoveredDrops,
      newDrops: discoveredDrops
    });

    setTimeout(() => {
      setIsScanning(false);
      setScanResults(null);
    }, 2000);

    return discoveredDrops;
  }, [musicDrops]);

  // Get active (undiscovered) music drops
  const getActiveMusicDrops = useCallback(() => {
    return musicDrops.filter(drop => !drop.discovered && drop.expiresAt > new Date());
  }, [musicDrops]);

  // Get discovered music drops
  const getDiscoveredMusicDrops = useCallback(() => {
    return musicDrops.filter(drop => drop.discovered);
  }, [musicDrops]);

  // Unlock a discovered music track (add to user's unlocked tracks)
  const unlockMusicTrack = useCallback(async (drop: MusicDrop) => {
    if (!drop.discovered) return false;
    
    // Mark as unlocked in local state
    setMusicDrops(prev => 
      prev.map(d => 
        d.id === drop.id ? { ...d, unlocked: true } : d
      )
    );
    
    // Add track to user's unlocked tracks collection
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentTracks = userData.unlockedTracks || [];
          
          // Only add if not already unlocked
          if (!currentTracks.includes(drop.trackUrl)) {
            const newTracks = [...currentTracks, drop.trackUrl];
            
            await updateDoc(userRef, {
              unlockedTracks: newTracks,
              lastActive: Timestamp.now()
            });
            
            console.log('🎵 Music track unlocked:', drop.trackName, 'from', drop.source);
            return true;
          }
        }
      } catch (error) {
        console.error('Error unlocking music track:', error);
      }
    }
    
    return false;
  }, [user]);

  // Replace discovered music drop with selected drop type
  const replaceMusicDropWithDropType = useCallback((dropId: string, dropType: 'marker' | 'photo' | 'music') => {
    // Remove the music drop
    setMusicDrops(prev => prev.filter(drop => drop.id !== dropId));
    
    console.log(`🔄 Music drop ${dropId} replaced with ${dropType} drop`);
    
    // Return the position and type for the map component to create the new drop
    const originalDrop = musicDrops.find(drop => drop.id === dropId);
    if (originalDrop) {
      return {
        position: originalDrop.position,
        dropType: dropType,
        replacedDropId: dropId
      };
    }
    
    return null;
  }, [musicDrops]);

  // Handle drop replacement with rewards
  const handleDropReplacement = useCallback(async (dropId: string, dropType: 'marker' | 'photo' | 'music') => {
    const replacementData = replaceMusicDropWithDropType(dropId, dropType);
    
    if (!replacementData) return null;
    
    // Log the reward based on drop type
    switch (dropType) {
      case 'marker':
        console.log('📍 Marker drop replacement: Will unlock Spotify track');
        break;
      case 'photo':
        console.log('📸 Photo drop replacement: Will unlock SoundCloud track');
        break;
      case 'music':
        console.log('🎵 Music drop replacement: Will unlock Facebook video');
        break;
    }
    
    return replacementData;
  }, [replaceMusicDropWithDropType]);

  return {
    musicDrops,
    activeMusicDrops: getActiveMusicDrops(),
    discoveredMusicDrops: getDiscoveredMusicDrops(),
    isScanning,
    scanResults,
    quickScan,
    musicScan,
    photoScan,
    fullAreaScan,
    scanForMusicDrops,
    unlockMusicTrack,
    discoverMusicDrop,
    replaceMusicDropWithDropType
  };
};