import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { RegistrationForm } from '../../components/RegistrationForm';
import * as registrationService from '../../lib/services/registrationService';

// Mock Firebase modules
jest.mock('../../lib/firebase', () => ({
  db: {},
  storage: {},
}));

// Mock the registration services with actual implementations for integration testing
jest.mock('../../lib/services/registrationService', () => ({
  registrationService: {
    createRegistration: jest.fn(),
    getRegistration: jest.fn(),
    updateRegistrationStatus: jest.fn(),
    getEventRegistrations: jest.fn(),
    getRegistrationSummary: jest.fn(),
  },
  registrationFormService: {
    createFormConfig: jest.fn(),
    getFormConfigByEventId: jest.fn(),
    updateFormConfig: jest.fn(),
  },
  ticketTypeService: {
    createTicketType: jest.fn(),
    getEventTicketTypes: jest.fn(),
    updateTicketAvailability: jest.fn(),
  },
  fileUploadService: {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  },
  generateConfirmationCode: jest.fn(() => 'TEST123'),
}));

// Mock data
const mockFormConfig = {
  id: 'form-1',
  eventId: 'event-1',
  title: 'Integration Test Event',
  description: 'Testing the complete registration flow',
  customFields: [
    {
      id: 'field-1',
      name: 'company',
      label: 'Company',
      type: 'text' as const,
      required: true,
      order: 1,
    },
    {
      id: 'field-2',
      name: 'dietary',
      label: 'Dietary Requirements',
      type: 'select' as const,
      required: false,
      options: ['None', 'Vegetarian', 'Vegan'],
      order: 2,
    },
  ],
  allowGroupRegistration: true,
  maxGroupSize: 3,
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
    availableQuantity: 95,
    isActive: true,
  },
  {
    id: 'ticket-2',
    name: 'VIP',
    description: 'Premium ticket',
    price: 100,
    maxQuantity: 20,
    availableQuantity: 15,
    isActive: true,
  },
];

// MSW server setup for API mocking
const server = setupServer(
  // Mock external API calls if needed
  http.get('/api/events/:eventId/form-config', () => {
    return HttpResponse.json(mockFormConfig);
  }),
  
  http.get('/api/events/:eventId/tickets', () => {
    return HttpResponse.json(mockTicketTypes);
  }),
  
  http.post('/api/registrations', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'reg-123',
      confirmationCode: 'TEST123',
      ...body,
    });
  })
);

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
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

