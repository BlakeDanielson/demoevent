'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Event } from '@/lib/types/event';
import { Calendar, MapPin, Users, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Load events from localStorage
    const loadEvents = () => {
      try {
        const storedEvents = JSON.parse(localStorage.getItem('events') || '[]');
        const eventsWithDates = storedEvents.map((event: any) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        }));
        setEvents(eventsWithDates);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, []);

  const formatEventDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  const formatEventTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Create Amazing
            <span className="text-blue-600"> Events</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Build beautiful, branded event pages with custom registration, ticketing, and analytics. 
            Everything you need to manage successful events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create-event"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 text-lg"
            >
              <Plus className="w-5 h-5" />
              Create Your First Event
            </Link>
            
            {events.length > 0 && (
              <button
                onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200 text-lg"
              >
                View Events
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From creation to analytics, our platform handles every aspect of event management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Custom Event Pages</h3>
              <p className="text-gray-600">
                Create beautiful, branded event pages with custom colors, fonts, and layouts that match your brand
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Registration & Ticketing</h3>
              <p className="text-gray-600">
                Flexible registration forms with custom fields, group registration, and integrated ticketing system
              </p>
            </div>

            <div className="text-center p-8 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Location & Maps</h3>
              <p className="text-gray-600">
                Interactive maps, address lookup, and directions to help attendees find your event easily
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      {events.length > 0 && (
        <section id="events-section" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Your Events
              </h2>
              <p className="text-xl text-gray-600">
                Manage and view all your created events
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/event/${event.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
                >
                  <div 
                    className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white"
                    style={{
                      background: `linear-gradient(135deg, ${event.branding.primaryColor}, ${event.branding.secondaryColor})`,
                    }}
                  >
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <p className="text-sm opacity-90">{formatEventDate(event.startDate)}</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatEventDate(event.startDate)} at {formatEventTime(event.startDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location.city}, {event.location.state}</span>
                      </div>
                      
                      {event.maxAttendees && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>Max {event.maxAttendees} attendees</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                        View Event →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/create-event"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Another Event
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {events.length === 0 && (
        <section className="py-20 px-6 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Create Your First Event?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of event organizers who trust our platform for their events
            </p>
            <Link
              href="/create-event"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transition-colors duration-200 text-lg"
            >
              <Plus className="w-5 h-5" />
              Get Started Now
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
