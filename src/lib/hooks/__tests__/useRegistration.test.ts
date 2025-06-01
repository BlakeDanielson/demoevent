import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRegistration } from '../useRegistration';
import * as registrationService from '../../services/registrationService';
import toast from 'react-hot-toast';

// Mock the registration services
jest.mock('../../services/registrationService');
jest.mock('react-hot-toast');

const mockRegistrationService = registrationService as jest.Mocked<typeof registrationService>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock data
const mockFormConfig = {
  id: 'form-1',
  eventId: 'event-1',
  title: 'Test Registration',
  description: 'Test description',
  customFields: [
    {
      id: 'field-1',
      name: 'company',
      label: 'Company',
      type: 'text' as const,
      required: true,
      order: 1,
    },
  ],
  allowGroupRegistration: true,
  maxGroupSize: 5,
  requiresApproval: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTicketTypes = [
  {
    id: 'ticket-1',
    name: 'General Admission',
    description: 'Standard ticket',
    price: 50,
    maxQuantity: 100,
    availableQuantity: 75,
    isActive: true,
  },
  {
    id: 'ticket-2',
    name: 'VIP',
    description: 'VIP ticket',
    price: 100,
    maxQuantity: 50,
    availableQuantity: 25,
    isActive: true,
  },
];

const mockRegistrations = [
  {
    id: 'reg-1',
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
        quantity: 2,
        price: 50,
      },
    ],
    totalAmount: 100,
    status: 'confirmed' as const,
    paymentStatus: 'completed' as const,
    registrationDate: new Date(),
    confirmationCode: 'ABC123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockRegistrationSummary = {
  totalRegistrations: 1,
  confirmedRegistrations: 1,
  pendingRegistrations: 0,
  totalRevenue: 100,
  ticketsSold: { 'ticket-1': 2 },
  registrationsByDate: { '2023-12-25': 1 },
};

const mockUploadedFile = {
  id: 'file-1',
  fieldId: 'field-1',
  fileName: 'test.pdf',
  fileUrl: 'https://example.com/test.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  uploadedAt: new Date(),
};

