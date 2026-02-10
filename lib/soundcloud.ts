'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SoundCloudWidget {
  bind: (event: string, callback: Function) => void;
  unbind: (event: string) => void;
  load: (url: string, options: any) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (milliseconds: number) => void;
  setVolume: (volume: number) => void;
  getVolume: (callback: (volume: number) => void) => void;
  getDuration: (callback: (duration: number) => void) => void;
  getPosition: (callback: (position: number) => void) => void;
  getCurrentSound: (callback: (soundData: any) => void) => void;
  isPaused: (callback: (paused: boolean) => void) => void;
}

interface SoundCloudManager {
  isInitialized: boolean;
  initialize: () => Promise<boolean>;
  createWidget: (iframeId: string, trackUrl: string, options?: {
    auto_play?: boolean;
    buying?: boolean;
    sharing?: boolean;
    show_artwork?: boolean;
    show_playcount?: boolean;
    show_user?: boolean;
    single_active?: boolean;
    start_track?: number;
    visual?: boolean;
    volume?: number;
    onFinish?: () => void;
    onError?: (error: any) => void;
  }) => SoundCloudWidget | null;
  destroyWidget: (iframeId: string) => void;
  destroyAll: () => void;
  getWidget: (iframeId: string) => SoundCloudWidget | null;
  createIframe: (iframeId: string, trackUrl: string, appendToBody?: boolean) => HTMLIFrameElement | null;
}

// Declare SC global variable
declare global {
  interface Window {
    SC: {
      Widget: {
        Events: {
          PLAY: string;
          PLAY_PROGRESS: string;
          PAUSE: string;
          FINISH: string;
          ERROR: string;
          READY: string;
          CLICK_DOWNLOAD: string;
          CLICK_BUY: string;
        };
        new (iframe: HTMLIFrameElement | string): any;
      };
    };
  }
}

// Mobile device detection
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth < 768;
};

