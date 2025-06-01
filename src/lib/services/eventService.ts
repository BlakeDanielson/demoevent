import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  WithFieldValue,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Event, EventFormData } from '../types/event';

const EVENTS_COLLECTION = 'events';

// Convert Firestore document to Event object
const convertDocToEvent = (doc: QueryDocumentSnapshot<DocumentData>): Event => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    startDate: data.startDate.toDate(),
    endDate: data.endDate.toDate(),
    location: data.location,
    organizerName: data.organizerName,
    organizerEmail: data.organizerEmail,
    organizerPhone: data.organizerPhone,
    branding: data.branding,
    heroImage: data.heroImage,
    media: data.media || [],
    agenda: data.agenda,
    maxAttendees: data.maxAttendees,
    registrationEnabled: data.registrationEnabled,
    isPrivate: data.isPrivate,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

// Convert Event object to Firestore document data
const convertEventToDoc = (event: Partial<Event>): WithFieldValue<DocumentData> => {
  const docData = { ...event } as Record<string, unknown>;
  
  // Convert Date objects to Firestore Timestamps
  if (event.startDate) {
    docData.startDate = Timestamp.fromDate(event.startDate);
  }
  if (event.endDate) {
    docData.endDate = Timestamp.fromDate(event.endDate);
  }
  if (event.createdAt) {
    docData.createdAt = Timestamp.fromDate(event.createdAt);
  }
  if (event.updatedAt) {
    docData.updatedAt = Timestamp.fromDate(event.updatedAt);
  }
  
  // Remove id from document data as it's stored separately
  delete docData.id;
  
  return docData as WithFieldValue<DocumentData>;
};

// Convert form data to Event object
export const convertFormDataToEvent = (formData: EventFormData): Omit<Event, 'id' | 'createdAt' | 'updatedAt'> => {
  const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
  const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

  return {
    title: formData.title,
    description: formData.description,
    startDate: startDateTime,
    endDate: endDateTime,
    location: {
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
    },
    organizerName: formData.organizerName,
    organizerEmail: formData.organizerEmail,
    organizerPhone: formData.organizerPhone,
    branding: {
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      fontFamily: formData.fontFamily,
    },
    media: formData.media,
    agenda: formData.agenda,
    maxAttendees: formData.maxAttendees,
    registrationEnabled: formData.registrationEnabled,
    isPrivate: formData.isPrivate,
  };
};

export class EventService {
  // Create a new event
  static async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docData = convertEventToDoc({
        ...eventData,
        createdAt: now,
        updatedAt: now,
      });

      const docRef = await addDoc(collection(db, EVENTS_COLLECTION), docData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  // Get event by ID
  static async getEventById(eventId: string): Promise<Event | null> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, eventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return convertDocToEvent(docSnap as QueryDocumentSnapshot<DocumentData>);
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw new Error('Failed to get event');
    }
  }

  // Update event
  static async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, eventId);
      const docData = convertEventToDoc({
        ...updates,
        updatedAt: new Date(),
      });

      await updateDoc(docRef, docData);
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  }

  // Delete event
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      const docRef = doc(db, EVENTS_COLLECTION, eventId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  }

  // Get all events (with optional filters)
  static async getAllEvents(options?: {
    isPrivate?: boolean;
    organizerEmail?: string;
    limitCount?: number;
  }): Promise<Event[]> {
    try {
      let q = query(collection(db, EVENTS_COLLECTION), orderBy('startDate', 'desc'));

      // Apply filters
      if (options?.isPrivate !== undefined) {
        q = query(q, where('isPrivate', '==', options.isPrivate));
      }
      if (options?.organizerEmail) {
        q = query(q, where('organizerEmail', '==', options.organizerEmail));
      }
      if (options?.limitCount) {
        q = query(q, limit(options.limitCount));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertDocToEvent);
    } catch (error) {
      console.error('Error getting events:', error);
      throw new Error('Failed to get events');
    }
  }

  // Get upcoming events
  static async getUpcomingEvents(limitCount: number = 10): Promise<Event[]> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('startDate', '>=', now),
        where('isPrivate', '==', false),
        orderBy('startDate', 'asc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertDocToEvent);
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw new Error('Failed to get upcoming events');
    }
  }

  // Get events by organizer
  static async getEventsByOrganizer(organizerEmail: string): Promise<Event[]> {
    try {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('organizerEmail', '==', organizerEmail),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertDocToEvent);
    } catch (error) {
      console.error('Error getting events by organizer:', error);
      throw new Error('Failed to get events by organizer');
    }
  }

  // Search events by title or description
  static async searchEvents(searchTerm: string): Promise<Event[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation that gets all public events and filters client-side
      // For production, consider using Algolia or similar service for better search
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('isPrivate', '==', false),
        orderBy('startDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const allEvents = querySnapshot.docs.map(convertDocToEvent);

      // Filter events that match the search term
      const searchTermLower = searchTerm.toLowerCase();
      return allEvents.filter(event =>
        event.title.toLowerCase().includes(searchTermLower) ||
        event.description.toLowerCase().includes(searchTermLower) ||
        event.organizerName.toLowerCase().includes(searchTermLower)
      );
    } catch (error) {
      console.error('Error searching events:', error);
      throw new Error('Failed to search events');
    }
  }
} 