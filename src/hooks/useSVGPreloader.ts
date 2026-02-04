'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// Utility hook for SVG preloading
const useSVGPreloader = (svgUrl: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cache, setCache] = useState<Map<string, string>>(new Map());

  const preloadSVG = useCallback(async () => {
    // Check if already in cache
    if (cache.has(svgUrl)) {
      setIsLoaded(true);
      return cache.get(svgUrl);
    }

    try {
      const response = await fetch(svgUrl);
      const svgText = await response.text();
      setCache(prev => new Map(prev).set(svgUrl, svgText));
      setIsLoaded(true);
      return svgText;
    } catch (error) {
      console.error('Failed to preload SVG:', error);
      setIsLoaded(false);
      return null;
    }
  }, [svgUrl, cache]);

  const getCachedSVG = useCallback((svgUrl: string) => {
    return cache.get(svgUrl) || null;
  }, [cache]);

  return { isLoaded, preloadSVG, getCachedSVG };
};

// Custom debounce hook
const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay) as unknown as NodeJS.Timeout;
  }, [callback, delay]);
};

export { useSVGPreloader, useDebounce };