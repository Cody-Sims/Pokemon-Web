import { PokemonInstance } from '@data/interfaces';

export interface HallOfFameEntry {
  timestamp: number;
  playerName: string;
  playtime: number;
  party: { pokemonId: number; level: number; nickname?: string }[];
}

/**
 * Manages game progress state: badges, flags, trainers defeated,
 * Pokédex, nuzlocke tracking, visited maps, and Hall of Fame.
 * Extracted from GameManager to separate progress concerns.
 */
export class ProgressManager {
  private badges: string[] = [];
  private flags: Record<string, boolean> = {};
  private trainersDefeated: string[] = [];
  private pokedex = { seen: new Set<number>(), caught: new Set<number>() };
  private nuzlockeEncountered: string[] = []; // route keys where first encounter already happened
  private visitedMaps: Set<string> = new Set(['pallet-town']);
  private hallOfFame: HallOfFameEntry[] = [];

  /** Reset all progress state for a new game. */
  reset(): void {
    this.badges = [];
    this.flags = {};
    this.trainersDefeated = [];
    this.pokedex = { seen: new Set<number>(), caught: new Set<number>() };
    this.nuzlockeEncountered = [];
    this.visitedMaps = new Set(['pallet-town']);
    this.hallOfFame = [];
  }

  // ── Badges ─────────────────────────────────────────────

  getBadges(): string[] { return this.badges; }
  addBadge(badge: string): void {
    if (!this.badges.includes(badge)) this.badges.push(badge);
  }

  // ── Flags ──────────────────────────────────────────────

  getFlag(flag: string): boolean { return this.flags[flag] ?? false; }
  setFlag(flag: string, value = true): void { this.flags[flag] = value; }
  getFlags(): Record<string, boolean> { return { ...this.flags }; }

  // ── Trainers ───────────────────────────────────────────

  isTrainerDefeated(trainerId: string): boolean { return this.trainersDefeated.includes(trainerId); }
  defeatTrainer(trainerId: string): void {
    if (!this.trainersDefeated.includes(trainerId)) this.trainersDefeated.push(trainerId);
  }
  getTrainersDefeated(): string[] { return this.trainersDefeated; }

  // ── Pokédex ────────────────────────────────────────────

  markSeen(id: number): void { this.pokedex.seen.add(id); }
  markCaught(id: number): void { this.pokedex.seen.add(id); this.pokedex.caught.add(id); }
  getPokedex(): { seen: number[]; caught: number[] } {
    return { seen: [...this.pokedex.seen], caught: [...this.pokedex.caught] };
  }

  // ── Nuzlocke tracking ─────────────────────────────────

  getNuzlockeEncountered(): string[] { return this.nuzlockeEncountered; }
  hasNuzlockeEncountered(routeKey: string): boolean { return this.nuzlockeEncountered.includes(routeKey); }
  markNuzlockeEncountered(routeKey: string): void {
    if (!this.nuzlockeEncountered.includes(routeKey)) this.nuzlockeEncountered.push(routeKey);
  }

  // ── Visited Maps ───────────────────────────────────────

  hasVisitedMap(mapKey: string): boolean { return this.visitedMaps.has(mapKey); }
  markMapVisited(mapKey: string): void { this.visitedMaps.add(mapKey); }

  // ── Hall of Fame ───────────────────────────────────────

  getHallOfFame(): HallOfFameEntry[] { return this.hallOfFame; }

  /**
   * Record a Hall of Fame entry.
   * Accepts the player snapshot data needed for the record so this manager
   * does not need to reach back into GameManager (avoids circular deps).
   */
  addHallOfFameEntry(playerName: string, playtime: number, party: PokemonInstance[]): void {
    this.hallOfFame.push({
      timestamp: Date.now(),
      playerName,
      playtime,
      party: party.map(p => ({
        pokemonId: p.dataId,
        level: p.level,
        nickname: p.nickname,
      })),
    });
  }

  // ── Serialization helpers ──────────────────────────────
  // IMPORTANT: Always use serialize()/deserialize() — Sets cannot be JSON.stringified directly

  serialize() {
    return {
      badges: this.badges,
      flags: this.flags,
      trainersDefeated: this.trainersDefeated,
      pokedex: this.getPokedex(),
      nuzlockeEncountered: this.nuzlockeEncountered,
      visitedMaps: [...this.visitedMaps],
      hallOfFame: this.hallOfFame,
    };
  }

  deserialize(data: {
    badges: string[];
    flags: Record<string, boolean>;
    trainersDefeated: string[];
    pokedex: { seen: number[]; caught: number[] };
    nuzlockeEncountered?: string[];
    visitedMaps?: string[];
    hallOfFame?: HallOfFameEntry[];
  }): void {
    this.badges = data.badges;
    this.flags = data.flags;
    this.trainersDefeated = data.trainersDefeated;
    this.pokedex.seen = new Set(data.pokedex.seen);
    this.pokedex.caught = new Set(data.pokedex.caught);
    if (data.nuzlockeEncountered) this.nuzlockeEncountered = data.nuzlockeEncountered;
    if (data.visitedMaps) this.visitedMaps = new Set(data.visitedMaps);
    if (data.hallOfFame) this.hallOfFame = data.hallOfFame;
  }
}
