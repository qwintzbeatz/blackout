// hooks/useStoryManager.ts
import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserMarker, Drop, StoryMission, BlackoutEvent } from '@/lib/types/blackout';

export const useStoryManager = (userId: string | null, userProfile: UserProfile | null) => {
  const [currentAct, setCurrentAct] = useState(1);
  const [storyProgress, setStoryProgress] = useState(0);
  const [activeMissions, setActiveMissions] = useState<StoryMission[]>([]);
  const [blackoutEvents, setBlackoutEvents] = useState<BlackoutEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize story for new users
  const initializeStory = useCallback(async () => {
    if (!userId || !userProfile) return;

    try {
      const storyRef = doc(db, 'story', userId);
      const storyDoc = await getDoc(storyRef);

      if (!storyDoc.exists()) {
        // Create initial story progress
        await setDoc(storyRef, {
          userId,
          currentAct: 1,
          storyProgress: 0,
          completedMissions: [],
          activeMissions: ['act1_intro'],
          crewTrust: { bqc: 0, sps: 0, lzt: 0, dgc: 0 },
          plotRevealed: false,
          lastUpdated: Timestamp.now()
        });
        
        setCurrentAct(1);
        setStoryProgress(0);
      } else {
        const data = storyDoc.data();
        setCurrentAct(data.currentAct || 1);
        setStoryProgress(data.storyProgress || 0);
        
        // Load active missions
        // This would come from your storyMissions data file
      }
    } catch (error) {
      console.error('Error initializing story:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfile]);

  // Trigger a Blackout event
  const triggerBlackoutEvent = useCallback(async (marker: UserMarker) => {
    if (!userId) return;

    const event: BlackoutEvent = {
      id: `blackout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: marker.position,
      timestamp: new Date(),
      description: `"${marker.description}" by ${marker.username || 'Unknown'} vanished overnight.`,
      affectedDrops: [marker.firestoreId || marker.id],
      crewClues: {
        bqc: "📡 GPS data shows clean removal at 3:47 AM. Professional buffing equipment signature detected.",
        sps: "🎵 Frequency analysis: Art was 'digitized' before removal. Residual frequency: 432Hz (healing tone).",
        lzt: "💔 Emotional resonance scan: Piece was 'appreciated' (87% emotional score) before removal. Unusual.",
        dgc: "👴 Old-school analysis: Buff job too clean for city workers. No overspray. Professional grade."
      },
      resolved: false
    };

    // Save to Firestore
    const eventRef = doc(db, 'blackout_events', event.id);
    await setDoc(eventRef, {
      ...event,
      timestamp: Timestamp.fromDate(event.timestamp)
    });

    setBlackoutEvents(prev => [event, ...prev]);
    return event;
  }, [userId]);

  // Check for Blackout triggers
  const checkBlackoutTriggers = useCallback((newMarker: UserMarker, allMarkers: UserMarker[]) => {
    // Trigger first disappearance after 3 markers
    if (allMarkers.filter(m => m.userId === userId).length === 3 && blackoutEvents.length === 0) {
      triggerBlackoutEvent(newMarker);
    }
    
    // Trigger pattern discovery after 10 markers
    if (allMarkers.length >= 10 && storyProgress < 25) {
      // Update story progress
      setStoryProgress(prev => Math.max(prev, 25));
    }
  }, [userId, blackoutEvents.length, storyProgress, triggerBlackoutEvent]);

  // Listen for Blackout events
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'blackout_events'),
      where('affectedDrops', 'array-contains', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as BlackoutEvent[];
      
      setBlackoutEvents(events);
    });

    return () => unsubscribe();
  }, [userId]);

  // Initialize on mount
  useEffect(() => {
    if (userId && userProfile) {
      initializeStory();
    }
  }, [userId, userProfile, initializeStory]);

  return {
    currentAct,
    storyProgress,
    activeMissions,
    blackoutEvents,
    isLoading,
    triggerBlackoutEvent,
    checkBlackoutTriggers,
    initializeStory
  };
};