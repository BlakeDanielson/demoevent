import { Event, EventFormData, EventLocation } from '../types/event';
import { format, parseISO, isValid } from 'date-fns';

// Date formatting utilities
export const formatEventDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date';
  return format(dateObj, 'PPP'); // e.g., "April 29, 2023"
};

export const formatEventTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid Time';
  return format(dateObj, 'p'); // e.g., "5:00 PM"
};

export const formatEventDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date/Time';
  return format(dateObj, 'PPP p'); // e.g., "April 29, 2023 5:00 PM"
};

// Convert Date to form input values
export const dateToFormInputs = (date: Date): { date: string; time: string } => {
  if (!isValid(date)) {
    return { date: '', time: '' };
  }
  
  return {
    date: format(date, 'yyyy-MM-dd'),
    time: format(date, 'HH:mm'),
  };
};

// Location utilities
export const formatEventLocation = (location: EventLocation): string => {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.zipCode,
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const formatEventLocationShort = (location: EventLocation): string => {
  return `${location.city}, ${location.state}`;
};

// Event status utilities
export const getEventStatus = (event: Event): 'upcoming' | 'ongoing' | 'past' => {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  if (now < startDate) return 'upcoming';
  if (now >= startDate && now <= endDate) return 'ongoing';
  return 'past';
};

export const isEventUpcoming = (event: Event): boolean => {
  return getEventStatus(event) === 'upcoming';
};

export const isEventOngoing = (event: Event): boolean => {
  return getEventStatus(event) === 'ongoing';
};

export const isEventPast = (event: Event): boolean => {
  return getEventStatus(event) === 'past';
};

// Event duration utilities
export const getEventDuration = (event: Event): string => {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  if (!isValid(startDate) || !isValid(endDate)) {
    return 'Invalid duration';
  }
  
  const durationMs = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${minutes}m`;
};

export const getEventDurationInDays = (event: Event): number => {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  if (!isValid(startDate) || !isValid(endDate)) {
    return 0;
  }
  
  const durationMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(durationMs / (1000 * 60 * 60 * 24));
};

// Event form utilities
export const convertEventToFormData = (event: Event): EventFormData => {
  const startInputs = dateToFormInputs(new Date(event.startDate));
  const endInputs = dateToFormInputs(new Date(event.endDate));
  
  return {
    title: event.title,
    description: event.description,
    startDate: startInputs.date,
    startTime: startInputs.time,
    endDate: endInputs.date,
    endTime: endInputs.time,
    address: event.location.address,
    city: event.location.city,
    state: event.location.state,
    zipCode: event.location.zipCode,
    country: event.location.country,
    organizerName: event.organizerName,
    organizerEmail: event.organizerEmail,
    organizerPhone: event.organizerPhone || '',
    primaryColor: event.branding.primaryColor,
    secondaryColor: event.branding.secondaryColor,
    fontFamily: event.branding.fontFamily,
    agenda: event.agenda || '',
    maxAttendees: event.maxAttendees,
    registrationEnabled: event.registrationEnabled,
    isPrivate: event.isPrivate,
    media: event.media,
  };
};

// Validation utilities
export const validateEventDates = (startDate: Date, endDate: Date): string | null => {
  if (!isValid(startDate) || !isValid(endDate)) {
    return 'Invalid date format';
  }
  
  if (startDate >= endDate) {
    return 'End date must be after start date';
  }
  
  const now = new Date();
  if (startDate < now) {
    return 'Start date cannot be in the past';
  }
  
  return null;
};

export const validateEventFormData = (formData: EventFormData): string[] => {
  const errors: string[] = [];
  
  // Required fields
  if (!formData.title.trim()) errors.push('Title is required');
  if (!formData.description.trim()) errors.push('Description is required');
  if (!formData.organizerName.trim()) errors.push('Organizer name is required');
  if (!formData.organizerEmail.trim()) errors.push('Organizer email is required');
  
  // Date validation
  const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
  const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
  
  const dateError = validateEventDates(startDateTime, endDateTime);
  if (dateError) errors.push(dateError);
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.organizerEmail && !emailRegex.test(formData.organizerEmail)) {
    errors.push('Invalid email format');
  }
  
  // Max attendees validation
  if (formData.maxAttendees && formData.maxAttendees < 1) {
    errors.push('Maximum attendees must be at least 1');
  }
  
  return errors;
};

// Search utilities
export const searchEvents = (events: Event[], searchTerm: string): Event[] => {
  if (!searchTerm.trim()) return events;
  
  const term = searchTerm.toLowerCase();
  
  return events.filter(event =>
    event.title.toLowerCase().includes(term) ||
    event.description.toLowerCase().includes(term) ||
    event.organizerName.toLowerCase().includes(term) ||
    formatEventLocation(event.location).toLowerCase().includes(term)
  );
};

// Sorting utilities
export const sortEventsByDate = (events: Event[], direction: 'asc' | 'desc' = 'asc'): Event[] => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return direction === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

export const sortEventsByTitle = (events: Event[], direction: 'asc' | 'desc' = 'asc'): Event[] => {
  return [...events].sort((a, b) => {
    const comparison = a.title.localeCompare(b.title);
    return direction === 'asc' ? comparison : -comparison;
  });
};

// Filter utilities
export const filterEventsByStatus = (events: Event[], status: 'upcoming' | 'ongoing' | 'past'): Event[] => {
  return events.filter(event => getEventStatus(event) === status);
};

export const filterEventsByOrganizer = (events: Event[], organizerEmail: string): Event[] => {
  return events.filter(event => event.organizerEmail === organizerEmail);
};

export const filterPublicEvents = (events: Event[]): Event[] => {
  return events.filter(event => !event.isPrivate);
};

export const filterPrivateEvents = (events: Event[]): Event[] => {
  return events.filter(event => event.isPrivate);
};

// URL utilities
export const generateEventSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateEventUrl = (event: Event): string => {
  const slug = generateEventSlug(event.title);
  return `/event/${event.id}/${slug}`;
}; 