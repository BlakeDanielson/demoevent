import { ticketTypeService } from '../registrationService';

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

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

describe('Ticket Type Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTicketType', () => {
    it('should create ticket type successfully', async () => {
      const mockTicketData = {
        name: 'General Admission',
        description: 'Standard ticket',
        price: 50,
        maxQuantity: 100,
        availableQuantity: 100,
        isActive: true,
      };

      mockAddDoc.mockResolvedValue({ id: 'ticket-123' });

      const result = await ticketTypeService.createTicketType(mockTicketData);

      expect(result).toBe('ticket-123');
      expect(mockAddDoc).toHaveBeenCalledWith(expect.anything(), mockTicketData);
    });
  });

  describe('updateTicketAvailability', () => {
    it('should update ticket availability successfully', async () => {
      const mockTicketData = {
        availableQuantity: 50,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTicketData,
      });

      await ticketTypeService.updateTicketAvailability('ticket-123', -2);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { availableQuantity: 48 }
      );
    });

    it('should throw error for insufficient availability', async () => {
      const mockTicketData = {
        availableQuantity: 1,
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockTicketData,
      });

      await expect(ticketTypeService.updateTicketAvailability('ticket-123', -5))
        .rejects.toThrow('Insufficient ticket availability');
    });

    it('should throw error for non-existent ticket', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      await expect(ticketTypeService.updateTicketAvailability('ticket-123', -1))
        .rejects.toThrow('Ticket type not found');
    });
  });

  describe('getEventTicketTypes', () => {
    it('should retrieve active ticket types for an event', async () => {
      const mockTickets = [
        {
          id: 'ticket-1',
          data: () => ({
            name: 'General Admission',
            price: 50,
            isActive: true,
          }),
        },
        {
          id: 'ticket-2',
          data: () => ({
            name: 'VIP',
            price: 100,
            isActive: true,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockTickets,
      });

      const result = await ticketTypeService.getEventTicketTypes('event-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ticket-1');
      expect(result[1].id).toBe('ticket-2');
    });
  });
}); 