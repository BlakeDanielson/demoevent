import {
  registrationService,
  registrationFormService,
  ticketTypeService,
  fileUploadService,
  generateConfirmationCode,
} from '../registrationService';
import { Registration, RegistrationFormConfig, TicketType } from '../../types/registration';

// Mock Firebase
jest.mock('../../firebase', () => ({
  db: {},
  storage: {},
}));

// Mock Firestore functions
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockWriteBatch = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  writeBatch: (...args: any[]) => mockWriteBatch(...args),
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date }),
  },
}));

// Mock Firebase Storage functions
const mockRef = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockDeleteObject = jest.fn();

jest.mock('firebase/storage', () => ({
  ref: (...args: any[]) => mockRef(...args),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
  deleteObject: (...args: any[]) => mockDeleteObject(...args),
}));

describe('Registration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRegistration', () => {
    it('should create a new registration successfully', async () => {
      const mockRegistrationData = {
        eventId: 'event-1',
        formConfigId: 'form-1',
        primaryParticipant: {
          id: 'participant-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          customFieldValues: {},
        },
        additionalParticipants: [],
        ticketSelections: [
          {
            ticketTypeId: 'ticket-1',
            quantity: 1,
            price: 50,
          },
        ],
        totalAmount: 50,
        status: 'confirmed' as const,
        paymentStatus: 'completed' as const,
        registrationDate: new Date(),
        confirmationCode: 'ABC123',
      };

      mockAddDoc.mockResolvedValue({ id: 'registration-123' });

      const result = await registrationService.createRegistration(mockRegistrationData);

      expect(result).toBe('registration-123');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...mockRegistrationData,
          createdAt: expect.anything(),
          updatedAt: expect.anything(),
        })
      );
    });

    it('should handle creation errors', async () => {
      const mockRegistrationData = {
        eventId: 'event-1',
        formConfigId: 'form-1',
        primaryParticipant: {
          id: 'participant-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          customFieldValues: {},
        },
        additionalParticipants: [],
        ticketSelections: [],
        totalAmount: 0,
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        registrationDate: new Date(),
        confirmationCode: 'ABC123',
      };

      mockAddDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(registrationService.createRegistration(mockRegistrationData))
        .rejects.toThrow('Failed to create registration');
    });
  });

  describe('getRegistration', () => {
    it('should retrieve a registration by ID', async () => {
      const mockRegistrationData = {
        eventId: 'event-1',
        formConfigId: 'form-1',
        primaryParticipant: {
          id: 'participant-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          customFieldValues: {},
        },
        additionalParticipants: [],
        ticketSelections: [],
        totalAmount: 50,
        status: 'confirmed',
        paymentStatus: 'completed',
        registrationDate: { toDate: () => new Date('2023-12-25') },
        confirmationCode: 'ABC123',
        createdAt: { toDate: () => new Date('2023-12-25') },
        updatedAt: { toDate: () => new Date('2023-12-25') },
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'registration-123',
        data: () => mockRegistrationData,
      });

      const result = await registrationService.getRegistration('registration-123');

      expect(result).toEqual({
        id: 'registration-123',
        ...mockRegistrationData,
        registrationDate: new Date('2023-12-25'),
        createdAt: new Date('2023-12-25'),
        updatedAt: new Date('2023-12-25'),
      });
    });

    it('should return null for non-existent registration', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await registrationService.getRegistration('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateRegistrationStatus', () => {
    it('should update registration status successfully', async () => {
      await registrationService.updateRegistrationStatus('registration-123', 'confirmed', 'completed');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'confirmed',
          paymentStatus: 'completed',
          updatedAt: expect.anything(),
          approvedAt: expect.anything(),
        })
      );
    });

    it('should handle update errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(registrationService.updateRegistrationStatus('registration-123', 'confirmed'))
        .rejects.toThrow('Failed to update registration status');
    });
  });

  describe('getEventRegistrations', () => {
    it('should retrieve all registrations for an event', async () => {
      const mockRegistrations = [
        {
          id: 'reg-1',
          data: () => ({
            eventId: 'event-1',
            status: 'confirmed',
            registrationDate: { toDate: () => new Date('2023-12-25') },
            createdAt: { toDate: () => new Date('2023-12-25') },
            updatedAt: { toDate: () => new Date('2023-12-25') },
          }),
        },
        {
          id: 'reg-2',
          data: () => ({
            eventId: 'event-1',
            status: 'pending',
            registrationDate: { toDate: () => new Date('2023-12-26') },
            createdAt: { toDate: () => new Date('2023-12-26') },
            updatedAt: { toDate: () => new Date('2023-12-26') },
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockRegistrations,
      });

      const result = await registrationService.getEventRegistrations('event-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('reg-1');
      expect(result[1].id).toBe('reg-2');
    });
  });

  describe('getRegistrationSummary', () => {
    it('should calculate registration summary correctly', async () => {
      const mockRegistrations = [
        {
          status: 'confirmed',
          paymentStatus: 'completed',
          totalAmount: 100,
          ticketSelections: [{ ticketTypeId: 'ticket-1', quantity: 2 }],
          registrationDate: new Date('2023-12-25'),
        },
        {
          status: 'pending',
          paymentStatus: 'pending',
          totalAmount: 50,
          ticketSelections: [{ ticketTypeId: 'ticket-2', quantity: 1 }],
          registrationDate: new Date('2023-12-25'),
        },
        {
          status: 'confirmed',
          paymentStatus: 'completed',
          totalAmount: 75,
          ticketSelections: [{ ticketTypeId: 'ticket-1', quantity: 1 }],
          registrationDate: new Date('2023-12-26'),
        },
      ];

      // Mock getEventRegistrations
      jest.spyOn(registrationService, 'getEventRegistrations')
        .mockResolvedValue(mockRegistrations as any);

      const result = await registrationService.getRegistrationSummary('event-1');

      expect(result).toEqual({
        totalRegistrations: 3,
        confirmedRegistrations: 2,
        pendingRegistrations: 1,
        totalRevenue: 175, // 100 + 75 (only completed payments)
        ticketsSold: {
          'ticket-1': 3, // 2 + 1
          'ticket-2': 1,
        },
        registrationsByDate: {
          '2023-12-25': 2,
          '2023-12-26': 1,
        },
      });
    });
  });
});

describe('generateConfirmationCode', () => {
  it('should generate a confirmation code of correct length', () => {
    const code = generateConfirmationCode();

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateConfirmationCode());
    }

    // Should generate mostly unique codes (allowing for small chance of collision)
    expect(codes.size).toBeGreaterThan(95);
  });
}); 