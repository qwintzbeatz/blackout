import imageCompression from 'browser-image-compression';

/**
 * Compress and upload image to ImgBB
 * @param file - The image file to upload
 * @returns Promise<string> - The URL of the uploaded image
 */
export async function uploadImageToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error('ImgBB API key is not configured. Please set NEXT_PUBLIC_IMGBB_API_KEY in your environment variables.');
  }

  try {
    // Compress image to under 1MB
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    };

    const compressedFile = await imageCompression(file, options);

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

    // Upload to ImgBB - API expects form data with key and image (base64 string)
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ImgBB upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.data?.url) {
      throw new Error('ImgBB upload failed: Invalid response');
    }

    return data.data.url;
  } catch (error) {
    console.error('Error uploading image to ImgBB:', error);
    throw error;
  }
}