// Custom hook for SoundCloud functionality
const useSoundCloud = (): SoundCloudManager => {
  const widgetsRef = useRef<Record<string, SoundCloudWidget>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const initPromiseRef = useRef<Promise<boolean> | null>(null);

  const initialize = useCallback(async (): Promise<boolean> => {
    // If already initialized, return true
    if (isInitialized) return true;
    
    // If loading in progress, return that promise
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    if (typeof window === 'undefined') return false;
    
    // Check if already loaded
    if (window.SC && window.SC.Widget) {
      setIsInitialized(true);
      return true;
    }

    setIsLoading(true);
    
    // Mobile-specific timeout
    const MOBILE_TIMEOUT = isMobileDevice() ? 15000 : 5000; // 15 seconds for mobile, 5 for desktop
    
    // Create a new promise for initialization
    initPromiseRef.current = new Promise((resolve) => {
      // Check again in case it loaded while we were setting up
      if (window.SC && window.SC.Widget) {
        setIsInitialized(true);
        setIsLoading(false);
        initPromiseRef.current = null;
        resolve(true);
        return;
      }

      // Load SoundCloud SDK if not present
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      
      script.onload = () => {
        // SoundCloud SDK needs a moment to initialize
        const checkInterval = setInterval(() => {
          if (window.SC && window.SC.Widget) {
            clearInterval(checkInterval);
            setIsInitialized(true);
            setIsLoading(false);
            initPromiseRef.current = null;
            resolve(true);
          }
        }, 100);

        // Extended timeout for mobile networks
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.SC || !window.SC.Widget) {
            console.warn('SoundCloud SDK loading timeout');
            setIsLoading(false);
            initPromiseRef.current = null;
            resolve(false);
          }
        }, MOBILE_TIMEOUT);
      };
      
      script.onerror = () => {
        console.error('Failed to load SoundCloud SDK');
        setIsLoading(false);
        initPromiseRef.current = null;
        resolve(false);
      };
      
      document.head.appendChild(script);
    });

    return initPromiseRef.current;
  }, [isInitialized]);

  const createIframe = useCallback((
    iframeId: string, 
    trackUrl: string, 
    appendToBody: boolean = false
  ): HTMLIFrameElement | null => {
    if (typeof window === 'undefined') return null;

    // Remove existing iframe with same ID
    const existingIframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (existingIframe) {
      existingIframe.remove();
    }

    // Create new iframe
    const iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.width = '100%';
    iframe.height = '166';
    iframe.frameBorder = 'no';
    iframe.scrolling = 'no';
    iframe.allow = 'autoplay';
    iframe.title = 'SoundCloud Player';

    // Build SoundCloud embed URL
    const params = new URLSearchParams({
      url: trackUrl,
      color: 'ff5500',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'false',
      show_reposts: 'false',
      show_teaser: 'false',
      visual: 'false',
      sharing: 'false',
      buying: 'false',
      download: 'false',
      show_playcount: 'false',
      show_artwork: 'false',
      show_playlist: 'false'
    });

    iframe.src = `https://w.soundcloud.com/player/?${params.toString()}`;
    
    // Set styles
    iframe.style.border = 'none';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.borderRadius = '8px';
    iframe.style.overflow = 'hidden';

    // Append to body or return element
    if (appendToBody) {
      document.body.appendChild(iframe);
    }

    return iframe;
  }, []);

  const createWidget = useCallback((
    iframeId: string,
    trackUrl: string,
    options: {
      auto_play?: boolean;
      buying?: boolean;
      sharing?: boolean;
      show_artwork?: boolean;
      show_playcount?: boolean;
      show_user?: boolean;
      single_active?: boolean;
      start_track?: number;
      visual?: boolean;
      volume?: number;
      onFinish?: () => void;
      onError?: (error: any) => void;
    } = {}
  ): SoundCloudWidget | null => {
    if (typeof window === 'undefined') {
      console.warn('Window not available (server-side)');
      return null;
    }

    if (!window.SC || !window.SC.Widget) {
      console.warn('SoundCloud SDK not loaded yet, attempting to initialize...');
      
      // Try to initialize and retry
      initialize().then((initialized) => {
        if (initialized) {
          console.log('SoundCloud initialized, retrying widget creation...');
          // Retry after initialization
          setTimeout(() => {
            createWidget(iframeId, trackUrl, options);
          }, 500);
        }
      });
      
      return null;
    }

    const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (!iframe) {
      console.error(`Iframe with id ${iframeId} not found`);
      return null;
    }

    try {
      const widget = new window.SC.Widget(iframe);

      // Configure widget
      widget.bind(window.SC.Widget.Events.READY, () => {
        console.log('SoundCloud widget ready for:', iframeId);
        
        // Set options
        if (options.volume !== undefined) {
          widget.setVolume(Math.round(options.volume * 100));
        }

        if (options.auto_play) {
          widget.play();
        }

        // Bind events
        if (options.onFinish) {
          widget.bind(window.SC.Widget.Events.FINISH, options.onFinish);
        }

        if (options.onError) {
          widget.bind(window.SC.Widget.Events.ERROR, (error: any) => {
            console.error('SoundCloud widget error:', error);
            options.onError!(error);
          });
        }
      });

      // Store widget reference
      widgetsRef.current[iframeId] = widget;

      return widget;
    } catch (error) {
      console.error('Failed to create SoundCloud widget:', error);
      return null;
    }
  }, [initialize]);

  const destroyWidget = useCallback((iframeId: string): void => {
    const widget = widgetsRef.current[iframeId];
    if (widget) {
      try {
        // Unbind all events if SC is available
        if (window.SC?.Widget?.Events) {
          const events = [
            window.SC.Widget.Events.PLAY,
            window.SC.Widget.Events.PAUSE,
            window.SC.Widget.Events.FINISH,
            window.SC.Widget.Events.ERROR,
            window.SC.Widget.Events.READY
          ].filter(Boolean);

          events.forEach(event => {
            try {
              widget.unbind(event);
            } catch (e) {
              // Ignore unbind errors
            }
          });
        }

        // Try to pause if possible
        if (widget && typeof widget.pause === 'function') {
          try {
            widget.pause();
          } catch (pauseError) {
            console.warn('Failed to pause widget:', pauseError);
          }
        }
      } catch (error) {
        console.error('Error destroying widget:', error);
      }

      // Remove widget from ref
      delete widgetsRef.current[iframeId];
    }

    // Remove iframe from DOM
    const iframe = document.getElementById(iframeId);
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }, []);

  const destroyAll = useCallback((): void => {
    Object.keys(widgetsRef.current).forEach(destroyWidget);
  }, [destroyWidget]);

  const getWidget = useCallback((iframeId: string): SoundCloudWidget | null => {
    return widgetsRef.current[iframeId] || null;
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialize();
    }
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyAll();
    };
  }, [destroyAll]);

  return {
    isInitialized,
    initialize,
    createWidget,
    destroyWidget,
    destroyAll,
    getWidget,
    createIframe
  };
};

export default useSoundCloud;
export { useSoundCloud };