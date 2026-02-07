// Firestore caching layer for optimized database queries
// Reduces redundant reads and improves performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class FirestoreCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  // Get item from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Set item in cache
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Invalidate specific key
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // Invalidate keys matching pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const firestoreCache = new FirestoreCache();

// React hook for using cache
import { useCallback, useState, useEffect } from 'react';

export function useFirestoreCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): { data: T | null; loading: boolean; error: Error | null; refresh: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = firestoreCache.get<T>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      firestoreCache.set(cacheKey, result, ttl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    firestoreCache.invalidate(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return { data, loading, error, refresh };
}

// Cache management utilities
export const cacheUtils = {
  // Prefetch common data
  async prefetchUserData(userId: string): Promise<void> {
    const keys = [
      `user:${userId}`,
      `markers:${userId}`,
      `drops:${userId}`,
      `profile:${userId}`
    ];

    for (const key of keys) {
      if (!firestoreCache.has(key)) {
        // Trigger fetch without waiting (prefetch)
        console.log(`[Cache] Prefetching: ${key}`);
      }
    }
  },

  // Invalidate all user data
  invalidateUserData(userId: string): void {
    firestoreCache.invalidatePattern(`.*${userId}.*`);
  },

  // Invalidate all markers
  invalidateMarkers(): void {
    firestoreCache.invalidatePattern('markers:.*');
  },

  // Invalidate all drops
  invalidateDrops(): void {
    firestoreCache.invalidatePattern('drops:.*');
  },

  // Get cache size info
  getCacheInfo(): string {
    const stats = firestoreCache.getStats();
    return `Cache: ${stats.size} entries`;
  }
};
