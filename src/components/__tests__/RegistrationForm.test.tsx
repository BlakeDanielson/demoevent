import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegistrationForm from '../RegistrationForm';
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
    {
      id: 'field-2',
      name: 'dietary',
      label: 'Dietary Requirements',
      type: 'select' as const,
      required: false,
      options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free'],
      order: 2,
    },
    {
      id: 'field-3',
      name: 'resume',
      label: 'Resume',
      type: 'file' as const,
      required: false,
      validation: {
        fileTypes: ['.pdf', '.doc', '.docx'],
        maxFileSize: 5242880, // 5MB
      },
      order: 3,
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
  {
    id: 'ticket-2',
    name: 'VIP',
    description: 'Premium event experience',
    price: 100,
    maxQuantity: 50,
    availableQuantity: 25,
    isActive: true,
  },
];

const mockUseRegistrationReturn = {
  formConfig: mockFormConfig,
  ticketTypes: mockTicketTypes,
  registrations: [],
  registrationSummary: null,
  uploadedFiles: {},
  isLoadingFormConfig: false,
  isLoadingTicketTypes: false,
  isLoadingRegistrations: false,
  isLoadingSummary: false,
  isSubmitting: false,
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

describe('RegistrationForm', () => {
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

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should show loading skeleton when ticket types are loading', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        isLoadingTicketTypes: true,
        ticketTypes: [],
      });

      renderComponent();

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
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

      expect(screen.getByText(/failed to load registration form/i)).toBeInTheDocument();
    });

    it('should show error message when ticket types fail to load', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        ticketTypes: [],
        ticketTypesError: new Error('Failed to load tickets'),
        isLoadingTicketTypes: false,
      });

      renderComponent();

      expect(screen.getByText(/failed to load ticket information/i)).toBeInTheDocument();
    });

    it('should show message when registration is closed', () => {
      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        isRegistrationOpen: jest.fn(() => false),
      });

      renderComponent();

      expect(screen.getByText(/registration is currently closed/i)).toBeInTheDocument();
    });
  });

  describe('Form Rendering', () => {
    it('should render form title and description', () => {
      renderComponent();

      expect(screen.getByText('Test Event Registration')).toBeInTheDocument();
      expect(screen.getByText('Register for our amazing test event')).toBeInTheDocument();
    });

    it('should render step indicator', () => {
      renderComponent();

      expect(screen.getByText('Participant Information')).toBeInTheDocument();
      expect(screen.getByText('Ticket Selection')).toBeInTheDocument();
      expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    });

    it('should render primary participant form fields', () => {
      renderComponent();

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });

    it('should render custom fields', () => {
      renderComponent();

      expect(screen.getByLabelText('Company')).toBeInTheDocument();
      expect(screen.getByLabelText('Dietary Requirements')).toBeInTheDocument();
      expect(screen.getByLabelText('Resume')).toBeInTheDocument();
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
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/company is required/i)).toBeInTheDocument();
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
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
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
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
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
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
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
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });
    });
  });

  describe('Ticket Selection', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderComponent();

      // Navigate to ticket selection step
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Acme Corp');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });
    });

    it('should display available ticket types', () => {
      expect(screen.getByText('General Admission')).toBeInTheDocument();
      expect(screen.getByText('Standard event ticket')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('75 available')).toBeInTheDocument();

      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Premium event experience')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('25 available')).toBeInTheDocument();
    });

    it('should allow selecting ticket quantities', async () => {
      const user = userEvent.setup();

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '2');

      expect(generalAdmissionSelect).toHaveValue('2');
    });

    it('should calculate total price correctly', async () => {
      const user = userEvent.setup();

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '2');

      const vipSelect = screen.getByLabelText(/vip quantity/i);
      await user.selectOptions(vipSelect, '1');

      await waitFor(() => {
        expect(screen.getByText(/total: \$200\.00/i)).toBeInTheDocument();
      });
    });

    it('should require at least one ticket selection', async () => {
      const user = userEvent.setup();

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/please select at least one ticket/i)).toBeInTheDocument();
      });
    });
  });

  describe('Group Registration', () => {
    it('should show add participant button when group registration is enabled', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Navigate to participant info step
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Acme Corp');

      expect(screen.getByRole('button', { name: /add participant/i })).toBeInTheDocument();
    });

    it('should add additional participant forms', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Fill primary participant
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Acme Corp');

      // Add additional participant
      const addButton = screen.getByRole('button', { name: /add participant/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/participant 2/i)).toBeInTheDocument();
      });
    });

    it('should enforce maximum group size', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Fill primary participant
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Acme Corp');

      // Add participants up to max group size (5 total, so 4 additional)
      const addButton = screen.getByRole('button', { name: /add participant/i });
      
      for (let i = 0; i < 4; i++) {
        await user.click(addButton);
      }

      // Button should be disabled after reaching max
      expect(addButton).toBeDisabled();
    });
  });

  describe('File Upload', () => {
    it('should handle file upload for file fields', async () => {
      const user = userEvent.setup();
      const mockUploadFile = jest.fn().mockResolvedValue({
        id: 'file-1',
        fieldId: 'field-3',
        fileName: 'resume.pdf',
        fileUrl: 'https://example.com/resume.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedAt: new Date(),
      });

      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        uploadFile: mockUploadFile,
      });

      renderComponent();

      const fileInput = screen.getByLabelText('Resume');
      const file = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' });

      await user.upload(fileInput, file);

      expect(mockUploadFile).toHaveBeenCalledWith(file, 'field-3');
    });

    it('should validate file types', async () => {
      const user = userEvent.setup();
      renderComponent();

      const fileInput = screen.getByLabelText('Resume');
      const invalidFile = new File(['image content'], 'image.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('should validate file size', async () => {
      const user = userEvent.setup();
      renderComponent();

      const fileInput = screen.getByLabelText('Resume');
      // Create a file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const fillCompleteForm = async (user: any) => {
      // Step 1: Participant Information
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText('Company'), 'Acme Corp');
      await user.selectOptions(screen.getByLabelText('Dietary Requirements'), 'Vegetarian');

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2: Ticket Selection
      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '2');

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 3: Review & Submit
      await waitFor(() => {
        expect(screen.getByText(/review your registration/i)).toBeInTheDocument();
      });

      const agreeCheckbox = screen.getByLabelText(/i agree to the terms/i);
      await user.click(agreeCheckbox);
    };

    it('should show review step with all information', async () => {
      const user = userEvent.setup();
      renderComponent();

      await fillCompleteForm(user);

      // Check that review information is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('General Admission × 2')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should require agreement to terms', async () => {
      const user = userEvent.setup();
      renderComponent();

      await fillCompleteForm(user);

      // Uncheck the agreement
      const agreeCheckbox = screen.getByLabelText(/i agree to the terms/i);
      await user.click(agreeCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument();
      });
    });

    it('should submit registration successfully', async () => {
      const user = userEvent.setup();
      const mockSubmitRegistration = jest.fn().mockResolvedValue({
        registrationId: 'reg-123',
        confirmationCode: 'ABC123',
      });

      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        submitRegistration: mockSubmitRegistration,
      });

      renderComponent();

      await fillCompleteForm(user);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitRegistration).toHaveBeenCalledWith({
          primaryParticipant: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            customFieldValues: {
              company: 'Acme Corp',
              dietary: 'Vegetarian',
            },
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
        });
      });

      expect(mockOnSuccess).toHaveBeenCalledWith({
        registrationId: 'reg-123',
        confirmationCode: 'ABC123',
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const mockSubmitRegistration = jest.fn().mockRejectedValue(new Error('Submission failed'));

      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        submitRegistration: mockSubmitRegistration,
      });

      renderComponent();

      await fillCompleteForm(user);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const mockSubmitRegistration = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ registrationId: 'reg-123', confirmationCode: 'ABC123' }), 1000))
      );

      mockUseRegistration.mockReturnValue({
        ...mockUseRegistrationReturn,
        submitRegistration: mockSubmitRegistration,
        isSubmitting: true,
      });

      renderComponent();

      await fillCompleteForm(user);

      const submitButton = screen.getByRole('button', { name: /submitting/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderComponent();

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i);
        const errorMessage = screen.getByText(/first name is required/i);
        
        expect(firstNameInput).toHaveAttribute('aria-describedby');
        expect(errorMessage).toHaveAttribute('id');
      });
    });
  });
}); 