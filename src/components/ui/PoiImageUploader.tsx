'use client';

import { useRef, useState } from 'react';
import { uploadPoiImage } from '@/lib/supabase/storage';

interface PoiImageUploaderProps {
  poiId: string;
  onUploadComplete?: (imageUrl: string) => void;
  currentImage?: string | null;
  className?: string;
}

export default function PoiImageUploader({
  poiId,
  onUploadComplete,
  currentImage,
  className = ''
}: PoiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase
      const imageUrl = await uploadPoiImage(file, poiId);

      // Update preview with actual URL
      setPreviewUrl(imageUrl);

      // Call callback
      onUploadComplete?.(imageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative">
        {previewUrl ? (
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="POI preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-50"
            >
              <span className="text-white text-sm font-bold">Cambiar imagen</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            <span className="text-3xl">📷</span>
            <span className="text-sm font-medium text-gray-600">
              {isUploading ? 'Uploading...' : 'Click to upload image'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
          Uploading...
        </div>
      )}
    </div>
  );
}
