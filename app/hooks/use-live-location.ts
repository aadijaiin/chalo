import * as Location from 'expo-location';
import * as React from 'react';
import { AppState } from 'react-native';

export type LiveLocation =
  | { status: 'loading' }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'error'; message: string }
  | { status: 'ready'; coords: Location.LocationObjectCoords; timestamp: number };

/** Asks for foreground permission, then streams the device position. */
export function useLiveLocation() {
  const [state, setState] = React.useState<LiveLocation>({ status: 'loading' });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (permission.status !== 'granted') {
        setState({ status: 'denied', canAskAgain: permission.canAskAgain });
        return;
      }
      setState((s) => (s.status === 'ready' ? s : { status: 'loading' }));

      // A coarse last-known fix paints the map instantly; the watcher refines it.
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last && !cancelled) {
        setState({ status: 'ready', coords: last.coords, timestamp: last.timestamp });
      }

      try {
        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 2000 },
          (position) => {
            if (!cancelled) {
              setState({ status: 'ready', coords: position.coords, timestamp: position.timestamp });
            }
          }
        );
      } catch (e) {
        if (!cancelled) setState({ status: 'error', message: (e as Error).message });
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [attempt]);

  // Re-check after the user returns from system settings.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && (state.status === 'denied' || state.status === 'error')) {
        setAttempt((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, [state.status]);

  const retry = React.useCallback(() => setAttempt((n) => n + 1), []);

  return { location: state, retry };
}
