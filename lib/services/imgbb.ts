import imageCompression from 'browser-image-compression';

// Timeout for upload request (90 seconds for slow mobile networks)
const UPLOAD_TIMEOUT_MS = 90000;
// Max time to spend on compression (longer for mobile)
const COMPRESSION_TIMEOUT_MS = 15000;

/**
 * Detect if the user is on a mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
}

/**
 * Detect HEIC/HEIF format (common on iOS)
 */
function isHeicFile(file: File): boolean {
  const extension = file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif');
  const mimeType = file.type === 'image/heic' || 
                   file.type === 'image/heif' ||
                   file.type === 'image/heic-sequence';
  
  return extension || mimeType;
}

/**
 * Fallback image resize using canvas (for when compression library fails)
 * This is more reliable on mobile browsers
 */
async function resizeImageFallback(file: File, maxDimension: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      
      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`🖼️ Fallback resize: ${img.width}x${img.height} -> ${width}x${height}`);
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.7 // 70% quality for mobile
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for resizing'));
    };
    
    img.src = url;
  });
}

/**
 * Compress and upload image to ImgBB
 * @param file - The image file to upload
 * @param onProgress - Optional callback for compression progress (0-100)
 * @returns Promise<string> - The URL of the uploaded image
 */
export async function uploadImageToImgBB(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error('ImgBB API key is not configured. Please set NEXT_PUBLIC_IMGBB_API_KEY in your environment variables.');
  }

  const isMobile = isMobileDevice();
  const isHeic = isHeicFile(file);
  
  console.log(`🖼️ Upload starting - Mobile: ${isMobile}, HEIC: ${isHeic}, Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

  // Warn about HEIC format - may need conversion
  if (isHeic) {
    console.warn('⚠️ HEIC format detected - attempting conversion. For best results, use JPEG or PNG.');
  }

  try {
    // Mobile-optimized compression settings
    const options = {
      // More aggressive for mobile: smaller file size
      maxSizeMB: isMobile ? 0.3 : 0.5, // 300KB for mobile, 500KB for desktop
      // Smaller dimensions for mobile to prevent memory issues
      maxWidthOrHeight: isMobile ? 600 : 800,
      // DISABLE Web Worker on mobile - causes issues on iOS Safari
      useWebWorker: !isMobile,
      fileType: 'image/jpeg',
      // Faster compression with fewer iterations for mobile
      maxIteration: isMobile ? 4 : 6,
      // Initial quality for faster compression
      initialQuality: isMobile ? 0.7 : 0.8,
      // Always convert to JPEG for consistency
      alwaysKeepResolution: false,
      onProgress: (progress: number) => {
        if (onProgress) onProgress(progress);
        console.log(`🖼️ Compression progress: ${progress}%`);
      },
    };
    
    // Race compression against timeout
    let compressedFile: File;
    
    try {
      const compressionPromise = imageCompression(file, options);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Compression timeout')), COMPRESSION_TIMEOUT_MS);
      });
      
      compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
      console.log(`🖼️ Compression completed - New size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    } catch (compressionError: any) {
      console.warn('⚠️ Compression issue:', compressionError.message);
      
      // If compression fails, try a simpler resize approach
      if (compressionError.message === 'Compression timeout' || compressionError.message.includes('Worker')) {
        console.log('🖼️ Attempting fallback: direct upload with reduced quality...');
        
        // Create a canvas-based resize as fallback
        compressedFile = await resizeImageFallback(file, isMobile ? 600 : 800);
      } else {
        // For other errors, try original file if small enough
        if (file.size < 2 * 1024 * 1024) { // Under 2MB
          console.log('🖼️ Using original file (small enough)');
          compressedFile = file;
        } else {
          throw new Error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please select a smaller image or try again.`);
        }
      }
    }

    // Convert compressed file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });

    // Upload to ImgBB with timeout
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ImgBB upload failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.data?.url) {
        throw new Error('ImgBB upload failed: Invalid response');
      }

      const imageUrl = data.data.url;
      console.log('🖼️ ImgBB upload successful:', imageUrl);
      return imageUrl;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timed out. Please try again with a smaller image.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error uploading image to ImgBB:', error);
    throw error;
  }
}
