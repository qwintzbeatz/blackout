import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/lib/utils/types';
import { generateAvatarUrl } from '@/lib/utils/helpers';

export const useUserProfile = (user: User | null) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const loadUserProfile = useCallback(async (currentUser: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        let profilePicUrl = data.profilePicUrl;
        if (!profilePicUrl || profilePicUrl === '') {
          profilePicUrl = generateAvatarUrl(currentUser.uid, data.username, data.gender);
        }
        
        setUserProfile({
          uid: data.uid,
          email: data.email,
          username: data.username,
          gender: data.gender || 'prefer-not-to-say',
          profilePicUrl: profilePicUrl,
          xp: data.xp || 0,
          level: data.level || 1,
          rank: data.rank || 'TOY',
          totalMarkers: data.totalMarkers || 0,
          favoriteColor: data.favoriteColor || '#10b981',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastActive: data.lastActive?.toDate() || new Date()
        });
        setShowProfileSetup(false);
      } else {
        setShowProfileSetup(true);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setShowProfileSetup(true);
    }
  }, []);

  const handleProfileSetup = useCallback(async (data: {
    username: string;
    gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  }) => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const profilePicUrl = generateAvatarUrl(user.uid, data.username.trim(), data.gender);
      
      const userProfileData = {
        uid: user.uid,
        email: user.email || '',
        username: data.username.trim(),
        gender: data.gender,
        profilePicUrl: profilePicUrl,
        xp: 0,
        level: 1,
        rank: 'TOY',
        totalMarkers: 0,
        favoriteColor: '#10b981',
        createdAt: Timestamp.now(),
        lastActive: Timestamp.now()
      };
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, userProfileData);
      
      setUserProfile({
        ...userProfileData,
        createdAt: new Date(),
        lastActive: new Date()
      } as UserProfile);
      
      setShowProfileSetup(false);
      return true;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      throw error;
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        lastActive: Timestamp.now()
      });
      
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user) {
      loadUserProfile(user);
    } else {
      setUserProfile(null);
      setShowProfileSetup(false);
    }
  }, [user, loadUserProfile]);

  return {
    userProfile,
    loadingProfile,
    showProfileSetup,
    handleProfileSetup,
    updateUserProfile,
    loadUserProfile
  };
};