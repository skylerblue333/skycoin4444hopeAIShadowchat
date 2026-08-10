import sharp from 'sharp';
import { storagePut } from './storage';
import { db } from './db';
import { datingProfiles } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface PhotoUploadOptions {
  userId: string;
  file: Buffer;
  fileName: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

interface OptimizedPhoto {
  url: string;
  key: string;
  width: number;
  height: number;
  size: number;
}

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_MAX_HEIGHT = 1200;
const DEFAULT_QUALITY = 80;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function optimizePhoto(
  file: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<Buffer> {
  const maxWidth = options.maxWidth || DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight || DEFAULT_MAX_HEIGHT;
  const quality = options.quality || DEFAULT_QUALITY;

  if (file.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  try {
    const optimized = await sharp(file)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    return optimized;
  } catch (error) {
        throw new Error('Failed to optimize photo');
  }
}

export async function uploadProfilePhoto(
  options: PhotoUploadOptions
): Promise<OptimizedPhoto> {
  const {
    userId,
    file,
    fileName,
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
  } = options;

  try {
    // Optimize the photo
    const optimized = await optimizePhoto(file, { maxWidth, maxHeight, quality });

    // Get image metadata
    const metadata = await sharp(optimized).metadata();

    // Upload to storage
    const fileKey = `dating/profiles/${userId}/${Date.now()}-${fileName}`;
    const { url, key } = await storagePut(fileKey, optimized, 'image/jpeg');

    return {
      url,
      key,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: optimized.length,
    };
  } catch (error) {
        throw error;
  }
}

export async function createThumbnail(
  file: Buffer,
  size: number = 200
): Promise<Buffer> {
  try {
    const thumbnail = await sharp(file)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
        throw new Error('Failed to create thumbnail');
  }
}

export async function uploadProfilePhotoWithThumbnail(
  options: PhotoUploadOptions & { thumbnailSize?: number }
): Promise<{
  photo: OptimizedPhoto;
  thumbnail: OptimizedPhoto;
}> {
  const { userId, file, fileName, thumbnailSize = 200 } = options;

  try {
    // Upload main photo
    const photo = await uploadProfilePhoto(options);

    // Create and upload thumbnail
    const thumbnailBuffer = await createThumbnail(file, thumbnailSize);
    const thumbnailFileKey = `dating/profiles/${userId}/thumb-${Date.now()}-${fileName}`;
    const { url: thumbUrl, key: thumbKey } = await storagePut(
      thumbnailFileKey,
      thumbnailBuffer,
      'image/jpeg'
    );

    return {
      photo,
      thumbnail: {
        url: thumbUrl,
        key: thumbKey,
        width: thumbnailSize,
        height: thumbnailSize,
        size: thumbnailBuffer.length,
      },
    };
  } catch (error) {
        throw error;
  }
}

export async function deleteProfilePhoto(photoKey: string): Promise<void> {
  try {
    // In production, you would call the storage delete API
    // For now, we just remove the reference from the database
      } catch (error) {
        throw error;
  }
}

export async function validatePhotoFile(file: Buffer): Promise<{
  isValid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}> {
  try {
    if (file.length > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    const metadata = await sharp(file).metadata();

    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        error: 'Invalid image dimensions',
      };
    }

    // Check aspect ratio (allow 0.5 to 2.0)
    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      return {
        isValid: false,
        error: 'Image aspect ratio is too extreme (must be between 0.5 and 2.0)',
      };
    }

    return {
      isValid: true,
      dimensions: { width: metadata.width, height: metadata.height },
    };
  } catch (error) {
        return {
      isValid: false,
      error: 'Failed to validate image',
    };
  }
}

export async function reorderProfilePhotos(
  userId: string,
  photoOrder: string[]
): Promise<void> {
  try {
    // Update the profile with new photo order
    await db
      .update(datingProfiles)
      .set({
        photos: JSON.stringify(photoOrder),
      })
      .where(eq(datingProfiles.userId, userId));

      } catch (error) {
        throw error;
  }
}
