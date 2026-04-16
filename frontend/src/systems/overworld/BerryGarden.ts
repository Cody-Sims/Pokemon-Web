import { GameManager } from '@managers/GameManager';
import { GameClock } from '@systems/engine/GameClock';

export interface BerryPlot {
  berryId: string;
  plantedAt: number;   // GameClock total-elapsed minutes
  wateredAt: number;    // GameClock total-elapsed minutes (0 = never watered)
  stage: 'empty' | 'planted' | 'growing' | 'ready';
}

/**
 * Berry growing system.
 * Plots are keyed by mapId and persisted via GameManager flags.
 *
 * Growth timeline (in game-minutes):
 *   planted → growing  : 120 min (2 in-game hours)
 *   growing → ready    : 240 min (4 in-game hours)
 * Watering halves the remaining time for the current stage.
 */
export class BerryGarden {
  private static readonly PLANTED_TO_GROWING = 120; // game-minutes
  private static readonly GROWING_TO_READY = 240;   // game-minutes

  /** Get all plots keyed by mapId. */
  static getPlots(): Record<string, BerryPlot[]> {
    const raw = GameManager.getInstance().getFlag('berryPlots');
    if (raw && typeof raw === 'boolean') {
      // Flag was stored as boolean — no plot data yet
      return {};
    }
    try {
      const stored = (GameManager.getInstance() as any)._berryPlots as Record<string, BerryPlot[]> | undefined;
      return stored ?? {};
    } catch {
      return {};
    }
  }

  /** Ensure plot array exists for a map with the given number of slots. */
  static ensurePlots(mapId: string, count: number): BerryPlot[] {
    const all = this.getPlots();
    if (!all[mapId]) {
      all[mapId] = Array.from({ length: count }, () => ({
        berryId: '',
        plantedAt: 0,
        wateredAt: 0,
        stage: 'empty' as const,
      }));
      this.savePlots(all);
    }
    return all[mapId];
  }

  /** Get plots for a specific map. */
  static getMapPlots(mapId: string): BerryPlot[] {
    return this.getPlots()[mapId] ?? [];
  }

  /** Plant a berry in a plot. Returns true on success. */
  static plant(mapId: string, plotIndex: number, berryId: string): boolean {
    const all = this.getPlots();
    const plots = all[mapId];
    if (!plots || plotIndex < 0 || plotIndex >= plots.length) return false;
    const plot = plots[plotIndex];
    if (plot.stage !== 'empty') return false;

    // Check player has the berry
    const gm = GameManager.getInstance();
    if (gm.getItemCount(berryId) <= 0) return false;
    gm.removeItem(berryId);

    plot.berryId = berryId;
    plot.plantedAt = this.getCurrentTime();
    plot.wateredAt = 0;
    plot.stage = 'planted';
    this.savePlots(all);
    return true;
  }

  /** Water a plot (speeds growth by 50%). */
  static water(mapId: string, plotIndex: number): void {
    const all = this.getPlots();
    const plots = all[mapId];
    if (!plots || plotIndex < 0 || plotIndex >= plots.length) return;
    const plot = plots[plotIndex];
    if (plot.stage === 'empty' || plot.stage === 'ready') return;
    plot.wateredAt = this.getCurrentTime();
    this.savePlots(all);
  }

  /** Harvest a ready plot. Returns the berry item ID or null. */
  static harvest(mapId: string, plotIndex: number): string | null {
    const all = this.getPlots();
    const plots = all[mapId];
    if (!plots || plotIndex < 0 || plotIndex >= plots.length) return null;
    const plot = plots[plotIndex];
    if (plot.stage !== 'ready') return null;

    const berryId = plot.berryId;
    const yield_ = 2 + Math.floor(Math.random() * 3); // 2-4 berries

    const gm = GameManager.getInstance();
    gm.addItem(berryId, yield_);

    // Reset plot
    plot.berryId = '';
    plot.plantedAt = 0;
    plot.wateredAt = 0;
    plot.stage = 'empty';
    this.savePlots(all);
    return berryId;
  }

  /** Advance growth stages based on current time. Call from OverworldScene update. */
  static update(currentTime: number): void {
    const all = this.getPlots();
    let changed = false;

    for (const mapId of Object.keys(all)) {
      for (const plot of all[mapId]) {
        if (plot.stage === 'empty' || plot.stage === 'ready') continue;

        const elapsed = currentTime - plot.plantedAt;
        const wasWatered = plot.wateredAt > 0;
        const speedMultiplier = wasWatered ? 1.5 : 1.0; // watering = 50% faster

        if (plot.stage === 'planted') {
          const threshold = this.PLANTED_TO_GROWING / speedMultiplier;
          if (elapsed >= threshold) {
            plot.stage = 'growing';
            changed = true;
          }
        }

        if (plot.stage === 'growing') {
          const fullThreshold = (this.PLANTED_TO_GROWING + this.GROWING_TO_READY) / speedMultiplier;
          if (elapsed >= fullThreshold) {
            plot.stage = 'ready';
            changed = true;
          }
        }
      }
    }

    if (changed) this.savePlots(all);
  }

  // ── Internal helpers ──

  private static getCurrentTime(): number {
    // Use a shared clock instance — OverworldScene sets this
    return (BerryGarden as any)._clockTime ?? 0;
  }

  /** Set the current game clock time (called by OverworldScene). */
  static setClockTime(totalElapsed: number): void {
    (BerryGarden as any)._clockTime = totalElapsed;
  }

  private static savePlots(all: Record<string, BerryPlot[]>): void {
    (GameManager.getInstance() as any)._berryPlots = all;
  }
}
