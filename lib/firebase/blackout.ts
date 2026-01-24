'use client';

import { collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BlackoutEvent } from '@/lib/utils/types';

export async function triggerManualBlackout(): Promise<BlackoutEvent | null> {
  try {
    const dropsRef = collection(db, 'drops');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const q = query(
      dropsRef,
      where('timestamp', '>', yesterday),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const drops = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (drops.length === 0) return null;
    
    const randomDrop = drops[Math.floor(Math.random() * drops.length)];
    let dropType: 'photo' | 'marker' | 'music' = 'marker';
    if (randomDrop.photoUrl) dropType = 'photo';
    if (randomDrop.trackUrl) dropType = 'music';
    
    const clues = [
      "Frequency interference detected",
      "Aesthetic anomaly in pattern matrix",
      "Data corruption during upload",
      "Urban canvas recalibration initiated",
      "Temporal displacement registered",
    ];
    const clue = clues[Math.floor(Math.random() * clues.length)];
    
    const blackoutRef = collection(db, 'blackoutEvents');
    const eventData = {
      dropId: randomDrop.id,
      dropType,
      originalOwner: randomDrop.createdBy,
      username: randomDrop.username || 'Anonymous',
      userProfilePic: randomDrop.userProfilePic || '',
      location: [randomDrop.lat, randomDrop.lng],
      disappearedAt: Timestamp.now(),
      clue,
      investigatingPlayers: [],
      solvedBy: null,
      solvedAt: null
    };
    
    const eventDoc = await addDoc(blackoutRef, eventData);
    return { id: eventDoc.id, ...eventData, disappearedAt: new Date() };
  } catch (error) {
    console.error('Blackout failed:', error);
    return null;
  }
}