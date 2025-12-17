export interface ImageConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'webp' | 'jpeg';
}

export const PROJECT_IMAGE_CONFIG: ImageConfig = {
  maxWidth: 800,
  maxHeight: 450,
  quality: 0.85,
  format: 'webp'
};

export const LOGO_CONFIG: ImageConfig = {
  maxWidth: 200,
  maxHeight: 200,
  quality: 0.9,
  format: 'webp'
};

export const ZONE_IMAGE_CONFIG: ImageConfig = {
  maxWidth: 800,
  maxHeight: 450,
  quality: 0.85,
  format: 'webp'
};

export async function optimizeImage(file: File, config: ImageConfig): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > config.maxWidth || height > config.maxHeight) {
        const ratio = Math.min(config.maxWidth / width, config.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image with smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const mimeType = config.format === 'webp' ? 'image/webp' : 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create blob'));
          }
        },
        mimeType,
        config.quality
      );
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}
