'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EventForm from '@/components/EventForm';
import { EventFormData } from '@/lib/validations/event';
import { Event } from '@/lib/types/event';
import { geocodeAddress, formatFullAddress } from '@/lib/geocoding';

export default function CreateEventPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    
    try {
      // Convert form data to Event object
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
      
      // Geocode the address to get coordinates
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      try {
        const fullAddress = formatFullAddress(
          data.address,
          data.city,
          data.state,
          data.zipCode,
          data.country
        );
        
        const geocodeResult = await geocodeAddress(fullAddress);
        latitude = geocodeResult.coordinates.lat;
        longitude = geocodeResult.coordinates.lng;
        
        console.log('Geocoded address:', {
          address: fullAddress,
          coordinates: geocodeResult.coordinates,
          formattedAddress: geocodeResult.formattedAddress
        });
      } catch (geocodeError) {
        console.warn('Failed to geocode address:', geocodeError);
        // Continue without coordinates - the map will still work with address-only
      }
      
      const event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
        title: data.title,
        description: data.description,
        startDate: startDateTime,
        endDate: endDateTime,
        location: {
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          latitude,
          longitude,
        },
        organizerName: data.organizerName,
        organizerEmail: data.organizerEmail,
        organizerPhone: data.organizerPhone,
        branding: {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          fontFamily: data.fontFamily,
        },
        media: data.media || [],
        agenda: data.agenda,
        maxAttendees: data.maxAttendees,
        registrationEnabled: data.registrationEnabled,
        isPrivate: data.isPrivate,
      };

      // For now, we'll store in localStorage (later this will be replaced with actual API call)
      const eventId = Date.now().toString();
      const fullEvent: Event = {
        ...event,
        id: eventId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in localStorage for demo purposes
      const existingEvents = JSON.parse(localStorage.getItem('events') || '[]');
      existingEvents.push(fullEvent);
      localStorage.setItem('events', JSON.stringify(existingEvents));

      // Redirect to the event page
      router.push(`/event/${eventId}`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <EventForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
} 