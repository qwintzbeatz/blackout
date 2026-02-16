/**
 * Custom hook for loading state management
 * Centralizes all loading states in one place
 */

import { useState, useCallback, useMemo } from 'react';

export interface LoadingStates {
  markers: boolean;
  profile: boolean;
  drops: boolean;
  topPlayers: boolean;
  gps: boolean;
  auth: boolean;
}

export function useLoadingManager() {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    markers: false,
    profile: false,
    drops: false,
    topPlayers: false,
    gps: false,
    auth: true
  });

  const setLoading = useCallback((key: keyof LoadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const isLoading = useMemo(() => {
    return Object.values(loadingStates).some(state => state);
  }, [loadingStates]);

  return { loadingStates, setLoading, isLoading };
}

export default useLoadingManager;
