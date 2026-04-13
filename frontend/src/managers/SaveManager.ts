import { SaveData } from '@data/interfaces';
import { GameManager } from './GameManager';

const SAVE_KEY = 'pokemon-web-save';
const SAVE_VERSION = 1;

/** Serialize/deserialize game state to localStorage. */
export class SaveManager {
  private static instance: SaveManager;

  private constructor() {}

  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  save(): void {
    const gm = GameManager.getInstance();
    const data: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: {
        name: gm.getPlayerName(),
        position: {
          mapKey: gm.getCurrentMap(),
          ...gm.getPlayerPosition(),
        },
        party: gm.getParty(),
        bag: gm.getBag(),
        money: gm.getMoney(),
        badges: gm.getBadges(),
        pokedex: gm.getPokedex(),
        playtime: gm.getPlaytime(),
      },
      flags: gm.getFlags(),
      trainersDefeated: gm.getTrainersDefeated(),
      boxes: gm.getBoxes(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
