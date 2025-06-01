import { createCustomFieldValidation } from '../registration';

describe('createCustomFieldValidation', () => {
  it('should create text validation with length constraints', () => {
    const textField = {
      id: 'text-1',
      name: 'description',
      label: 'Description',
      type: 'text' as const,
      required: true,
      validation: {
        minLength: 10,
        maxLength: 100,
      },
      order: 1,
    };

    const validation = createCustomFieldValidation(textField);
    
    // Should pass valid text
    expect(() => validation.parse('This is a valid description that meets the length requirements')).not.toThrow();
    
    // Should fail short text
    expect(() => validation.parse('Short')).toThrow();
    
    // Should fail long text
    const longText = 'a'.repeat(101);
    expect(() => validation.parse(longText)).toThrow();
  });

  it('should create email validation', () => {
    const emailField = {
      id: 'email-1',
      name: 'email',
      label: 'Email',
      type: 'email' as const,
      required: true,
      order: 1,
    };

    const validation = createCustomFieldValidation(emailField);
    
    // Should pass valid email
    expect(() => validation.parse('test@example.com')).not.toThrow();
    
    // Should fail invalid email
    expect(() => validation.parse('invalid-email')).toThrow();
  });

  it('should create phone validation', () => {
    const phoneField = {
      id: 'phone-1',
      name: 'phone',
      label: 'Phone',
      type: 'phone' as const,
      required: true,
      order: 1,
    };

    const validation = createCustomFieldValidation(phoneField);
    
    // Should pass valid phone numbers
    expect(() => validation.parse('+1234567890')).not.toThrow();
    expect(() => validation.parse('1234567890')).not.toThrow();
    
    // Should fail invalid phone
    expect(() => validation.parse('abc123')).toThrow();
  });

  it('should create select validation with options', () => {
    const selectField = {
      id: 'select-1',
      name: 'country',
      label: 'Country',
      type: 'select' as const,
      required: true,
      options: ['USA', 'Canada', 'UK'],
      order: 1,
    };

    const validation = createCustomFieldValidation(selectField);
    
    // Should pass valid option
    expect(() => validation.parse('USA')).not.toThrow();
    
    // Should fail invalid option
    expect(() => validation.parse('Germany')).toThrow();
  });

  it('should create checkbox validation for required fields', () => {
    const checkboxField = {
      id: 'checkbox-1',
      name: 'newsletter',
      label: 'Subscribe to newsletter',
      type: 'checkbox' as const,
      required: true,
      order: 1,
    };

    const validation = createCustomFieldValidation(checkboxField);
    
    // Should pass when checked
    expect(() => validation.parse(true)).not.toThrow();
    
    // Should fail when not checked (required)
    expect(() => validation.parse(false)).toThrow();
  });

  it('should create optional validation for non-required fields', () => {
    const optionalField = {
      id: 'optional-1',
      name: 'optional',
      label: 'Optional Field',
      type: 'text' as const,
      required: false,
      order: 1,
    };

    const validation = createCustomFieldValidation(optionalField);
    
    // Should pass with value
    expect(() => validation.parse('Some value')).not.toThrow();
    
    // Should pass with undefined (optional)
    expect(() => validation.parse(undefined)).not.toThrow();
  });

  it('should create date validation', () => {
    const dateField = {
      id: 'date-1',
      name: 'birthdate',
      label: 'Birth Date',
      type: 'date' as const,
      required: true,
      order: 1,
    };

    const validation = createCustomFieldValidation(dateField);
    
    // Should pass valid date string
    expect(() => validation.parse('2023-12-25')).not.toThrow();
    
    // Should fail invalid date
    expect(() => validation.parse('invalid-date')).toThrow();
  });

  it('should create file validation for required files', () => {
    const fileField = {
      id: 'file-1',
      name: 'resume',
      label: 'Resume',
      type: 'file' as const,
      required: true,
      order: 1,
    };

    const validation = createCustomFieldValidation(fileField);
    
    // Should pass with file
    expect(() => validation.parse('file-data')).not.toThrow();
    
    // Should fail without file (required)
    expect(() => validation.parse(undefined)).toThrow();
    expect(() => validation.parse(null)).toThrow();
  });

  it('should handle text validation with pattern', () => {
    const patternField = {
      id: 'pattern-1',
      name: 'code',
      label: 'Code',
      type: 'text' as const,
      required: true,
      validation: {
        pattern: '^[A-Z]{3}[0-9]{3}$', // 3 letters followed by 3 numbers
      },
      order: 1,
    };

    const validation = createCustomFieldValidation(patternField);
    
    // Should pass valid pattern
    expect(() => validation.parse('ABC123')).not.toThrow();
    
    // Should fail invalid pattern
    expect(() => validation.parse('abc123')).toThrow();
    expect(() => validation.parse('ABCD123')).toThrow();
  });
}); 