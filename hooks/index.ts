export { useMarkers } from './useMarkers';
export { useDrops } from './useDrops';
export { useOptimizedFirestore } from '../src/hooks/useOptimizedFirestore';
export { useOptimizedUserProfile } from './useOptimizedUserProfile';
export { useAdaptivePerformance } from '../src/hooks/useAdaptivePerformance';
export { useErrorHandler } from '../src/hooks/useErrorHandler';
export { useOptimizedApp } from '../src/hooks/useOptimizedApp';

// New hooks for better code organization
export { useMusicPlayer, getRandomStartTrack } from './useMusicPlayer';
export type { UseMusicPlayerOptions, UseMusicPlayerReturn } from './useMusicPlayer';

export { useDropCreation } from './useDropCreation';
export type { UseDropCreationOptions, UseDropCreationReturn, DropPosition } from './useDropCreation';