// @/components/ui/PhotoSelectionModal.tsx
import React, { useState, useRef } from 'react';
import ExifReader from 'exifreader';

interface PhotoSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPhotoSelect: (photoData: { url: string; file: File; location?: { lat: number; lng: number } }) => void;
}

const PhotoSelectionModal: React.FC<PhotoSelectionModalProps> = ({ 
  isVisible, 
  onClose, 
  onPhotoSelect 
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoLocation, setPhotoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photoMetadata, setPhotoMetadata] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract GPS coordinates from EXIF data
  const extractGPSFromExif = (exifData: any): { lat: number; lng: number } | null => {
    try {
      const gps = exifData.gps;
      if (!gps || !gps.Latitude || !gps.Longitude) {
        return null;
      }

      // Convert GPS coordinates from degrees/minutes/seconds to decimal
      const lat = gps.Latitude[0] + gps.Latitude[1] / 60 + gps.Latitude[2] / 3600;
      const lng = gps.Longitude[0] + gps.Longitude[1] / 60 + gps.Longitude[2] / 3600;

      // Handle hemisphere (N/S, E/W)
      const latRef = gps.LatitudeRef || 'N';
      const lngRef = gps.LongitudeRef || 'E';

      return {
        lat: latRef === 'S' ? -lat : lat,
        lng: lngRef === 'W' ? -lng : lng
      };
    } catch (error) {
      console.error('Error parsing GPS data:', error);
      return null;
    }
  };

  // Handle photo file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setSelectedFile(file);

    try {
      // Read EXIF data
      const arrayBuffer = await file.arrayBuffer();
      const tags = ExifReader.load(arrayBuffer);

      setPhotoMetadata(tags);

      // Extract GPS coordinates
      const location = extractGPSFromExif(tags);
      setPhotoLocation(location);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedPhoto(e.target?.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error reading EXIF data:', error);
      // Still create preview even if EXIF fails
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedPhoto(e.target?.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    // This would use the device camera API
    alert('Camera functionality coming soon! For now, select a photo with GPS data from your gallery.');
  };

  const handleUsePhoto = () => {
    if (selectedPhoto && selectedFile) {
      onPhotoSelect({ 
        url: selectedPhoto, 
        file: selectedFile,
        location: photoLocation || undefined
      });
      resetModal();
    }
  };

  const resetModal = () => {
    setSelectedPhoto(null);
    setSelectedFile(null);
    setPhotoLocation(null);
    setPhotoMetadata(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#f1f5f9',
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📸 Select Photo with GPS
          </h3>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#cbd5e1',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>

        {/* Photo Preview */}
        {selectedPhoto && (
          <div style={{
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <img 
              src={selectedPhoto} 
              alt="Preview" 
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.1)'
              }}
            />
          </div>
        )}

        {/* GPS Info Display */}
        {photoLocation && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>📍</span>
              <div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#10b981' 
                }}>
                  GPS Location Detected!
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#cbd5e1',
                  fontFamily: 'monospace',
                  marginTop: '5px'
                }}>
                  Lat: {photoLocation.lat.toFixed(6)}<br />
                  Lng: {photoLocation.lng.toFixed(6)}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '6px'
            }}>
              This photo will be placed at the exact location where it was taken!
            </div>
        </div>
        )}

        {/* No GPS Warning */}
        {selectedPhoto && !photoLocation && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: '#f59e0b' 
                }}>
                  No GPS Data Found
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#cbd5e1',
                  marginTop: '5px'
                }}>
                  This photo doesn't contain location data. 
                  You can still upload it, but you'll need to place it manually on the map.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <div style={{
                background: 'linear-gradient(135deg, #4dabf7, #3b82f6)',
                border: 'none',
                borderRadius: '12px',
                padding: '18px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                textAlign: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}>
                📁 Select Photo with GPS Data
              </div>
            </label>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: '8px',
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '6px'
            }}>
              Supports JPEG/HEIC with GPS metadata
            </div>
          </div>

          {/* Take Photo Button */}
          <button
            onClick={handleTakePhoto}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '12px',
              padding: '18px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
            }}
          >
            📱 Take New Photo with GPS
          </button>

          {/* Use Photo Button */}
          {selectedPhoto && (
            <button
              onClick={handleUsePhoto}
              disabled={isLoading}
              style={{
                background: photoLocation 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '12px',
                padding: '18px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: photoLocation 
                  ? '0 4px 15px rgba(16, 185, 129, 0.3)' 
                  : '0 4px 15px rgba(245, 158, 11, 0.3)'
              }}
            >
              {isLoading ? '🔄 Processing...' : photoLocation ? '📍 Use Photo with GPS' : '🗺️ Use Photo (Place Manually)'}
            </button>
          )}

          {/* Cancel Button */}
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            style={{
              background: 'none',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
        </div>

        {/* Tips Section */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            color: '#fbbf24',
            marginBottom: '8px' 
          }}>
            💡 How to get GPS data in photos:
          </div>
          <ul style={{ 
            fontSize: '12px', 
            color: '#cbd5e1',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li>Enable location services in your camera app</li>
            <li>Take photos outdoors for better GPS accuracy</li>
            <li>Photos must be in JPEG or HEIC format</li>
            <li>GPS data is embedded automatically by most smartphones</li>
            <li>Photos without GPS will need manual placement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PhotoSelectionModal;