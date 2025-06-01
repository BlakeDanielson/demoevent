import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegistrationForm } from '../RegistrationForm';
import * as useRegistrationHook from '../../lib/hooks/useRegistration';

// Mock the useRegistration hook
jest.mock('../../lib/hooks/useRegistration');

const mockUseRegistration = useRegistrationHook.useRegistration as jest.MockedFunction<
  typeof useRegistrationHook.useRegistration
>;

// Mock data
const mockFormConfig = {
  id: 'form-1',
  eventId: 'event-1',
  title: 'Test Event Registration',
  description: 'Register for our amazing test event',
  customFields: [
    {
      id: 'field-1',
      name: 'company',
      label: 'Company',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your company name',
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
    description: 'Standard event ticket',
    price: 50,
    maxQuantity: 100,
    availableQuantity: 75,
    isActive: true,
  },
];

const mockUseRegistrationReturn = {
  formConfig: mockFormConfig,
  ticketTypes: mockTicketTypes,
  registrations: [],
  registrationSummary: undefined,
  uploadedFiles: {},
  isLoadingFormConfig: false,
  isLoadingTicketTypes: false,
  isLoadingRegistrations: false,
  isLoadingSummary: false,
  isSubmitting: false,
  isUploadingFile: false,
  isUpdatingStatus: false,
  formConfigError: null,
  ticketTypesError: null,
  registrationsError: null,
  summaryError: null,
  submitRegistration: jest.fn(),
  updateRegistrationStatus: jest.fn(),
  uploadFile: jest.fn(),
  removeUploadedFile: jest.fn(),
  getAvailableTickets: jest.fn((ticketId: string) => {
    const ticket = mockTicketTypes.find(t => t.id === ticketId);
    return ticket?.availableQuantity || 0;
  }),
  isRegistrationOpen: jest.fn(() => true),
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

describe('RegistrationForm - Basic Functionality', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRegistration.mockReturnValue(mockUseRegistrationReturn);
  });

  const renderComponent = (props = {}) => {
    return render(
      <RegistrationForm
        eventId="event-1"
        onSuccess={mockOnSuccess}
        {...props}
      />,
      { wrapper: createWrapper() }
    );
  };

  describe('Loading States', () => {
    it('should show loading skeleton when form config is loading', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        isLoadingFormConfig: true,
        formConfig: null,
      });

      renderComponent();

      // Check for loading state instead of specific test id
      expect(screen.getByText(/loading/i) || screen.getByRole('status')).toBeTruthy();
    });

    it('should show loading skeleton when ticket types are loading', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        isLoadingTicketTypes: true,
        ticketTypes: [],
      });

      renderComponent();

      // Check for loading state instead of specific test id
      expect(screen.getByText(/loading/i) || screen.getByRole('status')).toBeTruthy();
    });
  });

  describe('Error States', () => {
    it('should show error message when form config fails to load', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        formConfig: null,
        formConfigError: new Error('Failed to load form config'),
        isLoadingFormConfig: false,
      });

      renderComponent();

      expect(screen.getByText(/failed to load registration form/i)).toBeTruthy();
    });

    it('should show error message when ticket types fail to load', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        ticketTypes: [],
        ticketTypesError: new Error('Failed to load tickets'),
        isLoadingTicketTypes: false,
      });

      renderComponent();

      expect(screen.getByText(/failed to load ticket information/i)).toBeTruthy();
    });

    it('should show message when registration is closed', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        isRegistrationOpen: jest.fn(() => false),
      });

      renderComponent();

      expect(screen.getByText(/registration is currently closed/i)).toBeTruthy();
    });
  });

  describe('Form Rendering', () => {
    it('should render form title and description', () => {
      renderComponent();

      expect(screen.getByText('Test Event Registration')).toBeTruthy();
      expect(screen.getByText('Register for our amazing test event')).toBeTruthy();
    });

    it('should render step indicator', () => {
      renderComponent();

      expect(screen.getByText('Participant Information')).toBeTruthy();
      expect(screen.getByText('Ticket Selection')).toBeTruthy();
      expect(screen.getByText('Review & Submit')).toBeTruthy();
    });

    it('should render primary participant form fields', () => {
      renderComponent();

      expect(screen.getByLabelText(/first name/i)).toBeTruthy();
      expect(screen.getByLabelText(/last name/i)).toBeTruthy();
      expect(screen.getByLabelText(/email/i)).toBeTruthy();
      expect(screen.getByLabelText(/phone/i)).toBeTruthy();
    });

    it('should render custom fields', () => {
      renderComponent();

      expect(screen.getByLabelText('Company')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeTruthy();
        expect(screen.getByText(/last name is required/i)).toBeTruthy();
        expect(screen.getByText(/email is required/i)).toBeTruthy();
        expect(screen.getByText(/company is required/i)).toBeTruthy();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeTruthy();
      });
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      renderComponent();

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, 'invalid-phone');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeTruthy();
      });
    });
  });

  describe('Multi-step Navigation', () => {
    it('should navigate to ticket selection step after valid participant info', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Fill in required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText('Company'), 'Acme Corp');

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeTruthy();
      });
    });

    it('should allow going back to previous step', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Navigate to step 2 first
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Acme Corp');

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeTruthy();
      });

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeTruthy();
        expect(screen.getByDisplayValue('John')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderComponent();

      expect(screen.getByRole('form')).toBeTruthy();
      expect(screen.getByLabelText(/first name/i)).toBeTruthy();
      expect(screen.getByLabelText(/last name/i)).toBeTruthy();
      expect(screen.getByLabelText(/email/i)).toBeTruthy();
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i);
        const errorMessage = screen.getByText(/first name is required/i);
        
        expect(firstNameInput.getAttribute('aria-describedby')).toBeTruthy();
        expect(errorMessage.getAttribute('id')).toBeTruthy();
      });
    });
  });
}); 