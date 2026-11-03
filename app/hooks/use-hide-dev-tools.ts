import * as React from 'react';

type DevMenu = { setToolsButtonVisible?: (visible: boolean) => Promise<void> | void };

// Screens that want the button hidden right now. Leaving a map back to another such screen
// mustn't bring the button back, so it only reappears once none are left.
let hiders = 0;

function setVisible(devMenu: DevMenu | null, visible: boolean) {
  // Rejects while the dev menu is still starting up (e.g. right after a reload); it's cosmetic.
  Promise.resolve(devMenu?.setToolsButtonVisible?.(visible)).catch(() => {});
}

/**
 * Hides the dev client's floating tools button while a screen is open, for full-screen maps
 * where it sits on top of the map controls. Shake the device for the dev menu instead.
 * Does nothing in builds without the dev client.
 */
export function useHideDevTools() {
  React.useEffect(() => {
    if (!__DEV__) return;
    let devMenu: DevMenu | null = null;
    try {
      devMenu = require('expo-dev-client');
    } catch {
      return;
    }
    hiders += 1;
    setVisible(devMenu, false);
    return () => {
      hiders -= 1;
      if (hiders === 0) setVisible(devMenu, true);
    };
  }, []);
}
