import { useState, useEffect, useCallback } from 'react';

interface TimeOfDayResult {
  currentTime: Date;
  hour: number;
  minute: number;
  isNight: boolean;
  isDay: boolean;
  timeString: string;
  sunPosition: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';
  theme: 'day' | 'night';
}

export const useTimeOfDay = (): TimeOfDayResult => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    // Set interval to update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate hour in New Zealand timezone (UTC+13)
  const getNZHour = useCallback((date: Date): number => {
    // New Zealand is UTC+13 (or UTC+12 with DST)
    // For simplicity, we'll use UTC+13 as specified
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    const nzTime = new Date(utcTime + (13 * 3600000));
    return nzTime.getHours();
  }, []);

  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();

  // Day time: 6:00 AM to 6:00 PM
  // Night time: 6:00 PM to 6:00 AM
  const isNight = hour < 6 || hour >= 18;
  const isDay = hour >= 6 && hour < 18;

  // Time string format
  const timeString = currentTime.toLocaleTimeString('en-NZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Pacific/Auckland'
  });

  // Sun position for visual feedback
  const getSunPosition = (): TimeOfDayResult['sunPosition'] => {
    if (hour >= 5 && hour < 7) return 'dawn';
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 13) return 'noon';
    if (hour >= 13 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'dusk';
    return 'night';
  };

  const sunPosition = getSunPosition();
  const theme: 'day' | 'night' = isDay ? 'day' : 'night';

  return {
    currentTime,
    hour,
    minute,
    isNight,
    isDay,
    timeString,
    sunPosition,
    theme
  };
};

// Hook for weather effects
interface WeatherCondition {
  type: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  intensity: number; // 0-100
  description: string;
}

interface WeatherResult extends WeatherCondition {
  isLoaded: boolean;
  refreshWeather: () => void;
}

// Simulated weather - in production, you'd fetch from a weather API
export const useWeather = (): WeatherResult => {
  const [weather, setWeather] = useState<WeatherCondition>({
    type: 'clear',
    intensity: 0,
    description: 'Clear skies'
  });

  const refreshWeather = useCallback(() => {
    // Simulate weather changes
    const conditions: WeatherCondition['type'][] = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    
    const conditionData: Record<WeatherCondition['type'], { intensity: number; description: string }> = {
      clear: { intensity: 0, description: 'Clear skies' },
      cloudy: { intensity: 20, description: 'Cloudy' },
      rain: { intensity: 50, description: 'Light rain' },
      storm: { intensity: 80, description: 'Stormy' },
      fog: { intensity: 30, description: 'Foggy' }
    };

    setWeather({
      type: randomCondition,
      ...conditionData[randomCondition]
    });
  }, []);

  return {
    ...weather,
    isLoaded: true,
    refreshWeather
  };
};
