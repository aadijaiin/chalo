import { Marker } from '@maplibre/maplibre-react-native';
import * as React from 'react';

type LngLat = [number, number];

const FRAME_MS = 33; // ~30 fps is plenty for a pin and keeps native marker updates cheap
const MIN_DURATION = 400;
const MAX_DURATION = 4000;
const TELEPORT_DEG = 0.05; // ~5 km: snap instead of sliding across the map

/**
 * Glides from the previous position to the new one over roughly the time
 * between updates, so a moving member drifts continuously instead of hopping.
 */
function useSmoothLngLat(target: LngLat) {
  const [pos, setPos] = React.useState(target);
  const current = React.useRef(target);
  const lastUpdate = React.useRef(Date.now());
  const frame = React.useRef<number | null>(null);

  React.useEffect(() => {
    const from = current.current;
    const now = Date.now();
    const gap = now - lastUpdate.current;
    lastUpdate.current = now;
    if (frame.current != null) cancelAnimationFrame(frame.current);

    const jump = Math.abs(target[0] - from[0]) + Math.abs(target[1] - from[1]);
    if (jump === 0) return;
    if (jump > TELEPORT_DEG) {
      current.current = target;
      setPos(target);
      return;
    }

    const duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, gap));
    let lastPaint = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - now) / duration);
      const next: LngLat = [from[0] + (target[0] - from[0]) * t, from[1] + (target[1] - from[1]) * t];
      current.current = next;
      if (t === 1 || Date.now() - lastPaint >= FRAME_MS) {
        lastPaint = Date.now();
        setPos(next);
      }
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [target[0], target[1]]);

  React.useEffect(() => () => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
  }, []);

  return pos;
}

/** A map Marker whose position animates smoothly between updates. */
export function SmoothMarker({
  lngLat,
  ...props
}: Omit<React.ComponentProps<typeof Marker>, 'lngLat'> & { lngLat: LngLat }) {
  const pos = useSmoothLngLat(lngLat);
  return <Marker {...props} lngLat={pos} />;
}
