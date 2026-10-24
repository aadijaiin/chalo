import { useLiveLocation, type LiveLocation } from '@/hooks/use-live-location';
import * as Location from 'expo-location';
import * as React from 'react';

type LocationContextValue = {
  location: LiveLocation;
  retry: () => void;
  /** Human-readable area name, e.g. "Rohini, Delhi". */
  place: string | null;
};

const LocationContext = React.createContext<LocationContextValue>({
  location: { status: 'loading' },
  retry: () => {},
  place: null,
});

const GEOCODE_EVERY_M = 250;

function distanceM(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371e3;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** One GPS stream for every signed-in screen, plus a throttled place name from the OS geocoder. */
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { location, retry } = useLiveLocation();
  const [place, setPlace] = React.useState<string | null>(null);
  const lastGeocoded = React.useRef<{ latitude: number; longitude: number } | null>(null);

  const coords = location.status === 'ready' ? location.coords : null;

  React.useEffect(() => {
    if (!coords) return;
    if (lastGeocoded.current && distanceM(lastGeocoded.current, coords) < GEOCODE_EVERY_M) return;
    lastGeocoded.current = { latitude: coords.latitude, longitude: coords.longitude };
    Location.reverseGeocodeAsync(coords)
      .then(([hit]) => {
        if (!hit) return;
        const parts = [hit.district || hit.subregion || hit.name, hit.city || hit.region].filter(Boolean);
        setPlace([...new Set(parts)].join(', ') || null);
      })
      .catch(() => {});
  }, [coords?.latitude, coords?.longitude]);

  const value = React.useMemo(() => ({ location, retry, place }), [location, retry, place]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  return React.useContext(LocationContext);
}
