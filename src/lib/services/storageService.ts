import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '../firebase';
import { EventMedia } from '../types/event';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export class StorageService {
  // Upload a single file
  static async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const storageRef = ref(storage, path);

      if (onProgress) {
        // Use resumable upload for progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              };
              onProgress(progress);
            },
            () => {
              reject(new Error('Failed to upload file'));
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
      } else {
        // Simple upload without progress tracking
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  // Upload event hero image
  static async uploadHeroImage(
    file: File,
    eventId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const fileName = `hero-${Date.now()}-${file.name}`;
    const path = `events/${eventId}/hero/${fileName}`;
    return this.uploadFile(file, path, onProgress);
  }

  // Upload event media (images/videos)
  static async uploadEventMedia(
    file: File,
    eventId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<EventMedia> {
    const fileName = `media-${Date.now()}-${file.name}`;
    const path = `events/${eventId}/media/${fileName}`;
    const url = await this.uploadFile(file, path, onProgress);

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

    return {
      id: `${eventId}-${Date.now()}`,
      type: mediaType,
      url,
      alt: file.name,
    };
  }

  // Upload event logo
  static async uploadEventLogo(
    file: File,
    eventId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const fileName = `logo-${Date.now()}-${file.name}`;
    const path = `events/${eventId}/branding/${fileName}`;
    return this.uploadFile(file, path, onProgress);
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: File[],
    eventId: string,
    type: 'media' | 'branding',
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `${type}-${Date.now()}-${index}-${file.name}`;
      const path = `events/${eventId}/${type}/${fileName}`;
      
      const progressCallback = onProgress 
        ? (progress: UploadProgress) => onProgress(index, progress)
        : undefined;

      return this.uploadFile(file, path, progressCallback);
    });

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw new Error('Failed to upload one or more files');
    }
  }

  // Delete a file
  static async deleteFile(url: string): Promise<void> {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Delete multiple files
  static async deleteMultipleFiles(urls: string[]): Promise<void> {
    const deletePromises = urls.map(url => this.deleteFile(url));
    
    try {
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw new Error('Failed to delete one or more files');
    }
  }

  // Get file size limit based on type
  static getFileSizeLimit(type: 'image' | 'video'): number {
    // Return size in bytes
    switch (type) {
      case 'image':
        return 10 * 1024 * 1024; // 10MB
      case 'video':
        return 100 * 1024 * 1024; // 100MB
      default:
        return 10 * 1024 * 1024; // 10MB default
    }
  }

  // Validate file type
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => file.type.startsWith(type));
  }

  // Validate file size
  static validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  // Get allowed file types for different upload contexts
  static getAllowedFileTypes(context: 'image' | 'video' | 'media'): string[] {
    switch (context) {
      case 'image':
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      case 'video':
        return ['video/mp4', 'video/webm', 'video/ogg'];
      case 'media':
        return [
          'image/jpeg', 'image/png', 'image/webp', 'image/gif',
          'video/mp4', 'video/webm', 'video/ogg'
        ];
      default:
        return ['image/jpeg', 'image/png', 'image/webp'];
    }
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 