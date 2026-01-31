import { useState, useEffect } from 'react';
import { useOptimizedFirestore } from '@/src/hooks/useOptimizedFirestore';
import { Drop } from '@/lib/types/blackout';

export const useDrops = (initialLimit: number = 100) => {
  const {
    data: dropsData,
    loading: dropsLoading,
    error: dropsError,
    hasMore: hasMoreDrops,
    loadMore: loadMoreDrops,
    refresh: refreshDrops,
    clearCache
  } = useOptimizedFirestore<Drop>('drops', {
    pageSize: initialLimit,
    filters: [],
    orderByField: 'timestamp',
    orderDirection: 'desc'
  });

  // Transform Firestore data to Drop format
  const drops: Drop[] = dropsData.map((drop: any) => ({
    ...drop,
    id: `drop-${drop.firestoreId || drop.id}`,
    // Ensure timestamp is a Date object
    timestamp: drop.timestamp instanceof Date ? drop.timestamp : new Date(drop.timestamp)
  }));

  const loadMore = async () => {
    if (!dropsLoading && hasMoreDrops) {
      await loadMoreDrops();
    }
  };

  const refresh = async () => {
    await refreshDrops();
  };

  return {
    drops,
    loading: dropsLoading,
    error: dropsError,
    hasMore: hasMoreDrops,
    loadMore,
    refresh,
    clearCache,
    totalDrops: drops.length
  };
};