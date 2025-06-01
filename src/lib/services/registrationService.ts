import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { 
  Registration, 
  RegistrationFormConfig, 
  TicketType, 
  UploadedFile,
  RegistrationSummary 
} from '../types/registration';

const COLLECTIONS = {
  REGISTRATIONS: 'registrations',
  REGISTRATION_FORMS: 'registrationForms',
  TICKET_TYPES: 'ticketTypes',
  UPLOADED_FILES: 'uploadedFiles',
} as const;

// Registration operations
export const registrationService = {
  // Create a new registration
  async createRegistration(registrationData: Omit<Registration, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTIONS.REGISTRATIONS), {
        ...registrationData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating registration:', error);
      throw new Error('Failed to create registration');
    }
  },

  // Get registration by ID
  async getRegistration(id: string): Promise<Registration | null> {
    try {
      const docRef = doc(db, COLLECTIONS.REGISTRATIONS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          registrationDate: data.registrationDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          approvedAt: data.approvedAt?.toDate(),
        } as Registration;
      }
      return null;
    } catch (error) {
      console.error('Error getting registration:', error);
      throw new Error('Failed to get registration');
    }
  },

  // Get registrations for an event
  async getEventRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REGISTRATIONS),
        where('eventId', '==', eventId),
        orderBy('registrationDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          registrationDate: data.registrationDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          approvedAt: data.approvedAt?.toDate(),
        } as Registration;
      });
    } catch (error) {
      console.error('Error getting event registrations:', error);
      throw new Error('Failed to get event registrations');
    }
  },

  // Update registration status
  async updateRegistrationStatus(
    id: string, 
    status: Registration['status'], 
    paymentStatus?: Registration['paymentStatus']
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.REGISTRATIONS, id);
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      };
      
      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }
      
      if (status === 'confirmed') {
        updateData.approvedAt = Timestamp.fromDate(new Date());
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating registration status:', error);
      throw new Error('Failed to update registration status');
    }
  },

  // Get registration summary for an event
  async getRegistrationSummary(eventId: string): Promise<RegistrationSummary> {
    try {
      const registrations = await this.getEventRegistrations(eventId);
      
      const summary: RegistrationSummary = {
        totalRegistrations: registrations.length,
        confirmedRegistrations: registrations.filter(r => r.status === 'confirmed').length,
        pendingRegistrations: registrations.filter(r => r.status === 'pending').length,
        totalRevenue: registrations
          .filter(r => r.paymentStatus === 'completed')
          .reduce((sum, r) => sum + r.totalAmount, 0),
        ticketsSold: {},
        registrationsByDate: {},
      };

      // Calculate tickets sold by type
      registrations.forEach(registration => {
        registration.ticketSelections.forEach(selection => {
          if (!summary.ticketsSold[selection.ticketTypeId]) {
            summary.ticketsSold[selection.ticketTypeId] = 0;
          }
          summary.ticketsSold[selection.ticketTypeId] += selection.quantity;
        });
      });

      // Calculate registrations by date
      registrations.forEach(registration => {
        const dateKey = registration.registrationDate.toISOString().split('T')[0];
        if (!summary.registrationsByDate[dateKey]) {
          summary.registrationsByDate[dateKey] = 0;
        }
        summary.registrationsByDate[dateKey]++;
      });

      return summary;
    } catch (error) {
      console.error('Error getting registration summary:', error);
      throw new Error('Failed to get registration summary');
    }
  },
};

// Registration form configuration operations
export const registrationFormService = {
  // Create registration form config
  async createFormConfig(formData: Omit<RegistrationFormConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, COLLECTIONS.REGISTRATION_FORMS), {
        ...formData,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating form config:', error);
      throw new Error('Failed to create form configuration');
    }
  },

  // Get form config by event ID
  async getFormConfigByEventId(eventId: string): Promise<RegistrationFormConfig | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.REGISTRATION_FORMS),
        where('eventId', '==', eventId),
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as RegistrationFormConfig;
      }
      return null;
    } catch (error) {
      console.error('Error getting form config:', error);
      throw new Error('Failed to get form configuration');
    }
  },

  // Update form config
  async updateFormConfig(id: string, updates: Partial<RegistrationFormConfig>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.REGISTRATION_FORMS, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error('Error updating form config:', error);
      throw new Error('Failed to update form configuration');
    }
  },
};

// Ticket type operations
export const ticketTypeService = {
  // Create ticket type
  async createTicketType(ticketData: Omit<TicketType, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.TICKET_TYPES), ticketData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating ticket type:', error);
      throw new Error('Failed to create ticket type');
    }
  },

  // Get ticket types for an event
  async getEventTicketTypes(eventId: string): Promise<TicketType[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TICKET_TYPES),
        where('eventId', '==', eventId),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TicketType[];
    } catch (error) {
      console.error('Error getting ticket types:', error);
      throw new Error('Failed to get ticket types');
    }
  },

  // Update ticket availability
  async updateTicketAvailability(ticketTypeId: string, quantityChange: number): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TICKET_TYPES, ticketTypeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentData = docSnap.data() as TicketType;
        const newAvailableQuantity = currentData.availableQuantity + quantityChange;
        
        if (newAvailableQuantity < 0) {
          throw new Error('Insufficient ticket availability');
        }
        
        await updateDoc(docRef, {
          availableQuantity: newAvailableQuantity,
        });
      } else {
        throw new Error('Ticket type not found');
      }
    } catch (error) {
      console.error('Error updating ticket availability:', error);
      throw error;
    }
  },
};

// File upload operations
export const fileUploadService = {
  // Upload file
  async uploadFile(file: File, eventId: string, fieldId: string): Promise<UploadedFile> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `registrations/${eventId}/${fieldId}/${fileName}`;
      const fileRef = ref(storage, filePath);
      
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        fieldId,
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
      };
      
      // Store file metadata in Firestore
      await addDoc(collection(db, COLLECTIONS.UPLOADED_FILES), {
        ...uploadedFile,
        uploadedAt: Timestamp.fromDate(uploadedFile.uploadedAt),
      });
      
      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  },

  // Delete file
  async deleteFile(fileUrl: string, fileId: string): Promise<void> {
    try {
      // Delete from storage
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      
      // Delete metadata from Firestore
      const docRef = doc(db, COLLECTIONS.UPLOADED_FILES, fileId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  },
};

// Utility function to generate confirmation code
export const generateConfirmationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}; 