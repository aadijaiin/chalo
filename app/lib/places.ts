import * as Location from 'expo-location';

/**
 * Place search from Photon (komoot's free OpenStreetMap geocoder, no key; fair use, so callers
 * debounce), biased towards where you are. Naming a dropped pin uses the OS geocoder instead.
 */

const PHOTON = 'https://photon.komoot.io/api/';

export type Place = { id: string; name: string; detail: string; lat: number; lng: number };

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

export async function searchPlaces(query: string, near: { latitude: number; longitude: number } | null, signal?: AbortSignal) {
  const params = new URLSearchParams({ q: query, limit: '8', lang: 'en' });
  if (near) {
    params.set('lat', String(near.latitude));
    params.set('lon', String(near.longitude));
  }
  const res = await fetch(`${PHOTON}?${params}`, { signal, headers: { 'User-Agent': 'chalo-app' } });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const body: { features: PhotonFeature[] } = await res.json();

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const f of body.features) {
    const p = f.properties;
    const name = p.name || [p.housenumber, p.street].filter(Boolean).join(' ');
    if (!name) continue;
    const detail = [...new Set([p.district, p.city || p.county, p.state, p.country].filter(Boolean))]
      .filter((x) => x !== name)
      .join(', ');
    // Photon often returns the same place as a node and a way; keep the first.
    const dedupe = `${name}|${detail}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const [lng, lat] = f.geometry.coordinates;
    places.push({ id: `${p.osm_type}${p.osm_id ?? dedupe}`, name, detail, lat, lng });
  }
  return places;
}

/** A short name for a spot on the map, e.g. "Connaught Place, New Delhi". */
export async function nameForPoint(lat: number, lng: number) {
  try {
    const [hit] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!hit) return null;
    const head = hit.name && !/^\d/.test(hit.name) ? hit.name : hit.street || hit.district || hit.subregion;
    const tail = hit.city || hit.region;
    return [...new Set([head, tail].filter(Boolean))].join(', ') || null;
  } catch {
    return null;
  }
}
