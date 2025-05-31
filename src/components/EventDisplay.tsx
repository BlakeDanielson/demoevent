'use client';

import { Event } from '@/lib/types/event';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Users, ExternalLink } from 'lucide-react';
import MediaGallery from './MediaGallery';

interface EventDisplayProps {
  event: Event;
  showRegistrationButton?: boolean;
  onRegister?: () => void;
}

export default function EventDisplay({ event, showRegistrationButton = true, onRegister }: EventDisplayProps) {
  const formatEventDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatEventTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const getFullAddress = () => {
    const { address, city, state, zipCode, country } = event.location;
    return `${address}, ${city}, ${state} ${zipCode}, ${country}`;
  };

  const getGoogleMapsUrl = () => {
    const address = encodeURIComponent(getFullAddress());
    return `https://www.google.com/maps/search/?api=1&query=${address}`;
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        fontFamily: event.branding.fontFamily,
        '--primary-color': event.branding.primaryColor,
        '--secondary-color': event.branding.secondaryColor,
      } as React.CSSProperties}
    >
      {/* Hero Section */}
      <section 
        className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white"
        style={{
          background: `linear-gradient(135deg, ${event.branding.primaryColor}, ${event.branding.secondaryColor})`,
          backgroundImage: event.heroImage ? `url(${event.heroImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {event.heroImage && (
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        )}
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          {event.branding.logo && (
            <img 
              src={event.branding.logo} 
              alt="Event Logo" 
              className="h-16 mx-auto mb-6"
            />
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {event.title}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {event.description}
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-lg">{formatEventDate(event.startDate)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-lg">
                {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{event.location.city}, {event.location.state}</span>
            </div>
          </div>
          
          {showRegistrationButton && event.registrationEnabled && (
            <button
              onClick={onRegister}
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-200 text-lg"
            >
              Register Now
            </button>
          )}
        </div>
      </section>

      {/* Event Details */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Information */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6" style={{ color: event.branding.primaryColor }}>
                  Event Details
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Calendar className="w-6 h-6 mt-1" style={{ color: event.branding.primaryColor }} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Date & Time</h3>
                      <p className="text-gray-600">
                        {formatEventDate(event.startDate)}
                      </p>
                      <p className="text-gray-600">
                        {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 mt-1" style={{ color: event.branding.primaryColor }} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Location</h3>
                      <p className="text-gray-600">{getFullAddress()}</p>
                      <a
                        href={getGoogleMapsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <User className="w-6 h-6 mt-1" style={{ color: event.branding.primaryColor }} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Organizer</h3>
                      <p className="text-gray-600">{event.organizerName}</p>
                      <p className="text-gray-600">{event.organizerEmail}</p>
                      {event.organizerPhone && (
                        <p className="text-gray-600">{event.organizerPhone}</p>
                      )}
                    </div>
                  </div>
                  
                  {event.maxAttendees && (
                    <div className="flex items-start gap-4">
                      <Users className="w-6 h-6 mt-1" style={{ color: event.branding.primaryColor }} />
                      <div>
                        <h3 className="font-semibold text-gray-900">Capacity</h3>
                        <p className="text-gray-600">Maximum {event.maxAttendees} attendees</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agenda */}
              {event.agenda && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: event.branding.primaryColor }}>
                    Agenda
                  </h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-600 whitespace-pre-wrap">{event.agenda}</p>
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {event.media.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: event.branding.primaryColor }}>
                    Gallery
                  </h2>
                  <MediaGallery media={event.media} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Info Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: event.branding.primaryColor }}>
                  Quick Info
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatEventDate(event.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formatEventTime(event.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{event.location.city}</span>
                  </div>
                  {event.maxAttendees && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{event.maxAttendees}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration:</span>
                    <span className="font-medium">
                      {event.registrationEnabled ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Card */}
              {event.registrationEnabled && showRegistrationButton && (
                <div 
                  className="rounded-lg shadow-md p-6 text-white"
                  style={{ backgroundColor: event.branding.primaryColor }}
                >
                  <h3 className="text-lg font-semibold mb-4">Ready to Join?</h3>
                  <p className="mb-4 opacity-90">
                    Don't miss out on this amazing event. Register now to secure your spot!
                  </p>
                  <button
                    onClick={onRegister}
                    className="w-full px-4 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    Register Now
                  </button>
                </div>
              )}

              {/* Map Placeholder */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: event.branding.primaryColor }}>
                  Location
                </h3>
                <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 text-sm">Interactive map will be displayed here</p>
                    <a
                      href={getGoogleMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 