export class SoundCloudManager {
  private static instance: SoundCloudManager;
  private widgets: Map<string, any> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SoundCloudManager {
    if (!SoundCloudManager.instance) {
      SoundCloudManager.instance = new SoundCloudManager();
    }
    return SoundCloudManager.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      if (window.SC) {
        this.isInitialized = true;
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      script.onload = () => {
        this.isInitialized = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  createWidget(iframeId: string, trackUrl: string, options: any = {}) {
    if (!this.isInitialized || !window.SC) {
      console.warn('SoundCloud not initialized');
      return null;
    }

    const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (!iframe) return null;

    this.destroyWidget(iframeId);

    try {
      const widget = window.SC.Widget(iframe);
      this.widgets.set(iframeId, widget);

      widget.bind(window.SC.Widget.Events.READY, () => {
        widget.setVolume(Math.round((options.volume || 0.5) * 100));
        if (options.autoplay) widget.play();
      });

      widget.bind(window.SC.Widget.Events.FINISH, options.onFinish || (() => {}));
      widget.bind(window.SC.Widget.Events.ERROR, options.onError || ((e: any) => 
        console.error('SoundCloud error:', e)
      ));

      return widget;
    } catch (error) {
      console.error('Failed to create SoundCloud widget:', error);
      return null;
    }
  }

  destroyWidget(iframeId: string): void {
    const widget = this.widgets.get(iframeId);
    if (widget) {
      try {
        if (typeof widget.unbind === 'function' && window.SC) {
          widget.unbind(window.SC.Widget.Events.READY);
          widget.unbind(window.SC.Widget.Events.PLAY);
          widget.unbind(window.SC.Widget.Events.PAUSE);
          widget.unbind(window.SC.Widget.Events.FINISH);
          widget.unbind(window.SC.Widget.Events.ERROR);
        }
        if (typeof widget.destroy === 'function') {
          widget.destroy();
        }
      } catch (error) {
        console.error('Error destroying widget:', error);
      }
      this.widgets.delete(iframeId);
    }
  }

  destroyAll(): void {
    this.widgets.forEach((_, iframeId) => this.destroyWidget(iframeId));
    this.widgets.clear();
    this.isInitialized = false;
  }

  getWidget(iframeId: string): any {
    return this.widgets.get(iframeId);
  }

  hasWidget(iframeId: string): boolean {
    return this.widgets.has(iframeId);
  }

  createIframe(iframeId: string, trackUrl: string, hidden: boolean = true): HTMLIFrameElement | null {
    if (typeof document === 'undefined') return null;

    let iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = iframeId;
      
      const params = new URLSearchParams({
        url: trackUrl,
        auto_play: 'false',
        hide_related: 'true',
        show_comments: 'false',
        show_user: 'false',
        show_reposts: 'false',
        visual: 'false',
        download: 'false',
        buying: 'false',
        liking: 'false',
        sharing: 'false',
        show_playcount: 'false',
        show_artwork: 'false',
        show_playlist: 'false'
      });
      
      iframe.src = `https://w.soundcloud.com/player/?${params.toString()}`;
      iframe.width = '1';
      iframe.height = '1';
      iframe.frameBorder = 'no';
      iframe.scrolling = 'no';
      
      if (hidden) {
        iframe.style.position = 'absolute';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
      }
      
      document.body.appendChild(iframe);
    }
    
    return iframe;
  }
}

declare global {
  interface Window {
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): any;
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          ERROR: string;
        };
      };
    };
  }
}