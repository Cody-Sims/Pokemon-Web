/**
 * Accelerated game clock for day/night cycle.
 * 1 real minute = 10 game minutes → full day/night in ~2.4 real hours.
 */

export type TimePeriod = 'morning' | 'day' | 'evening' | 'night';

/** Tint colors for each time period (applied as camera tint). */
export const TIME_TINTS: Record<TimePeriod, number> = {
  morning: 0xffeedd,   // warm orange tint
  day:     0xffffff,   // neutral (no tint)
  evening: 0xffbbaa,   // orange/pink sunset
  night:   0x8888cc,   // blue-ish dark
};

export class GameClock {
  private startRealTime: number;
  private gameTimeOffset: number; // game-minutes offset from start

  constructor(gameMinutesElapsed = 0) {
    this.startRealTime = Date.now();
    this.gameTimeOffset = gameMinutesElapsed;
  }

  /** Get current game time in minutes (0–1440 = 24h cycle). */
  getGameMinutes(): number {
    const realElapsedMs = Date.now() - this.startRealTime;
    const realElapsedMin = realElapsedMs / 60000;
    const gameMinutes = realElapsedMin * 10 + this.gameTimeOffset; // 10x accelerated
    return gameMinutes % 1440; // wrap to 24h
  }

  /** Get current game hour (0–23). */
  getGameHour(): number {
    return Math.floor(this.getGameMinutes() / 60);
  }

  /** Get current time period. */
  getTimePeriod(): TimePeriod {
    const hour = this.getGameHour();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'day';
    if (hour >= 18 && hour < 21) return 'evening';
    return 'night';
  }

  /** Get formatted clock string (HH:MM). */
  getClockString(): string {
    const totalMin = this.getGameMinutes();
    const h = Math.floor(totalMin / 60) % 24;
    const m = Math.floor(totalMin % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Get the tint color for the current time period. */
  getCurrentTint(): number {
    return TIME_TINTS[this.getTimePeriod()];
  }

  /** Get total game minutes elapsed since clock start (for save). */
  getTotalElapsed(): number {
    const realElapsedMs = Date.now() - this.startRealTime;
    const realElapsedMin = realElapsedMs / 60000;
    return realElapsedMin * 10 + this.gameTimeOffset;
  }

  /** Restore from saved game minutes. */
  setElapsedMinutes(minutes: number): void {
    this.startRealTime = Date.now();
    this.gameTimeOffset = minutes;
  }
}
