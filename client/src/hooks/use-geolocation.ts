import { useState, useEffect } from "react";

interface GeolocationState {
  location: {
    latitude: number;
    longitude: number;
  } | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: "Geolocation is not supported by this browser",
        loading: false,
      });
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        error: null,
        loading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = "An unknown error occurred";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "User denied the request for Geolocation";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "The request to get user location timed out";
          break;
      }

      setState({
        location: null,
        error: errorMessage,
        loading: false,
      });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // Optional: Watch position for real-time updates
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}
