import * as React from 'react';

/**
 * Hides the dev client's floating tools button while a screen is open, for full-screen maps
 * where it sits on top of the map controls. Shake the device for the dev menu instead.
 * Does nothing in builds without the dev client.
 */
export function useHideDevTools() {
  React.useEffect(() => {
    if (!__DEV__) return;
    let devMenu: { setToolsButtonVisible?: (visible: boolean) => void } | null = null;
    try {
      devMenu = require('expo-dev-client');
    } catch {
      return;
    }
    devMenu?.setToolsButtonVisible?.(false);
    return () => devMenu?.setToolsButtonVisible?.(true);
  }, []);
}
