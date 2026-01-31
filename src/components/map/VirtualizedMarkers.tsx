import React, { useMemo, useCallback } from 'react';
import { UserMarker } from '@/lib/types/blackout';
import { useAdaptivePerformance } from '@/src/hooks/useAdaptivePerformance';

interface VirtualizedMarkersProps {
  markers: UserMarker[];
  onMarkerClick: (marker: UserMarker) => void;
  gpsPosition: [number, number] | null;
  radius: number;
}

export const VirtualizedMarkers: React.FC<VirtualizedMarkersProps> = ({
  markers,
  onMarkerClick,
  gpsPosition,
  radius
}) => {
  const { settings, isLowPerformance } = useAdaptivePerformance();

  // Filter markers by radius and calculate distances
  const visibleMarkers = useMemo(() => {
    if (!gpsPosition) return markers;

    return markers
      .filter(marker => {
        if (!marker.position) return false;
        
        const distance = calculateDistance(
          gpsPosition[0], gpsPosition[1],
          marker.position[0], marker.position[1]
        );
        
        marker.distanceFromCenter = distance;
        return distance <= radius;
      })
      .sort((a, b) => (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0))
      .slice(0, settings.markerLimit); // Apply performance limit
  }, [markers, gpsPosition, radius, settings.markerLimit]);

  // Virtualization: only render markers that are actually visible
  const renderableMarkers = useMemo(() => {
    if (isLowPerformance) {
      // On low-performance devices, only render the closest markers
      return visibleMarkers.slice(0, Math.min(20, visibleMarkers.length));
    }
    
    return visibleMarkers;
  }, [visibleMarkers, isLowPerformance]);

  // Memoized marker click handler
  const handleMarkerClick = useCallback((marker: UserMarker) => {
    onMarkerClick(marker);
  }, [onMarkerClick]);

  // Calculate marker cluster for distant markers on low performance
  const markerClusters = useMemo(() => {
    if (!isLowPerformance || renderableMarkers.length <= 30) return null;

    const clusters: Array<{
      position: [number, number];
      count: number;
      markers: UserMarker[];
    }> = [];

    const clusterSize = 5;
    for (let i = 0; i < renderableMarkers.length; i += clusterSize) {
      const clusterMarkers = renderableMarkers.slice(i, i + clusterSize);
      const avgLat = clusterMarkers.reduce((sum, m) => sum + m.position[0], 0) / clusterMarkers.length;
      const avgLng = clusterMarkers.reduce((sum, m) => sum + m.position[1], 0) / clusterMarkers.length;
      
      clusters.push({
        position: [avgLat, avgLng],
        count: clusterMarkers.length,
        markers: clusterMarkers
      });
    }

    return clusters;
  }, [renderableMarkers, isLowPerformance]);

  if (renderableMarkers.length === 0) return null;

  // Low-performance clustered rendering
  if (isLowPerformance && markerClusters) {
    return (
      <>
        {markerClusters.map((cluster, index) => (
          <div
            key={`cluster-${index}`}
            onClick={() => handleMarkerClick(cluster.markers[0])}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000 + index,
              cursor: 'pointer'
            }}
          >
            <div style={{
              backgroundColor: cluster.markers[0].color,
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {cluster.count}
            </div>
          </div>
        ))}
      </>
    );
  }

  // High-performance individual marker rendering
  return (
    <>
      {renderableMarkers.map((marker, index) => (
        <div
          key={marker.id}
          onClick={() => handleMarkerClick(marker)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000 + index,
            cursor: 'pointer',
            // Performance optimization: use transform instead of left/top for better performance
            willChange: 'transform'
          }}
        >
          <div
            style={{
              backgroundColor: marker.color,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.8)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              // Performance optimization: hardware acceleration
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          />
          {marker.username && (
            <div
              style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none'
              }}
            >
              {marker.username}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // Distance in km (not needed for this use case, but keeping for consistency)
}