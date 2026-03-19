import { useState, useCallback } from "react";

const STORAGE_KEY = "pededireto_user_location";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface StoredLocation {
  city: string;
  timestamp: number;
}

const getStored = (): string | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredLocation = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.city;
  } catch {
    return null;
  }
};

const storeCity = (city: string) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, timestamp: Date.now() }));
};

export const useUserLocation = () => {
  const [city, setCity] = useState<string | null>(getStored);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasAsked, setHasAsked] = useState(!!getStored());

  const detectLocation = useCallback(async () => {
    // Don't re-ask if already stored
    if (getStored()) {
      setCity(getStored());
      setHasAsked(true);
      return;
    }

    if (!navigator.geolocation) {
      setHasAsked(true);
      return;
    }

    setIsDetecting(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=pt`,
        { headers: { "User-Agent": "PedeDireto/1.0" } }
      );

      if (res.ok) {
        const data = await res.json();
        const detectedCity =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.municipality ||
          null;

        if (detectedCity) {
          storeCity(detectedCity);
          setCity(detectedCity);
        }
      }
    } catch {
      // User denied or timeout — silently fail
    } finally {
      setIsDetecting(false);
      setHasAsked(true);
    }
  }, []);

  const setManualCity = useCallback((newCity: string) => {
    storeCity(newCity);
    setCity(newCity);
    setHasAsked(true);
  }, []);

  const clearCity = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCity(null);
  }, []);

  return { city, isDetecting, hasAsked, detectLocation, setManualCity, clearCity };
};
