# BLACKOUT NZ - QUICK EDITS CHEATSHEET

## 🎨 UI & STYLING

# 1. Change all marker colors:
edit app/globals.css → .spray-can-icon styles

# 2. Add new graffiti fonts:
edit app/globals.css → Add new @font-face declarations (lines 200-400)

# 3. Modify button styles:
edit components/map/MapComponent.tsx → Button style objects (lines 200-300)

# 4. Change map tile style:
edit components/map/MapComponent.tsx → useDarkTiles prop or TileLayer URL

# 5. Add new CSS animations:
edit app/globals.css → Add @keyframes (lines 100-150)

# 6. Modify popup styles:
edit app/globals.css → .leaflet-popup-content styles

# 7. Change color scheme:
edit constants/crewGraffitiStyles.ts → Update crew color values

# 8. Add new marker effects:
edit components/map/LayeredMarkerIcon.tsx → Add new effect classes

## 🎯 MARKERS & GRAFFITI

# 9. Add new marker types:
edit constants/markers.ts → Add to MARKER_NAMES and MARKER_DESCRIPTIONS

# 10. Add new graffiti styles:
edit constants/graffitiTypes.ts → Add to GRAFFITI_TYPES object

# 11. Add new surfaces:
edit constants/surfaces.ts → Add to SURFACE_TYPES

# 12. Modify REP values:
edit constants/graffitiTypes.ts → Update baseRep values

# 13. Add new special effects:
edit lib/types/blackout.ts → Add to SpecialMarkerType union

# 14. Change marker clustering:
edit components/map/MapComponent.tsx → Modify MarkerClusterGroup options

## 👥 CREW & USER SYSTEM

# 15. Add new crews:
edit data/crews.ts → Add new Crew object

# 16. Modify crew bonuses:
edit data/crews.ts → Update bonus and motivation fields

# 17. Add new ranks:
edit lib/utils.ts → Update calculateRank() function

# 18. Modify user stats:
edit lib/types/blackout.ts → Add fields to UserProfile interface

# 19. Change crew colors:
edit constants/crewGraffitiStyles.ts → Update color values

# 20. Add new player characters:
edit data/characters.ts → Add new PlayerCharacter object

## 🎵 MUSIC & AUDIO

# 21. Add new SoundCloud tracks:
edit constants/tracks.ts → Add to TRACKS array

# 22. Add new Spotify tracks:
edit constants/spotify_tracks.ts → Add to SPOTIFY_TRACKS array

# 23. Modify music player:
edit components/music/MusicPlayer.tsx → Update player logic

# 24. Change track unlock requirements:
edit hooks/useMusicPlayer.ts → Modify unlock conditions

## 📍 LOCATIONS & MAP

# 25. Add new locations:
edit constants/locations.ts → Add to NEW_ZEALAND_LOCATIONS

# 26. Modify GPS accuracy:
edit hooks/useGPSTracker.ts → Update accuracy settings

# 27. Change map center:
edit app/page.tsx → Update initialMapCenter

# 28. Add new map markers:
edit constants/markers.ts → Add to MARKERS array

## 💬 CHAT & COMMUNICATION

# 29. Modify crew chat:
edit components/chat/CrewChatPanel.tsx → Update chat styles

# 30. Add new chat features:
edit components/chat/CrewChat.tsx → Add new message types

# 31. Change notification system:
edit components/ui/RepNotification.tsx → Update notification logic

# 32. Modify direct messaging:
edit components/DirectMessaging.tsx → Update DM styles

## 🎮 GAME MECHANICS

# 33. Modify REP calculation:
edit lib/utils.ts → Update calculateRepForMarker() function

# 34. Add new game modes:
edit hooks/useMissionTriggers.ts → Add new mission types

# 35. Change difficulty settings:
edit constants/graffitiTypes.ts → Update difficulty values

# 36. Modify performance settings:
edit hooks/useLoadingManager.ts → Update performance thresholds

# 37. Add new story missions:
edit data/storyMissions.ts → Add new mission objects

# 38. Modify story progression:
edit hooks/useStoryManager.ts → Update story logic

# 39. Add error handling:
edit components/ui/EnhancedErrorBoundary.tsx → Update error recovery

# 40. Modify offline mode:
edit components/ui/OfflineJoystick.tsx → Update offline navigation

## 🚨 ERROR HANDLING & RECOVERY

# 41. Modify error boundary:
edit components/ui/EnhancedErrorBoundary.tsx → Update error recovery logic

# 42. Add error recovery actions:
edit components/ui/ErrorRecoveryPanel.tsx → Add new recovery options

# 43. Modify error notifications:
edit components/ui/RepNotification.tsx → Update error display

# 44. Add custom error types:
edit lib/types/blackout.ts → Add new error interfaces

## 🎵 MUSIC SYSTEM ENHANCEMENTS

