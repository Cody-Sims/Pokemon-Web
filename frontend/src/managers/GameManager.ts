import { PokemonInstance } from '@data/interfaces';
import { DifficultyMode, DifficultyConfig } from '@data/difficulty';

import { PartyManager } from './PartyManager';
import { ProgressManager, HallOfFameEntry } from './ProgressManager';
import { PlayerStateManager, SpeedrunSplit } from './PlayerStateManager';
import { StatsManager, GameStats, defaultStats } from './StatsManager';

// Re-export types so existing `import { GameStats, HallOfFameEntry } from '@managers/GameManager'` still works
export type { GameStats, HallOfFameEntry, SpeedrunSplit };
export { defaultStats };

/**
 * Thin facade over the focused sub-managers.
 *
 * Every public method that existed before is preserved as a delegation call
 * so that all existing consumers continue to work without changes.
 *
 * New code should prefer accessing the sub-managers directly via the getters
 * (e.g. `GameManager.getInstance().partyMgr`) for clarity.
 */
export class GameManager {
  private static instance: GameManager;

  // ── Sub-managers ───────────────────────────────────────
  private readonly _party = new PartyManager();
  private readonly _progress = new ProgressManager();
  private readonly _player = new PlayerStateManager();
  private readonly _stats = new StatsManager();

  private constructor() { /* sub-manager constructors handle init */ }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /** Direct access to the party / PC-box sub-manager. */
  get partyMgr(): PartyManager { return this._party; }
  /** Direct access to the progress sub-manager (badges, flags, pokedex, etc.). */
  get progressMgr(): ProgressManager { return this._progress; }
  /** Direct access to the player-state sub-manager (name, position, inventory, etc.). */
  get playerMgr(): PlayerStateManager { return this._player; }
  /** Direct access to the stats sub-manager. */
  get statsMgr(): StatsManager { return this._stats; }

  // ══════════════════════════════════════════════════════
  //  Reset
  // ══════════════════════════════════════════════════════

  /** Reset all game state for a new game. */
  reset(): void {
    this._party.reset();
    this._progress.reset();
    this._player.reset();
    this._stats.reset();
  }

  // ══════════════════════════════════════════════════════
  //  Delegation — Party  (→ PartyManager)
  // ══════════════════════════════════════════════════════

  getParty(): PokemonInstance[] { return this._party.getParty(); }
  setParty(party: PokemonInstance[]): void { this._party.setParty(party); }
  addToParty(pokemon: PokemonInstance): boolean { return this._party.addToParty(pokemon); }
  removeFromParty(index: number): PokemonInstance | null { return this._party.removeFromParty(index); }
  adjustFriendship(pokemonIndex: number, amount: number): void { this._party.adjustFriendship(pokemonIndex, amount); }

  // PC Boxes
  getBoxes(): PokemonInstance[][] { return this._party.getBoxes(); }
  getBox(index: number): PokemonInstance[] { return this._party.getBox(index); }
  getBoxNames(): string[] { return this._party.getBoxNames(); }
  setBoxName(index: number, name: string): void { this._party.setBoxName(index, name); }
  depositPokemon(boxIndex: number, pokemon: PokemonInstance): boolean { return this._party.depositPokemon(boxIndex, pokemon); }
  withdrawPokemon(boxIndex: number, slotIndex: number): PokemonInstance | null { return this._party.withdrawPokemon(boxIndex, slotIndex); }
  autoDeposit(pokemon: PokemonInstance): boolean { return this._party.autoDeposit(pokemon); }

  // ══════════════════════════════════════════════════════
  //  Delegation — Progress  (→ ProgressManager)
  // ══════════════════════════════════════════════════════

  getBadges(): string[] { return this._progress.getBadges(); }
  addBadge(badge: string): void {
    if (this._progress.getBadges().includes(badge)) return;
    this._progress.addBadge(badge);
    // Auto-record speed-run split on first acquisition.
    const pretty = badge.replace(/^./, c => c.toUpperCase());
    this._player.recordSpeedrunSplit(`badge:${badge}`, `${pretty} Badge`);
  }

  getFlag(flag: string): boolean { return this._progress.getFlag(flag); }
  setFlag(flag: string, value = true): void { this._progress.setFlag(flag, value); }
  getFlags(): Record<string, boolean> { return this._progress.getFlags(); }

