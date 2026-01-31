import { useState, useEffect } from 'react';

export class PerformanceManager {
  private static instance: PerformanceManager;
  private settings = {
    markerLimit: 25,
    updateInterval: 30000, // 30 seconds
    enableCrewDetection: true,
    graphicsQuality: 'medium' as 'low' | 'medium' | 'high',
    maxDrops: 50
  };

  private constructor() {
    this.detectDeviceCapabilities();
  }

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  detectDeviceCapabilities() {
    if (typeof window === 'undefined') return;

    // Detect device memory
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    // Detect connection speed
    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';

    // Adjust settings based on capabilities
    if (deviceMemory <= 2 || effectiveType === 'slow-2g') {
      this.settings = {
        markerLimit: 12,
        updateInterval: 60000,
        enableCrewDetection: false,
        graphicsQuality: 'low',
        maxDrops: 30
      };
    } else if (deviceMemory <= 4 || effectiveType === '2g') {
      this.settings = {
        markerLimit: 25,
        updateInterval: 40000,
        enableCrewDetection: true,
        graphicsQuality: 'medium',
        maxDrops: 75
      };
    } else {
      this.settings = {
        markerLimit: 50,
        updateInterval: 20000,
        enableCrewDetection: true,
        graphicsQuality: 'high',
        maxDrops: 150
      };
    }

    console.log('Performance settings detected:', this.settings);
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  // Battery-aware adjustments
  adjustForBattery(level: number) {
    if (level < 0.2) {
      // Critical battery - minimal operations
      this.settings.updateInterval = 120000; // 2 minutes
      this.settings.enableCrewDetection = false;
    } else if (level < 0.5) {
      // Low battery - conservative
      this.settings.updateInterval = 60000; // 1 minute
    }
  }
}

// Hook for React components
export const usePerformance = () => {
  const manager = PerformanceManager.getInstance();
  const [settings, setSettings] = useState(manager.getSettings());

  useEffect(() => {
    // Listen for battery changes
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        manager.adjustForBattery(battery.level);
        setSettings(manager.getSettings());

        battery.addEventListener('levelchange', () => {
          manager.adjustForBattery(battery.level);
          setSettings(manager.getSettings());
        });
      });
    }

    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        manager.detectDeviceCapabilities();
        setSettings(manager.getSettings());
      });
    }
  }, []);

  return {
    settings,
    updateSettings: (newSettings: Partial<typeof settings>) => {
      manager.updateSettings(newSettings);
      setSettings(manager.getSettings());
    }
  };
};