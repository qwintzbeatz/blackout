# page.tsx Refactor – Batch 4
# Extracted: PhotosPanel, MapControlPanel, MusicPanel
# Estimated additional line reduction: ~1,000 lines

---

## New files

  components/panels/PhotosPanel.tsx       ← Photos & Gallery panel (~190 lines)
  components/panels/MapControlPanel.tsx   ← Map Control + Performance panel (~200 lines)
  components/panels/MusicPanel.tsx        ← Music Collection panel (~180 lines)

---

## 1. Add imports to page.tsx

  import PhotosPanel from '@/components/panels/PhotosPanel';
  import MapControlPanel from '@/components/panels/MapControlPanel';
  import MusicPanel from '@/components/panels/MusicPanel';

---

## 2. Replace PhotosPanel (lines ~4396–4759)

DELETE the entire IIFE block:
  {showPhotosPanel && (() => { ... })()}

REPLACE WITH:
  {showPhotosPanel && (
    <PhotosPanel
      user={user}
      userProfile={userProfile}
      drops={drops}
      gpsPosition={gpsPosition}
      mapRef={mapRef}
      panelStyle={panelStyle}
      togglePanel={togglePanel}
      handleProfilePicUpload={handleProfilePicUpload}
      setPendingDropPosition={setPendingDropPosition}
      setShowPhotoModal={setShowPhotoModal}
      setSelectedPhotoDrop={setSelectedPhotoDrop}
      handleRefreshAll={handleRefreshAll}
    />
  )}

---

## 3. Replace MapControlPanel (lines ~4762–5118)

DELETE the entire block:
  {showMapPanel && ( <div style={{...panelStyle ...}}> ... </div> )}

REPLACE WITH:
  {showMapPanel && (
    <MapControlPanel
      userMarkers={userMarkers}
      topPlayers={topPlayers}
      gpsStatus={gpsStatus}
      unlockedTracks={unlockedTracks}
      isRefreshing={isRefreshing}
      showLegend={showLegend}
      show50mRadius={show50mRadius}
      showTopPlayers={showTopPlayers}
      showSatelliteView={showSatelliteView}
      crewDetectionEnabled={crewDetectionEnabled}
      markerQuality={markerQuality}
      mapRef={mapRef}
      panelStyle={panelStyle}
      togglePanel={togglePanel}
      setShowLegend={setShowLegend}
      setShow50mRadius={setShow50mRadius}
      setShowTopPlayers={setShowTopPlayers}
      setShowSatelliteView={setShowSatelliteView}
      setCrewDetectionEnabled={setCrewDetectionEnabled}
      setMarkerQuality={setMarkerQuality}
      handleRefreshAll={handleRefreshAll}
    />
  )}

---

## 4. Replace MusicPanel (lines ~5120–5384)

DELETE the entire block starting at:
  {/* Music Panel - Always rendered, dynamic z-index */}
  <div key={`music-panel-...`} ...>
  ...
  </div>

REPLACE WITH:
  <MusicPanel
    showMusicPanel={showMusicPanel}
    isMobile={isMobile}
    userProfile={userProfile}
    unlockedTracks={unlockedTracks}
    currentTrackIndex={currentTrackIndex}
    isPlaying={isPlaying}
    panelStyle={panelStyle}
    togglePanel={togglePanel}
    setVideoUnlockModal={setVideoUnlockModal}
    setCurrentTrackIndex={setCurrentTrackIndex}
    setShowSpotifyWidget={setShowSpotifyWidget}
    setIsPlaying={setIsPlaying}
    togglePlay={togglePlay}
  />

---

## Running total

  Batch 1:   ~787 lines removed
  Batch 2:   ~740 lines removed
  Batch 3:   ~620 lines removed
  Batch 4: ~1,000 lines removed
  ─────────────────────────────────
  Total:    ~3,147 lines removed
  page.tsx: 6,339 → ~3,192 lines
