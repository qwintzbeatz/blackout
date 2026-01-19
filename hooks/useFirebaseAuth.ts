'use client';

import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Set persistence for auth (keeps user logged in)
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error('Error setting auth persistence:', error);
      });
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Try again later';
          break;
        default:
          errorMessage = error.message || 'Login failed';
      }
      
      setAuthError(errorMessage);
      return false;
    }
  };

  const handleSignup = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Signup failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak (min 6 characters)';
          break;
        default:
          errorMessage = error.message || 'Signup failed';
      }
      
      setAuthError(errorMessage);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      setAuthError(error.message);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log('Auth state changed, user:', currentUser?.email);
      setUser(currentUser);
      setLoadingAuth(false);
    });
    
    return () => unsubscribe();
  }, []);

  return {
    user,
    loadingAuth,
    authError,
    handleLogin,
    handleSignup,
    handleLogout,
    setAuthError
  };
};