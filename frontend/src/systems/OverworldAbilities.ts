import { GameManager } from '@managers/GameManager';
import { PokemonInstance } from '@data/interfaces';

export type FieldAbility = 'cut' | 'surf' | 'strength' | 'flash' | 'fly' | 'rock-smash';

export interface FieldAbilityConfig {
  moveId: string;
  badgeRequired: number;
  description: string;
}

export const FIELD_ABILITIES: Record<FieldAbility, FieldAbilityConfig> = {
  'cut':        { moveId: 'cut',        badgeRequired: 1, description: 'Cut down small trees' },
  'surf':       { moveId: 'surf',       badgeRequired: 3, description: 'Travel across water' },
  'strength':   { moveId: 'strength',   badgeRequired: 4, description: 'Push heavy boulders' },
  'flash':      { moveId: 'flash',      badgeRequired: 2, description: 'Light up dark caves' },
  'fly':        { moveId: 'fly',        badgeRequired: 5, description: 'Fly to visited towns' },
  'rock-smash': { moveId: 'rock-smash', badgeRequired: 1, description: 'Smash cracked rocks' },
};

export class OverworldAbilities {
  /** Check if player can use a field ability (has Pokemon with move + enough badges). */
  static canUse(ability: FieldAbility): boolean {
    const config = FIELD_ABILITIES[ability];
    const gm = GameManager.getInstance();
    if (gm.getBadges().length < config.badgeRequired) return false;
    return this.getUser(ability) !== null;
  }

  /** Get the first Pokemon in party that knows the required move. */
  static getUser(ability: FieldAbility): PokemonInstance | null {
    const config = FIELD_ABILITIES[ability];
    const party = GameManager.getInstance().getParty();
    for (const pokemon of party) {
      if (pokemon.currentHp <= 0) continue;
      if (pokemon.moves.some(m => m.moveId === config.moveId)) {
        return pokemon;
      }
    }
    return null;
  }

  /** Get list of available field abilities based on current party and badges. */
  static getAvailable(): FieldAbility[] {
    return (Object.keys(FIELD_ABILITIES) as FieldAbility[]).filter(a => this.canUse(a));
  }
}
