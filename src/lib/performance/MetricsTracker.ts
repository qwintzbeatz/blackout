export class MetricsTracker {
  static trackImprovement(metric: string, before: number, after: number) {
    const improvement = ((before - after) / before * 100).toFixed(1);
    console.log(`🚀 ${metric}: ${before}ms → ${after}ms (${improvement}% improvement)`);
    
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_improvement', {
        metric,
        before,
        after,
        improvement: parseFloat(improvement)
      });
    }
  }

  static trackMemoryUsage(before: number, after: number, description: string) {
    const reduction = ((before - after) / before * 100).toFixed(1);
    console.log(`🧠 Memory ${description}: ${before}MB → ${after}MB (${reduction}% reduction)`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'memory_optimization', {
        description,
        before,
        after,
        reduction: parseFloat(reduction)
      });
    }
  }

  static trackNetworkRequests(before: number, after: number, description: string) {
    const reduction = ((before - after) / before * 100).toFixed(1);
    console.log(`📡 Network ${description}: ${before} → ${after} requests (${reduction}% reduction)`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'network_optimization', {
        description,
        before,
        after,
        reduction: parseFloat(reduction)
      });
    }
  }

  static trackRenderingPerformance(before: number, after: number, description: string) {
    const improvement = ((before - after) / before * 100).toFixed(1);
    console.log(`🎨 Rendering ${description}: ${before}ms → ${after}ms (${improvement}% improvement)`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'rendering_optimization', {
        description,
        before,
        after,
        improvement: parseFloat(improvement)
      });
    }
  }

  static trackErrorReduction(before: number, after: number, description: string) {
    const reduction = ((before - after) / before * 100).toFixed(1);
    console.log(`🛡️ Errors ${description}: ${before} → ${after} errors (${reduction}% reduction)`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'error_reduction', {
        description,
        before,
        after,
        reduction: parseFloat(reduction)
      });
    }
  }

  static trackUserExperience(metric: string, value: number, unit: string = 'ms') {
    console.log(`👤 User Experience ${metric}: ${value}${unit}`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'user_experience', {
        metric,
        value,
        unit
      });
    }
  }

  static trackBatteryLife(before: number, after: number, description: string) {
    const improvement = ((after - before) / before * 100).toFixed(1);
    console.log(`🔋 Battery ${description}: ${before}min → ${after}min (${improvement}% improvement)`);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'battery_optimization', {
        description,
        before,
        after,
        improvement: parseFloat(improvement)
      });
    }
  }

  // Initialize metrics tracking
  static initialize() {
    if (typeof window !== 'undefined') {
      console.log('📊 MetricsTracker initialized - tracking all performance improvements');
      
      // Track initial page load performance
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        this.trackUserExperience('page_load_time', Math.round(navigationTiming.loadEventEnd - navigationTiming.loadEventStart));
        this.trackUserExperience('dom_content_loaded', Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.loadEventStart));
      }
    }
  }
}