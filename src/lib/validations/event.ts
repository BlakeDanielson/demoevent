import { z } from 'zod';

const eventMediaSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),
  url: z.string().url('Must be a valid URL'),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

export const eventFormSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Event description is required').max(2000, 'Description must be less than 2000 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.string().min(1, 'End date is required'),
  endTime: z.string().min(1, 'End time is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  organizerName: z.string().min(1, 'Organizer name is required'),
  organizerEmail: z.string().email('Valid email is required'),
  organizerPhone: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  fontFamily: z.string().min(1, 'Font family is required'),
  agenda: z.string().optional(),
  maxAttendees: z.number().positive('Must be a positive number').optional(),
  registrationEnabled: z.boolean(),
  isPrivate: z.boolean(),
  media: z.array(eventMediaSchema).max(10, 'Maximum 10 media files allowed'),
}).refine((data) => {
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
  const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
  return endDateTime > startDateTime;
}, {
  message: 'End date and time must be after start date and time',
  path: ['endDate'],
});

export type EventFormData = z.infer<typeof eventFormSchema>; 