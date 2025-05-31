'use client';

import { useState, useRef, useCallback } from 'react';
import { EventMedia } from '@/lib/types/event';
import { Upload, X, Video, GripVertical, Edit2, Check, AlertCircle } from 'lucide-react';

interface MediaUploadProps {
  media: EventMedia[];
  onChange: (media: EventMedia[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function MediaUpload({
  media,
  onChange,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedTypes = ['image/*', 'video/*'],
  className = ''
}: MediaUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File "${file.name}" is too large. Maximum size is ${maxFileSize}MB.`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File "${file.name}" is not a supported format.`;
    }

    return null;
  };

  const processFiles = useCallback(async (files: FileList) => {
    const newErrors: string[] = [];
    const newMedia: EventMedia[] = [];

    // Check total file count
    if (media.length + files.length > maxFiles) {
      newErrors.push(`Cannot upload more than ${maxFiles} files total.`);
      setErrors(newErrors);
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      
      if (error) {
        newErrors.push(error);
        continue;
      }

      try {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const mediaItem: EventMedia = {
          id: `${Date.now()}-${i}`,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url,
          alt: file.name,
          caption: ''
        };

        newMedia.push(mediaItem);
      } catch {
        newErrors.push(`Failed to process file "${file.name}".`);
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    } else {
      setErrors([]);
    }

    if (newMedia.length > 0) {
      onChange([...media, ...newMedia]);
    }
  }, [media, onChange, maxFiles, maxFileSize, validateFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeMedia = (id: string) => {
    onChange(media.filter(item => item.id !== id));
  };

  const startEditingCaption = (id: string, currentCaption: string) => {
    setEditingCaption(id);
    setCaptionValue(currentCaption);
  };

  const saveCaption = (id: string) => {
    onChange(media.map(item => 
      item.id === id ? { ...item, caption: captionValue } : item
    ));
    setEditingCaption(null);
    setCaptionValue('');
  };

  const cancelEditingCaption = () => {
    setEditingCaption(null);
    setCaptionValue('');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newMedia = [...media];
    const draggedItem = newMedia[draggedIndex];
    
    // Remove the dragged item
    newMedia.splice(draggedIndex, 1);
    
    // Insert at new position
    newMedia.splice(dropIndex, 0, draggedItem);
    
    onChange(newMedia);
    setDraggedIndex(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Media Files
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop your images or videos here, or click to browse
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choose Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2">
          Maximum {maxFiles} files, {maxFileSize}MB each. Supports images and videos.
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-1">Upload Errors</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">
            Uploaded Media ({media.length}/{maxFiles})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {media.map((item, index) => (
              <div
                key={item.id}
                className={`relative bg-white border rounded-lg overflow-hidden shadow-sm ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOverItem(e, index)}
                onDrop={(e) => handleDropItem(e, index)}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 z-10 cursor-move bg-black bg-opacity-50 rounded p-1">
                  <GripVertical className="w-4 h-4 text-white" />
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  aria-label="Remove media"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Media Preview */}
                <div className="aspect-video bg-gray-100">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.alt || 'Uploaded image'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Caption Editor */}
                <div className="p-3">
                  {editingCaption === item.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={captionValue}
                        onChange={(e) => setCaptionValue(e.target.value)}
                        placeholder="Add a caption..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveCaption(item.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditingCaption}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-600 flex-1">
                        {item.caption || 'No caption'}
                      </p>
                      <button
                        type="button"
                        onClick={() => startEditingCaption(item.id, item.caption || '')}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                        aria-label="Edit caption"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 