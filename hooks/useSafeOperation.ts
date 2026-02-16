/**
 * Custom hook for safe operations with error handling
 * Provides a wrapper for operations that might fail
 */

import { useCallback } from 'react';

export function useSafeOperation() {
  const safeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await operation();
    } catch (error) {
      console.error('Operation failed:', error);
      return fallback;
    }
  }, []);

  return { safeOperation };
}

export default useSafeOperation;
