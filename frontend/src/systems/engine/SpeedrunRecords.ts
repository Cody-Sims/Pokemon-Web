/**
 * Personal-best (PB) tracking for speed-run splits.
 *
 * Stored separately from the save file because PBs span across all runs:
 * a fresh New Game shouldn't wipe the player's lifetime best champion time.
 * Persisted to `localStorage` under {@link PB_STORAGE_KEY}.
 *
 * Only `recordIfBetter` mutates state; everything else is read-only.
 */

export interface SpeedrunRecord {
  /** Stable split id (e.g. badge id, 'champion'). */
  id: string;
  /** Human-readable label captured at the time the PB was set. */
  label: string;
  /** Best playtime in seconds. */
  playtime: number;
  /** Wall-clock timestamp at which the PB was set. */
  timestamp: number;
}

const PB_STORAGE_KEY = 'pokemon-web-speedrun-pbs';

function readStore(): Record<string, SpeedrunRecord> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PB_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, SpeedrunRecord>;
    }
  } catch { /* fall through */ }
  return {};
}

function writeStore(store: Record<string, SpeedrunRecord>): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(PB_STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore quota */ }
}

export const SpeedrunRecords = {
  /** Read all currently-tracked PBs. */
  getAll(): Record<string, SpeedrunRecord> {
    return readStore();
  },

  /** Get a single PB by id, or null if none recorded. */
  get(id: string): SpeedrunRecord | null {
    return readStore()[id] ?? null;
  },

  /**
   * If `playtime` (seconds) is strictly less than the current PB for `id`
   * (or no PB exists yet), persist the new record and return it. Returns
   * null when the existing PB is already better or equal.
   */
  recordIfBetter(id: string, label: string, playtime: number): SpeedrunRecord | null {
    if (!Number.isFinite(playtime) || playtime < 0) return null;
    const store = readStore();
    const current = store[id];
    if (current && current.playtime <= playtime) return null;
    const record: SpeedrunRecord = { id, label, playtime, timestamp: Date.now() };
    store[id] = record;
    writeStore(store);
    return record;
  },

  /** Erase all PBs (used by tests; not exposed to UI). */
  clear(): void {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(PB_STORAGE_KEY); } catch { /* ignore */ }
  },

  /**
   * Build a pretty-printed JSON string capturing the splits from the current
   * run alongside the lifetime PBs. `runMeta` is freeform (player name,
   * timestamp, difficulty, etc.) so the caller can decorate the export.
   */
  exportJson(runMeta: Record<string, unknown>, currentSplits: SpeedrunRecord[] | { id: string; label: string; playtime: number; timestamp: number }[]): string {
    const pbs = readStore();
    const payload = {
      schema: 'pokemon-aurum-speedrun/v1',
      exportedAt: Date.now(),
      run: runMeta,
      currentRunSplits: currentSplits,
      personalBests: pbs,
    };
    return JSON.stringify(payload, null, 2);
  },

  /**
   * Trigger a browser download of the exported splits JSON. No-op outside
   * the DOM (e.g. unit tests).
   */
  downloadJson(runMeta: Record<string, unknown>, currentSplits: SpeedrunRecord[] | { id: string; label: string; playtime: number; timestamp: number }[], filename = `pokemon-aurum-splits-${Date.now()}.json`): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return;
    const blob = new Blob([this.exportJson(runMeta, currentSplits)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
