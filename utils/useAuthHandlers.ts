/**
 * useAuthHandlers.ts
 * Extracted from page.tsx – login, signup, logout, saveFavoriteColor.
 *
 * Usage in HomeComponent:
 *   const { handleLogin, handleSignup, handleLogout, saveFavoriteColor } =
 *     useAuthHandlers({ ... });
 */

import { useState, useCallback } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { UserProfile } from '@/lib/types/blackout';

interface UseAuthHandlersParams {
  email: string;
  password: string;
  userProfile: UserProfile | null;
  user: { uid: string } | null;

  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setAuthError: (v: string | null) => void;
  setShowLogin: (v: boolean) => void;
  setShowSignup: (v: boolean) => void;
  setIsPlaying: (v: boolean) => void;
  setUserProfile: (updater: ((prev: UserProfile | null) => UserProfile | null) | null) => void;
  closeAllPanels: () => void;
}

export const useAuthHandlers = ({
  email,
  password,
  userProfile,
  user,
  setEmail,
  setPassword,
  setAuthError,
  setShowLogin,
  setShowSignup,
  setIsPlaying,
  setUserProfile,
  closeAllPanels,
}: UseAuthHandlersParams) => {

  const handleLogin = useCallback(async (e: React.FormEvent): Promise<void> => {
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
  }, [email, password, setAuthError, setIsPlaying, setShowLogin, setEmail, setPassword]);

  const handleSignup = useCallback(async (e: React.FormEvent): Promise<void> => {
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
  }, [email, password, setAuthError, setIsPlaying, setShowSignup, setEmail, setPassword]);

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      setIsPlaying(false);
      closeAllPanels();
      await signOut(auth);
    } catch (error: any) {
      setAuthError(error.message);
    }
  }, [setIsPlaying, closeAllPanels, setAuthError]);

  const saveFavoriteColor = useCallback(async (color: string): Promise<void> => {
    if (!user || !userProfile) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { favoriteColor: color, lastActive: Timestamp.now() });
      setUserProfile((prev) => prev ? { ...prev, favoriteColor: color } : null);
    } catch (error) {
      console.error('Error saving favorite color:', error);
    }
  }, [user, userProfile, setUserProfile]);

  return { handleLogin, handleSignup, handleLogout, saveFavoriteColor };
};
