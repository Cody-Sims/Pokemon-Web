import { PokemonInstance } from '@data/interfaces';

/**
 * Manages the player's Pokémon party and PC box storage.
 * Extracted from GameManager to separate party/box concerns.
 */
export class PartyManager {
  private party: PokemonInstance[] = [];
  private boxes: PokemonInstance[][] = Array.from({ length: 12 }, () => []);
  private boxNames: string[] = Array.from({ length: 12 }, (_, i) => `Box ${i + 1}`);

  /** Reset all party and box state for a new game. */
  reset(): void {
    this.party = [];
    this.boxes = Array.from({ length: 12 }, () => []);
    this.boxNames = Array.from({ length: 12 }, (_, i) => `Box ${i + 1}`);
  }

  // ── Party ──────────────────────────────────────────────

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

  /** Remove a Pokémon from the party by index (PC withdraw/deposit). */
  removeFromParty(index: number): PokemonInstance | null {
    if (index < 0 || index >= this.party.length || this.party.length <= 1) return null;
    return this.party.splice(index, 1)[0];
  }

  /** Adjust friendship for a party Pokémon by index. Clamps to [0, 255]. */
  adjustFriendship(pokemonIndex: number, amount: number): void {
    const p = this.party[pokemonIndex];
    if (p) {
      p.friendship = Math.max(0, Math.min(255, p.friendship + amount));
    }
  }

  // ── PC Boxes ───────────────────────────────────────────

  getBoxes(): PokemonInstance[][] { return this.boxes.map(box => [...box]); }
  getBox(index: number): PokemonInstance[] { return this.boxes[index] ?? []; }
  getBoxNames(): string[] { return [...this.boxNames]; }
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

  /** MED-44: Swap two party members by index with bounds validation. */
  swapPartyMembers(indexA: number, indexB: number): void {
    if (indexA < 0 || indexA >= this.party.length || indexB < 0 || indexB >= this.party.length) return;
    const temp = this.party[indexA];
    this.party[indexA] = this.party[indexB];
    this.party[indexB] = temp;
  }

  // ── Serialization helpers ──────────────────────────────

  serialize() {
    return {
      party: this.party,
      boxes: this.boxes,
      boxNames: this.boxNames,
    };
  }

  deserialize(data: { party: PokemonInstance[]; boxes?: PokemonInstance[][]; boxNames?: string[] }): void {
    // Shallow-clone each instance so the runtime party holds fresh objects
    // rather than the raw JSON-parsed graph. This prevents mutations from
    // leaking back into the save data and ensures future class-based
    // PokemonInstance fields (Maps, Sets, methods) can be reconstructed.
    this.party = data.party.map(p => ({ ...p, moves: p.moves.map(m => ({ ...m })) }));
    if (data.boxes) this.boxes = data.boxes.map(box => box.map(p => ({ ...p, moves: p.moves.map(m => ({ ...m })) })));
    if (data.boxNames) this.boxNames = [...data.boxNames];
  }
}
