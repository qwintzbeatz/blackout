import { useEffect, useState, useCallback, useRef } from 'react';
import { usePerformance } from '@/src/lib/performance/PerformanceManager';

export const useAdaptivePerformance = () => {
  const { settings, updateSettings } = usePerformance();
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  // Monitor FPS
  const measureFPS = useCallback(() => {
    frameCountRef.current++;
    const currentTime = Date.now();
    
    if (currentTime >= lastTimeRef.current + 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)));
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  }, []);

  // Monitor memory usage
  const monitorMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / memory.totalJSHeapSize;
      setMemoryUsage(usedMemory);
    }
  }, []);

  // Auto-adjust settings based on performance
  useEffect(() => {
    // Adjust for low FPS
    if (fps < 30) {
      updateSettings({
        graphicsQuality: 'low',
        markerLimit: Math.min(settings.markerLimit, 15),
        updateInterval: Math.max(settings.updateInterval, 60000)
      });
    } else if (fps < 45) {
      updateSettings({
        graphicsQuality: 'medium',
        markerLimit: Math.min(settings.markerLimit, 30)
      });
    }

    // Adjust for high memory usage
    if (memoryUsage > 0.8) {
      updateSettings({
        markerLimit: Math.min(settings.markerLimit, 20),
        enableCrewDetection: false
      });
    }
  }, [fps, memoryUsage, settings.markerLimit, updateSettings]);

  // Start monitoring
  useEffect(() => {
    requestAnimationFrame(measureFPS);
    
    const memoryInterval = setInterval(monitorMemory, 5000);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, [measureFPS, monitorMemory]);

  return {
    settings,
    fps,
    memoryUsage,
    isHighPerformance: fps >= 45 && memoryUsage < 0.7,
    isLowPerformance: fps < 30 || memoryUsage > 0.8
  };
};