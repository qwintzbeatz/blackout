// ===========================================
// BLACKOUT NZ - Component Exports
// ===========================================

// Authentication Components
export { default as LoginScreen } from './auth/LoginScreen';
export { default as ProfileSetup } from './auth/ProfileSetup';
export { default as ProfileSetupSticker } from './ProfileSetupSticker';

// Navigation Components
export { default as BottomNavigation } from './navigation/BottomNavigation';

// Profile Components
export { default as ProfileStats } from './profile/ProfileStats';
export { ProfilePanel } from './profile/ProfilePanel';

// Modal Components
export { default as DropTypeModal } from './modals/DropTypeModal';

// UI Components
export { default as LegendPanel } from './ui/LegendPanel';
export { default as RepNotification } from './ui/RepNotification';
export { default as SongUnlockModal } from './ui/SongUnlockModal';
export { default as PhotoSelectionModal } from './ui/PhotoSelectionModal';
export { default as SurfaceGraffitiSelector } from './ui/SurfaceGraffitiSelector';
export { default as ErrorBoundary } from './ui/ErrorBoundary';

// Map Components
export { default as MarkerPopupCard } from './MarkerPopupCard';
export { default as DropPopup } from './map/DropPopup';
export { default as SprayCanIcon } from './map/SprayCanIcon';

// Music Components
export { default as SpotifyPlayer } from './music/SpotifyPlayer';
export { default as SoundCloudPlayer } from './music/SoundCloudPlayer';
export { default as MusicDropPopup } from './music/MusicDropPopup';

// Photo Components
export { default as PhotoDropPopup } from './photo/PhotoDropPopup';

// Story Components
export { default as StoryPanel } from './story/StoryPanel';
export { StoryManagerProvider } from './story/StoryManager';

// Chat Components
export { default as CrewChatPanel } from './chat/CrewChatPanel';
export { default as DirectMessaging } from './DirectMessaging';

// Marker Components
export { default as MarkerDropPopup } from './marker/MarkerDropPopup';

// Type exports
export type { UserProfile } from '@/lib/types/blackout';
