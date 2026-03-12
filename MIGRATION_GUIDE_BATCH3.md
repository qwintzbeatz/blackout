# page.tsx Refactor – Batch 3
# Extracted: saveMarkerToFirestore, handleMusicDropReplacement, map/marker actions
# Estimated additional line reduction: ~620 lines

---

## New files

  hooks/useSaveMarker.ts              ← saveMarkerToFirestore + calculateStreakBonus (~140 lines)
  hooks/useMusicDropReplacement.ts    ← handleMusicDropReplacement (~300 lines)
  hooks/useMapActions.ts              ← handleMapClick, centerMap, centerOnGPS,
                                         updateMarker, deleteMarker, deleteAllMarkers,
                                         goToMarker, handleRefreshAll (~180 lines)

---

## 1. Replace saveMarkerToFirestore (lines ~1891–2030)

DELETE the function from HomeComponent (also delete calculateStreakBonus at ~1233).

ADD import:
  import { useSaveMarker } from '@/hooks/useSaveMarker';

INSIDE HomeComponent:
  const { saveMarkerToFirestore, calculateStreakBonus } = useSaveMarker({
    user,
    userProfile,
    lastMarkerDate,
    setLastMarkerDate,
    setUserProfile,
    setRepNotification,
    setNpcWelcomeNotification,
    loadTopPlayers,
  });

NOTE: saveMarkerToFirestore now also calls maybeShowCrewWelcome and
maybeCompleteAct1Mission internally, so you can remove those duplicate
inline blocks from the original function body when you delete it.

---

## 2. Replace handleMusicDropReplacement (lines ~740–1040)

DELETE the useCallback from HomeComponent.

ADD import:
  import { useMusicDropReplacement } from '@/hooks/useMusicDropReplacement';

INSIDE HomeComponent:
  const { handleMusicDropReplacement } = useMusicDropReplacement({
    user,
    userProfile,
    userProfileRef,
    isCreatingDrop,
    drops,
    musicDrops,
    unlockedTracks,
    selectedMarkerType,
    selectedMarkerColor,
    selectedSurface,
    selectedGraffitiType,
    selectedSpecialType,
    setIsCreatingDrop,
    setDrops,
    setUserProfile,
    setUnlockedTracks,
    setSelectedMusicDrop,
    setShowDropTypeModal,
    setPendingDropPosition,
    setRepNotification,
    setRecentlyUnlocked,
    setSongUnlockModal,
    setVideoUnlockModal,
    replaceMusicDropWithDropType,
    saveMarkerToFirestore,
    loadDrops,
    loadAllMarkers,
  });

---

## 3. Replace map/marker actions (lines ~2561–2745)

DELETE these from HomeComponent:
  - handleMapClick
  - memoizedHandleMapClick (just use handleMapClick directly)
  - centerMap
  - centerOnGPS
  - updateMarker
  - deleteMarker
  - deleteAllMarkers
  - goToMarker
  - handleRefreshAll

ADD import:
  import { useMapActions } from '@/hooks/useMapActions';

INSIDE HomeComponent:
  const {
    handleMapClick,
    centerMap,
    centerOnGPS,
    updateMarker,
    deleteMarker,
    deleteAllMarkers,
    goToMarker,
    handleRefreshAll,
  } = useMapActions({
    user,
    userProfile,
    userMarkers,
    isCreatingDrop,
    isOfflineMode,
    loadingUserProfile,
    showProfileSetup,
    gpsPosition,
    expandedRadius,
    mapRef,
    musicScan,
    setUserMarkers,
    setUserProfile,
    setNextMarkerNumber,
    setMapCenter,
    setZoom,
    setIsScanning,
    setIsRefreshing,
    setPendingDropPosition,
    setShowDropTypeModal,
    setRepNotification,
    loadAllMarkers,
    loadTopPlayers,
    loadDrops,
  });

Also remove the line:
  const memoizedHandleMapClick = useMemo(() => handleMapClick, [handleMapClick]);
and replace any JSX references to memoizedHandleMapClick with handleMapClick.

---

## Running total

  Batch 1:   ~787 lines removed
  Batch 2:   ~740 lines removed
  Batch 3:   ~620 lines removed
  ─────────────────────────────────
  Total:    ~2,147 lines removed
  page.tsx: 6,339 → ~4,192 lines
