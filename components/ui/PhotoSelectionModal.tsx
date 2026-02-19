'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { uploadImageToImgBB } from '@/lib/services/imgbb';
import exifr from 'exifr';

interface PhotoSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPhotoSelect: (photoData: { url: string; file: File; location?: { lat: number; lng: number } }) => void;
  onPhotoCapture?: (position: { lat: number; lng: number }) => void;
}

const PhotoSelectionModalOptimized: React.FC<PhotoSelectionModalProps> = ({
  isVisible,
  onClose,
  onPhotoSelect,
  onPhotoCapture
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check browser compatibility and log info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Browser camera support check:');
      console.log('- navigator.mediaDevices:', !!navigator.mediaDevices);
      console.log('- getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
      console.log('- HTTPS:', location.protocol === 'https:');
      console.log('- User Agent:', navigator.userAgent);
      
      // HTTPS is required for camera access in most browsers
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setError('Camera requires HTTPS connection. Please use file upload instead.');
        return;
      }
      
      if (!navigator.mediaDevices) {
        setError('Camera not supported in this browser. Please use file upload.');
        return;
      }
      
      // Clear any existing camera errors when modal opens
      if (isVisible) {
        setError(null);
      }
    }
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const imageUrl = await uploadImageToImgBB(selectedFile);
      
      // Extract GPS coordinates from EXIF data
      let location: { lat: number; lng: number } | undefined = undefined;
      
      try {
        const exifData = await exifr.gps(selectedFile);
        
        if (exifData && exifData.latitude !== undefined && exifData.longitude !== undefined) {
          location = {
            lat: exifData.latitude,
            lng: exifData.longitude
          };
          console.log('📍 GPS coordinates extracted from photo:', location);
        } else {
          console.log('📍 No GPS data found in photo EXIF');
        }
      } catch (exifError) {
        console.log('📍 Could not extract EXIF data:', exifError);
        // Continue without location - will use user's current GPS position
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onPhotoSelect({
          url: imageUrl,
          file: selectedFile,
          location: location
        });
        handleClose();
      }, 500);
      
    } catch (error: any) {
      setError(error.message || 'Failed to upload image');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, onPhotoSelect]);

  // Handle camera capture
  const handleCameraCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
          setCameraMode(false);
          
          // Stop camera
          const stream = video.srcObject as MediaStream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      }, 'image/jpeg', 0.8);
    }
  }, [handleFileSelect]);

  // Start camera
  const startCamera = useCallback(async () => {
    console.log('🎬 Starting camera attempt...');
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // HTTPS check
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Camera requires HTTPS');
      }

      let stream;
      
      // Approach 1: Try the simplest possible constraints
      try {
        console.log('📷 Attempting basic video access...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        console.log('✅ Basic camera successful!');
      } catch (basicError) {
        console.log('❌ Basic failed:', basicError);
        
        // Approach 2: Try with explicit dimensions
        try {
          console.log('📷 Attempting with dimensions...');
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 640,
              height: 480 
            } 
          });
          console.log('✅ Dimensions camera successful!');
        } catch (dimError) {
          console.log('❌ Dimensions failed:', dimError);
          throw dimError;
        }
      }
      
      // Attach stream to video element
      if (videoRef.current && stream) {
        console.log('📹 Attaching stream to video element...');
        videoRef.current.srcObject = stream;
        
        // Set camera mode immediately after stream is attached
        console.log('📹 Stream attached, setting camera mode to true');
        setCameraMode(true);
        
        // Optional: Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('🎥 Video metadata loaded!');
        };
      }
    } catch (error) {
      console.error('🚫 Camera access failed:', error);
      let errorMessage = 'Camera access failed. Please use file upload instead.';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = '🚫 Camera permission denied. Please allow camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = '📷 No camera found. Please use file upload instead.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = '📹 Camera is already in use. Please close other apps using camera.';
        } else if (error.message.includes('HTTPS')) {
          errorMessage = '🔒 Camera requires HTTPS connection. Please use file upload.';
        }
      }
      
      setError(errorMessage);
    }
  }, [cameraMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraMode(false);
    }
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl('');
    setError(null);
    setUploadProgress(0);
    setIsUploading(false);
    setCameraMode(false);
    stopCamera();
    onClose();
  }, [onClose, stopCamera]);

  // Test camera access with minimal constraints
  const testBasicCamera = useCallback(async () => {
    console.log('Testing basic camera access...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true 
      });
      console.log('Basic camera successful!');
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.log('Basic camera failed:', error);
      return false;
    }
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '24px',
        width: 'min(90vw, 450px)',
        maxWidth: '450px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        color: '#ffffff'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff'
          }}>
            📸 Add Photo
          </h2>
          
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              if (cameraMode) {
                stopCamera();
                setCameraMode(false);
              }
            }}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: !cameraMode ? '#ff6b35' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📁 Upload
          </button>
          
          <button
            onClick={() => {
              if (!cameraMode) {
                console.log('Starting camera...');
                startCamera();
              } else {
                console.log('Capturing photo...');
                handleCameraCapture();
              }
            }}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: cameraMode ? '#ff6b35' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {cameraMode ? '📸 Capture' : '📷 Camera'}
          </button>
        </div>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            fontSize: '10px',
            color: '#888',
            marginBottom: '10px',
            padding: '8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '4px'
          }}>
            <div>Camera Mode: {cameraMode ? 'ON' : 'OFF'}</div>
            <div>HTTPS: {typeof window !== 'undefined' ? location.protocol : 'N/A'}</div>
            <div>MediaDevices: {typeof navigator !== 'undefined' ? !!navigator.mediaDevices : 'N/A'}</div>
          </div>
        )}

        {/* Content */}
        {!cameraMode ? (
          /* File Upload Mode */
          <div>
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed rgba(255,255,255,0.3)',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff6b35';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}
                />
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    Drag & drop photo here
                  </div>
                  <div style={{ fontSize: '12px', color: '#b0b0b0' }}>
                    or click to browse
                  </div>
                </div>
              )}
            </div>

            {selectedFile && (
              <div style={{
                fontSize: '12px',
                color: '#b0b0b0',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
        ) : (
          /* Camera Mode */
          <div style={{ textAlign: 'center' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: '350px',
                height: 'auto',
                borderRadius: '8px',
                backgroundColor: '#000000',
                objectFit: 'cover'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div style={{
              fontSize: '12px',
              color: '#b0b0b0',
              marginTop: '12px'
            }}>
              Position yourself and tap "Capture"
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #ff4444',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            {error}
            <button
              onClick={() => {
                console.log('Trying fallback camera...');
                setError(null);
                // Try the most basic camera access
                navigator.mediaDevices?.getUserMedia({ video: true })
                  .then(stream => {
                    if (videoRef.current) {
                      videoRef.current.srcObject = stream;
                      setCameraMode(true);
                      console.log('Fallback camera started');
                    }
                  })
                  .catch(err => {
                    console.log('Fallback also failed:', err);
                    setError('Camera not available. Please use file upload.');
                  });
              }}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Try Basic Camera
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div style={{
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px'
            }}>
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: '#ff6b35',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            disabled={isUploading}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          
          {selectedFile && !cameraMode && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              style={{
                padding: '10px 20px',
                backgroundColor: isUploading ? 'rgba(255,255,255,0.1)' : '#ff6b35',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.5 : 1
              }}
            >
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoSelectionModalOptimized;
