import { z } from 'zod';

export const customFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'textarea', 'file', 'date']),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    fileTypes: z.array(z.string()).optional(),
    maxFileSize: z.number().optional(),
  }).optional(),
  order: z.number(),
});

export const ticketTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Ticket name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  maxQuantity: z.number().min(1, 'Max quantity must be at least 1'),
  availableQuantity: z.number().min(0, 'Available quantity must be non-negative'),
  isActive: z.boolean(),
  salesStartDate: z.date().optional(),
  salesEndDate: z.date().optional(),
});

export const participantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  customFieldValues: z.record(z.any()),
});

export const ticketSelectionSchema = z.object({
  ticketTypeId: z.string().min(1, 'Ticket type is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
});

export const registrationFormSchema = z.object({
  primaryParticipant: participantSchema,
  additionalParticipants: z.array(participantSchema),
  ticketSelections: z.array(ticketSelectionSchema).min(1, 'At least one ticket must be selected'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  marketingOptIn: z.boolean().optional(),
});

export const registrationFormConfigSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  title: z.string().min(1, 'Form title is required'),
  description: z.string().optional(),
  customFields: z.array(customFieldSchema),
  allowGroupRegistration: z.boolean(),
  maxGroupSize: z.number().min(1).optional(),
  requiresApproval: z.boolean(),
  confirmationMessage: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Dynamic validation for custom fields
export const createCustomFieldValidation = (field: z.infer<typeof customFieldSchema>) => {
  switch (field.type) {
    case 'text':
    case 'textarea':
      let textValidation = z.string();
      if (field.validation?.minLength) {
        textValidation = textValidation.min(field.validation.minLength, `Minimum ${field.validation.minLength} characters required`);
      }
      if (field.validation?.maxLength) {
        textValidation = textValidation.max(field.validation.maxLength, `Maximum ${field.validation.maxLength} characters allowed`);
      }
      if (field.validation?.pattern) {
        textValidation = textValidation.regex(new RegExp(field.validation.pattern), 'Invalid format');
      }
      return field.required ? textValidation : textValidation.optional();
    
    case 'email':
      const emailValidation = z.string().email('Invalid email address');
      return field.required ? emailValidation : emailValidation.optional();
    
    case 'phone':
      const phoneValidation = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number');
      return field.required ? phoneValidation : phoneValidation.optional();
    
    case 'select':
      if (field.options && field.options.length > 0) {
        const selectValidation = z.enum(field.options as [string, ...string[]]);
        return field.required ? selectValidation : selectValidation.optional();
      }
      return field.required ? z.string() : z.string().optional();
    
    case 'checkbox':
      if (field.required) {
        return z.boolean().refine(val => val === true, `${field.label} is required`);
      }
      return z.boolean().optional();
    
    case 'date':
      const dateValidation = z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date');
      return field.required ? dateValidation : dateValidation.optional();
    
    case 'file':
      return field.required ? z.any().refine(val => val !== undefined && val !== null, `${field.label} is required`) : z.any().optional();
    
    default:
      return field.required ? z.string() : z.string().optional();
  }
};

export type CustomFieldType = z.infer<typeof customFieldSchema>;
export type TicketTypeType = z.infer<typeof ticketTypeSchema>;
export type ParticipantType = z.infer<typeof participantSchema>;
export type TicketSelectionType = z.infer<typeof ticketSelectionSchema>;
export type RegistrationFormType = z.infer<typeof registrationFormSchema>;
export type RegistrationFormConfigType = z.infer<typeof registrationFormConfigSchema>; 