  isTrainerDefeated(trainerId: string): boolean { return this._progress.isTrainerDefeated(trainerId); }
  defeatTrainer(trainerId: string): void { this._progress.defeatTrainer(trainerId); }
  getTrainersDefeated(): string[] { return this._progress.getTrainersDefeated(); }

  markSeen(id: number): void { this._progress.markSeen(id); }
  markCaught(id: number): void { this._progress.markCaught(id); }
  getPokedex(): { seen: number[]; caught: number[] } { return this._progress.getPokedex(); }

  getNuzlockeEncountered(): string[] { return this._progress.getNuzlockeEncountered(); }
  hasNuzlockeEncountered(routeKey: string): boolean { return this._progress.hasNuzlockeEncountered(routeKey); }
  markNuzlockeEncountered(routeKey: string): void { this._progress.markNuzlockeEncountered(routeKey); }

  hasVisitedMap(mapKey: string): boolean { return this._progress.hasVisitedMap(mapKey); }
  markMapVisited(mapKey: string): void { this._progress.markMapVisited(mapKey); }

  getHallOfFame(): HallOfFameEntry[] { return this._progress.getHallOfFame(); }
  /** Record a Hall of Fame entry using current player/party state. */
  addHallOfFameEntry(): void {
    this._progress.addHallOfFameEntry(
      this._player.getPlayerName(),
      this._player.getPlaytime(),
      this._party.getParty(),
    );
    // Final speed-run split on first champion victory.
    this._player.recordSpeedrunSplit('champion', 'Champion Defeated');
  }

  // ══════════════════════════════════════════════════════
  //  Delegation — Player State  (→ PlayerStateManager)
  // ══════════════════════════════════════════════════════

  getPlayerName(): string { return this._player.getPlayerName(); }
  setPlayerName(name: string): void { this._player.setPlayerName(name); }
  getPlayerGender(): 'boy' | 'girl' { return this._player.getPlayerGender(); }
  setPlayerGender(gender: 'boy' | 'girl'): void { this._player.setPlayerGender(gender); }
  getTrainerId(): string { return this._player.getTrainerId(); }
  setTrainerId(id: string): void { this._player.setTrainerId(id); }

  getCurrentMap(): string { return this._player.getCurrentMap(); }
  setCurrentMap(map: string): void { this._player.setCurrentMap(map); }
  getPlayerPosition(): { x: number; y: number; direction: string } { return this._player.getPlayerPosition(); }
  setPlayerPosition(pos: { x: number; y: number; direction: string }): void { this._player.setPlayerPosition(pos); }

  getBag(): { itemId: string; quantity: number }[] { return this._player.getBag(); }
  addItem(itemId: string, qty = 1): void { this._player.addItem(itemId, qty); }
  removeItem(itemId: string, qty = 1): boolean { return this._player.removeItem(itemId, qty); }
  getItemCount(itemId: string): number { return this._player.getItemCount(itemId); }

  getMoney(): number { return this._player.getMoney(); }
  addMoney(amount: number): void { this._player.addMoney(amount); }
  spendMoney(amount: number): boolean { return this._player.spendMoney(amount); }

  getPlaytime(): number { return this._player.getPlaytime(); }
  addPlaytime(seconds: number): void { this._player.addPlaytime(seconds); }

  getDifficulty(): DifficultyMode { return this._player.getDifficulty(); }
  setDifficulty(mode: DifficultyMode): void { this._player.setDifficulty(mode); }
  getDifficultyConfig(): DifficultyConfig { return this._player.getDifficultyConfig(); }

  getSettings(): Record<string, string | number | boolean> { return this._player.getSettings(); }
  getSetting(key: string): string | number | boolean | undefined { return this._player.getSetting(key); }
  setSetting(key: string, value: string | number | boolean): void { this._player.setSetting(key, value); }

  getBerryPlots(): Record<string, unknown[]> { return this._player.getBerryPlots(); }
  setBerryPlots(plots: Record<string, unknown[]>): void { this._player.setBerryPlots(plots); }

  /** Game-clock minute timestamp at which the given berry tree was last harvested, or null. */
  getBerryHarvestTime(treeId: string): number | null { return this._player.getBerryHarvestTime(treeId); }
  /** Record a harvest of `treeId` at the given game-clock minute timestamp. */
  recordBerryHarvest(treeId: string, gameMinutes: number): void { this._player.recordBerryHarvest(treeId, gameMinutes); }
  /** Read-only view of all recorded berry harvests. */
  getBerryHarvests(): Record<string, number> { return this._player.getBerryHarvests(); }

