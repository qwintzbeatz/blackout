# page.tsx Refactor Guide – Batch 2
# Handlers: handleProfileSetup, handlePhotoSelect, handleMarkerDrop, handleMusicDrop
# + Shared utility: dropRewards.ts (eliminates duplicated crew-welcome & mission logic)
# Estimated additional line reduction: ~700–800 lines

---

## New files to add to your project

  hooks/useProfileSetup.ts          ← handleProfileSetup (~140 lines removed)
  hooks/usePhotoDropHandler.ts      ← handlePhotoSelect  (~240 lines removed)
  hooks/useMarkerDropHandler.ts     ← handleMarkerDrop   (~230 lines removed)
  hooks/useMusicDropHandler.ts      ← handleMusicDrop    (~130 lines removed)
  lib/utils/dropRewards.ts          ← shared crew-welcome + mission logic (~60 lines removed per call site)

---

## 1. Add lib/utils/dropRewards.ts

Drop this file in your project – no changes needed to call sites yet.
It exports two helpers used internally by the hooks above:
  - maybeShowCrewWelcome(...)
  - maybeCompleteAct1Mission(...)

---

## 2. Replace handleProfileSetup (lines ~1387–1528)

DELETE the function body from HomeComponent.

ADD import:
  import { useProfileSetup } from '@/hooks/useProfileSetup';

INSIDE HomeComponent:
  const { handleProfileSetup } = useProfileSetup({
    user,
    setProfileLoading,
    setUserProfile,
    setSelectedMarkerColor,
    setUnlockedTracks,
    setCurrentTrackIndex,
    setIsPlaying,
    setShowProfileSetup,
    setProfileUsername,
    setProfileCrewName,
    setSelectedCrew,
    setProfileCrewChoice,
    loadTopPlayers,
    loadAllMarkers,
  });

---

## 3. Replace handlePhotoSelect (lines ~2032–2269)

DELETE the function body from HomeComponent.

ADD import:
  import { usePhotoDropHandler } from '@/hooks/usePhotoDropHandler';

INSIDE HomeComponent:
  const { handlePhotoSelect } = usePhotoDropHandler({
    user,
    userProfile,
    isCreatingDrop,
    pendingDropPosition,
    gpsPosition,
    selectedMusicDrop,
    setIsCreatingDrop,
    setIsUploadingPhoto,
    setDrops,
    setUserProfile,
    setUnlockedTracks,
    setShowPhotoModal,
    setPendingDropPosition,
    setSelectedMusicDrop,
    setSongUnlockModal,
    setRecentlyUnlocked,
    setRepNotification,
    setNpcWelcomeNotification,
    replaceMusicDropWithDropType,
    loadDrops,
  });

---

## 4. Replace handleMarkerDrop (lines ~2271–2425)

DELETE the function body from HomeComponent.

ADD import:
  import { useMarkerDropHandler } from '@/hooks/useMarkerDropHandler';

INSIDE HomeComponent:
  const { handleMarkerDrop } = useMarkerDropHandler({
    user,
    userProfile,
    userProfileRef,
    isCreatingDrop,
    pendingDropPosition,
    selectedMusicDrop,
    selectedMarkerType,
    selectedMarkerColor,
    selectedSurface,
    selectedGraffitiType,
    selectedSpecialType,
    setIsCreatingDrop,
    setUserProfile,
    setUnlockedTracks,
    setShowDropTypeModal,
    setPendingDropPosition,
    setSelectedMusicDrop,
    setSongUnlockModal,
    setRecentlyUnlocked,
    setRepNotification,
    setNpcWelcomeNotification,
    saveMarkerToFirestore,
    handleMusicDropReplacement,
    loadDrops,
    loadAllMarkers,
    loadTopPlayers,
  });

---

## 5. Replace handleMusicDrop (lines ~2435–2559)

DELETE the function body from HomeComponent.

ADD import:
  import { useMusicDropHandler } from '@/hooks/useMusicDropHandler';

INSIDE HomeComponent:
  const { handleMusicDrop } = useMusicDropHandler({
    user,
    userProfile,
    isCreatingDrop,
    pendingDropPosition,
    selectedMusicDrop,
    selectedTrackForMusicDrop,
    unlockedTracks,
    setIsCreatingDrop,
    setUserProfile,
    setUnlockedTracks,
    setSelectedTrackForMusicDrop,
    setShowDropTypeModal,
    setPendingDropPosition,
    setSelectedMusicDrop,
    setRepNotification,
    setNpcWelcomeNotification,
    handleMusicDropReplacement,
    loadDrops,
  });

---

## Summary

  Batch 1 (previous):   ~787 lines removed
  Batch 2 (this guide): ~740 lines removed
  ──────────────────────────────────────────
  Running total:        ~1,527 lines removed
  page.tsx: 6,339 → ~4,812 lines

Next candidates for extraction:
  - handleMapClick       (~50 lines)
  - saveMarkerToFirestore (~140 lines)
  - handleMusicDropReplacement (~300 lines)
  - The JSX render sections (profile panel, map panel, modals)
