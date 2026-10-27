import { requireOptionalNativeModule } from 'expo';
import type * as BatteryModule from 'expo-battery';

export type BatteryReading = { level: number; charging: boolean };

// Dev builds made before battery was added don't have its native side; read it only when it's
// there. Without it nothing is sent, which also keeps those builds working against older servers.
const Battery: typeof BatteryModule | null = requireOptionalNativeModule('ExpoBattery') ? require('expo-battery') : null;

/** This phone's battery, posted with your location so the crew can tell a dying phone from a quiet one. */
export async function readBattery(): Promise<BatteryReading | null> {
  if (!Battery) return null;
  try {
    const [level, state] = await Promise.all([Battery.getBatteryLevelAsync(), Battery.getBatteryStateAsync()]);
    // -1 means unknown (simulators, some devices).
    if (level < 0) return null;
    const charging = state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
    return { level, charging };
  } catch {
    return null;
  }
}
