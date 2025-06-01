'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { EventLocation } from '@/lib/types/event';
import { MapPin, ExternalLink, AlertCircle } from 'lucide-react';

interface InteractiveMapProps {
  location: EventLocation;
  height?: string;
  className?: string;
}

export default function InteractiveMap({ 
  location, 
  height = '300px', 
  className = '' 
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFullAddress = useCallback(() => {
    const { address, city, state, zipCode, country } = location;
    return `${address}, ${city}, ${state} ${zipCode}, ${country}`;
  }, [location]);

  const getGoogleMapsUrl = () => {
    const address = encodeURIComponent(getFullAddress());
    return `https://www.google.com/maps/search/?api=1&query=${address}`;
  };

  const getDirectionsUrl = () => {
    const address = encodeURIComponent(getFullAddress());
    return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
  };

  // Geocode address to get coordinates if not provided
  const geocodeAddress = useCallback(async (geocoder: google.maps.Geocoder): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: getFullAddress() }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }, [getFullAddress]);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          throw new Error('Google Maps API key is not configured');
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        const google = await loader.load();
        
        if (!mapRef.current) {
          throw new Error('Map container not found');
        }

        // Use provided coordinates or geocode the address
        let coords: { lat: number; lng: number };
        
        if (location.latitude && location.longitude) {
          coords = { lat: location.latitude, lng: location.longitude };
        } else {
          const geocoder = new google.maps.Geocoder();
          coords = await geocodeAddress(geocoder);
        }

        // Create the map with responsive settings
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: coords,
          zoom: window.innerWidth < 768 ? 14 : 15, // Slightly zoomed out on mobile
          mapTypeControl: window.innerWidth >= 768, // Hide on mobile
          streetViewControl: window.innerWidth >= 768, // Hide on mobile
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'cooperative', // Better mobile interaction
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        // Create a marker
        const marker = new google.maps.Marker({
          position: coords,
          map: mapInstance,
          title: getFullAddress(),
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: window.innerWidth < 768 ? 10 : 8, // Larger marker on mobile
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#1E40AF',
            strokeWeight: 2,
          }
        });

        // Create info window with responsive content
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: ${window.innerWidth < 768 ? '250px' : '200px'};">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1F2937; font-size: ${window.innerWidth < 768 ? '16px' : '14px'};">${location.address}</h3>
              <p style="margin: 0; color: #6B7280; font-size: ${window.innerWidth < 768 ? '14px' : '12px'}; line-height: 1.4;">
                ${location.city}, ${location.state} ${location.zipCode}<br>
                ${location.country}
              </p>
            </div>
          `
        });

        // Show info window on marker click
        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });

        // Handle window resize for responsive behavior
        const handleResize = () => {
          google.maps.event.trigger(mapInstance, 'resize');
        };

        window.addEventListener('resize', handleResize);

        setIsLoading(false);

        // Cleanup function
        return () => {
          window.removeEventListener('resize', handleResize);
        };

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [location, geocodeAddress, getFullAddress]);

  if (error) {
    return (
      <div 
        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 ${className}`}
        style={{ height, minHeight: '200px' }}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed max-w-sm">{error}</p>
          
          <div className="space-y-3 sm:space-y-4 w-full max-w-sm">
            <div className="flex items-start gap-2 text-gray-700 p-2 bg-white rounded border">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm break-words">{getFullAddress()}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-blue-700 transition-colors touch-target"
              >
                <ExternalLink className="w-4 h-4" />
                View on Maps
              </a>
              
              <a
                href={getDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-green-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-green-700 transition-colors touch-target"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center z-10"
          style={{ height, minHeight: '200px' }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full rounded-lg overflow-hidden"
        style={{ height, minHeight: '200px' }}
      />
      
      {/* Map Controls Overlay for Mobile */}
      <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex flex-col gap-2 sm:hidden">
        <a
          href={getGoogleMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors touch-target"
          title="View on Google Maps"
        >
          <ExternalLink className="w-5 h-5 text-gray-700" />
        </a>
        
        <a
          href={getDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors touch-target"
          title="Get Directions"
        >
          <MapPin className="w-5 h-5 text-gray-700" />
        </a>
      </div>
      
      {/* Desktop Map Actions */}
      <div className="hidden sm:flex absolute top-3 sm:top-4 right-3 sm:right-4 gap-2">
        <a
          href={getGoogleMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white shadow-md rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View on Maps
        </a>
        
        <a
          href={getDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white shadow-md rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          Directions
        </a>
      </div>
    </div>
  );
} 