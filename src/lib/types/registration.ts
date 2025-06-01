export interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  maxQuantity: number;
  availableQuantity: number;
  isActive: boolean;
  salesStartDate?: Date;
  salesEndDate?: Date;
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'file' | 'date';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    fileTypes?: string[]; // For file fields
    maxFileSize?: number; // In bytes
  };
  order: number;
}

export interface RegistrationFormConfig {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  customFields: CustomField[];
  allowGroupRegistration: boolean;
  maxGroupSize?: number;
  requiresApproval: boolean;
  confirmationMessage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  customFieldValues: Record<string, any>;
  uploadedFiles?: UploadedFile[];
}

export interface UploadedFile {
  id: string;
  fieldId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface TicketSelection {
  ticketTypeId: string;
  quantity: number;
  price: number;
}

export interface Registration {
  id: string;
  eventId: string;
  formConfigId: string;
  primaryParticipant: Participant;
  additionalParticipants: Participant[];
  ticketSelections: TicketSelection[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  registrationDate: Date;
  confirmationCode: string;
  notes?: string;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationFormData {
  primaryParticipant: Omit<Participant, 'id' | 'uploadedFiles'>;
  additionalParticipants: Omit<Participant, 'id' | 'uploadedFiles'>[];
  ticketSelections: TicketSelection[];
  agreeToTerms: boolean;
  marketingOptIn?: boolean;
}

export interface RegistrationSummary {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  totalRevenue: number;
  ticketsSold: Record<string, number>;
  registrationsByDate: Record<string, number>;
} 