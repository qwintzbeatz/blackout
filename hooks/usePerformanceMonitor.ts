/**
 * usePerformanceMonitor.ts
 * Extracted from page.tsx – monitors component render count and slow operations.
 */

import { useRef, useEffect, useCallback } from 'react';

export const usePerformanceMonitor = () => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 50) {
      console.warn('High render count detected. Check for infinite loops.');
    }
  });

  const logPerformance = useCallback((operation: string, startTime: number) => {
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`Slow operation (${operation}): ${duration.toFixed(2)}ms`);
    }
  }, []);

  return { logPerformance };
};
