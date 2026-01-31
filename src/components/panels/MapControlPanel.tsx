'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface MapControlPanelProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  center: [number, number];
  onCenterChange: (center: [number, number]) => void;
  show50mRadius: boolean;
  onToggle50mRadius: () => void;
  markerQuality: 'low' | 'medium' | 'high';
  onMarkerQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  showOnlyMyDrops: boolean;
  onToggleShowOnlyMyDrops: () => void;
  useDarkTiles: boolean;
  onToggleDarkTiles: () => void;
  onClose: () => void;
}

const NZ_LOCATIONS = [
  { name: 'Auckland', coords: [-36.8485, 174.7633] as [number, number] },
  { name: 'Wellington', coords: [-41.2865, 174.7762] as [number, number] },
  { name: 'Christchurch', coords: [-43.5320, 172.6306] as [number, number] },
  { name: 'Queenstown', coords: [-45.0312, 168.6626] as [number, number] },
  { name: 'Dunedin', coords: [-45.8788, 170.5028] as [number, number] }
];

// Optimized panel styling
const panelStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: '#e0e0e0',
  padding: '20px',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  width: 'min(90vw, 360px)',
  maxHeight: '80vh',
  overflowY: 'auto' as const,
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(12px)',
  zIndex: 1400,
  position: 'relative' as const
};

const MapControlPanelOptimized: React.FC<MapControlPanelProps> = ({
  zoom,
  onZoomChange,
  center,
  onCenterChange,
  show50mRadius,
  onToggle50mRadius,
  markerQuality,
  onMarkerQualityChange,
  showOnlyMyDrops,
  onToggleShowOnlyMyDrops,
  useDarkTiles,
  onToggleDarkTiles,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'performance' | 'locations'>('view');
  const [customCoords, setCustomCoords] = useState({ lat: '', lng: '' });

  // Handle zoom change with debouncing
  const handleZoomChange = useCallback((newZoom: number) => {
    onZoomChange(Math.max(4, Math.min(18, newZoom)));
  }, [onZoomChange]);

  // Handle location jump
  const handleLocationJump = useCallback((coords: [number, number]) => {
    onCenterChange(coords);
    onZoomChange(12); // Zoom in for better view
  }, [onCenterChange, onZoomChange]);

  // Handle custom coordinates
  const handleCustomLocationJump = useCallback(() => {
    const lat = parseFloat(customCoords.lat);
    const lng = parseFloat(customCoords.lng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -47.5 && lat <= -34.0 && lng >= 165.0 && lng <= 179.0) {
      onCenterChange([lat, lng]);
      setCustomCoords({ lat: '', lng: '' });
    } else {
      alert('Invalid coordinates. Please enter valid NZ coordinates.');
    }
  }, [customCoords, onCenterChange]);

  // Get quality description
  const getQualityDescription = useCallback((quality: 'low' | 'medium' | 'high') => {
    switch (quality) {
      case 'low':
        return 'Best performance, fewer items';
      case 'medium':
        return 'Balanced performance and quality';
      case 'high':
        return 'Best quality, may impact performance';
      default:
        return '';
    }
  }, []);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          🗺️ Map Controls
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '4px',
        borderRadius: '8px'
      }}>
        {(['view', 'performance', 'locations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: activeTab === tab ? '#2196F3' : 'transparent',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* View Tab */}
      {activeTab === 'view' && (
        <div>
          {/* Zoom Control */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>
                🔍 Zoom Level
              </span>
              <span style={{ fontSize: '12px', color: '#b0b0b0' }}>
                {zoom}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => handleZoomChange(zoom - 1)}
                disabled={zoom <= 4}
                style={{
                  padding: '6px 12px',
                  backgroundColor: zoom <= 4 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: zoom <= 4 ? 'not-allowed' : 'pointer'
                }}
              >
                -
              </button>
              
              <input
                type="range"
                min="4"
                max="18"
                value={zoom}
                onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px'
                }}
              />
              
              <button
                onClick={() => handleZoomChange(zoom + 1)}
                disabled={zoom >= 18}
                style={{
                  padding: '6px 12px',
                  backgroundColor: zoom >= 18 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: zoom >= 18 ? 'not-allowed' : 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Display Options */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#ffffff'
            }}>
              🎨 Display Options
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={show50mRadius}
                  onChange={onToggle50mRadius}
                  style={{ marginRight: '8px' }}
                />
                Show 50m GPS radius
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={showOnlyMyDrops}
                  onChange={onToggleShowOnlyMyDrops}
                  style={{ marginRight: '8px' }}
                />
                Show only my drops
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={useDarkTiles}
                  onChange={onToggleDarkTiles}
                  style={{ marginRight: '8px' }}
                />
                Dark map tiles
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#ffffff'
            }}>
              ⚡ Marker Quality
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(['low', 'medium', 'high'] as const).map(quality => (
                <label
                  key={quality}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: markerQuality === quality ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
                    fontSize: '12px'
                  }}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={quality}
                    checked={markerQuality === quality}
                    onChange={() => onMarkerQualityChange(quality)}
                    style={{ marginRight: '8px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {quality}
                    </div>
                    <div style={{ fontSize: '10px', color: '#b0b0b0' }}>
                      {getQualityDescription(quality)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#b0b0b0'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ffffff' }}>
              💡 Performance Tips
            </div>
            <div>• Lower quality improves speed on older devices</div>
            <div>• High quality shows more items but may lag</div>
            <div>• Medium is recommended for most devices</div>
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <div>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#ffffff'
            }}>
              📍 Quick Locations
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px'
            }}>
              {NZ_LOCATIONS.map(location => (
                <button
                  key={location.name}
                  onClick={() => handleLocationJump(location.coords)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#ffffff'
            }}>
              🎯 Custom Coordinates
            </div>
            
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <input
                type="number"
                placeholder="Latitude"
                value={customCoords.lat}
                onChange={(e) => setCustomCoords(prev => ({ ...prev, lat: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <input
                type="number"
                placeholder="Longitude"
                value={customCoords.lng}
                onChange={(e) => setCustomCoords(prev => ({ ...prev, lng: e.target.value }))}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <button
              onClick={handleCustomLocationJump}
              disabled={!customCoords.lat || !customCoords.lng}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2196F3',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: (!customCoords.lat || !customCoords.lng) ? 'not-allowed' : 'pointer',
                opacity: (!customCoords.lat || !customCoords.lng) ? 0.5 : 1
              }}
            >
              Jump to Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapControlPanelOptimized;