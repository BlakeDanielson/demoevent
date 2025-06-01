import { z } from 'zod';
import {
  customFieldSchema,
  ticketTypeSchema,
  participantSchema,
  ticketSelectionSchema,
  registrationFormSchema,
  createCustomFieldValidation,
} from '../registration';

describe('Edge Case Validation Tests', () => {
  describe('Boundary Value Testing', () => {
    it('should handle extremely long text inputs', () => {
      const longText = 'a'.repeat(10000);
      const textField = {
        id: 'text-1',
        name: 'description',
        label: 'Description',
        type: 'text' as const,
        required: true,
        validation: {
          maxLength: 100,
        },
        order: 1,
      };

      const validation = createCustomFieldValidation(textField);
      expect(() => validation.parse(longText)).toThrow();
    });

    it('should handle zero-length required fields', () => {
      const participant = {
        firstName: '',
        lastName: '',
        email: '',
        customFieldValues: {},
      };

      expect(() => participantSchema.parse(participant)).toThrow();
    });

    it('should handle maximum ticket quantities', () => {
      const maxTicketSelection = {
        ticketTypeId: 'ticket-1',
        quantity: Number.MAX_SAFE_INTEGER,
        price: 50.00,
      };

      // Should handle large numbers gracefully
      expect(() => ticketSelectionSchema.parse(maxTicketSelection)).not.toThrow();
    });

    it('should handle maximum price values', () => {
      const expensiveTicket = {
        id: 'ticket-1',
        name: 'Premium',
        price: Number.MAX_SAFE_INTEGER,
        maxQuantity: 1,
        availableQuantity: 1,
        isActive: true,
      };

      expect(() => ticketTypeSchema.parse(expensiveTicket)).not.toThrow();
    });
  });

  describe('Malformed Data Testing', () => {
    it('should reject null and undefined values in required fields', () => {
      const malformedParticipant = {
        firstName: null,
        lastName: undefined,
        email: 'test@example.com',
        customFieldValues: {},
      };

      expect(() => participantSchema.parse(malformedParticipant)).toThrow();
    });

    it('should handle malformed email addresses', () => {
      const malformedEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'missing@domain',
        'spaces in@email.com',
        'email@domain..com',
        'email@-domain.com',
        'email@domain-.com',
      ];

      malformedEmails.forEach(email => {
        const participant = {
          firstName: 'John',
          lastName: 'Doe',
          email,
          customFieldValues: {},
        };

        expect(() => participantSchema.parse(participant)).toThrow();
      });
    });

    it('should handle malformed phone numbers', () => {
      const malformedPhones = [
        'abc123',
        '123',
        '+',
        '++1234567890',
        '123-456-789a',
        'phone number',
        '1234567890123456789012345', // too long
      ];

      const phoneField = {
        id: 'phone-1',
        name: 'phone',
        label: 'Phone',
        type: 'phone' as const,
        required: true,
        order: 1,
      };

      const validation = createCustomFieldValidation(phoneField);

      malformedPhones.forEach(phone => {
        expect(() => validation.parse(phone)).toThrow();
      });
    });

    it('should handle invalid date formats', () => {
      const dateField = {
        id: 'date-1',
        name: 'birthdate',
        label: 'Birth Date',
        type: 'date' as const,
        required: true,
        order: 1,
      };

      const validation = createCustomFieldValidation(dateField);

      const invalidDates = [
        '2023-13-01', // invalid month
        '2023-02-30', // invalid day
        '2023/12/25', // wrong format
        'December 25, 2023', // wrong format
        '25-12-2023', // wrong format
        'not-a-date',
        '2023-12-32', // invalid day
      ];

      invalidDates.forEach(date => {
        expect(() => validation.parse(date)).toThrow();
      });
    });
  });

  describe('Unicode and Special Character Testing', () => {
    it('should handle unicode characters in names', () => {
      const unicodeParticipant = {
        firstName: 'José',
        lastName: 'Müller',
        email: 'josé.müller@example.com',
        customFieldValues: {},
      };

      expect(() => participantSchema.parse(unicodeParticipant)).not.toThrow();
    });

    it('should handle special characters in custom fields', () => {
      const specialCharsField = {
        id: 'special-1',
        name: 'notes',
        label: 'Special Notes',
        type: 'textarea' as const,
        required: false,
        order: 1,
      };

      const validation = createCustomFieldValidation(specialCharsField);

      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
      expect(() => validation.parse(specialText)).not.toThrow();
    });

    it('should handle emoji in text fields', () => {
      const emojiText = '🎉 Excited for the event! 🚀✨';
      const textField = {
        id: 'text-1',
        name: 'comment',
        label: 'Comment',
        type: 'text' as const,
        required: false,
        order: 1,
      };

      const validation = createCustomFieldValidation(textField);
      expect(() => validation.parse(emojiText)).not.toThrow();
    });
  });

  describe('Injection Attack Prevention', () => {
    it('should handle potential SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users --",
      ];

      sqlInjectionAttempts.forEach(attempt => {
        const participant = {
          firstName: attempt,
          lastName: 'Test',
          email: 'test@example.com',
          customFieldValues: {},
        };

        // Should not throw - validation should pass but sanitization happens elsewhere
        expect(() => participantSchema.parse(participant)).not.toThrow();
      });
    });

    it('should handle potential XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
      ];

      xssAttempts.forEach(attempt => {
        const participant = {
          firstName: attempt,
          lastName: 'Test',
          email: 'test@example.com',
          customFieldValues: {},
        };

        // Should not throw - validation should pass but sanitization happens elsewhere
        expect(() => participantSchema.parse(participant)).not.toThrow();
      });
    });
  });

  describe('Concurrent Registration Edge Cases', () => {
    it('should handle multiple ticket selections for same type', () => {
      const duplicateSelections = {
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
            price: 50.00,
          },
          {
            ticketTypeId: 'ticket-1', // Same ticket type
            quantity: 3,
            price: 50.00,
          },
        ],
        agreeToTerms: true,
      };

      // Schema should allow this - business logic should handle deduplication
      expect(() => registrationFormSchema.parse(duplicateSelections)).not.toThrow();
    });

    it('should handle zero quantity selections', () => {
      const zeroQuantitySelection = {
        ticketTypeId: 'ticket-1',
        quantity: 0,
        price: 50.00,
      };

      expect(() => ticketSelectionSchema.parse(zeroQuantitySelection)).toThrow();
    });

    it('should handle negative quantities', () => {
      const negativeQuantitySelection = {
        ticketTypeId: 'ticket-1',
        quantity: -5,
        price: 50.00,
      };

      expect(() => ticketSelectionSchema.parse(negativeQuantitySelection)).toThrow();
    });
  });

  describe('File Upload Edge Cases', () => {
    it('should handle file validation with extreme sizes', () => {
      const fileField = {
        id: 'file-1',
        name: 'document',
        label: 'Document',
        type: 'file' as const,
        required: true,
        validation: {
          maxFileSize: 1024, // 1KB limit
          fileTypes: ['.pdf'],
        },
        order: 1,
      };

      const validation = createCustomFieldValidation(fileField);

      // Should pass with valid file reference
      expect(() => validation.parse('valid-file-reference')).not.toThrow();

      // Should fail when required but missing
      expect(() => validation.parse(undefined)).toThrow();
      expect(() => validation.parse(null)).toThrow();
      expect(() => validation.parse('')).toThrow();
    });

    it('should handle multiple file type restrictions', () => {
      const restrictiveFileField = {
        id: 'file-1',
        name: 'media',
        label: 'Media File',
        type: 'file' as const,
        required: true,
        validation: {
          fileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
          maxFileSize: 10485760, // 10MB
        },
        order: 1,
      };

      expect(() => customFieldSchema.parse(restrictiveFileField)).not.toThrow();
    });
  });

  describe('Custom Field Pattern Validation', () => {
    it('should handle complex regex patterns', () => {
      const complexPatternField = {
        id: 'pattern-1',
        name: 'complexCode',
        label: 'Complex Code',
        type: 'text' as const,
        required: true,
        validation: {
          pattern: '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', // Password-like pattern
        },
        order: 1,
      };

      const validation = createCustomFieldValidation(complexPatternField);

      // Valid complex pattern
      expect(() => validation.parse('Password123!')).not.toThrow();

      // Invalid patterns
      expect(() => validation.parse('password')).toThrow();
      expect(() => validation.parse('PASSWORD')).toThrow();
      expect(() => validation.parse('Password')).toThrow();
      expect(() => validation.parse('Pass123')).toThrow();
    });

    it('should handle invalid regex patterns gracefully', () => {
      const invalidPatternField = {
        id: 'pattern-1',
        name: 'invalidPattern',
        label: 'Invalid Pattern',
        type: 'text' as const,
        required: true,
        validation: {
          pattern: '[', // Invalid regex
        },
        order: 1,
      };

      // Should not throw during field creation
      expect(() => customFieldSchema.parse(invalidPatternField)).not.toThrow();

      // But validation creation might handle invalid regex
      const validation = createCustomFieldValidation(invalidPatternField);
      // Implementation should handle invalid regex gracefully
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle large custom field values object', () => {
      const largeCustomFieldValues: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeCustomFieldValues[`field${i}`] = `value${i}`.repeat(100);
      }

      const participantWithLargeData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        customFieldValues: largeCustomFieldValues,
      };

      // Should handle large objects
      expect(() => participantSchema.parse(participantWithLargeData)).not.toThrow();
    });

    it('should handle deeply nested custom field structure', () => {
      const nestedCustomFields = {
        level1: {
          level2: {
            level3: {
              value: 'deep value'
            }
          }
        }
      };

      const participant = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        customFieldValues: nestedCustomFields,
      };

      // Schema expects flat structure, should handle gracefully
      expect(() => participantSchema.parse(participant)).not.toThrow();
    });
  });
}); 