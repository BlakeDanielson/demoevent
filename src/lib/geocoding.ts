import { Loader } from '@googlemaps/js-api-loader';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
}

let googleMapsLoader: Promise<typeof google> | null = null;

const getGoogleMaps = async (): Promise<typeof google> => {
  if (!googleMapsLoader) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });

    googleMapsLoader = loader.load();
  }

  return googleMapsLoader;
};

export const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
  try {
    const google = await getGoogleMaps();
    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { address },
        (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === 'OK' && results && results[0]) {
            const result = results[0];
            const location = result.geometry.location;
            
            resolve({
              coordinates: {
                lat: location.lat(),
                lng: location.lng()
              },
              formattedAddress: result.formatted_address
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Failed to initialize geocoding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const formatFullAddress = (
  address: string,
  city: string,
  state: string,
  zipCode: string,
  country: string
): string => {
  return `${address}, ${city}, ${state} ${zipCode}, ${country}`;
}; 