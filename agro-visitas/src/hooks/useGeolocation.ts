import { useState, useEffect, useCallback } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

interface UseGeolocationReturn {
  location: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  getCurrentLocation: () => Promise<GeolocationPosition | null>;
  isSupported: boolean;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar suporte do navegador
  const isSupported = 'geolocation' in navigator;

  const getCurrentLocation = useCallback((): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        const errorMsg = 'Geolocalização não suportada neste navegador';
        setError(errorMsg);
        console.error('[GPS]', errorMsg);
        resolve(null);
        return;
      }

      setLoading(true);
      setError(null);

      console.log('[GPS] Solicitando localização...');

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
          };

          console.log('[GPS] Localização obtida:', coords);
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let errorMsg = 'Erro ao obter localização';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Permissão de localização negada. Habilite nas configurações do navegador.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Localização indisponível. Verifique se o GPS está ativado.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Tempo esgotado ao obter localização. Tente novamente.';
              break;
          }

          console.error('[GPS] Erro:', errorMsg, err);
          setError(errorMsg);
          setLoading(false);
          resolve(null);
        },
        options
      );
    });
  }, [isSupported]);

  // Auto-detectar localização ao montar (opcional)
  useEffect(() => {
    // Não executar auto-detecção para economizar bateria
    // Será chamado manualmente quando necessário
  }, []);

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    isSupported,
  };
}

// Função utilitária para formatar coordenadas
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`;
}

// Função utilitária para validar coordenadas
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}