  getGameClockMinutes(): number { return this._player.getGameClockMinutes(); }
  setGameClockMinutes(minutes: number): void { this._player.setGameClockMinutes(minutes); }

  /** Read the recorded speed-run splits (badges + champion) in record order. */
  getSpeedrunSplits(): SpeedrunSplit[] { return this._player.getSpeedrunSplits(); }
  /** Manually record a split (e.g. for custom milestones); no-op if `id` already recorded. */
  recordSpeedrunSplit(id: string, label: string): SpeedrunSplit | null {
    return this._player.recordSpeedrunSplit(id, label);
  }

  // ── Challenge modes (delegation) ───────────────────────

  getChallengeModes(): ReturnType<PlayerStateManager['getChallengeModes']> { return this._player.getChallengeModes(); }
  setChallengeModes(modes: ReturnType<PlayerStateManager['getChallengeModes']>): void { this._player.setChallengeModes(modes); }
  hasChallengeMode(mode: Parameters<PlayerStateManager['hasChallengeMode']>[0]): boolean { return this._player.hasChallengeMode(mode); }
  getMonotypeLock(): ReturnType<PlayerStateManager['getMonotypeLock']> { return this._player.getMonotypeLock(); }
  setMonotypeLock(type: Parameters<PlayerStateManager['setMonotypeLock']>[0]): void { this._player.setMonotypeLock(type); }

  // ══════════════════════════════════════════════════════
  //  Delegation — Stats  (→ StatsManager)
  // ══════════════════════════════════════════════════════

  getGameStats(): GameStats { return this._stats.getGameStats(); }
  incrementStat(key: keyof GameStats, amount = 1): void { this._stats.incrementStat(key, amount); }
  getStat(key: keyof GameStats): number { return this._stats.getStat(key); }

  getStepCount(): number { return this._stats.getStepCount(); }
  incrementStepCount(): number { return this._stats.incrementStepCount(); }

  // ══════════════════════════════════════════════════════
  //  Serialization (flat shape preserved for save compat)
  // ══════════════════════════════════════════════════════

  /** Serialize state for saving. Produces the exact same flat shape as the original. */
  serialize() {
    return {
      ...this._party.serialize(),
      ...this._progress.serialize(),
      ...this._player.serialize(),
      ...this._stats.serialize(),
    };
  }

  /** Restore state from save data. */
  deserialize(data: ReturnType<GameManager['serialize']>): void {
    this._party.deserialize(data);
    this._progress.deserialize(data);
    this._player.deserialize(data);
    this._stats.deserialize(data);
  }

  /** Restore state from a SaveData object (from localStorage). */
  loadFromSave(save: {
    player: {
      name: string;
      gender?: 'boy' | 'girl';
      position: { mapKey: string; x: number; y: number; direction: string };
      party: PokemonInstance[];
      bag: { itemId: string; quantity: number }[];
      money: number;
      badges: string[];
      pokedex: { seen: number[]; caught: number[] };
      playtime: number;
    };
    flags: Record<string, boolean>;
    trainersDefeated: string[];
    boxes?: PokemonInstance[][];
    difficulty?: string;
    nuzlockeEncountered?: string[];
    gameStats?: Record<string, number>;
    hallOfFame?: unknown[];
    visitedMaps?: string[];
    gameClockMinutes?: number;
  }): void {
    // Party sub-manager
    this._party.deserialize({
      party: save.player.party,
      boxes: save.boxes,
    });

    // Progress sub-manager
    this._progress.deserialize({
      badges: save.player.badges,
      flags: save.flags,
      trainersDefeated: save.trainersDefeated,
      pokedex: save.player.pokedex,
      nuzlockeEncountered: save.nuzlockeEncountered,
      visitedMaps: save.visitedMaps,
      hallOfFame: save.hallOfFame as HallOfFameEntry[] | undefined,
    });

    // Player state sub-manager
    this._player.deserialize({
      playerName: save.player.name,
      playerGender: save.player.gender,
      currentMap: save.player.position.mapKey,
      playerPosition: {
        x: save.player.position.x,
        y: save.player.position.y,
        direction: save.player.position.direction,
      },
      bag: save.player.bag,
      money: save.player.money,
      playtime: save.player.playtime,
      difficulty: save.difficulty,
      gameClockMinutes: save.gameClockMinutes,
    });

    // Stats sub-manager
    this._stats.deserialize({
      gameStats: save.gameStats as GameStats | undefined,
    });
  }
}