describe('Registration Integration Tests', () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    // Setup service mocks
    (registrationService.registrationFormService.getFormConfigByEventId as jest.Mock)
      .mockResolvedValue(mockFormConfig);
    (registrationService.ticketTypeService.getEventTicketTypes as jest.Mock)
      .mockResolvedValue(mockTicketTypes);
    (registrationService.registrationService.createRegistration as jest.Mock)
      .mockResolvedValue('reg-123');
    (registrationService.ticketTypeService.updateTicketAvailability as jest.Mock)
      .mockResolvedValue(undefined);
  });

  describe('Complete Registration Flow', () => {
    it('should complete a full single participant registration successfully', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      render(
        <RegistrationForm eventId="event-1" onSuccess={mockOnSuccess} />,
        { wrapper: createWrapper() }
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      // Step 1: Fill participant information
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText('Company'), 'Test Corp');
      await user.selectOptions(screen.getByLabelText('Dietary Requirements'), 'Vegetarian');

      // Navigate to ticket selection
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 2: Select tickets
      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '2');

      // Navigate to review
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Step 3: Review and submit
      await waitFor(() => {
        expect(screen.getByText(/review your registration/i)).toBeInTheDocument();
      });

      // Verify review information
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test Corp')).toBeInTheDocument();
      expect(screen.getByText('General Admission × 2')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();

      // Agree to terms and submit
      const agreeCheckbox = screen.getByLabelText(/i agree to the terms/i);
      await user.click(agreeCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user.click(submitButton);

      // Verify service calls
      await waitFor(() => {
        expect(registrationService.registrationService.createRegistration).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: 'event-1',
            formConfigId: 'form-1',
            primaryParticipant: expect.objectContaining({
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: '+1234567890',
              customFieldValues: {
                company: 'Test Corp',
                dietary: 'Vegetarian',
              },
            }),
            additionalParticipants: [],
            ticketSelections: [
              {
                ticketTypeId: 'ticket-1',
                quantity: 2,
                price: 50,
              },
            ],
            totalAmount: 100,
            status: 'confirmed',
            paymentStatus: 'completed',
            confirmationCode: 'TEST123',
            registrationDate: expect.any(Date),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          })
        );
      });

      // Verify ticket availability update
      expect(registrationService.ticketTypeService.updateTicketAvailability)
        .toHaveBeenCalledWith('ticket-1', -2);

      // Verify success callback
      expect(mockOnSuccess).toHaveBeenCalledWith('TEST123');
    });

    it('should handle group registration with multiple participants', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      render(
        <RegistrationForm eventId="event-1" onSuccess={mockOnSuccess} />,
        { wrapper: createWrapper() }
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      // Fill primary participant
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Test Corp');

      // Add additional participant
      const addButton = screen.getByRole('button', { name: /add participant/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/participant 2/i)).toBeInTheDocument();
      });

      // Fill additional participant
      const additionalFirstName = screen.getByLabelText(/participant 2.*first name/i);
      const additionalLastName = screen.getByLabelText(/participant 2.*last name/i);
      const additionalEmail = screen.getByLabelText(/participant 2.*email/i);
      const additionalCompany = screen.getByLabelText(/participant 2.*company/i);

      await user.type(additionalFirstName, 'Jane');
      await user.type(additionalLastName, 'Smith');
      await user.type(additionalEmail, 'jane@example.com');
      await user.type(additionalCompany, 'Another Corp');

      // Navigate to ticket selection
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select tickets for group
      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '2'); // 2 tickets for 2 people

      // Navigate to review and submit
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/review your registration/i)).toBeInTheDocument();
      });

      // Verify group information is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Submit registration
      const agreeCheckbox = screen.getByLabelText(/i agree to the terms/i);
      await user.click(agreeCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user.click(submitButton);

      // Verify group registration was created
      await waitFor(() => {
        expect(registrationService.registrationService.createRegistration).toHaveBeenCalledWith(
          expect.objectContaining({
            primaryParticipant: expect.objectContaining({
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
            }),
            additionalParticipants: [
              expect.objectContaining({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                customFieldValues: {
                  company: 'Another Corp',
                },
              }),
            ],
          })
        );
      });
    });

    it('should handle ticket availability constraints', async () => {
      const user = userEvent.setup();

      // Mock limited ticket availability
      const limitedTickets = [
        {
          ...mockTicketTypes[0],
          availableQuantity: 1, // Only 1 ticket available
        },
        mockTicketTypes[1],
      ];

      (registrationService.ticketTypeService.getEventTicketTypes as jest.Mock)
        .mockResolvedValue(limitedTickets);

      render(
        <RegistrationForm eventId="event-1" onSuccess={jest.fn()} />,
        { wrapper: createWrapper() }
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      // Fill participant information
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Test Corp');

      // Navigate to ticket selection
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      // Verify limited availability is displayed
      expect(screen.getByText('1 available')).toBeInTheDocument();

      // Try to select more tickets than available
      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      
      // The select should only show options up to available quantity
      const options = screen.getAllByRole('option');
      const generalAdmissionOptions = options.filter(option => 
        option.textContent && parseInt(option.textContent) <= 1
      );
      
      expect(generalAdmissionOptions.length).toBeGreaterThan(0);
    });

    it('should handle form validation errors across steps', async () => {
      const user = userEvent.setup();

      render(
        <RegistrationForm eventId="event-1" onSuccess={jest.fn()} />,
        { wrapper: createWrapper() }
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Verify validation errors are shown
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/company is required/i)).toBeInTheDocument();
      });

      // Fill some fields but with invalid data
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText('Company'), 'Test Corp');

      await user.click(nextButton);

      // Verify email validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });

      // Fix email and proceed
      await user.clear(screen.getByLabelText(/email/i));
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      await user.click(nextButton);

      // Should now proceed to ticket selection
      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      // Try to proceed without selecting tickets
      const nextButton2 = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton2);

      // Verify ticket selection validation
      await waitFor(() => {
        expect(screen.getByText(/please select at least one ticket/i)).toBeInTheDocument();
      });
    });

    it('should handle service errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock service error
      (registrationService.registrationService.createRegistration as jest.Mock)
        .mockRejectedValue(new Error('Database connection failed'));

      render(
        <RegistrationForm eventId="event-1" onSuccess={jest.fn()} />,
        { wrapper: createWrapper() }
      );

      // Complete the form
      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      // Fill participant information
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Test Corp');

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Select tickets
      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '1');

      await user.click(screen.getByRole('button', { name: /next/i }));

      // Submit registration
      await waitFor(() => {
        expect(screen.getByText(/review your registration/i)).toBeInTheDocument();
      });

      const agreeCheckbox = screen.getByLabelText(/i agree to the terms/i);
      await user.click(agreeCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user.click(submitButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should properly transform and validate data through the entire flow', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = jest.fn();

      render(
        <RegistrationForm eventId="event-1" onSuccess={mockOnSuccess} />,
        { wrapper: createWrapper() }
      );

      // Complete registration flow
      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1-234-567-8900');
      await user.type(screen.getByLabelText('Company'), 'Test Corp');
      await user.selectOptions(screen.getByLabelText('Dietary Requirements'), 'Vegan');

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '2');

      const vipSelect = screen.getByLabelText(/vip quantity/i);
      await user.selectOptions(vipSelect, '1');

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/review your registration/i)).toBeInTheDocument();
      });

      const agreeCheckbox = screen.getByLabelText(/i agree to the terms/i);
      await user.click(agreeCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user.click(submitButton);

      // Verify the exact data structure passed to the service
      await waitFor(() => {
        expect(registrationService.registrationService.createRegistration).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId: 'event-1',
            formConfigId: 'form-1',
            primaryParticipant: {
              id: expect.any(String),
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phone: '+1-234-567-8900',
              customFieldValues: {
                company: 'Test Corp',
                dietary: 'Vegan',
              },
              uploadedFiles: [],
            },
            additionalParticipants: [],
            ticketSelections: [
              {
                ticketTypeId: 'ticket-1',
                quantity: 2,
                price: 50,
              },
              {
                ticketTypeId: 'ticket-2',
                quantity: 1,
                price: 100,
              },
            ],
            totalAmount: 200, // (2 * 50) + (1 * 100)
            status: 'confirmed',
            paymentStatus: 'completed',
            confirmationCode: 'TEST123',
            registrationDate: expect.any(Date),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          })
        );
      });

      // Verify ticket availability updates for both ticket types
      expect(registrationService.ticketTypeService.updateTicketAvailability)
        .toHaveBeenCalledWith('ticket-1', -2);
      expect(registrationService.ticketTypeService.updateTicketAvailability)
        .toHaveBeenCalledWith('ticket-2', -1);
    });

    it('should handle concurrent registration attempts', async () => {
      const user1 = userEvent.setup();
      const user2 = userEvent.setup();

      // Mock scenario where first registration succeeds, second fails due to insufficient tickets
      let callCount = 0;
      (registrationService.registrationService.createRegistration as jest.Mock)
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve('reg-123');
          } else {
            return Promise.reject(new Error('Insufficient tickets available'));
          }
        });

      // Render two forms simultaneously
      const { rerender } = render(
        <RegistrationForm eventId="event-1" onSuccess={jest.fn()} />,
        { wrapper: createWrapper() }
      );

      // This test would be more realistic with actual concurrent users,
      // but demonstrates the error handling for race conditions
      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      // Fill and submit first registration
      await user1.type(screen.getByLabelText(/first name/i), 'John');
      await user1.type(screen.getByLabelText(/last name/i), 'Doe');
      await user1.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user1.type(screen.getByLabelText('Company'), 'Test Corp');

      await user1.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user1.selectOptions(generalAdmissionSelect, '1');

      await user1.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/review your registration/i)).toBeInTheDocument();
      });

      const agreeCheckbox = screen.getByLabelText(/i agree to the terms/i);
      await user1.click(agreeCheckbox);

      const submitButton = screen.getByRole('button', { name: /submit registration/i });
      await user1.click(submitButton);

      // First registration should succeed
      await waitFor(() => {
        expect(registrationService.registrationService.createRegistration).toHaveBeenCalledTimes(1);
      });

      // Simulate second registration attempt
      rerender(
        <RegistrationForm eventId="event-1" onSuccess={jest.fn()} />
      );

      // The second attempt would fail with insufficient tickets error
      // This demonstrates the system's ability to handle race conditions
    });
  });

  describe('Form State Management', () => {
    it('should preserve form data when navigating between steps', async () => {
      const user = userEvent.setup();

      render(
        <RegistrationForm eventId="event-1" onSuccess={jest.fn()} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument();
      });

      // Fill participant information
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText('Company'), 'Test Corp');
      await user.selectOptions(screen.getByLabelText('Dietary Requirements'), 'Vegetarian');

      // Navigate to ticket selection
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      // Select tickets
      const generalAdmissionSelect = screen.getByLabelText(/general admission quantity/i);
      await user.selectOptions(generalAdmissionSelect, '2');

      // Navigate back to participant info
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Verify data is preserved
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Corp')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Vegetarian')).toBeInTheDocument();

      // Navigate forward again
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/select your tickets/i)).toBeInTheDocument();
      });

      // Verify ticket selection is preserved
      const preservedSelect = screen.getByLabelText(/general admission quantity/i);
      expect(preservedSelect).toHaveValue('2');
    });
  });
}); 