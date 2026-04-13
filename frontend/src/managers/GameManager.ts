import { PokemonInstance } from '@data/interfaces';

/** Central game state: party, badges, playtime, flags. */
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
  private playtime = 0;
  private currentMap = 'pallet-town';
  private playerPosition = { x: 7, y: 10, direction: 'down' as string };

  private constructor() {}

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  // Party
  getParty(): PokemonInstance[] { return this.party; }
  setParty(party: PokemonInstance[]): void { this.party = party; }
  addToParty(pokemon: PokemonInstance): boolean {
    if (this.party.length >= 6) return false;
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
  addMoney(amount: number): void { this.money += amount; }
  spendMoney(amount: number): boolean {
    if (this.money < amount) return false;
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

  // Position & Map
  getCurrentMap(): string { return this.currentMap; }
  setCurrentMap(map: string): void { this.currentMap = map; }
  getPlayerPosition(): { x: number; y: number; direction: string } { return this.playerPosition; }
  setPlayerPosition(pos: { x: number; y: number; direction: string }): void { this.playerPosition = pos; }
  getPlayerName(): string { return this.playerName; }
  setPlayerName(name: string): void { this.playerName = name; }
  getPlaytime(): number { return this.playtime; }
  addPlaytime(seconds: number): void { this.playtime += seconds; }

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
      playtime: this.playtime,
      currentMap: this.currentMap,
      playerPosition: this.playerPosition,
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
    this.playtime = data.playtime;
    this.currentMap = data.currentMap;
    this.playerPosition = data.playerPosition;
  }

  /** Restore state from a SaveData object (from localStorage). */
  loadFromSave(save: {
    player: {
      name: string;
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
    this.playtime = save.player.playtime;
    this.currentMap = save.player.position.mapKey;
    this.playerPosition = {
      x: save.player.position.x,
      y: save.player.position.y,
      direction: save.player.position.direction,
    };
  }
}
