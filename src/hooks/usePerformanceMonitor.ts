'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

// Simple performance monitoring hook
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    interactionCount: 0,
    memoryUsage: 0,
    networkRequests: 0,
    componentRenders: {} as Record<string, number>
  });

  // Start timing
  const startTiming = Date.now();
  const endTiming = () => Date.now();

  // Metrics collection function
  const collectMetrics = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      renderTime: endTiming(),
      interactionCount: prev.interactionCount + 1
    }));
  }, [metrics, setMetrics]);

  // Interaction logging
  const logInteraction = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1
    }));
  }, [metrics, setMetrics]);

  // Memory usage tracking
  const logMemoryUsage = useCallback(() => {
    if ((performance as any).memory) {
      setMetrics(prev => ({
        ...prev,
        memoryUsage: (performance as any).memory.usedJSHeapSize
      }));
    }
  }, [metrics, setMetrics]);

  // Network request tracking
  const logNetworkRequest = useCallback((url: string) => {
    setMetrics(prev => ({
      ...prev,
      networkRequests: prev.networkRequests + 1
    }));
  }, [metrics, setMetrics]);

  // Component render tracking
  const logComponentRender = useCallback((componentName: string) => {
    setMetrics(prev => ({
      ...prev,
      componentRenders: {
        ...prev.componentRenders,
        [componentName]: (prev.componentRenders[componentName] || 0) + 1
      }
    }));
  }, [metrics, setMetrics]);

  // Performance optimization suggestions
  const getOptimizations = useCallback(() => {
    if (metrics.renderTime > 0 && metrics.interactionCount > 0) {
      const renderTime = metrics.renderTime - startTiming;
      const duration = renderTime - startTiming;
      const interactionRate = metrics.interactionCount / (renderTime - startTiming);
      
      // Log performance insights
      console.log(`Performance: ${interactionRate} interactions/sec, ${duration}ms render time`);
      
      // Suggest optimizations
      if (duration > 16) {
        console.warn('Slow render detected - consider optimizing components');
      } else if (duration > 50) {
        console.log('Fast render detected - great performance');
      }
    }
    
    return {
      renderTime: metrics.renderTime,
      interactionCount: metrics.interactionCount,
      memoryUsage: metrics.memoryUsage,
      networkRequests: metrics.networkRequests,
      componentRenders: metrics.componentRenders
    };
  }, [metrics, setMetrics]);
};

export { usePerformanceMonitor };