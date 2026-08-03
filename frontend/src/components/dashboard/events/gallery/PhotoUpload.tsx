'use client';

import React, { useState, useEffect } from 'react';
import { Camera, X, Image as ImageIcon, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PhotoUploadProps {
  photos: (File | string)[];
  onChange: (photos: (File | string)[]) => void;
}

export function PhotoUpload({ photos = [], onChange }: PhotoUploadProps) {
  const { t } = useTranslation();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Synchronize and generate preview URLs for File objects
  useEffect(() => {
    // Generate object URLs for File instances
    const objectUrls = photos.map(photo => {
      if (typeof photo === 'string') {
        return photo;
      }
      try {
        return URL.createObjectURL(photo);
      } catch (err) {
        return '';
      }
    });

    setPreviewUrls(objectUrls);

    // Cleanup object URLs on unmount/re-run
    return () => {
      objectUrls.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    onChange([...photos, ...selectedFiles]);
  };

  const handleRemove = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* File Dropzone / Uploader */}
      <div className="flex flex-col gap-4">
        <label className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/10 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
          <Upload className="w-8 h-8 text-primary mb-2" />
          <p className="text-sm font-bold text-foreground mb-1">
            {t('events.clickToSelectPhotos', 'Click to Select or Drag Photos')}
          </p>
          <p className="text-xs text-muted-foreground">Upload setup photos, stage dimensions, or site condition proofs (Max 5MB per file)</p>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {photos.map((photo, idx) => {
            const isFile = photo instanceof File;
            const previewUrl = previewUrls[idx] || '';

            return (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-video flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt={`Site photo ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
                
                {/* File / URL Badge */}
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-black/60 text-white select-none">
                  {isFile ? 'New Photo' : 'Saved Photo'}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
