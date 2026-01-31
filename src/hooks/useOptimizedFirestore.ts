import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PerformanceManager } from '@/src/lib/performance/PerformanceManager';

interface PaginationOptions {
  pageSize: number;
  filters?: Array<{ field: string; op: any; value: any }>;
  orderByField: string;
  orderDirection?: 'asc' | 'desc';
}

export const useOptimizedFirestore = <T>(
  collectionName: string,
  options: PaginationOptions
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);
  const performanceManager = PerformanceManager.getInstance();

  // Adjust page size based on performance settings
  const optimizedPageSize = Math.min(
    options.pageSize, 
    performanceManager.getSettings().maxDrops
  );

  const loadData = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      let q = query(
        collection(db, collectionName),
        orderBy(options.orderByField, options.orderDirection || 'desc'),
        limit(optimizedPageSize)
      );

      // Apply filters
      if (options.filters) {
        options.filters.forEach(filter => {
          q = query(q, where(filter.field, filter.op, filter.value));
        });
      }

      // Apply pagination
      if (!reset && lastDocRef.current) {
        q = query(q, startAfter(lastDocRef.current));
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMore(false);
        if (reset) setData([]);
        return;
      }

      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      if (reset) {
        setData(newData);
      } else {
        setData(prev => [...prev, ...newData]);
      }

      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === options.pageSize);
    } catch (err: any) {
      console.error(`Error loading ${collectionName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collectionName, options, loading]);

  const refresh = useCallback(() => {
    lastDocRef.current = null;
    setHasMore(true);
    loadData(true);
  }, [loadData]);

  // Cache management
  const clearCache = useCallback(() => {
    setData([]);
    lastDocRef.current = null;
    setHasMore(true);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      clearCache();
    };
  }, [clearCache]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore: () => loadData(false),
    refresh,
    clearCache
  };
};