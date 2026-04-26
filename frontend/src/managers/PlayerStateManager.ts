import { DifficultyMode, DifficultyConfig, DIFFICULTY_CONFIGS } from '@data/difficulty';

/**
 * Manages player identity, position, inventory, money, settings, and
 * miscellaneous player-specific state (difficulty, trainer ID, playtime, etc.).
 * Extracted from GameManager to separate player-state concerns.
 */
export class PlayerStateManager {
  private playerName = 'Red';
  private playerGender: 'boy' | 'girl' = 'boy';
  private currentMap = 'pallet-town';
  private playerPosition = { x: 7, y: 10, direction: 'down' as string };
  private bag: { itemId: string; quantity: number }[] = [];
  private money = 3000;
  private trainerId = '00000';
  private playtime = 0;
  private difficulty: DifficultyMode = 'classic';
  private berryPlots: Record<string, unknown[]> = {};
  private gameClockMinutes = 0;
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
    this.berryPlots = {};
    this.gameClockMinutes = 0;
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
  addItem(itemId: string, qty = 1): void {
    const entry = this.bag.find(e => e.itemId === itemId);
    if (entry) { entry.quantity += qty; }
    else { this.bag.push({ itemId, quantity: qty }); }
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

  // ── Settings ───────────────────────────────────────────

  getSettings(): Record<string, string | number | boolean> { return this.settings; }
  getSetting(key: string): string | number | boolean | undefined { return this.settings[key]; }
  setSetting(key: string, value: string | number | boolean): void { this.settings[key] = value; }

  // ── Berry Plots ────────────────────────────────────────

  getBerryPlots(): Record<string, unknown[]> { return this.berryPlots; }
  setBerryPlots(plots: Record<string, unknown[]>): void { this.berryPlots = plots; }

  // ── Game Clock ─────────────────────────────────────────

  getGameClockMinutes(): number { return this.gameClockMinutes; }
  setGameClockMinutes(minutes: number): void { this.gameClockMinutes = minutes; }

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
      settings: this.settings,
      berryPlots: this.berryPlots,
      gameClockMinutes: this.gameClockMinutes,
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
    settings?: Record<string, string | number | boolean>;
    berryPlots?: Record<string, unknown[]>;
    gameClockMinutes?: number;
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
    if (data.settings) this.settings = { ...this.settings, ...data.settings };
    if (data.berryPlots) this.berryPlots = data.berryPlots;
    if (data.gameClockMinutes != null) this.gameClockMinutes = data.gameClockMinutes;
  }
}
