'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons for Next.js
if (typeof window !== 'undefined') {
  // Dynamically import leaflet only on client side
  const L = require('leaflet');
  
  // Fix for default icons
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Component to update map view
function MapUpdater({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position && map) {
      map.setView(position, 15);
    }
  }, [position, map]);
  
  return null;
}

export default function MapComponent() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setError(null);
          
          // Watch for ongoing position updates
          navigator.geolocation.watchPosition(
            (watchPos) => {
              setPosition([watchPos.coords.latitude, watchPos.coords.longitude]);
            },
            (err) => {
              console.error('Geolocation watch error:', err);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        },
        (err) => {
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, [isClient]);

  if (!isClient) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        Initializing...
      </div>
    );
  }

  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Error Message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          <strong>Location Error:</strong> {error}
          <br />
          <small>Please allow location access in your browser settings</small>
        </div>
      )}

      {/* Loading Message */}
      {!position && !error && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#4dabf7',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          Getting your location...
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={position || defaultCenter}
        zoom={position ? 15 : 13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {position && (
          <>
            <MapUpdater position={position} />
            <Marker position={position}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong>You are here!</strong>
                  <br />
                  <small>
                    Latitude: {position[0].toFixed(6)}
                    <br />
                    Longitude: {position[1].toFixed(6)}
                  </small>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Coordinates Display */}
      {position && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontSize: '14px'
        }}>
          📍 Your location: {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </div>
      )}
    </div>
  );
}