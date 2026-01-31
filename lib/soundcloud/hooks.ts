import { useEffect, useRef } from 'react';
import { SoundCloudManager } from './SoundCloudManager';

export const useSoundCloud = () => {
  const manager = useRef(SoundCloudManager.getInstance());

  useEffect(() => {
    manager.current.initialize();

    return () => {
      manager.current.destroyAll();
    };
  }, []);

  return manager.current;
};

export const useSoundCloudWidget = (iframeId: string, trackUrl: string, options: any = {}) => {
  const soundCloud = useSoundCloud();
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!trackUrl || !trackUrl.includes('soundcloud.com')) return;

    const iframe = soundCloud.createIframe(iframeId, trackUrl, true);
    if (!iframe) return;

    const widget = soundCloud.createWidget(iframeId, trackUrl, options);
    widgetRef.current = widget;

    return () => {
      soundCloud.destroyWidget(iframeId);
    };
  }, [iframeId, trackUrl, options.volume, options.autoplay]);

  return widgetRef.current;
};