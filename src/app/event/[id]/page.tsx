'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EventDisplay from '@/components/EventDisplay';
import { Event } from '@/lib/types/event';

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = () => {
      try {
        const eventId = params.id as string;
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const foundEvent = events.find((e: Event) => e.id === eventId);

        if (foundEvent) {
          // Convert date strings back to Date objects
          foundEvent.startDate = new Date(foundEvent.startDate);
          foundEvent.endDate = new Date(foundEvent.endDate);
          foundEvent.createdAt = new Date(foundEvent.createdAt);
          foundEvent.updatedAt = new Date(foundEvent.updatedAt);
          
          setEvent(foundEvent);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [params.id]);

  const handleRegister = () => {
    // For now, just show an alert (later this will navigate to registration page)
    alert('Registration functionality will be implemented in the next task!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The event you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <EventDisplay event={event} onRegister={handleRegister} />;
} 