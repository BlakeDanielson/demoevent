'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, Video, AlertCircle, GripVertical } from 'lucide-react';
import { EventMedia } from '@/lib/types/event';
import toast from 'react-hot-toast';

interface EnhancedMediaUploadProps {
  media: EventMedia[];
  onChange: (media: EventMedia[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
}

const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_TYPES = ['image/*', 'video/*'];

export const EnhancedMediaUpload: React.FC<EnhancedMediaUploadProps> = ({
  media,
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  className = '',
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Handle rejected files
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error) => {
          if (error.code === 'file-too-large') {
            toast.error(`File "${file.name}" is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File "${file.name}" is not a supported format.`);
          } else {
            toast.error(`Error with file "${file.name}": ${error.message}`);
          }
        });
      });

      // Process accepted files
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const newMediaItem: EventMedia = {
            id: `${Date.now()}-${Math.random()}`,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url: result,
            alt: file.name,
            caption: '',
          };

          onChange([...media, newMediaItem]);
        };
        reader.readAsDataURL(file);
      });
    },
    [media, onChange, maxFileSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles - media.length,
    multiple: true,
  });

  const removeMedia = (id: number | string) => {
    onChange(media.filter((item) => item.id !== id));
  };

  const updateCaption = (id: number | string, caption: string) => {
    onChange(media.map((item) => (item.id === id ? { ...item, caption } : item)));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const newMedia = [...media];
    const draggedItem = newMedia[draggedIndex];
    
    // Remove the dragged item
    newMedia.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newMedia.splice(insertIndex, 0, draggedItem);
    
    onChange(newMedia);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${media.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={media.length >= maxFiles} />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 font-medium mb-2">
              {media.length >= maxFiles 
                ? `Maximum ${maxFiles} files reached`
                : 'Drag & drop media files here, or click to select'
              }
            </p>
            <p className="text-sm text-gray-500">
              Supports images and videos up to {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
            <p className="text-sm text-gray-500">
              {maxFiles - media.length} files remaining
            </p>
          </div>
        )}
      </div>

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                relative group bg-white rounded-lg border shadow-sm overflow-hidden cursor-move
                ${draggedIndex === index ? 'opacity-50' : ''}
                ${dragOverIndex === index ? 'ring-2 ring-blue-500' : ''}
                transition-all duration-200
              `}
            >
              {/* Drag Handle */}
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeMedia(item.id)}
                className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Remove media"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Media Preview */}
              <div className="aspect-video bg-gray-100 relative">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.alt || 'Uploaded media'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Video className="h-8 w-8 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">Video</span>
                  </div>
                )}
              </div>

              {/* Caption Input */}
              <div className="p-3">
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={item.caption || ''}
                  onChange={(e) => updateCaption(item.id, e.target.value)}
                  className="w-full text-sm border-none outline-none resize-none bg-transparent placeholder-gray-400"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {media.length === 0 && (
        <div className="text-center py-4">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No media files uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedMediaUpload; 