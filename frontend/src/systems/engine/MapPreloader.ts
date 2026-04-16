import Phaser from 'phaser';
import { mapRegistry, MapDefinition } from '@data/maps';
import { encounterTables, fishingTables } from '@data/encounter-tables';
import { pokemonData } from '@data/pokemon';
import { trainerData } from '@data/trainer-data';
import { GameManager } from '@managers/GameManager';

/** Distance (Manhattan) at which to start preloading a warp target's assets. */
const PROXIMITY_TILES = 8;

/**
 * Proximity-based asset preloader for map transitions.
 *
 * Instead of loading every Pokémon sprite at boot, this system loads
 * front/back sprites on demand: eagerly for the current map and lazily
 * for adjacent maps as the player approaches a warp tile.
 */
export class MapPreloader {
  /** Maps whose front/back sprites are fully loaded. */
  private static loadedMaps = new Set<string>();
  /** Maps currently being loaded (to avoid duplicate queues). */
  private static pendingMaps = new Set<string>();

  // ── Helpers ──────────────────────────────────────────────

  /** Collect every Pokémon ID that can appear on a given map. */
  static getMapPokemonIds(mapKey: string): Set<number> {
    const ids = new Set<number>();
    const mapDef = mapRegistry[mapKey];
    if (!mapDef) return ids;

    // Wild encounters
    const table = encounterTables[mapDef.encounterTableKey];
    if (table) {
      for (const entry of table) ids.add(entry.pokemonId);
    }

    // Fishing encounters
    const fishTable = fishingTables[mapKey];
    if (fishTable) {
      for (const entries of Object.values(fishTable)) {
        if (entries) for (const entry of entries) ids.add(entry.pokemonId);
      }
    }

    // Trainer party Pokémon
    for (const t of mapDef.trainers) {
      const td = trainerData[t.trainerId];
      if (td) for (const p of td.party) ids.add(p.pokemonId);
    }

    return ids;
  }

  /** Queue front + back sprites for Pokémon IDs not yet in the texture cache. */
  private static queueSprites(scene: Phaser.Scene, ids: Set<number>): boolean {
    let queued = false;
    for (const id of ids) {
      const data = pokemonData[id];
      if (!data) continue;
      const name = data.name.toLowerCase();

      if (!scene.textures.exists(data.spriteKeys.front)) {
        scene.load.image(data.spriteKeys.front, `assets/sprites/pokemon/${name}-front.png`);
        queued = true;
      }
      if (!scene.textures.exists(data.spriteKeys.back)) {
        scene.load.image(data.spriteKeys.back, `assets/sprites/pokemon/${name}-back.png`);
        queued = true;
      }
    }
    return queued;
  }

  // ── Public API ───────────────────────────────────────────

  /**
   * Ensure front/back sprites for the current map's encounters + trainers
   * AND the player's party are loaded.  Starts the loader and resolves once
   * all queued assets have finished.  Safe to call multiple times.
   */
  static ensureMapReady(scene: Phaser.Scene, mapKey: string): Promise<void> {
    const ids = this.getMapPokemonIds(mapKey);

    // Also include the player's party so MenuScene / BattleScene never stalls.
    const party = GameManager.getInstance().getParty();
    for (const p of party) ids.add(p.dataId);

    const queued = this.queueSprites(scene, ids);
    this.loadedMaps.add(mapKey);

    if (!queued) return Promise.resolve();

    return new Promise<void>(resolve => {
      scene.load.once('complete', () => resolve());
      scene.load.start();
    });
  }

  /**
   * Fire-and-forget background preload for every map reachable from the
   * current map's warps.
   */
  static preloadAdjacentMaps(scene: Phaser.Scene, mapKey: string): void {
    const mapDef = mapRegistry[mapKey];
    if (!mapDef) return;

    const adjacentKeys = new Set<string>();
    for (const warp of mapDef.warps) adjacentKeys.add(warp.targetMap);

    let anyQueued = false;
    for (const adjKey of adjacentKeys) {
      if (this.loadedMaps.has(adjKey) || this.pendingMaps.has(adjKey)) continue;
      this.pendingMaps.add(adjKey);

      const ids = this.getMapPokemonIds(adjKey);
      if (this.queueSprites(scene, ids)) anyQueued = true;
    }

    if (!anyQueued) {
      // Nothing new to load – mark them done immediately.
      for (const k of adjacentKeys) {
        this.pendingMaps.delete(k);
        this.loadedMaps.add(k);
      }
      return;
    }

    scene.load.once('complete', () => {
      for (const k of adjacentKeys) {
        this.pendingMaps.delete(k);
        this.loadedMaps.add(k);
      }
    });
    scene.load.start();
  }

  /**
   * Called every player step.  When the player is within {@link PROXIMITY_TILES}
   * of a warp tile, preload that destination's assets in the background.
   */
  static checkProximity(
    scene: Phaser.Scene,
    mapDef: MapDefinition,
    playerTX: number,
    playerTY: number,
  ): void {
    for (const warp of mapDef.warps) {
      const dist = Math.abs(warp.tileX - playerTX) + Math.abs(warp.tileY - playerTY);
      if (dist > PROXIMITY_TILES) continue;

      const targetKey = warp.targetMap;
      if (this.loadedMaps.has(targetKey) || this.pendingMaps.has(targetKey)) continue;

      this.pendingMaps.add(targetKey);
      const ids = this.getMapPokemonIds(targetKey);
      const queued = this.queueSprites(scene, ids);

      if (queued) {
        scene.load.once('complete', () => {
          this.loadedMaps.add(targetKey);
          this.pendingMaps.delete(targetKey);
        });
        scene.load.start();
      } else {
        this.loadedMaps.add(targetKey);
        this.pendingMaps.delete(targetKey);
      }
    }
  }

  /**
   * Ensure the player's current party sprites are loaded (called before
   * battles or when opening the party screen).
   */
  static ensurePartyReady(scene: Phaser.Scene): boolean {
    const ids = new Set<number>();
    for (const p of GameManager.getInstance().getParty()) ids.add(p.dataId);

    const queued = this.queueSprites(scene, ids);
    if (queued) scene.load.start();
    return queued;
  }

  /** Reset internal tracking (useful in tests). */
  static reset(): void {
    this.loadedMaps.clear();
    this.pendingMaps.clear();
  }
}
