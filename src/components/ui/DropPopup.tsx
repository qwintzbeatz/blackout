'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { uploadImageToImgBB } from '@/lib/services/imgbb';
import PhotoSelectionModal from '@/components/ui/PhotoSelectionModal';

interface DropPopupProps {
  isVisible: boolean;
  position: { lat: number; lng: number };
  onClose: () => void;
  onDropCreate: (dropData: {
    lat: number;
    lng: number;
    photoUrl?: string;
    trackUrl?: string;
    markerType: string;
  }) => void;
}

const MARKER_TYPES = [
  'Tag/Signature',
  'Throw-Up', 
  'Stencil/Brand/Stamp',
  'Paste-Up/Poster',
  'Piece/Bombing',
  'Burner/Heater',
  'Roller/Blockbuster',
  'Mural',
  'Extinguisher'
];

const DropPopupOptimized: React.FC<DropPopupProps> = ({
  isVisible,
  position,
  onClose,
  onDropCreate
}) => {
  const [dropType, setDropType] = useState<'photo' | 'music' | 'marker'>('marker');
  const [selectedMarkerType, setSelectedMarkerType] = useState('Tag/Signature');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [trackUrl, setTrackUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Debug logging for photo state
  useEffect(() => {
    console.log('🎨 Photo Drop State:', {
      dropType,
      hasSelectedFile: !!selectedFile,
      hasPreviewUrl: !!previewUrl,
      fileName: selectedFile?.name
    });
  }, [dropType, selectedFile, previewUrl]);

  // Calculate upload cost
  const uploadCost = useMemo(() => {
    switch (dropType) {
      case 'photo': return '5 REP';
      case 'music': return '3 REP';
      case 'marker': return '2 REP';
      default: return '0 REP';
    }
  }, [dropType]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  

  // Handle photo modal selection
  const handlePhotoSelect = useCallback((photoData: { url: string; file: File }) => {
    console.log('📸 Photo selected in DropPopup:', photoData.file.name);
    setSelectedFile(photoData.file);
    // Create preview URL for the selected file
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('🖼️ Preview created');
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(photoData.file);
    setError(null);
  }, []);

  // Validate track URL
  const validateTrackUrl = useCallback((url: string): boolean => {
    if (!url) return true; // Optional
    return url.includes('soundcloud.com') || url.includes('bandcamp.com') || url.includes('youtube.com');
  }, []);

  // Form validation
  const isFormValid = useMemo(() => {
    switch (dropType) {
      case 'photo':
        return selectedFile !== null;
      case 'music':
        return validateTrackUrl(trackUrl);
      case 'marker':
        return selectedMarkerType !== '';
      default:
        return false;
    }
  }, [dropType, selectedFile, trackUrl, selectedMarkerType, validateTrackUrl]);

  // Handle create drop
  const handleCreateDrop = useCallback(async () => {
    if (!isFormValid || isCreating) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      let photoUrl: string | undefined;
      
      // Upload photo if selected
      if (selectedFile && dropType === 'photo') {
        photoUrl = await uploadImageToImgBB(selectedFile);
      }
      
      // Create drop data
      const dropData = {
        lat: position.lat,
        lng: position.lng,
        photoUrl: photoUrl,
        trackUrl: dropType === 'music' ? trackUrl : undefined,
        markerType: dropType === 'marker' ? selectedMarkerType : 'default'
      };
      
      onDropCreate(dropData);
      handleClose();
      
    } catch (error: any) {
      setError(error.message || 'Failed to create drop');
    } finally {
      setIsCreating(false);
    }
  }, [isFormValid, isCreating, selectedFile, trackUrl, selectedMarkerType, dropType, position, onDropCreate]);

  // Handle close
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl('');
    setTrackUrl('');
    setSelectedMarkerType('Tag/Signature');
    setError(null);
    setIsCreating(false);
    onClose();
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '24px',
      width: 'min(90vw, 400px)',
      maxWidth: '400px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      zIndex: 1500
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ffffff'
        }}>
          💧 Create Drop
        </h3>
        
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Drop Type Selection */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {[
          { id: 'photo', label: '📸 Photo', color: '#10b981' },
          { id: 'music', label: '🎵 Music', color: '#ff6b35' },
          { id: 'marker', label: '🎨 Marker', color: '#8b5cf6' }
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setDropType(type.id as any)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: dropType === type.id ? type.color : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Content based on type */}
      <div style={{ marginBottom: '20px' }}>
        {/* Photo Drop */}
        {dropType === 'photo' && (
          <div>
            {selectedFile && previewUrl ? (
              <div style={{
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <img
                  src={previewUrl}
                  alt="Selected photo"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '150px',
                    borderRadius: '8px',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: '#b0b0b0',
                  marginTop: '8px'
                }}>
                  {selectedFile.name}
                </div>
              </div>
            ) : (
              <div
                onClick={() => setShowPhotoModal(true)}
                style={{
                  border: '2px dashed rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff6b35';
                  e.currentTarget.style.backgroundColor = 'rgba(255,107,53,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    Take Photo or Upload
                  </div>
                  <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                    Camera or file selection
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Music Drop */}
        {dropType === 'music' && (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              color: '#b0b0b0'
            }}>
              Track URL
            </label>
            <input
              type="url"
              value={trackUrl}
              onChange={(e) => setTrackUrl(e.target.value)}
              placeholder="SoundCloud, Bandcamp, or YouTube URL"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: trackUrl && !validateTrackUrl(trackUrl) ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#ffffff',
                outline: 'none'
              }}
            />
            {trackUrl && !validateTrackUrl(trackUrl) && (
              <div style={{
                fontSize: '10px',
                color: '#ff4444',
                marginTop: '4px'
              }}>
                Please enter a valid SoundCloud, Bandcamp, or YouTube URL
              </div>
            )}
          </div>
        )}

        {/* Marker Drop */}
        {dropType === 'marker' && (
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              color: '#b0b0b0'
            }}>
              Marker Type
            </label>
            <select
              value={selectedMarkerType}
              onChange={(e) => setSelectedMarkerType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#ffffff',
                outline: 'none'
              }}
            >
              {MARKER_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Cost Display */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#b0b0b0',
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        Cost: <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>{uploadCost}</span>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid #ff4444',
          color: '#ff6b6b',
          padding: '8px',
          borderRadius: '6px',
          fontSize: '11px',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleClose}
          disabled={isCreating}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: isCreating ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
        
        <button
          onClick={handleCreateDrop}
          disabled={!isFormValid || isCreating}
          style={{
            padding: '8px 16px',
            backgroundColor: isFormValid && !isCreating ? '#ff6b35' : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: isFormValid && !isCreating ? 'pointer' : 'not-allowed',
            opacity: (isFormValid && !isCreating) ? 1 : 0.5
          }}
        >
          {isCreating ? 'Creating...' : 'Create Drop'}
        </button>
      </div>
      
      {/* Photo Selection Modal */}
      <PhotoSelectionModal
        isVisible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoSelect={handlePhotoSelect}
      />
    </div>
  );
};

export default DropPopupOptimized;