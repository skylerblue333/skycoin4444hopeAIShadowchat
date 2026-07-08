import React, { useCallback, useState } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoUploadProps {
  onUpload: (file: File) => Promise<{ url: string; key: string }>;
  maxFiles?: number;
  maxFileSize?: number;
  onPhotosChange?: (photos: { url: string; key: string }[]) => void;
}

interface UploadedPhoto {
  url: string;
  key: string;
  isUploading?: boolean;
  error?: string;
}

export function PhotoUpload({
  onUpload,
  maxFiles = 6,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  onPhotosChange,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxFileSize / 1024 / 1024}MB limit`,
      };
    }

    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'File must be an image',
      };
    }

    return { valid: true };
  };

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      setError(null);
      const newPhotos: UploadedPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check if we've reached max files
        if (photos.length + newPhotos.length >= maxFiles) {
          setError(`Maximum ${maxFiles} photos allowed`);
          break;
        }

        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }

        // Add uploading placeholder
        const uploadingPhoto: UploadedPhoto = {
          url: URL.createObjectURL(file),
          key: `uploading-${Date.now()}-${i}`,
          isUploading: true,
        };

        newPhotos.push(uploadingPhoto);

        try {
          const result = await onUpload(file);
          // Replace uploading placeholder with actual photo
          const index = newPhotos.findIndex((p) => p.key === uploadingPhoto.key);
          if (index !== -1) {
            newPhotos[index] = {
              url: result.url,
              key: result.key,
              isUploading: false,
            };
          }
        } catch (err) {
          const index = newPhotos.findIndex((p) => p.key === uploadingPhoto.key);
          if (index !== -1) {
            newPhotos[index].error = 'Upload failed';
            newPhotos[index].isUploading = false;
          }
        }
      }

      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos.filter((p) => !p.isUploading && !p.error));
    },
    [photos, maxFiles, onUpload, onPhotosChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleRemovePhoto = (key: string) => {
    const updated = photos.filter((p) => p.key !== key);
    setPhotos(updated);
    onPhotosChange?.(updated.filter((p) => !p.isUploading && !p.error));
  };

  const canAddMore = photos.length < maxFiles;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Drag and drop photos here
          </p>
          <p className="text-xs text-gray-500 mb-4">
            or click to select (max {maxFiles - photos.length} remaining)
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="photo-input"
          />
          <label htmlFor="photo-input">
            <Button variant="outline" size="sm" asChild>
              <span>Select Photos</span>
            </Button>
          </label>
        </motion.div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {photos.map((photo) => (
            <motion.div
              key={photo.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <Card className="overflow-hidden aspect-square">
                <img
                  src={photo.url}
                  alt="Uploaded photo"
                  className="w-full h-full object-cover"
                />

                {/* Loading Overlay */}
                {photo.isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}

                {/* Error Overlay */}
                {photo.error && (
                  <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                )}

                {/* Remove Button */}
                {!photo.isUploading && !photo.error && (
                  <button
                    onClick={() => handleRemovePhoto(photo.key)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Photo Count */}
      {photos.length > 0 && (
        <p className="text-sm text-gray-600">
          {photos.filter((p) => !p.isUploading && !p.error).length} of {maxFiles} photos
        </p>
      )}
    </div>
  );
}
