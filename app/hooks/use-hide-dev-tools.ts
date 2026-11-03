import * as React from 'react';

/**
 * Hides the dev client's floating tools button while a screen is open, for full-screen maps
 * where it sits on top of the map controls. Shake the device for the dev menu instead.
 * Does nothing in builds without the dev client.
 */
export function useHideDevTools() {
  React.useEffect(() => {
    if (!__DEV__) return;
    let devMenu: { setToolsButtonVisible?: (visible: boolean) => Promise<void> | void } | null = null;
    try {
      devMenu = require('expo-dev-client');
    } catch {
      return;
    }
    // Rejects while the dev menu is still starting up (e.g. right after a reload); it's cosmetic.
    const setVisible = (visible: boolean) =>
      Promise.resolve(devMenu?.setToolsButtonVisible?.(visible)).catch(() => {});
    setVisible(false);
    return () => {
      setVisible(true);
    };
  }, []);
}
