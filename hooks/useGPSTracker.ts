// Add the useGPSTracker content from above
import { useState, useCallback, useRef, useEffect } from 'react';

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
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser');
      setIsLoading(false);
      return;
    }

    if (window.location.protocol === 'http:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
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
      (err) => {
        console.error('GPS initial error:', err);
        let errorMessage = 'Failed to get location';
        
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err && err.code) {
          switch(err.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied. Please enable location services.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location information unavailable. Check your GPS signal.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Unable to get your location. Please check your device settings.';
          }
        } else {
          errorMessage = 'Could not access location. Please ensure location services are enabled.';
        }
        
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

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser');
      return;
    }

    if (window.location.protocol === 'http:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
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
          (err) => {
            console.error('GPS watch error:', err);
            let errorMessage = 'GPS tracking failed';
            
            if (err && err.message) {
              errorMessage = err.message;
            } else if (err && err.code) {
              switch(err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied';
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable';
                  break;
                case err.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  break;
                default:
                  errorMessage = 'Unknown GPS error';
              }
            }
            
            setError(errorMessage);
            stopTracking();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            distanceFilter: 1
          }
        );
        
        watchIdRef.current = watchId;
      },
      (err) => {
        console.error('GPS initial error:', err);
        let errorMessage = 'Failed to get location';
        
        if (err && err.message) {
          errorMessage = err.message;
        } else if (err && err.code) {
          switch(err.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location information unavailable. Check your GPS signal or network connection.';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Unable to get your location. Please check your device settings.';
          }
        } else {
          errorMessage = 'Could not access location. Please ensure location services are enabled and try again.';
        }
        
        setError(errorMessage);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setSpeed(null);
    setHeading(null);
  }, []);

  // Start tracking automatically when component mounts
  useEffect(() => {
    // Get initial location when component mounts
    getInitialLocation();
    
    // Start tracking automatically
    setTimeout(() => {
      startTracking();
    }, 1000);

    return () => {
      if (watchIdRef.current !== null) {
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