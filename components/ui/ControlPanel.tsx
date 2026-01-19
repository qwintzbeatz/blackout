'use client';
import { useState } from 'react';
import { EAST_AUCKLAND_LOCATIONS, UserMarker } from '@/lib/utils/types';
import { useGPSTracker } from '@/hooks/useGPSTracker';

// Fix 1: better typing for mapRef
interface ControlPanelProps {
  gpsTracker: ReturnType<typeof useGPSTracker>;
  userMarkers: UserMarker[];
  loadingMarkers: boolean;
  show50mRadius: boolean;
  zoom: number;
  onToggleRadius: () => void;
  onZoomChange: (zoom: number) => void;
  onCenterOnGPS: () => void;
  onDeleteMarker: (id: string) => void;
  onDeleteAllMarkers: () => void;
  onReloadMarkers: () => void;
  onGoToMarker: (marker: UserMarker) => void;
  mapRef: React.RefObject<any>;                    // improved
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  gpsTracker,
  userMarkers,
  loadingMarkers,
  show50mRadius,
  zoom,
  onToggleRadius,
  onZoomChange,
  onCenterOnGPS,
  onDeleteMarker,
  onDeleteAllMarkers,
  onReloadMarkers,
  onGoToMarker,
  mapRef,
}) => {
  const [activeTab, setActiveTab] = useState<'gps' | 'markers' | 'locations'>('gps');

  const toggleTracking = () => {
    gpsTracker.isTracking ? gpsTracker.stopTracking() : gpsTracker.startTracking();
  };

  const centerOnLocation = (coords: [number, number]) => {
    mapRef.current?.setView(coords, 15);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 70,
        left: 70,
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        maxWidth: '320px',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
        {(['gps', 'markers', 'locations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? 'white' : '#4b5563',
              border: 'none',
              borderRadius: '6px 6px 0 0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab === 'gps' ? '📍 GPS' : tab === 'markers' ? '🎯 Markers' : '🗺️ Places'}
          </button>
        ))}
      </div>

      {/* GPS Tab */}
      {activeTab === 'gps' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: gpsTracker.position ? '#ecfdf5' : '#fffbeb',
                borderLeft: `4px solid ${gpsTracker.position ? '#10b981' : '#f59e0b'}`,
                fontSize: '13px',
              }}
            >
              {gpsTracker.position ? 'Live GPS active' : 'Using default location'}
            </div>

            <button
              onClick={toggleTracking}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '12px',
                background: gpsTracker.isTracking ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {gpsTracker.isTracking ? '🛑 Stop Tracking' : '📍 Start Tracking'}
            </button>

            {gpsTracker.error && (
              <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '8px' }}>
                {gpsTracker.error}
              </div>
            )}
          </div>

          {gpsTracker.position && (
            <>
              <button
                onClick={onToggleRadius}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '12px',
                  background: show50mRadius ? '#10b981' : '#f3f4f6',
                  color: show50mRadius ? 'white' : '#374151',
                  border: '1px solid',
                  borderColor: show50mRadius ? '#10b981' : '#d1d5db',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                {show50mRadius ? 'Hide' : 'Show'} 50 m radius
              </button>

              <button
                onClick={onCenterOnGPS}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                🎯 Center on me
              </button>
            </>
          )}
        </>
      )}

      {/* Markers Tab – simplified + safer stopPropagation */}
      {activeTab === 'markers' && (
        <>
          <button
            onClick={onReloadMarkers}
            disabled={loadingMarkers}
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '16px',
              background: loadingMarkers ? '#e5e7eb' : '#3b82f6',
              color: loadingMarkers ? '#6b7280' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            {loadingMarkers ? 'Loading…' : '↻ Reload Markers'}
          </button>

          <div style={{ fontWeight: 600, marginBottom: '8px' }}>
            Your Markers ({userMarkers.length})
            {userMarkers.length > 0 && (
              <button
                onClick={onDeleteAllMarkers}
                style={{
                  float: 'right',
                  color: '#ef4444',
                  background: 'none',
                  border: '1px solid #ef4444',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '12px',
                }}
              >
                Delete All
              </button>
            )}
          </div>

          {userMarkers.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
              No markers yet
            </div>
          ) : (
            <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              {userMarkers.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onGoToMarker(m)}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#10b981' }}>{m.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {m.position[0].toFixed(5)}, {m.position[1].toFixed(5)}
                  </div>
                  {m.distanceFromCenter != null && (
                    <div style={{ fontSize: '11px', color: m.distanceFromCenter <= 50 ? '#10b981' : '#d97706' }}>
                      {Math.round(m.distanceFromCenter)} m
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      onDeleteMarker(m.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '16px',
                      cursor: 'pointer',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <select
          onChange={(e) => {
            const loc = EAST_AUCKLAND_LOCATIONS[e.target.value as keyof typeof EAST_AUCKLAND_LOCATIONS];
            if (loc) centerOnLocation(loc.coords);
          }}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
          }}
        >
          <option value="">Jump to location…</option>
          {Object.keys(EAST_AUCKLAND_LOCATIONS).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      )}

      {/* Zoom – bottom common control */}
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '13px', marginBottom: '8px' }}>Zoom: {zoom}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              const z = Math.max(10, zoom - 1);
              onZoomChange(z);
              mapRef.current?.setZoom(z);
            }}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid #d1d5db' }}
          >
            –
          </button>
          <button
            onClick={() => {
              const z = Math.min(18, zoom + 1);
              onZoomChange(z);
              mapRef.current?.setZoom(z);
            }}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid #d1d5db' }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;