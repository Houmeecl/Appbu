import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  location: {
    latitude: number;
    longitude: number;
  } | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocalización no disponible en este dispositivo',
        loading: false,
      });
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      // Validate that coordinates are within Chile's bounds
      const isInChile = latitude >= -55.98 && latitude <= -17.5 && 
                        longitude >= -109.45 && longitude <= -66.42;
      
      if (!isInChile) {
        setState({
          location: null,
          error: 'Ubicación fuera del territorio nacional chileno',
          loading: false,
        });
        return;
      }

      setState({
        location: { latitude, longitude },
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Error desconocido al obtener ubicación';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Acceso a ubicación denegado. Active la geolocalización.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Información de ubicación no disponible.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado para obtener ubicación.';
          break;
      }
      
      setState({
        location: null,
        error: errorMessage,
        loading: false,
      });
    };

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 15000,
      maximumAge: options.maximumAge ?? 300000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  // Auto-request location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Format coordinates for display
  const formatCoordinates = useCallback((lat: number, lng: number) => {
    return {
      dms: {
        latitude: convertToDMS(lat, 'lat'),
        longitude: convertToDMS(lng, 'lng'),
      },
      decimal: {
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }
    };
  }, []);

  // Get address from coordinates (reverse geocoding)
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      // In production, you would use a geocoding service like Google Maps or Nominatim
      // For now, we'll return a formatted address based on coordinates
      const region = getChileanRegion(lat, lng);
      return {
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        region: region,
        country: 'Chile'
      };
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    getCurrentLocation,
    formatCoordinates,
    getAddressFromCoordinates,
  };
}

// Helper function to convert decimal degrees to DMS format
function convertToDMS(coordinate: number, type: 'lat' | 'lng'): string {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.floor((minutesFloat - minutes) * 60);
  
  const direction = type === 'lat' 
    ? (coordinate >= 0 ? 'N' : 'S')
    : (coordinate >= 0 ? 'E' : 'W');
  
  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

// Helper function to determine Chilean region from coordinates
function getChileanRegion(lat: number, lng: number): string {
  // Approximate regions based on latitude
  if (lat > -18.5) return 'Región de Arica y Parinacota';
  if (lat > -21.5) return 'Región de Tarapacá';
  if (lat > -24.5) return 'Región de Antofagasta';
  if (lat > -27.5) return 'Región de Atacama';
  if (lat > -30.5) return 'Región de Coquimbo';
  if (lat > -33.5) return 'Región de Valparaíso';
  if (lat > -35) return 'Región Metropolitana';
  if (lat > -36) return 'Región del Libertador General Bernardo O\'Higgins';
  if (lat > -37) return 'Región del Maule';
  if (lat > -38.5) return 'Región del Ñuble';
  if (lat > -39.5) return 'Región del Biobío';
  if (lat > -40.5) return 'Región de La Araucanía';
  if (lat > -44) return 'Región de Los Ríos';
  if (lat > -46.5) return 'Región de Los Lagos';
  if (lat > -48.5) return 'Región de Aysén';
  return 'Región de Magallanes y Antártica Chilena';
}