import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { StorageService, UploadProgress } from '../services/storageService';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl?: string;
}

export interface MultiUploadState {
  isUploading: boolean;
  progress: Record<number, number>;
  error: string | null;
  uploadedUrls: string[];
  completedCount: number;
  totalCount: number;
}

// Hook for uploading a single file with progress tracking
export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadFile = useCallback(async (
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      const url = await StorageService.uploadFile(file, path, (progress) => {
        setUploadState(prev => ({
          ...prev,
          progress: progress.progress,
        }));
        onProgress?.(progress);
      });

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        uploadedUrl: url,
      });

      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
    });
  }, []);

  return {
    uploadState,
    uploadFile,
    resetUploadState,
  };
};

// Hook for uploading multiple files with individual progress tracking
export const useMultiFileUpload = () => {
  const [uploadState, setUploadState] = useState<MultiUploadState>({
    isUploading: false,
    progress: {},
    error: null,
    uploadedUrls: [],
    completedCount: 0,
    totalCount: 0,
  });

  const uploadFiles = useCallback(async (
    files: File[],
    eventId: string,
    type: 'media' | 'branding'
  ) => {
    setUploadState({
      isUploading: true,
      progress: {},
      error: null,
      uploadedUrls: [],
      completedCount: 0,
      totalCount: files.length,
    });

    try {
      const urls = await StorageService.uploadMultipleFiles(
        files,
        eventId,
        type,
        (fileIndex, progress) => {
          setUploadState(prev => ({
            ...prev,
            progress: {
              ...prev.progress,
              [fileIndex]: progress.progress,
            },
          }));
        }
      );

      setUploadState({
        isUploading: false,
        progress: {},
        error: null,
        uploadedUrls: urls,
        completedCount: files.length,
        totalCount: files.length,
      });

      return urls;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: {},
      error: null,
      uploadedUrls: [],
      completedCount: 0,
      totalCount: 0,
    });
  }, []);

  return {
    uploadState,
    uploadFiles,
    resetUploadState,
  };
};

// Hook for uploading hero image
export const useHeroImageUpload = () => {
  return useMutation({
    mutationFn: async ({ 
      file, 
      eventId, 
      onProgress 
    }: { 
      file: File; 
      eventId: string; 
      onProgress?: (progress: UploadProgress) => void;
    }) => {
      return StorageService.uploadHeroImage(file, eventId, onProgress);
    },
  });
};

// Hook for uploading event media
export const useEventMediaUpload = () => {
  return useMutation({
    mutationFn: async ({ 
      file, 
      eventId, 
      onProgress 
    }: { 
      file: File; 
      eventId: string; 
      onProgress?: (progress: UploadProgress) => void;
    }) => {
      return StorageService.uploadEventMedia(file, eventId, onProgress);
    },
  });
};

// Hook for uploading event logo
export const useEventLogoUpload = () => {
  return useMutation({
    mutationFn: async ({ 
      file, 
      eventId, 
      onProgress 
    }: { 
      file: File; 
      eventId: string; 
      onProgress?: (progress: UploadProgress) => void;
    }) => {
      return StorageService.uploadEventLogo(file, eventId, onProgress);
    },
  });
};

// Hook for deleting files
export const useFileDelete = () => {
  return useMutation({
    mutationFn: (url: string) => StorageService.deleteFile(url),
  });
};

// Hook for deleting multiple files
export const useMultiFileDelete = () => {
  return useMutation({
    mutationFn: (urls: string[]) => StorageService.deleteMultipleFiles(urls),
  });
};

// Hook for file validation
export const useFileValidation = () => {
  const validateFile = useCallback((
    file: File,
    context: 'image' | 'video' | 'media'
  ): { isValid: boolean; error?: string } => {
    const allowedTypes = StorageService.getAllowedFileTypes(context);
    const maxSize = StorageService.getFileSizeLimit(
      file.type.startsWith('image/') ? 'image' : 'video'
    );

    if (!StorageService.validateFileType(file, allowedTypes)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    if (!StorageService.validateFileSize(file, maxSize)) {
      return {
        isValid: false,
        error: `File size too large. Maximum size: ${StorageService.formatFileSize(maxSize)}`,
      };
    }

    return { isValid: true };
  }, []);

  const validateFiles = useCallback((
    files: File[],
    context: 'image' | 'video' | 'media'
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    files.forEach((file, index) => {
      const validation = validateFile(file, context);
      if (!validation.isValid && validation.error) {
        errors.push(`File ${index + 1}: ${validation.error}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [validateFile]);

  return {
    validateFile,
    validateFiles,
    formatFileSize: StorageService.formatFileSize,
    getAllowedFileTypes: StorageService.getAllowedFileTypes,
    getFileSizeLimit: StorageService.getFileSizeLimit,
  };
}; 