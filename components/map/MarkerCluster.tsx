import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

interface MarkerClusterProps {
  markers: any[];
  selectedMarker: any;
  onMarkerClick: (marker: any) => void;
  user: any;
}

const MarkerCluster: React.FC<MarkerClusterProps> = React.memo(({ 
  markers, 
  selectedMarker, 
  onMarkerClick, 
  user 
}) => {
  if (!markers.length) return null;
  
  return (
    <MarkerClusterGroup>
      {markers.map((marker, index) => {
        const customIcon = L.divIcon({
          html: `
            <div style="
              width: 40px;
              height: 40px;
              background-color: ${marker.color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              position: relative;
              cursor: pointer;
              animation: ${!selectedMarker || selectedMarker.id !== marker.id ? 'pulseMarker 2s infinite' : 'none'};
            ">
              ${marker.username?.charAt(0).toUpperCase() || 'U'}
              ${marker.userId === user?.uid ? `
                <div style="
                  position: absolute;
                  top: -3px;
                  right: -3px;
                  width: 8px;
                  height: 8px;
                  background-color: #4dabf7;
                  border-radius: 50%;
                  border: 1px solid white;
                  animation: pulseGlow 1.5s infinite;
                "></div>
              ` : ''}
            </div>
            ${!selectedMarker || selectedMarker.id !== marker.id ? `
              <div style="
                position: absolute;
                top: -12px;
                left: -12px;
                width: 64px;
                height: 64px;
                border-radius: 50%;
                border: 2px dashed ${marker.color};
                opacity: 0.3;
                pointer-events: none;
                animation: ripple 3s infinite;
              "></div>
            ` : ''}
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        return (
          <Marker
            key={marker.id || `marker-${index}`}
            position={marker.position}
            icon={customIcon}
            eventHandlers={{
              click: () => onMarkerClick(marker)
            }}
          />
        );
      })}
    </MarkerClusterGroup>
  );
});

MarkerCluster.displayName = 'MarkerCluster';

export default MarkerCluster;