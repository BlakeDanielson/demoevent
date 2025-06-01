import { z } from 'zod';
import {
  customFieldSchema,
  ticketTypeSchema,
  participantSchema,
  ticketSelectionSchema,
  registrationFormSchema,
  registrationFormConfigSchema,
} from '../registration';

describe('Registration Validation Schemas', () => {
  describe('customFieldSchema', () => {
    it('should validate a valid custom field', () => {
      const validField = {
        id: 'field-1',
        name: 'firstName',
        label: 'First Name',
        type: 'text' as const,
        required: true,
        placeholder: 'Enter your first name',
        order: 1,
      };

      expect(() => customFieldSchema.parse(validField)).not.toThrow();
    });

    it('should reject invalid field types', () => {
      const invalidField = {
        id: 'field-1',
        name: 'firstName',
        label: 'First Name',
        type: 'invalid-type',
        required: true,
        order: 1,
      };

      expect(() => customFieldSchema.parse(invalidField)).toThrow();
    });

    it('should require name and label', () => {
      const fieldWithoutName = {
        id: 'field-1',
        label: 'First Name',
        type: 'text' as const,
        required: true,
        order: 1,
      };

      const fieldWithoutLabel = {
        id: 'field-1',
        name: 'firstName',
        type: 'text' as const,
        required: true,
        order: 1,
      };

      expect(() => customFieldSchema.parse(fieldWithoutName)).toThrow();
      expect(() => customFieldSchema.parse(fieldWithoutLabel)).toThrow();
    });

    it('should validate file field with validation options', () => {
      const fileField = {
        id: 'file-1',
        name: 'resume',
        label: 'Resume',
        type: 'file' as const,
        required: true,
        validation: {
          fileTypes: ['.pdf', '.doc', '.docx'],
          maxFileSize: 5242880, // 5MB
        },
        order: 1,
      };

      expect(() => customFieldSchema.parse(fileField)).not.toThrow();
    });

    it('should validate select field with options', () => {
      const selectField = {
        id: 'select-1',
        name: 'country',
        label: 'Country',
        type: 'select' as const,
        required: true,
        options: ['USA', 'Canada', 'UK'],
        order: 1,
      };

      expect(() => customFieldSchema.parse(selectField)).not.toThrow();
    });
  });

  describe('ticketTypeSchema', () => {
    it('should validate a valid ticket type', () => {
      const validTicket = {
        id: 'ticket-1',
        name: 'General Admission',
        description: 'Standard event ticket',
        price: 50.00,
        maxQuantity: 100,
        availableQuantity: 75,
        isActive: true,
      };

      expect(() => ticketTypeSchema.parse(validTicket)).not.toThrow();
    });

    it('should reject negative prices', () => {
      const invalidTicket = {
        id: 'ticket-1',
        name: 'General Admission',
        price: -10,
        maxQuantity: 100,
        availableQuantity: 75,
        isActive: true,
      };

      expect(() => ticketTypeSchema.parse(invalidTicket)).toThrow();
    });

    it('should reject zero or negative quantities', () => {
      const invalidMaxQuantity = {
        id: 'ticket-1',
        name: 'General Admission',
        price: 50,
        maxQuantity: 0,
        availableQuantity: 75,
        isActive: true,
      };

      const invalidAvailableQuantity = {
        id: 'ticket-1',
        name: 'General Admission',
        price: 50,
        maxQuantity: 100,
        availableQuantity: -5,
        isActive: true,
      };

      expect(() => ticketTypeSchema.parse(invalidMaxQuantity)).toThrow();
      expect(() => ticketTypeSchema.parse(invalidAvailableQuantity)).toThrow();
    });

    it('should allow free tickets (price = 0)', () => {
      const freeTicket = {
        id: 'ticket-1',
        name: 'Free Admission',
        price: 0,
        maxQuantity: 100,
        availableQuantity: 75,
        isActive: true,
      };

      expect(() => ticketTypeSchema.parse(freeTicket)).not.toThrow();
    });
  });

  describe('participantSchema', () => {
    it('should validate a valid participant', () => {
      const validParticipant = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        customFieldValues: {
          company: 'Acme Corp',
          dietary: 'vegetarian',
        },
      };

      expect(() => participantSchema.parse(validParticipant)).not.toThrow();
    });

    it('should require first name, last name, and email', () => {
      const invalidParticipant = {
        lastName: 'Doe',
        email: 'john.doe@example.com',
        customFieldValues: {},
      };

      expect(() => participantSchema.parse(invalidParticipant)).toThrow();
    });

    it('should validate email format', () => {
      const invalidEmail = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        customFieldValues: {},
      };

      expect(() => participantSchema.parse(invalidEmail)).toThrow();
    });

    it('should allow optional phone', () => {
      const participantWithoutPhone = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        customFieldValues: {},
      };

      expect(() => participantSchema.parse(participantWithoutPhone)).not.toThrow();
    });
  });

  describe('ticketSelectionSchema', () => {
    it('should validate a valid ticket selection', () => {
      const validSelection = {
        ticketTypeId: 'ticket-1',
        quantity: 2,
        price: 50.00,
      };

      expect(() => ticketSelectionSchema.parse(validSelection)).not.toThrow();
    });

    it('should require positive quantity', () => {
      const invalidSelection = {
        ticketTypeId: 'ticket-1',
        quantity: 0,
        price: 50.00,
      };

      expect(() => ticketSelectionSchema.parse(invalidSelection)).toThrow();
    });

    it('should require non-negative price', () => {
      const invalidPrice = {
        ticketTypeId: 'ticket-1',
        quantity: 2,
        price: -10,
      };

      expect(() => ticketSelectionSchema.parse(invalidPrice)).toThrow();
    });
  });

  describe('registrationFormSchema', () => {
    it('should validate a complete registration form', () => {
      const validForm = {
        primaryParticipant: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          customFieldValues: {},
        },
        additionalParticipants: [
          {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            customFieldValues: {},
          },
        ],
        ticketSelections: [
          {
            ticketTypeId: 'ticket-1',
            quantity: 2,
            price: 50.00,
          },
        ],
        agreeToTerms: true,
        marketingOptIn: false,
      };

      expect(() => registrationFormSchema.parse(validForm)).not.toThrow();
    });

    it('should require at least one ticket selection', () => {
      const invalidForm = {
        primaryParticipant: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          customFieldValues: {},
        },
        additionalParticipants: [],
        ticketSelections: [],
        agreeToTerms: true,
      };

      expect(() => registrationFormSchema.parse(invalidForm)).toThrow();
    });

    it('should require agreement to terms', () => {
      const invalidForm = {
        primaryParticipant: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          customFieldValues: {},
        },
        additionalParticipants: [],
        ticketSelections: [
          {
            ticketTypeId: 'ticket-1',
            quantity: 1,
            price: 50.00,
          },
        ],
        agreeToTerms: false,
      };

      expect(() => registrationFormSchema.parse(invalidForm)).toThrow();
    });
  });
}); 