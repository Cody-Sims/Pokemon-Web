import { DifficultyMode, DifficultyConfig, DIFFICULTY_CONFIGS } from '@data/difficulty';
import { ChallengeMode } from '@data/challenge-modes';
import { PokemonType } from '@utils/type-helpers';
import { SpeedrunRecords } from '@systems/engine/SpeedrunRecords';

/** A speed-run split — playtime snapshot at a notable event. */
export interface SpeedrunSplit {
  /** Stable identifier (e.g. badge id, trainer id, 'champion'). */
  id: string;
  /** Human-readable label shown in the splits list. */
  label: string;
  /** Playtime in seconds when the split was recorded. */
  playtime: number;
  /** Wall-clock timestamp when the split was recorded. */
  timestamp: number;
}

/**
 * Manages player identity, position, inventory, money, settings, and
 * miscellaneous player-specific state (difficulty, trainer ID, playtime, etc.).
 * Extracted from GameManager to separate player-state concerns.
 */
export class PlayerStateManager {
  /** HIGH-22: Maximum quantity of a single item type. */
  static readonly MAX_ITEM_COUNT = 999;
  private playerName = 'Red';
  private playerGender: 'boy' | 'girl' = 'boy';
  private currentMap = 'pallet-town';
  private playerPosition = { x: 7, y: 10, direction: 'down' as string };
  private bag: { itemId: string; quantity: number }[] = [];
  private money = 3000;
  private trainerId = '00000';
  private playtime = 0;
  private difficulty: DifficultyMode = 'classic';
  private challengeModes: ChallengeMode[] = [];
  /** Locked-in monotype for `monotype` runs, captured from the chosen starter. */
  private monotypeLock: PokemonType | null = null;
  private berryPlots: Record<string, unknown[]> = {};
  /** Berry-tree harvest log: tree-id → game-clock minutes when last harvested. */
  private berryHarvests: Record<string, number> = {};
  /** A.1 Battle Tower — Battle-Point currency earned from streak victories. */
  private battlePoints = 0;
  /** Best streak per tier (0 if never cleared a battle in that tier). */
  private towerBestStreak: Record<string, number> = {};
  /** Lifetime full clears per tier. */
  private towerClears: Record<string, number> = {};
  private gameClockMinutes = 0;
  private speedrunSplits: SpeedrunSplit[] = [];
  private settings: Record<string, string | number | boolean> = {
    textSpeed: 'medium',
    musicVolume: 0.5,
    sfxVolume: 0.7,
    battleAnimations: true,
    textScale: 'medium',
    colorblindMode: 'off',
    reducedMotion: false,
    showMinimap: true,
    showTypeHints: true,
    speedrunTimer: false,
  };

