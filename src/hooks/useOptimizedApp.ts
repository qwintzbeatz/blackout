import { useEffect, useRef, useCallback } from 'react';
import { useSoundCloud } from '@/lib/soundcloud';
import { useOptimizedFirestore } from '@/src/hooks/useOptimizedFirestore';
import { useAdaptivePerformance } from '@/src/hooks/useAdaptivePerformance';
import { MetricsTracker } from '@/src/lib/performance/MetricsTracker';
import { useErrorHandler } from '@/src/hooks/useErrorHandler';
import { PerformanceManager } from '@/src/lib/performance/PerformanceManager';

interface OptimizedAppProps {
  userId?: string;
  crewId?: string;
  onPerformanceUpdate?: (metrics: any) => void;
}

export const useOptimizedApp = ({ userId, crewId, onPerformanceUpdate }: OptimizedAppProps) => {
  const soundCloudManager = useSoundCloud();
  const performanceManager = PerformanceManager.getInstance();
  const { settings } = useAdaptivePerformance();
  const { reportError, retryAction } = useErrorHandler(userId, crewId);
  
  // Track initial load time
  const loadStartTime = useRef(Date.now());
  const hasTrackedLoad = useRef(false);

  // Initialize metrics tracking
  useEffect(() => {
    if (!hasTrackedLoad.current) {
      MetricsTracker.initialize();
      hasTrackedLoad.current = true;
    }
  }, []);

  // Performance-aware Firestore with tracking
  const createOptimizedFirestore = useCallback((collectionName: string, options: any) => {
    const startTime = Date.now();
    
    // Apply performance settings to options
    const optimizedOptions = {
      ...options,
      pageSize: Math.min(options.pageSize, performanceManager.getSettings().maxDrops)
    };

    const hooks = useOptimizedFirestore(collectionName, optimizedOptions);
    
    // Track performance improvement
    setTimeout(() => {
      const endTime = Date.now();
      MetricsTracker.trackImprovement(
        `firestore_${collectionName}_load`,
        0, // Baseline (no optimization)
        endTime - startTime
      );
    }, 100);

    return hooks;
  }, [performanceManager]);

  // Optimized SoundCloud operations with tracking
  const createOptimizedSoundCloud = useCallback(async (operation: () => Promise<any>, operationName: string) => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      
      MetricsTracker.trackImprovement(
        `soundcloud_${operationName}`,
        1000, // Baseline (1 second)
        Date.now() - startTime
      );
      
      return result;
    } catch (error) {
      await reportError(error as Error);
      throw error;
    }
  }, [reportError, soundCloudManager]);

  // Performance-aware retry logic
  const createOptimizedRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T | null> => {
    const startTime = Date.now();
    
    return retryAction(async () => {
      const result = await operation();
      
      MetricsTracker.trackImprovement(
        `${operationName}_retry_success`,
        5000, // Baseline (5 seconds)
        Date.now() - startTime
      );
      
      return result as T;
    }, maxRetries) as Promise<T | null>;
  }, [retryAction]);

  // Memory usage tracking
  const trackMemoryUsage = useCallback((before: number, description: string) => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const after = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
      
      MetricsTracker.trackMemoryUsage(before, after, description);
    }
  }, []);

  // Network request optimization
  const createOptimizedNetworkRequest = useCallback(async <T>(
    request: () => Promise<T>,
    requestName: string
  ): Promise<T> => {
    const startTime = Date.now();
    const memoryBefore = 'memory' in performance ? 
      (performance as any).memory.usedJSHeapSize : 0;

    try {
      const result = await request();
      
      const endTime = Date.now();
      const memoryAfter = 'memory' in performance ? 
        (performance as any).memory.usedJSHeapSize : 0;

      MetricsTracker.trackNetworkRequests(1, 1, `${requestName}_success`);
      MetricsTracker.trackImprovement(
        `${requestName}_performance`,
        2000, // Baseline (2 seconds)
        endTime - startTime
      );
      
      if (memoryBefore > 0) {
        trackMemoryUsage(memoryBefore / 1024 / 1024, `${requestName}_memory`);
      }

      return result;
    } catch (error) {
      MetricsTracker.trackNetworkRequests(1, 0, `${requestName}_error`);
      await reportError(error as Error);
      throw error;
    }
  }, [reportError, trackMemoryUsage]);

  // Performance monitoring callback
  useEffect(() => {
    if (onPerformanceUpdate) {
      const interval = setInterval(() => {
        const metrics = {
          settings,
          timestamp: new Date(),
          memoryUsage: 'memory' in performance ? 
            (performance as any).memory.usedJSHeapSize : 0,
          userExperience: Date.now() - loadStartTime.current
        };
        
        onPerformanceUpdate(metrics);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [onPerformanceUpdate, settings, loadStartTime]);

  return {
    // Optimized hooks
    createOptimizedFirestore,
    createOptimizedSoundCloud,
    createOptimizedRetry,
    createOptimizedNetworkRequest,
    
    // Performance tracking
    trackMemoryUsage,
    
    // Managers
    soundCloudManager,
    performanceManager,
    
    // Settings
    settings,
    
    // Error handling
    reportError,
    retryAction
  };
};