// Add the useGPSTracker content from above
import { useState, useCallback, useRef, useEffect } from 'react';

type GeoError = {
  code?: number;
  message?: string;
};

const getGeolocationErrorMessage = (err: GeoError | null | undefined, context: 'initial' | 'watch' = 'initial'): string => {
  if (!err) {
    return context === 'watch' ? 'GPS tracking failed' : 'Failed to get location';
  }

  if (err.message) {
    return err.message;
  }

  switch (err.code) {
    case 1: // PERMISSION_DENIED
      return context === 'watch'
        ? 'Location permission denied'
        : 'Location permission denied. Please enable location services in your browser settings.';
    case 2: // POSITION_UNAVAILABLE
      return context === 'watch'
        ? 'Location information unavailable'
        : 'Location information unavailable. Check your GPS signal or network connection.';
    case 3: // TIMEOUT
      return 'Location request timed out. Please try again.';
    default:
      return context === 'watch'
        ? 'Unknown GPS error'
        : 'Unable to get your location. Please check your device settings.';
  }
};

export const useGPSTracker = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  const getInitialLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported in this browser');
      setIsLoading(false);
      return;
    }

    if (
      window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setError('GPS requires HTTPS. Use localhost or deploy to production.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
        setIsLoading(false);
      },
      (err: GeolocationPositionError) => {
        console.error('GPS initial error:', err);
        const errorMessage = getGeolocationErrorMessage(err, 'initial');
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setSpeed(null);
    setHeading(null);
  }, []);

  const startTracking = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported in this browser');
      return;
    }

    if (
      window.location.protocol === 'http:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setError('GPS requires HTTPS. Use localhost or deploy to production.');
      return;
    }

    setIsTracking(true);
    setError(null);

    // First get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);

        // Start continuous tracking
        const watchId = navigator.geolocation.watchPosition(
          (watchPos) => {
            setPosition([watchPos.coords.latitude, watchPos.coords.longitude]);
            setAccuracy(watchPos.coords.accuracy);
            setSpeed(watchPos.coords.speed || null);
            setHeading(watchPos.coords.heading || null);
          },
          (err: GeolocationPositionError) => {
            console.error('GPS watch error:', err);
            const errorMessage = getGeolocationErrorMessage(err, 'watch');
            setError(errorMessage);
            stopTracking();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );

        watchIdRef.current = watchId;
      },
      (err: GeolocationPositionError) => {
        console.error('GPS initial error:', err);
        const errorMessage = getGeolocationErrorMessage(err, 'initial');
        setError(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [stopTracking]);

  // Start tracking automatically when component mounts
  useEffect(() => {
    // Get initial location when component mounts
    getInitialLocation();

    // Start tracking automatically
    const timer = setTimeout(() => {
      startTracking();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [getInitialLocation, startTracking]);

  return {
    position,
    accuracy,
    speed,
    heading,
    error,
    isTracking,
    isLoading,
    startTracking,
    stopTracking
  };
};