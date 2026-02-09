import imageCompression from 'browser-image-compression';

// Timeout for upload request (60 seconds for mobile networks)
const UPLOAD_TIMEOUT_MS = 60000;
// Max time to spend on compression
const COMPRESSION_TIMEOUT_MS = 5000;

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

  try {
    // Aggressive compression for mobile - get under 500KB
    const options = {
      maxSizeMB: 0.5, // 500KB max for fastest mobile upload
      maxWidthOrHeight: 800, // 800px max dimension
      useWebWorker: true,
      fileType: 'image/jpeg',
      // Faster compression settings
      maxIteration: 6,
      onProgress: (progress: number) => {
        if (onProgress) onProgress(progress);
      },
    };
    
    // Race compression against timeout
    let compressedFile: File;
    const compressionPromise = imageCompression(file, options);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Compression timeout')), COMPRESSION_TIMEOUT_MS);
    });
    
    try {
      compressedFile = await Promise.race([compressionPromise, timeoutPromise]);
      console.log('🖼️ Compression completed within timeout');
    } catch (compressionError: any) {
      if (compressionError.message === 'Compression timeout') {
        console.warn('⚠️ Compression timed out, using original file');
        // Try to resize just by reducing quality without full compression
        compressedFile = file;
      } else {
        throw compressionError;
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