# 45. Add new unlock modals:
edit components/ui/SongUnlockModal.tsx → Update modal styling

# 46. Add video unlock system:
edit components/ui/VideoUnlockModal.tsx → Update video player

# 47. Modify music player controls:
edit hooks/useMusicPlayerControls.ts → Update player logic

# 48. Add music drop replacement:
edit hooks/useMusicDropReplacement.ts → Update replacement logic

# 49. Modify Spotify player:
edit components/music/SpotifyPlayer.tsx → Update player interface

# 50. Modify SoundCloud player:
edit components/music/SoundCloudPlayer.tsx → Update player interface

## 🎮 PERFORMANCE OPTIMIZATION

# 51. Modify graphics quality settings:
edit hooks/usePerformanceMonitor.ts → Update quality detection

# 52. Add performance settings panel:
edit components/ui/PerformanceSettingsPanel.tsx → Update settings UI

# 53. Modify marker quality limits:
edit hooks/useLoadingManager.ts → Update marker limits

# 54. Add crew detection toggle:
edit hooks/useCrewChatUnreadTracker.ts → Update detection logic

# 55. Optimize map rendering:
edit components/map/MapComponent.tsx → Update rendering settings

## 📱 OFFLINE MODE & NAVIGATION

# 56. Modify offline joystick:
edit components/ui/OfflineJoystick.tsx → Update joystick controls

# 57. Add offline state management:
edit app/page.tsx → Update offline mode logic

# 58. Modify GPS tracking:
edit hooks/useGPSTracker.ts → Update offline behavior

# 59. Add offline map caching:
edit components/map/MapComponent.tsx → Update caching logic

# 60. Modify radar scanner:
edit components/map/RadarScanner.tsx → Update scanning animation

## 🎨 UI ENHANCEMENTS

# 61. Add surface graffiti selector:
edit components/ui/SurfaceGraffitiSelector.tsx → Update selector UI

# 62. Modify dual panel system:
edit app/page.tsx → Update panel toggle logic

# 63. Add enhanced legend:
edit components/ui/LegendPanel.tsx → Update legend display

# 64. Modify bottom navigation:
edit components/navigation/BottomNavigation.tsx → Update navigation buttons

# 65. Add story panel:
edit components/panels/StoryPanel.tsx → Update story display

## 🔧 PERFORMANCE & OPTIMIZATION

# 66. Optimize marker rendering:
edit components/map/MemoizedMarker.tsx → Update memoization logic

# 67. Modify loading states:
edit hooks/useLoadingManager.ts → Update loading thresholds

# 68. Optimize map performance:
edit components/map/MapComponent.tsx → Update clustering settings

# 69. Modify image compression:
edit utils/index.ts → Update compression settings

## 📱 MOBILE & RESPONSIVE

# 70. Modify mobile styles:
edit app/globals.css → Update @media queries

# 71. Change touch behavior:
edit app/globals.css → Update touch-action properties

# 72. Optimize for mobile:
edit next.config.ts → Update mobile optimization settings

## 🔐 AUTHENTICATION & SECURITY

# 73. Modify login flow:
edit components/auth/LoginSignup.tsx → Update authentication logic

# 74. Change profile setup:
edit components/auth/ProfileSetup.tsx → Update setup process

# 75. Modify permissions:
edit lib/firebase/config.ts → Update security rules

## 📊 DATA & ANALYTICS

# 76. Add new analytics:
edit lib/utils.ts → Add tracking functions

# 77. Modify database structure:
edit lib/types/blackout.ts → Update interfaces

# 78. Add new data migrations:
edit utils/migration.ts → Add migration functions

# 79. Change data persistence:
edit hooks/useOptimizedFirestore.ts → Update caching logic

## ⚠️ SAFE EDITING RULES

Test after each change: npm run build

Backup before major edits: cp file.ts file.ts.backup

One change at a time - Isolate issues

Dynamic imports stay in main page - Don't move Leaflet imports

Font files must be in public/fonts/ directory

Image assets must be in public/ directory

Firebase rules require deployment: firebase deploy --rules

## 🚀 QUICK COMMANDS

# Build project: npm run build
# Start dev server: npm run dev
# Run linting: npm run lint
# Analyze bundle: npm run build:analyze
# Deploy to Vercel: vercel

## 📁 KEY FILE LOCATIONS

# Main page: app/page.tsx
# Map component: components/map/MapComponent.tsx
# User markers: components/map/UserMarkerComponent.tsx
# Crew system: data/crews.ts
# Graffiti styles: constants/graffitiTypes.ts
# Music system: components/music/
# Authentication: components/auth/
# Firebase config: lib/firebase/config.ts
# Type definitions: lib/types/blackout.ts
# Utility functions: lib/utils.ts
# Performance: hooks/useLoadingManager.ts