  constructor() {
    // Load persisted settings from localStorage
    try {
      const stored = localStorage.getItem('pokemon-web-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          this.settings = { ...this.settings, ...parsed };
        }
      }
    } catch { /* ignore parse errors */ }
  }

  /** Reset all player state for a new game. */
  reset(): void {
    this.playerName = 'Red';
    this.playerGender = 'boy';
    this.currentMap = 'pallet-town';
    this.playerPosition = { x: 7, y: 10, direction: 'down' as string };
    this.bag = [];
    this.money = 3000;
    this.trainerId = String(10000 + Math.floor(Math.random() * 90000));
    this.playtime = 0;
    this.difficulty = 'classic';
    this.challengeModes = [];
    this.monotypeLock = null;
    this.berryPlots = {};
    this.berryHarvests = {};
    this.battlePoints = 0;
    this.towerBestStreak = {};
    this.towerClears = {};
    this.gameClockMinutes = 0;
    this.speedrunSplits = [];
  }

  // ── Identity ───────────────────────────────────────────

  getPlayerName(): string { return this.playerName; }
  setPlayerName(name: string): void { this.playerName = name; }
  getPlayerGender(): 'boy' | 'girl' { return this.playerGender; }
  setPlayerGender(gender: 'boy' | 'girl'): void { this.playerGender = gender; }
  getTrainerId(): string { return this.trainerId; }
  setTrainerId(id: string): void { this.trainerId = id; }

  // ── Position & Map ─────────────────────────────────────

  getCurrentMap(): string { return this.currentMap; }
  setCurrentMap(map: string): void { this.currentMap = map; }
  getPlayerPosition(): { x: number; y: number; direction: string } { return this.playerPosition; }
  setPlayerPosition(pos: { x: number; y: number; direction: string }): void { this.playerPosition = pos; }

  // ── Bag (inventory) ────────────────────────────────────

  getBag(): { itemId: string; quantity: number }[] { return this.bag; }
  addItem(itemId: string, qty = 1): boolean {
    // MED-40: Reject non-positive quantities
    if (qty <= 0) return false;
    // HIGH-22: Enforce per-item capacity limit
    const current = this.getItemCount(itemId);
    if (current + qty > PlayerStateManager.MAX_ITEM_COUNT) return false;
    const entry = this.bag.find(e => e.itemId === itemId);
    if (entry) { entry.quantity += qty; }
    else { this.bag.push({ itemId, quantity: qty }); }
    return true;
  }
  removeItem(itemId: string, qty = 1): boolean {
    const entry = this.bag.find(e => e.itemId === itemId);
    if (!entry || entry.quantity < qty) return false;
    entry.quantity -= qty;
    if (entry.quantity <= 0) {
      this.bag = this.bag.filter(e => e.itemId !== itemId);
    }
    return true;
  }
  getItemCount(itemId: string): number {
    return this.bag.find(e => e.itemId === itemId)?.quantity ?? 0;
  }

  // ── Money ──────────────────────────────────────────────

  getMoney(): number { return this.money; }
  addMoney(amount: number): void {
    if (amount < 0) return; // Prevent negative money additions
    this.money += amount;
  }
  spendMoney(amount: number): boolean {
    if (amount < 0 || this.money < amount) return false;
    this.money -= amount;
    return true;
  }

  // ── Playtime ───────────────────────────────────────────

  getPlaytime(): number { return this.playtime; }
  addPlaytime(seconds: number): void { this.playtime += seconds; }

  // ── Difficulty ─────────────────────────────────────────

  getDifficulty(): DifficultyMode { return this.difficulty; }
  setDifficulty(mode: DifficultyMode): void { this.difficulty = mode; }
  getDifficultyConfig(): DifficultyConfig { return DIFFICULTY_CONFIGS[this.difficulty]; }

  // ── Challenge modes ────────────────────────────────────

  /** Active challenge modes (any combination of monotype/soloRun/noItems/minimalCatches). */
  getChallengeModes(): ChallengeMode[] { return this.challengeModes; }
  setChallengeModes(modes: ChallengeMode[]): void { this.challengeModes = [...modes]; }
  hasChallengeMode(mode: ChallengeMode): boolean { return this.challengeModes.includes(mode); }
  /** Locked-in monotype for `monotype` runs (captured from the starter at game start). */
  getMonotypeLock(): PokemonType | null { return this.monotypeLock; }
  setMonotypeLock(type: PokemonType | null): void { this.monotypeLock = type; }

  // ── Settings ───────────────────────────────────────────

  getSettings(): Record<string, string | number | boolean> { return this.settings; }
  getSetting(key: string): string | number | boolean | undefined { return this.settings[key]; }
  setSetting(key: string, value: string | number | boolean): void { this.settings[key] = value; }

  // ── Berry Plots ────────────────────────────────────────

  getBerryPlots(): Record<string, unknown[]> { return this.berryPlots; }
  setBerryPlots(plots: Record<string, unknown[]>): void { this.berryPlots = plots; }

  // ── Berry-tree harvest log ─────────────────────────────

  /**
   * Get the game-clock minutes at which the given berry tree was last
   * harvested, or null if it has never been harvested.
   */
  getBerryHarvestTime(treeId: string): number | null {
    return this.berryHarvests[treeId] ?? null;
  }
  /** Record a harvest of `treeId` at the current game-clock minute timestamp. */
  recordBerryHarvest(treeId: string, gameMinutes: number): void {
    this.berryHarvests[treeId] = gameMinutes;
  }
  /** Read-only view of all recorded berry harvests. */
  getBerryHarvests(): Record<string, number> { return this.berryHarvests; }

  // ── Battle Tower (A.1) ─────────────────────────────

  /** Battle-Point currency earned from Battle Tower streaks. */
  getBattlePoints(): number { return this.battlePoints; }
  /** Add `amount` BP. Negative or non-finite values are ignored. */
  addBattlePoints(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.battlePoints += Math.floor(amount);
  }
  /** Spend BP. Returns false (no-op) if insufficient. */
  spendBattlePoints(amount: number): boolean {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const cost = Math.floor(amount);
    if (this.battlePoints < cost) return false;
    this.battlePoints -= cost;
    return true;
  }
  /** Best streak (in battles) achieved on the given Battle Tower tier. */
  getTowerBestStreak(tier: string): number { return this.towerBestStreak[tier] ?? 0; }
  /** If `streak` is greater than the recorded best for `tier`, update it. */
  recordTowerStreak(tier: string, streak: number): void {
    if (!Number.isFinite(streak) || streak < 0) return;
    if ((this.towerBestStreak[tier] ?? 0) < streak) {
      this.towerBestStreak[tier] = Math.floor(streak);
    }
  }
  /** Number of full Battle Tower clears the player has completed for the given tier. */
  getTowerClears(tier: string): number { return this.towerClears[tier] ?? 0; }
  /** Increment the full-clear counter for `tier`. */
  recordTowerClear(tier: string): void {
    this.towerClears[tier] = (this.towerClears[tier] ?? 0) + 1;
  }

  // ── Game Clock ─────────────────────────────────────────

  getGameClockMinutes(): number { return this.gameClockMinutes; }
  setGameClockMinutes(minutes: number): void { this.gameClockMinutes = minutes; }

  // ── Speed-run splits ──────────────────────────────────

  getSpeedrunSplits(): SpeedrunSplit[] { return this.speedrunSplits; }
  /** Record a split if one for this id has not already been recorded. */
  recordSpeedrunSplit(id: string, label: string): SpeedrunSplit | null {
    if (this.speedrunSplits.some(s => s.id === id)) return null;
    const split: SpeedrunSplit = {
      id, label,
      playtime: this.playtime,
      timestamp: Date.now(),
    };
    this.speedrunSplits.push(split);
    // Update the lifetime personal-best store (no-op if the existing PB is faster).
    SpeedrunRecords.recordIfBetter(id, label, this.playtime);
    return split;
  }
  clearSpeedrunSplits(): void { this.speedrunSplits = []; }

  // ── Serialization helpers ──────────────────────────────

  serialize() {
    return {
      playerName: this.playerName,
      playerGender: this.playerGender,
      currentMap: this.currentMap,
      playerPosition: this.playerPosition,
      bag: this.bag,
      money: this.money,
      trainerId: this.trainerId,
      playtime: this.playtime,
      difficulty: this.difficulty,
      challengeModes: this.challengeModes,
      monotypeLock: this.monotypeLock,
      settings: this.settings,
      berryPlots: this.berryPlots,
      berryHarvests: this.berryHarvests,
      battlePoints: this.battlePoints,
      towerBestStreak: this.towerBestStreak,
      towerClears: this.towerClears,
      gameClockMinutes: this.gameClockMinutes,
      speedrunSplits: this.speedrunSplits,
    };
  }

  deserialize(data: {
    playerName: string;
    playerGender?: 'boy' | 'girl';
    currentMap: string;
    playerPosition: { x: number; y: number; direction: string };
    bag: { itemId: string; quantity: number }[];
    money: number;
    trainerId?: string;
    playtime: number;
    difficulty?: string;
    challengeModes?: ChallengeMode[];
    monotypeLock?: PokemonType | null;
    settings?: Record<string, string | number | boolean>;
    berryPlots?: Record<string, unknown[]>;
    berryHarvests?: Record<string, number>;
    battlePoints?: number;
    towerBestStreak?: Record<string, number>;
    towerClears?: Record<string, number>;
    gameClockMinutes?: number;
    speedrunSplits?: SpeedrunSplit[];
  }): void {
    this.playerName = data.playerName;
    if (data.playerGender) this.playerGender = data.playerGender;
    this.currentMap = data.currentMap;
    this.playerPosition = data.playerPosition;
    this.bag = data.bag;
    this.money = data.money;
    if (data.trainerId) this.trainerId = data.trainerId;
    this.playtime = data.playtime;
    if (data.difficulty) this.difficulty = data.difficulty as DifficultyMode;
    if (data.challengeModes) this.challengeModes = data.challengeModes;
    if (data.monotypeLock !== undefined) this.monotypeLock = data.monotypeLock;
    if (data.settings) this.settings = { ...this.settings, ...data.settings };
    if (data.berryPlots) this.berryPlots = data.berryPlots;
    if (data.berryHarvests) this.berryHarvests = data.berryHarvests;
    if (typeof data.battlePoints === 'number') this.battlePoints = data.battlePoints;
    if (data.towerBestStreak) this.towerBestStreak = data.towerBestStreak;
    if (data.towerClears) this.towerClears = data.towerClears;
    if (data.gameClockMinutes != null) this.gameClockMinutes = data.gameClockMinutes;
    if (data.speedrunSplits) this.speedrunSplits = data.speedrunSplits;
  }
}
