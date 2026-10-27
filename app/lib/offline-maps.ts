import { distanceM } from '@/lib/location';
import type { LngLat } from '@/lib/routing';
import { OfflineManager, type LngLatBounds, type OfflinePack } from '@maplibre/maplibre-react-native';
import * as React from 'react';

/**
 * Saves the map along your route for places with no signal (ghats, highways between towns).
 * The route is cut into short stretches, each saved as a small box at street-level detail,
 * plus one low-detail overview of the whole trip. A box around the entire route would pull
 * in far more tiles than the road actually needs.
 */

const KIND = 'chalo-route';
const CHUNK_M = 15_000;
// How far either side of the road to keep.
const PAD_M = 2_500;
const DETAIL_ZOOM: [number, number] = [11, 14];
const OVERVIEW_ZOOM: [number, number] = [5, 10];

export type OfflineState =
  | { status: 'none' }
  | { status: 'downloading'; percent: number }
  | { status: 'ready'; sizeMb: number; partyId: string }
  | { status: 'error'; message: string };

function pad([w, s, e, n]: LngLatBounds, m: number): LngLatBounds {
  const dLat = m / 110_540;
  const dLng = m / (111_320 * Math.cos((((s + n) / 2) * Math.PI) / 180));
  return [w - dLng, s - dLat, e + dLng, n + dLat];
}

function boundsOf(points: LngLat[]): LngLatBounds {
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

/** Boxes covering the line in roughly CHUNK_M stretches, each padded either side. */
export function corridorBoxes(line: LngLat[]): LngLatBounds[] {
  const boxes: LngLatBounds[] = [];
  let chunk: LngLat[] = [line[0]];
  let run = 0;
  for (let i = 1; i < line.length; i++) {
    const [a, b] = [line[i - 1], line[i]];
    run += distanceM({ latitude: a[1], longitude: a[0] }, { latitude: b[1], longitude: b[0] });
    chunk.push(b);
    if (run >= CHUNK_M) {
      boxes.push(pad(boundsOf(chunk), PAD_M));
      chunk = [b];
      run = 0;
    }
  }
  if (chunk.length > 1 || boxes.length === 0) boxes.push(pad(boundsOf(chunk), PAD_M));
  return boxes;
}

async function savedPacks() {
  const packs = await OfflineManager.getPacks();
  return packs.filter((p) => p.metadata?.kind === KIND);
}

/** Removes the saved route map. Only one trip is kept at a time. */
export async function removeOfflineRoute() {
  for (const p of await savedPacks()) await OfflineManager.deletePack(p.id);
}

async function summarize(packs: OfflinePack[]): Promise<OfflineState> {
  if (packs.length === 0) return { status: 'none' };
  const statuses = await Promise.all(packs.map((p) => p.status()));
  const done = statuses.every((s) => s.state === 'complete');
  if (!done) {
    const percent = statuses.reduce((sum, s) => sum + s.percentage, 0) / statuses.length;
    return { status: 'downloading', percent };
  }
  const bytes = statuses.reduce((sum, s) => sum + s.completedResourceSize, 0);
  return { status: 'ready', sizeMb: bytes / 1_000_000, partyId: String(packs[0].metadata.partyId) };
}

/** What's saved right now, and its progress while downloading. */
export function useOfflineRoute() {
  const [state, setState] = React.useState<OfflineState>({ status: 'none' });

  const refresh = React.useCallback(async () => {
    try {
      setState(await summarize(await savedPacks()));
    } catch (e) {
      setState({ status: 'error', message: (e as Error).message });
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const download = React.useCallback(
    async (partyId: string, line: LngLat[], mapStyle: string) => {
      if (line.length < 2) return;
      setState({ status: 'downloading', percent: 0 });
      try {
        await removeOfflineRoute();
        const boxes = corridorBoxes(line);
        const jobs = [
          { bounds: pad(boundsOf(line), PAD_M), zoom: OVERVIEW_ZOOM },
          ...boxes.map((bounds) => ({ bounds, zoom: DETAIL_ZOOM })),
        ];
        // One progress number for all the packs together.
        const progress = new Map<string, number>();
        const report = () => {
          const sum = [...progress.values()].reduce((a, b) => a + b, 0);
          setState({ status: 'downloading', percent: sum / jobs.length });
        };
        OfflineManager.setProgressEventThrottle(500);
        await Promise.all(
          jobs.map((job, i) =>
            OfflineManager.createPack(
              {
                mapStyle,
                bounds: job.bounds,
                minZoom: job.zoom[0],
                maxZoom: job.zoom[1],
                metadata: { kind: KIND, partyId, part: i },
              },
              (pack, status) => {
                progress.set(pack.id, status.percentage);
                report();
                if (status.state === 'complete' && progress.size === jobs.length && [...progress.values()].every((p) => p >= 100)) {
                  refresh();
                }
              },
              (_pack, error) => setState({ status: 'error', message: error.message })
            )
          )
        );
      } catch (e) {
        setState({ status: 'error', message: (e as Error).message });
      }
    },
    [refresh]
  );

  const remove = React.useCallback(async () => {
    await removeOfflineRoute().catch(() => {});
    setState({ status: 'none' });
  }, []);

  return { state, download, remove, refresh };
}
