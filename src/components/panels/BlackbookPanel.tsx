'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { UserMarker, MarkerName, MarkerDescription } from '@/lib/utils/types';

interface BlackbookPanelProps {
  userMarkers: UserMarker[];
  onDeleteMarker: (markerId: string) => void;
  onDeleteAllMarkers: () => void;
  onClose: () => void;
  userProfile: {
    username: string;
    profilePicUrl: string;
    rank: string;
    level: number;
    rep: number;
    totalMarkers: number;
  };
}

const BlackbookPanel: React.FC<BlackbookPanelProps> = ({
  userMarkers,
  onDeleteMarker,
  onDeleteAllMarkers,
  onClose,
  userProfile
}) => {
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | 'all' | null>(null);

  // Calculate marker statistics
  const markerStats = useMemo(() => {
    const stats = {
      totalMarkers: userMarkers.length,
      markerTypes: {} as Record<string, number>,
      markerDescriptions: {} as Record<string, number>,
      recentMarkers: userMarkers.slice(-5).reverse(),
      topLocations: [] as Array<{lat: number; lng: number; count: number}>
    };

    // Count marker types and descriptions
    userMarkers.forEach(marker => {
      stats.markerTypes[marker.name] = (stats.markerTypes[marker.name] || 0) + 1;
      stats.markerDescriptions[marker.description] = (stats.markerDescriptions[marker.description] || 0) + 1;
    });

    // Group nearby markers (approximate location clustering)
    const locationMap = new Map<string, number>();
    userMarkers.forEach(marker => {
      // Round coordinates to create location clusters
      const latKey = Math.round(marker.position[0] * 100) / 100;
      const lngKey = Math.round(marker.position[1] * 100) / 100;
      const key = `${latKey},${lngKey}`;
      locationMap.set(key, (locationMap.get(key) || 0) + 1);
    });

    // Convert to array and sort by count
    stats.topLocations = Array.from(locationMap.entries())
      .map(([key, count]) => {
        const [lat, lng] = key.split(',').map(Number);
        return { lat, lng, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return stats;
  }, [userMarkers]);

  // Handle delete marker
  const handleDeleteMarker = useCallback((markerId: string) => {
    onDeleteMarker(markerId);
    setShowDeleteConfirm(null);
    setSelectedMarker(null);
  }, [onDeleteMarker]);

  // Handle delete all markers
  const handleDeleteAllMarkers = useCallback(() => {
    onDeleteAllMarkers();
    setShowDeleteConfirm(null);
  }, [onDeleteAllMarkers]);

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const panelStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    color: '#e0e0e0',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    width: 'min(110vw, 500px)',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    border: '1px solid rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    zIndex: 1500,
    position: 'relative' as const
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1500
    }}>
      <div style={panelStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid rgba(255,255,255,0.1)',
          paddingBottom: '15px'
        }}>
          <div>
            <h2 style={{ color: '#e0e0e0', margin: 0, fontSize: '24px' }}>📓 Blackbook</h2>
            <p style={{ color: '#b0b0b0', margin: '5px 0 0', fontSize: '14px' }}>
              Your graffiti collection & statistics
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '5px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* User Stats Overview */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '15px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <img
            src={userProfile.profilePicUrl}
            alt={userProfile.username}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: `3px solid #10b981`
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
              {userProfile.username}
            </div>
            <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
              {userProfile.rank} • Level {userProfile.level} • {userProfile.rep} REP
            </div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#10b981',
            borderRadius: '10px',
            color: 'white'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{markerStats.totalMarkers}</div>
            <div style={{ fontSize: '10px' }}>MARKERS</div>
          </div>
        </div>

        {/* Enhanced Statistics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Total Markers */}
          <div style={{
            backgroundColor: 'rgba(79, 172, 254, 0.1)',
            border: '1px solid rgba(79, 172, 254, 0.3)',
            padding: '15px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#4dabf7',
              marginBottom: '5px' 
            }}>
              {markerStats.totalMarkers}
            </div>
            <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
              Total Markers
            </div>
          </div>

          {/* Marker Types */}
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '15px',
            borderRadius: '10px'
          }}>
            <h3 style={{ color: '#10b981', margin: '0 0 10px', fontSize: '14px' }}>Top Types</h3>
            <div style={{ fontSize: '12px' }}>
              {Object.entries(markerStats.markerTypes)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([type, count]) => (
                  <div key={type} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                    color: '#e0e0e0'
                  }}>
                    <span>{type}</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Marker Descriptions */}
          <div style={{
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            border: '1px solid rgba(255, 107, 53, 0.3)',
            padding: '15px',
            borderRadius: '10px'
          }}>
            <h3 style={{ color: '#ff6b35', margin: '0 0 10px', fontSize: '14px' }}>Top Styles</h3>
            <div style={{ fontSize: '12px' }}>
              {Object.entries(markerStats.markerDescriptions)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([desc, count]) => (
                  <div key={desc} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                    color: '#e0e0e0'
                  }}>
                    <span style={{ fontSize: '10px' }}>{desc}</span>
                    <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Location Statistics */}
        {markerStats.topLocations.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            padding: '15px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#9c27b0', margin: '0 0 10px', fontSize: '14px' }}>📍 Top Locations</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
              fontSize: '12px'
            }}>
              {markerStats.topLocations.map((location, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  color: '#e0e0e0'
                }}>
                  <span>Location {index + 1}</span>
                  <span style={{ 
                    color: '#9c27b0', 
                    fontWeight: 'bold' 
                  }}>
                    {location.count} markers
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Gallery */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#e0e0e0', margin: '0 0 15px', fontSize: '16px' }}>🎨 Marker Gallery</h3>
          {userMarkers.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '10px',
              maxHeight: '250px',
              overflowY: 'auto',
              padding: '5px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '10px'
            }}>
              {userMarkers.map((marker, index) => (
                <div
                  key={marker.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: `2px solid ${marker.color}40`,
                    position: 'relative'
                  }}
                  onClick={() => setSelectedMarker(marker)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {/* Marker Preview */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: marker.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    marginBottom: '8px',
                    boxShadow: `0 2px 8px ${marker.color}60`
                  }}>
                    📍
                  </div>
                  
                  {/* Marker Info */}
                  <div style={{
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    <div style={{
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {marker.name}
                    </div>
                    <div style={{
                      color: '#b0b0b0',
                      fontSize: '9px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {marker.description}
                    </div>
                    <div style={{
                      color: '#666',
                      fontSize: '8px',
                      marginTop: '4px'
                    }}>
                      {formatDate(marker.timestamp).split(' ')[0]}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(marker.id || `${index}`);
                    }}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(239, 68, 68, 0.9)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '10px',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '30px 20px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              color: '#666'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎨</div>
              <div style={{ fontSize: '14px' }}>No markers in your gallery</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Start placing markers to build your collection
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setShowDeleteConfirm('all')}
            disabled={userMarkers.length === 0}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: userMarkers.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: userMarkers.length > 0 ? 1 : 0.5
            }}
          >
            🗑️ Clear All Markers
          </button>
          <button
            onClick={() => {
              // Export markers functionality
              const dataStr = JSON.stringify(userMarkers, null, 2);
              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
              const exportFileDefaultName = `${userProfile.username}_blackbook.json`;
              const linkElement = document.createElement('a');
              linkElement.setAttribute('href', dataUri);
              linkElement.setAttribute('download', exportFileDefaultName);
              linkElement.click();
            }}
            disabled={userMarkers.length === 0}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#4dabf7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: userMarkers.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: userMarkers.length > 0 ? 1 : 0.5
            }}
          >
            📥 Export Data
          </button>
        </div>

        {/* Recent Markers */}
        <div>
          <h3 style={{ color: '#e0e0e0', margin: '0 0 15px', fontSize: '16px' }}>📍 Recent Activity</h3>
          {markerStats.recentMarkers.length > 0 ? (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {markerStats.recentMarkers.map((marker, index) => (
                <div
                  key={marker.id || index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => setSelectedMarker(marker)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                      {marker.name}
                    </div>
                    <div style={{ color: '#b0b0b0', fontSize: '12px' }}>
                      {marker.description} • {formatDate(marker.timestamp)}
                    </div>
                    <div style={{ color: '#666', fontSize: '10px', marginTop: '2px' }}>
                      📍 {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(marker.id || `${index}`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '5px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '10px',
              color: '#666'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>📍</div>
              <div style={{ fontSize: '14px' }}>No recent activity</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Start placing markers to build your blackbook
              </div>
            </div>
          )}
        </div>

        {/* Selected Marker Details */}
        {selectedMarker && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)',
            zIndex: 1600,
            minWidth: '300px'
          }}>
            <h3 style={{ color: '#4dabf7', margin: '0 0 15px' }}>Marker Details</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <div><strong>Type:</strong> {selectedMarker.name}</div>
              <div><strong>Style:</strong> {selectedMarker.description}</div>
              <div><strong>Location:</strong> {selectedMarker.position[0].toFixed(6)}, {selectedMarker.position[1].toFixed(6)}</div>
              <div><strong>Placed:</strong> {formatDate(selectedMarker.timestamp)}</div>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            zIndex: 1600,
            minWidth: '300px'
          }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 15px' }}>⚠️ Confirm Delete</h3>
            <p style={{ color: '#e0e0e0', marginBottom: '20px' }}>
              {showDeleteConfirm === 'all' 
                ? 'Are you sure you want to delete ALL markers? This action cannot be undone.'
                : 'Are you sure you want to delete this marker? This action cannot be undone.'
              }
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm === 'all') {
                    handleDeleteAllMarkers();
                  } else {
                    handleDeleteMarker(showDeleteConfirm);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackbookPanel;