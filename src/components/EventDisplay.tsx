'use client';

import { Event } from '@/lib/types/event';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, User, Users } from 'lucide-react';
import MediaGallery from './MediaGallery';
import InteractiveMap from './InteractiveMap';

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
        className="relative h-64 sm:h-80 md:h-96 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white"
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
        
        <div className="relative z-10 text-center container-responsive">
          {event.branding.logo && (
            <img 
              src={event.branding.logo} 
              alt="Event Logo" 
              className="h-12 sm:h-16 mx-auto mb-4 sm:mb-6"
            />
          )}
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
            {event.title}
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 max-w-4xl mx-auto leading-relaxed">
            {event.description}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{formatEventDate(event.startDate)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>
                {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{event.location.city}, {event.location.state}</span>
            </div>
          </div>
          
          {showRegistrationButton && event.registrationEnabled && (
            <button
              onClick={onRegister}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-200 text-base sm:text-lg touch-target"
            >
              Register Now
            </button>
          )}
        </div>
      </section>

      {/* Event Details */}
      <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
        <div className="container-responsive">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6 sm:space-y-8">
              {/* Event Information */}
              <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: event.branding.primaryColor }}>
                  Event Details
                </h2>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 mt-1 flex-shrink-0" style={{ color: event.branding.primaryColor }} />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Date & Time</h3>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {formatEventDate(event.startDate)}
                      </p>
                      <p className="text-gray-600 text-sm sm:text-base">
                        {formatEventTime(event.startDate)} - {formatEventTime(event.endDate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 sm:gap-4">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mt-1 flex-shrink-0" style={{ color: event.branding.primaryColor }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Location</h3>
                      <p className="text-gray-600 text-sm sm:text-base break-words">{getFullAddress()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 sm:gap-4">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 mt-1 flex-shrink-0" style={{ color: event.branding.primaryColor }} />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Organizer</h3>
                      <p className="text-gray-600 text-sm sm:text-base">{event.organizerName}</p>
                      <p className="text-gray-600 text-sm sm:text-base break-all">{event.organizerEmail}</p>
                      {event.organizerPhone && (
                        <p className="text-gray-600 text-sm sm:text-base">{event.organizerPhone}</p>
                      )}
                    </div>
                  </div>
                  
                  {event.maxAttendees && (
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 mt-1 flex-shrink-0" style={{ color: event.branding.primaryColor }} />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Capacity</h3>
                        <p className="text-gray-600 text-sm sm:text-base">Maximum {event.maxAttendees} attendees</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Map */}
              <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: event.branding.primaryColor }}>
                  Event Location
                </h2>
                <InteractiveMap 
                  location={event.location} 
                  height="300px"
                  className="rounded-lg overflow-hidden"
                />
              </div>

              {/* Agenda */}
              {event.agenda && (
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: event.branding.primaryColor }}>
                    Agenda
                  </h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{event.agenda}</p>
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              {event.media.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: event.branding.primaryColor }}>
                    Gallery
                  </h2>
                  <MediaGallery media={event.media} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 sm:space-y-8">
              {/* Quick Info Card */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: event.branding.primaryColor }}>
                  Quick Info
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900 text-right">{format(event.startDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900 text-right">{formatEventTime(event.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900 text-right">{event.location.city}</span>
                  </div>
                  {event.maxAttendees && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium text-gray-900">{event.maxAttendees}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">{event.isPrivate ? 'Private' : 'Public'}</span>
                  </div>
                </div>
                
                {showRegistrationButton && event.registrationEnabled && (
                  <button
                    onClick={onRegister}
                    className="w-full mt-4 sm:mt-6 px-4 py-3 text-white font-medium rounded-lg shadow-sm hover:opacity-90 transition-opacity duration-200 touch-target text-sm sm:text-base"
                    style={{ backgroundColor: event.branding.primaryColor }}
                  >
                    Register for Event
                  </button>
                )}
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: event.branding.primaryColor }}>
                  Contact Organizer
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{event.organizerName}</p>
                  </div>
                  <div>
                    <a 
                      href={`mailto:${event.organizerEmail}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base break-all"
                    >
                      {event.organizerEmail}
                    </a>
                  </div>
                  {event.organizerPhone && (
                    <div>
                      <a 
                        href={`tel:${event.organizerPhone}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm sm:text-base"
                      >
                        {event.organizerPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: event.branding.primaryColor }}>
                  Share Event
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: event.title,
                          text: event.description,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Event link copied to clipboard!');
                      }
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base touch-target"
                  >
                    Share Event
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Event link copied to clipboard!');
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base touch-target"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 