'use client';

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';

interface PhotoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export default function PhotoSelectionModal({
  isOpen,
  onClose,
  onPhotoSelected,
  isUploading = false,
}: PhotoSelectionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please select an image under 10MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a photo first');
      return;
    }

    try {
      await onPhotoSelected(selectedFile);
      // Reset state after successful upload
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 20px 0',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
          }}
        >
          Select a Photo for Your Drop
        </h2>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {previewUrl && (
          <div
            style={{
              marginBottom: '20px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
            }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              backgroundColor: isUploading ? '#f3f4f6' : 'white',
            }}
          />
        </div>

        {isUploading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '3px solid #3b82f6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ color: '#3b82f6', fontWeight: '500' }}>
              Uploading and compressing photo...
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCancel}
            disabled={isUploading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: selectedFile && !isUploading ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed',
            }}
          >
            {isUploading ? 'Uploading...' : 'Place Drop'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
