import { fileUploadService } from '../registrationService';

// Mock Firebase
jest.mock('../../firebase', () => ({
  db: {},
  storage: {},
}));

// Mock Firebase Storage functions
const mockRef = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockDeleteObject = jest.fn();
const mockAddDoc = jest.fn();
const mockDeleteDoc = jest.fn();

jest.mock('firebase/storage', () => ({
  ref: (...args: any[]) => mockRef(...args),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: any[]) => mockDeleteObject(...args),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  doc: jest.fn(),
}));

describe('File Upload Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockSnapshot = { ref: 'mock-ref' };
      const mockDownloadURL = 'https://example.com/file.pdf';

      mockUploadBytes.mockResolvedValue(mockSnapshot);
      mockGetDownloadURL.mockResolvedValue(mockDownloadURL);
      mockAddDoc.mockResolvedValue({ id: 'file-123' });

      // Mock crypto.randomUUID
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: () => 'mock-uuid',
        },
      });

      const result = await fileUploadService.uploadFile(mockFile, 'event-1', 'field-1');

      expect(result).toEqual({
        id: 'mock-uuid',
        fieldId: 'field-1',
        fileName: 'test.pdf',
        fileUrl: mockDownloadURL,
        fileSize: mockFile.size,
        mimeType: 'application/pdf',
        uploadedAt: expect.any(Date),
      });

      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      mockUploadBytes.mockRejectedValue(new Error('Upload failed'));

      await expect(fileUploadService.uploadFile(mockFile, 'event-1', 'field-1'))
        .rejects.toThrow('Failed to upload file');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      await fileUploadService.deleteFile('https://example.com/file.pdf', 'file-123');

      expect(mockDeleteObject).toHaveBeenCalled();
      expect(mockDeleteDoc).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      mockDeleteObject.mockRejectedValue(new Error('Delete failed'));

      await expect(fileUploadService.deleteFile('https://example.com/file.pdf', 'file-123'))
        .rejects.toThrow('Failed to delete file');
    });
  });
}); 