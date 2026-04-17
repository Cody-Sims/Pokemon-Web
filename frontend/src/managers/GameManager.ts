import { PokemonInstance } from '@data/interfaces';
import { DifficultyMode, DifficultyConfig, DIFFICULTY_CONFIGS } from '@data/difficulty';

export interface GameStats {
  totalBattlesWon: number;
  totalBattlesLost: number;
  wildBattles: number;
  trainerBattles: number;
  totalCatches: number;
  totalSteps: number;
  moneyEarned: number;
  moneySpent: number;
  pokemonEvolved: number;
  criticalHits: number;
  highestDamage: number;
}

export interface HallOfFameEntry {
  timestamp: number;
  playerName: string;
  playtime: number;
  party: { pokemonId: number; level: number; nickname?: string }[];
}

function defaultStats(): GameStats {
  return {
    totalBattlesWon: 0, totalBattlesLost: 0, wildBattles: 0,
    trainerBattles: 0, totalCatches: 0, totalSteps: 0,
    moneyEarned: 0, moneySpent: 0, pokemonEvolved: 0,
    criticalHits: 0, highestDamage: 0,
  };
}

/** Central game state: party, badges, playtime, flags, stats. */
export class GameManager {
  private static instance: GameManager;

  private party: PokemonInstance[] = [];
  private bag: { itemId: string; quantity: number }[] = [];
  private money = 3000;
  private badges: string[] = [];
  private flags: Record<string, boolean> = {};
  private trainersDefeated: string[] = [];
  private pokedex = { seen: new Set<number>(), caught: new Set<number>() };
  private playerName = 'Red';
  private playerGender: 'boy' | 'girl' = 'boy';
  private playtime = 0;
  private currentMap = 'pallet-town';
  private playerPosition = { x: 7, y: 10, direction: 'down' as string };
  private boxes: PokemonInstance[][] = Array.from({ length: 12 }, () => []);
  private boxNames: string[] = Array.from({ length: 12 }, (_, i) => `Box ${i + 1}`);
  private difficulty: DifficultyMode = 'classic';
  private trainerId = '00000';
  private nuzlockeEncountered: string[] = []; // route keys where first encounter already happened
  private stepCount = 0;
  private gameStats: GameStats = defaultStats();
  private hallOfFame: HallOfFameEntry[] = [];
  private visitedMaps: Set<string> = new Set(['pallet-town']);
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
  };

  private constructor() {
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

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /** Reset all game state for a new game. */
  reset(): void {
    this.party = [];
    this.bag = [];
    this.money = 3000;
    this.badges = [];
    this.flags = {};
    this.trainersDefeated = [];
    this.pokedex = { seen: new Set<number>(), caught: new Set<number>() };
    this.playerName = 'Red';
    this.playerGender = 'boy';
    this.playtime = 0;
    this.currentMap = 'pallet-town';
    this.playerPosition = { x: 7, y: 10, direction: 'down' as string };
    this.boxes = Array.from({ length: 12 }, () => []);
    this.boxNames = Array.from({ length: 12 }, (_, i) => `Box ${i + 1}`);
    this.difficulty = 'classic';
    this.trainerId = String(10000 + Math.floor(Math.random() * 90000));
    this.nuzlockeEncountered = [];
    this.stepCount = 0;
    this.gameStats = defaultStats();
    this.hallOfFame = [];
    this.visitedMaps = new Set(['pallet-town']);
  }

  // Party
  getParty(): PokemonInstance[] { return this.party; }
  setParty(party: PokemonInstance[]): void { this.party = party; }
  addToParty(pokemon: PokemonInstance): boolean {
    if (this.party.length >= 6) {
      // Party full — auto-deposit to first available PC box
      return this.autoDeposit(pokemon);
    }
    this.party.push(pokemon);
    return true;
  }

  // Bag
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

  // Money
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

  // Badges
  getBadges(): string[] { return this.badges; }
  addBadge(badge: string): void {
    if (!this.badges.includes(badge)) this.badges.push(badge);
  }

  // Flags
  getFlag(flag: string): boolean { return this.flags[flag] ?? false; }
  setFlag(flag: string, value = true): void { this.flags[flag] = value; }
  getFlags(): Record<string, boolean> { return this.flags; }

  // Trainers
  isTrainerDefeated(trainerId: string): boolean { return this.trainersDefeated.includes(trainerId); }
  defeatTrainer(trainerId: string): void {
    if (!this.trainersDefeated.includes(trainerId)) this.trainersDefeated.push(trainerId);
  }
  getTrainersDefeated(): string[] { return this.trainersDefeated; }

  // Pokedex
  markSeen(id: number): void { this.pokedex.seen.add(id); }
  markCaught(id: number): void { this.pokedex.seen.add(id); this.pokedex.caught.add(id); }
  getPokedex(): { seen: number[]; caught: number[] } {
    return { seen: [...this.pokedex.seen], caught: [...this.pokedex.caught] };
  }

  // Friendship
  /** Adjust friendship for a party Pokémon by index. Clamps to [0, 255]. */
  adjustFriendship(pokemonIndex: number, amount: number): void {
    const p = this.party[pokemonIndex];
    if (p) {
      p.friendship = Math.max(0, Math.min(255, p.friendship + amount));
    }
  }

  // Step counter (for friendship walking bonus)
  getStepCount(): number { return this.stepCount; }
  incrementStepCount(): number {
    this.stepCount++;
    return this.stepCount;
  }

  // Position & Map
  getCurrentMap(): string { return this.currentMap; }
  setCurrentMap(map: string): void { this.currentMap = map; }
  getPlayerPosition(): { x: number; y: number; direction: string } { return this.playerPosition; }
  setPlayerPosition(pos: { x: number; y: number; direction: string }): void { this.playerPosition = pos; }
  getPlayerName(): string { return this.playerName; }
  setPlayerName(name: string): void { this.playerName = name; }
  getPlayerGender(): 'boy' | 'girl' { return this.playerGender; }
  setPlayerGender(gender: 'boy' | 'girl'): void { this.playerGender = gender; }
  getPlaytime(): number { return this.playtime; }
  addPlaytime(seconds: number): void { this.playtime += seconds; }

  // Difficulty
  getDifficulty(): DifficultyMode { return this.difficulty; }
  setDifficulty(mode: DifficultyMode): void { this.difficulty = mode; }
  getDifficultyConfig(): DifficultyConfig { return DIFFICULTY_CONFIGS[this.difficulty]; }

  // Trainer ID
  getTrainerId(): string { return this.trainerId; }
  setTrainerId(id: string): void { this.trainerId = id; }

  // Nuzlocke tracking
  getNuzlockeEncountered(): string[] { return this.nuzlockeEncountered; }
  hasNuzlockeEncountered(routeKey: string): boolean { return this.nuzlockeEncountered.includes(routeKey); }
  markNuzlockeEncountered(routeKey: string): void {
    if (!this.nuzlockeEncountered.includes(routeKey)) this.nuzlockeEncountered.push(routeKey);
  }

  // PC Boxes
  getBoxes(): PokemonInstance[][] { return this.boxes; }
  getBox(index: number): PokemonInstance[] { return this.boxes[index] ?? []; }
  getBoxNames(): string[] { return this.boxNames; }
  setBoxName(index: number, name: string): void { if (index >= 0 && index < 12) this.boxNames[index] = name; }

  /** Deposit a Pokémon into a specific box slot. Returns true on success. */
  depositPokemon(boxIndex: number, pokemon: PokemonInstance): boolean {
    const box = this.boxes[boxIndex];
    if (!box || box.length >= 30) return false;
    box.push(pokemon);
    return true;
  }

  /** Withdraw a Pokémon from a box. Returns the Pokémon or null. */
  withdrawPokemon(boxIndex: number, slotIndex: number): PokemonInstance | null {
    const box = this.boxes[boxIndex];
    if (!box || slotIndex < 0 || slotIndex >= box.length) return null;
    return box.splice(slotIndex, 1)[0];
  }

  /** Auto-deposit: find first box with space and deposit. Returns true on success. */
  autoDeposit(pokemon: PokemonInstance): boolean {
    for (let i = 0; i < this.boxes.length; i++) {
      if (this.boxes[i].length < 30) {
        this.boxes[i].push(pokemon);
        return true;
      }
    }
    return false; // all boxes full
  }

  /** Remove a Pokémon from the party by index (PC withdraw/deposit). */
  removeFromParty(index: number): PokemonInstance | null {
    if (index < 0 || index >= this.party.length || this.party.length <= 1) return null;
    return this.party.splice(index, 1)[0];
  }

  // Settings
  getSettings(): Record<string, string | number | boolean> { return this.settings; }
  getSetting(key: string): string | number | boolean | undefined { return this.settings[key]; }
  setSetting(key: string, value: string | number | boolean): void { this.settings[key] = value; }

  // Game Stats
  getGameStats(): GameStats { return this.gameStats; }
  incrementStat(key: keyof GameStats, amount = 1): void {
    this.gameStats[key] += amount;
  }
  getStat(key: keyof GameStats): number { return this.gameStats[key]; }

  // Hall of Fame
  getHallOfFame(): HallOfFameEntry[] { return this.hallOfFame; }
  addHallOfFameEntry(): void {
    this.hallOfFame.push({
      timestamp: Date.now(),
      playerName: this.playerName,
      playtime: this.playtime,
      party: this.party.map(p => ({
        pokemonId: p.dataId,
        level: p.level,
        nickname: p.nickname,
      })),
    });
  }

  // Visited Maps
  hasVisitedMap(mapKey: string): boolean { return this.visitedMaps.has(mapKey); }
  markMapVisited(mapKey: string): void { this.visitedMaps.add(mapKey); }

  // Berry Plots (NEW-003)
  getBerryPlots(): Record<string, unknown[]> { return this.berryPlots; }
  setBerryPlots(plots: Record<string, unknown[]>): void { this.berryPlots = plots; }

  // Game Clock (BUG-058)
  getGameClockMinutes(): number { return this.gameClockMinutes; }
  setGameClockMinutes(minutes: number): void { this.gameClockMinutes = minutes; }

  /** Serialize state for saving. */
  serialize() {
    return {
      party: this.party,
      bag: this.bag,
      money: this.money,
      badges: this.badges,
      flags: this.flags,
      trainersDefeated: this.trainersDefeated,
      pokedex: this.getPokedex(),
      playerName: this.playerName,
      playerGender: this.playerGender,
      playtime: this.playtime,
      currentMap: this.currentMap,
      playerPosition: this.playerPosition,
      boxes: this.boxes,
      boxNames: this.boxNames,
      settings: this.settings,
      difficulty: this.difficulty,
      trainerId: this.trainerId,
      nuzlockeEncountered: this.nuzlockeEncountered,
      gameStats: this.gameStats,
      hallOfFame: this.hallOfFame,
      visitedMaps: [...this.visitedMaps],
      berryPlots: this.berryPlots,
      gameClockMinutes: this.gameClockMinutes,
    };
  }

  /** Restore state from save data. */
  deserialize(data: ReturnType<GameManager['serialize']>): void {
    this.party = data.party;
    this.bag = data.bag;
    this.money = data.money;
    this.badges = data.badges;
    this.flags = data.flags;
    this.trainersDefeated = data.trainersDefeated;
    this.pokedex.seen = new Set(data.pokedex.seen);
    this.pokedex.caught = new Set(data.pokedex.caught);
    this.playerName = data.playerName;
    if (data.playerGender) this.playerGender = data.playerGender;
    this.playtime = data.playtime;
    this.currentMap = data.currentMap;
    this.playerPosition = data.playerPosition;
    if (data.boxes) this.boxes = data.boxes;
    if (data.boxNames) this.boxNames = data.boxNames;
    if (data.settings) this.settings = { ...this.settings, ...data.settings };
    if (data.difficulty) this.difficulty = data.difficulty as DifficultyMode;
    if (data.trainerId) this.trainerId = data.trainerId;
    if (data.nuzlockeEncountered) this.nuzlockeEncountered = data.nuzlockeEncountered;
    if (data.gameStats) this.gameStats = { ...defaultStats(), ...data.gameStats };
    if (data.hallOfFame) this.hallOfFame = data.hallOfFame;
    if (data.visitedMaps) this.visitedMaps = new Set(data.visitedMaps);
    if (data.berryPlots) this.berryPlots = data.berryPlots;
    if (data.gameClockMinutes != null) this.gameClockMinutes = data.gameClockMinutes;
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
  }): void {
    this.party = save.player.party;
    this.bag = save.player.bag;
    this.money = save.player.money;
    this.badges = save.player.badges;
    this.flags = save.flags;
    this.trainersDefeated = save.trainersDefeated;
    this.pokedex.seen = new Set(save.player.pokedex.seen);
    this.pokedex.caught = new Set(save.player.pokedex.caught);
    this.playerName = save.player.name;
    if (save.player.gender) this.playerGender = save.player.gender;
    this.playtime = save.player.playtime;
    this.currentMap = save.player.position.mapKey;
    this.playerPosition = {
      x: save.player.position.x,
      y: save.player.position.y,
      direction: save.player.position.direction,
    };
    if (save.boxes) this.boxes = save.boxes;
    if (save.difficulty) this.difficulty = save.difficulty as DifficultyMode;
    if (save.nuzlockeEncountered) this.nuzlockeEncountered = save.nuzlockeEncountered;
    if (save.gameStats) this.gameStats = { ...defaultStats(), ...save.gameStats };
    if (save.hallOfFame) this.hallOfFame = save.hallOfFame as typeof this.hallOfFame;
    if (save.visitedMaps) this.visitedMaps = new Set(save.visitedMaps);
  }
}
