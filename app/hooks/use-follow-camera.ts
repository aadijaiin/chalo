import type { CameraRef, ViewPadding } from '@maplibre/maplibre-react-native';
import * as React from 'react';

export type FollowMode = 'off' | 'follow' | 'heading';

type Coords = { latitude: number; longitude: number; speed: number | null; heading: number | null };

// Glide over roughly the time between fixes, like SmoothMarker does for the pin, so you stay
// centred instead of the camera arriving early and waiting.
const MIN_GLIDE_MS = 400;
const MAX_GLIDE_MS = 2500;
// Below this you're walking or crawling, and the compass course jumps around: keep the bearing.
const COURSE_MIN_SPEED = 2;
const HEADING_PITCH = 45;

/** Zoom out as you speed up, so a highway shows more road ahead than a city street. */
function zoomFor(speedMs: number) {
  if (speedMs > 22) return 14; // ~80 km/h+
  if (speedMs > 10) return 15; // ~36 km/h+
  return 16;
}

/**
 * Keeps the camera on you while you move. 'heading' also turns the map to your direction of
 * travel and tilts it, like a navigation app. Turning it off (a drag, or another camera move)
 * is up to the caller.
 */
export function useFollowCamera(
  cameraRef: React.RefObject<CameraRef | null>,
  mode: FollowMode,
  coords: Coords | null,
  padding: ViewPadding
) {
  const lastAt = React.useRef(0);
  const bearing = React.useRef(0);
  // Smoothed, so one noisy fix doesn't bounce the zoom between levels.
  const speed = React.useRef(0);

  React.useEffect(() => {
    if (mode === 'off' || !coords) {
      lastAt.current = 0;
      return;
    }
    const now = Date.now();
    const first = lastAt.current === 0;
    const duration = first ? 800 : Math.min(MAX_GLIDE_MS, Math.max(MIN_GLIDE_MS, now - lastAt.current));
    lastAt.current = now;

    const s = coords.speed != null && coords.speed >= 0 ? coords.speed : 0;
    speed.current = first ? s : speed.current * 0.7 + s * 0.3;
    if (mode === 'heading' && s > COURSE_MIN_SPEED && coords.heading != null && coords.heading >= 0) {
      bearing.current = coords.heading;
    }

    cameraRef.current?.easeTo({
      center: [coords.longitude, coords.latitude],
      zoom: zoomFor(speed.current),
      bearing: mode === 'heading' ? bearing.current : 0,
      pitch: mode === 'heading' ? HEADING_PITCH : 0,
      padding,
      duration,
      easing: first ? 'ease' : 'linear',
    });
  }, [mode, coords?.latitude, coords?.longitude]);
}
