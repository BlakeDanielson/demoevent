export interface EventBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface EventLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface EventMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  caption?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: EventLocation;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  branding: EventBranding;
  heroImage?: string;
  media: EventMedia[];
  agenda?: string;
  maxAttendees?: number;
  registrationEnabled: boolean;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  agenda?: string;
  maxAttendees?: number;
  registrationEnabled: boolean;
  isPrivate: boolean;
  media: EventMedia[];
} 