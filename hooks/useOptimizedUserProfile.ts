import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/lib/types/blackout';

export const useOptimizedUserProfile = (user: User | null) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          username: data.username || '',
          gender: data.gender || 'prefer-not-to-say',
          profilePicUrl: data.profilePicUrl || '',
          rep: data.rep || 0,
          level: data.level || 1,
          rank: data.rank || 'Sprayer',
          totalMarkers: data.totalMarkers || 0,
          favoriteColor: data.favoriteColor || '#000000',
          unlockedTracks: data.unlockedTracks || [],
          crewId: data.crewId || null,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          lastActive: data.lastActive?.toDate ? data.lastActive.toDate() : new Date()
        };
        setUserProfile(profile);
      } else {
        // Create new profile if it doesn't exist
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          username: user.email?.split('@')[0] || '',
          gender: 'prefer-not-to-say',
          profilePicUrl: '',
          rep: 0,
          level: 1,
          rank: 'Sprayer',
          totalMarkers: 0,
          favoriteColor: '#000000',
          unlockedTracks: [],
          crewId: null,
          createdAt: new Date(),
          lastActive: new Date()
        };
        
        await setDoc(userDoc, {
          ...newProfile,
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
        
        setUserProfile(newProfile);
      }
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    setLoading(true);
    setError(null);

    try {
      const userDoc = doc(db, 'users', user.uid);
      
      // Prepare update data with timestamp
      const updateData = {
        ...updates,
        lastActive: serverTimestamp()
      };

      await updateDoc(userDoc, updateData);
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates, lastActive: new Date() } : null);
      
      console.log('Profile updated successfully');
    } catch (err: any) {
      console.error('Error updating user profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const incrementRep = useCallback(async (amount: number) => {
    if (!user || !userProfile) return;

    const newRep = Math.max(0, userProfile.rep + amount);
    const newLevel = Math.floor(newRep / 100) + 1;
    
    const ranks = ['Sprayer', 'Toy', 'King', 'Legend'];
    const newRank = ranks[Math.min(Math.floor(newLevel / 25), ranks.length - 1)];

    await updateUserProfile({
      rep: newRep,
      level: newLevel,
      rank: newRank
    });
  }, [user, userProfile, updateUserProfile]);

  // Load profile when user changes
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  return {
    userProfile,
    loading,
    error,
    updateUserProfile,
    incrementRep,
    refreshProfile: loadUserProfile
  };
};