const mockFormData = {
  primaryParticipant: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    customFieldValues: {},
  },
  additionalParticipants: [],
  ticketSelections: [
    {
      ticketTypeId: 'ticket-1',
      quantity: 2,
      price: 50,
    },
  ],
  agreeToTerms: true,
  marketingOptIn: false,
};

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('useRegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks with proper typing
    (mockRegistrationService.registrationFormService.getFormConfigByEventId as jest.Mock).mockResolvedValue(mockFormConfig);
    (mockRegistrationService.ticketTypeService.getEventTicketTypes as jest.Mock).mockResolvedValue(mockTicketTypes);
    (mockRegistrationService.registrationService.getEventRegistrations as jest.Mock).mockResolvedValue(mockRegistrations);
    (mockRegistrationService.registrationService.getRegistrationSummary as jest.Mock).mockResolvedValue(mockRegistrationSummary);
  });

  describe('Data Fetching', () => {
    it('should fetch form configuration successfully', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.formConfig).toEqual(mockFormConfig);
        expect(result.current.isLoadingFormConfig).toBe(false);
      });

      expect(mockRegistrationService.registrationFormService.getFormConfigByEventId)
        .toHaveBeenCalledWith('event-1');
    });

    it('should fetch ticket types successfully', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.ticketTypes).toEqual(mockTicketTypes);
        expect(result.current.isLoadingTicketTypes).toBe(false);
      });

      expect(mockRegistrationService.ticketTypeService.getEventTicketTypes)
        .toHaveBeenCalledWith('event-1');
    });

    it('should fetch registrations successfully', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.registrations).toEqual(mockRegistrations);
        expect(result.current.isLoadingRegistrations).toBe(false);
      });

      expect(mockRegistrationService.registrationService.getEventRegistrations)
        .toHaveBeenCalledWith('event-1');
    });

    it('should fetch registration summary successfully', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.registrationSummary).toEqual(mockRegistrationSummary);
        expect(result.current.isLoadingSummary).toBe(false);
      });

      expect(mockRegistrationService.registrationService.getRegistrationSummary)
        .toHaveBeenCalledWith('event-1');
    });

    it('should handle fetch errors gracefully', async () => {
      const error = new Error('Fetch failed');
      (mockRegistrationService.registrationFormService.getFormConfigByEventId as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.formConfigError).toBeTruthy();
        expect(result.current.isLoadingFormConfig).toBe(false);
      });
    });
  });

  describe('File Upload', () => {
    it('should upload file successfully', async () => {
      (mockRegistrationService.fileUploadService.uploadFile as jest.Mock).mockResolvedValue(mockUploadedFile);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        await result.current.uploadFile(mockFile, 'field-1');
      });

      await waitFor(() => {
        expect(result.current.uploadedFiles['field-1']).toContain(mockUploadedFile);
      });

      expect(mockRegistrationService.fileUploadService.uploadFile)
        .toHaveBeenCalledWith(mockFile, 'event-1', 'field-1');
      expect(mockToast.success).toHaveBeenCalledWith('File uploaded successfully');
    });

    it('should handle file upload errors', async () => {
      const error = new Error('Upload failed');
      (mockRegistrationService.fileUploadService.uploadFile as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await act(async () => {
        try {
          await result.current.uploadFile(mockFile, 'field-1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to upload file');
    });

    it('should remove uploaded file', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      // First add a file
      act(() => {
        result.current.removeUploadedFile('field-1', 0);
      });

      expect(result.current.uploadedFiles['field-1']).toEqual([]);
    });
  });

  describe('Registration Submission', () => {
    it('should submit registration successfully', async () => {
      (mockRegistrationService.registrationService.createRegistration as jest.Mock).mockResolvedValue('reg-123');
      (mockRegistrationService.generateConfirmationCode as jest.Mock).mockReturnValue('ABC123');

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      // Wait for initial data to load
      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      let submissionResult: any;
      await act(async () => {
        submissionResult = await result.current.submitRegistration(mockFormData);
      });

      expect(submissionResult).toEqual({
        registrationId: 'reg-123',
        confirmationCode: 'ABC123',
      });

      expect(mockRegistrationService.registrationService.createRegistration)
        .toHaveBeenCalled();
      expect(mockRegistrationService.ticketTypeService.updateTicketAvailability)
        .toHaveBeenCalledWith('ticket-1', -2);
    });

    it('should validate ticket availability before submission', async () => {
      const invalidFormData = {
        ...mockFormData,
        ticketSelections: [
          {
            ticketTypeId: 'ticket-1',
            quantity: 100, // More than available (75)
            price: 50,
          },
        ],
      };

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      // Wait for initial data to load
      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      await act(async () => {
        try {
          await result.current.submitRegistration(invalidFormData);
        } catch (error) {
          expect(error).toEqual(new Error('Insufficient tickets available for General Admission'));
        }
      });
    });

    it('should handle submission errors', async () => {
      const error = new Error('Submission failed');
      (mockRegistrationService.registrationService.createRegistration as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      // Wait for initial data to load
      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      await act(async () => {
        try {
          await result.current.submitRegistration(mockFormData);
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Submission failed');
    });

    it('should require form configuration for submission', async () => {
      (mockRegistrationService.registrationFormService.getFormConfigByEventId as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      // Wait for data to load (should be null)
      await waitFor(() => {
        expect(result.current.isLoadingFormConfig).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.submitRegistration(mockFormData);
        } catch (error) {
          expect(error).toEqual(new Error('Registration form configuration not found'));
        }
      });
    });
  });

  describe('Registration Status Updates', () => {
    it('should update registration status successfully', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateRegistrationStatus('reg-123', 'confirmed', 'completed');
      });

      expect(mockRegistrationService.registrationService.updateRegistrationStatus)
        .toHaveBeenCalledWith('reg-123', 'confirmed', 'completed');
      expect(mockToast.success).toHaveBeenCalledWith('Registration status updated successfully');
    });

    it('should handle status update errors', async () => {
      const error = new Error('Update failed');
      (mockRegistrationService.registrationService.updateRegistrationStatus as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.updateRegistrationStatus('reg-123', 'confirmed');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockToast.error).toHaveBeenCalledWith('Failed to update registration status');
    });
  });

  describe('Utility Functions', () => {
    it('should get available tickets correctly', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.ticketTypes).toBeTruthy();
      });

      const availableTickets = result.current.getAvailableTickets('ticket-1');
      expect(availableTickets).toBe(75);

      const nonExistentTickets = result.current.getAvailableTickets('non-existent');
      expect(nonExistentTickets).toBe(0);
    });

    it('should check if registration is open correctly', async () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      const isOpen = result.current.isRegistrationOpen();
      expect(isOpen).toBe(true);
    });

    it('should return false when form config is inactive', async () => {
      const inactiveFormConfig = { ...mockFormConfig, isActive: false };
      (mockRegistrationService.registrationFormService.getFormConfigByEventId as jest.Mock)
        .mockResolvedValue(inactiveFormConfig);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      const isOpen = result.current.isRegistrationOpen();
      expect(isOpen).toBe(false);
    });

    it('should return false when no tickets are available', async () => {
      const soldOutTickets = mockTicketTypes.map(ticket => ({
        ...ticket,
        availableQuantity: 0,
      }));
      (mockRegistrationService.ticketTypeService.getEventTicketTypes as jest.Mock)
        .mockResolvedValue(soldOutTickets);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      const isOpen = result.current.isRegistrationOpen();
      expect(isOpen).toBe(false);
    });

    it('should handle ticket sales dates correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const ticketsWithFutureSales = mockTicketTypes.map(ticket => ({
        ...ticket,
        salesStartDate: futureDate,
      }));
      (mockRegistrationService.ticketTypeService.getEventTicketTypes as jest.Mock)
        .mockResolvedValue(ticketsWithFutureSales);

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      const isOpen = result.current.isRegistrationOpen();
      expect(isOpen).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should handle loading states correctly', () => {
      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      // Initially should be loading
      expect(result.current.isLoadingFormConfig).toBe(true);
      expect(result.current.isLoadingTicketTypes).toBe(true);
      expect(result.current.isLoadingRegistrations).toBe(true);
      expect(result.current.isLoadingSummary).toBe(true);
    });

    it('should track submission state correctly', async () => {
      (mockRegistrationService.registrationService.createRegistration as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('reg-123'), 100))
      );

      const { result } = renderHook(() => useRegistration('event-1'), {
        wrapper: createWrapper(),
      });

      // Wait for initial data to load
      await waitFor(() => {
        expect(result.current.formConfig).toBeTruthy();
        expect(result.current.ticketTypes).toBeTruthy();
      });

      expect(result.current.isSubmitting).toBe(false);

      act(() => {
        result.current.submitRegistration(mockFormData);
      });

      expect(result.current.isSubmitting).toBe(true);

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });
}); 