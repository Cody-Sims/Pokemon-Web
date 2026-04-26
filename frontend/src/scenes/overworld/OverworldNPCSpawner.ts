import { NPC } from '@entities/NPC';
import { Trainer } from '@entities/Trainer';
import { InteractableObject } from '@entities/InteractableObject';
import { GameManager } from '@managers/GameManager';
import { NPCBehaviorController } from '@systems/overworld/NPCBehavior';
import { trainerData } from '@data/trainer-data';
import { SOLID_TILES } from '@data/maps';
import type { MapDefinition, NpcSpawn, ObjectSpawn } from '@data/maps';
import { TILE_SIZE } from '@utils/constants';
import type { TimePeriod } from '@systems/engine/GameClock';

export interface SpawnedNPCs {
  npcs: NPC[];
  behaviors: NPCBehaviorController[];
}

/** Spawn all flag-gated NPCs from the map definition, applying time-based schedules. */
export function spawnNPCs(
  scene: Phaser.Scene,
  mapDef: MapDefinition,
  player: { x: number; y: number },
  existingNpcs: NPC[],
  timePeriod?: TimePeriod,
): SpawnedNPCs {
  const gm = GameManager.getInstance();
  const npcs: NPC[] = [];
  const behaviors: NPCBehaviorController[] = [];

  for (const def of mapDef.npcs) {
    if (def.requireFlag) {
      const negate = def.requireFlag.startsWith('!');
      const flagName = negate ? def.requireFlag.slice(1) : def.requireFlag;
      const flagVal = gm.getFlag(flagName);
      if (negate ? flagVal : !flagVal) continue;
    }

    // Apply time-based schedule: skip NPC if hidden, or override position
    let spawnX = def.tileX;
    let spawnY = def.tileY;
    if (def.schedule && timePeriod) {
      const entry = def.schedule[timePeriod];
      if (entry === 'hidden') continue;
      if (entry) {
        spawnX = entry.x;
        spawnY = entry.y;
      }
    }

    const npc = new NPC(
      scene, spawnX, spawnY,
      def.textureKey, def.id, def.dialogue, def.facing,
    );
    npc.setScale(2);
    npc.setDepth(1);
    (npc as NPC & { spawnDef?: NpcSpawn }).spawnDef = def;
    npcs.push(npc);

    if (def.behavior && def.behavior.type !== 'stationary') {
      const mapW = mapDef.width;
      const mapH = mapDef.height;
      const controller = new NPCBehaviorController(scene, npc, def.behavior, (tx, ty) => {
        if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) return true;
        if (SOLID_TILES.has(mapDef.ground[ty][tx])) return true;
        const pTX = Math.floor(player.x / TILE_SIZE);
        const pTY = Math.floor(player.y / TILE_SIZE);
        if (pTX === tx && pTY === ty) return true;
        for (const other of existingNpcs) {
          if (other === npc) continue;
          const oTX = Math.floor(other.x / TILE_SIZE);
          const oTY = Math.floor(other.y / TILE_SIZE);
          if (oTX === tx && oTY === ty) return true;
        }
        return false;
      });
      behaviors.push(controller);
    }
  }

  return { npcs, behaviors };
}

/** Spawn trainers for the map. */
export function spawnTrainers(
  scene: Phaser.Scene,
  mapDef: MapDefinition,
): Trainer[] {
  const gm = GameManager.getInstance();
  const trainers: Trainer[] = [];

  for (const def of mapDef.trainers) {
    if (gm.isTrainerDefeated(def.trainerId)) continue;
    const tData = trainerData[def.trainerId];
    const trainer = new Trainer(
      scene, def.tileX, def.tileY,
      def.textureKey, def.id, def.trainerId,
      tData?.dialogue?.before ?? ['...'],
      def.facing, def.lineOfSight,
    );
    trainer.setScale(2);
    trainer.setDepth(1);
    trainer.mapGround = mapDef.ground;
    trainers.push(trainer);
  }

  return trainers;
}

/** Spawn all flag-gated interactable objects (signs, item balls, etc.) from the map definition. */
export function spawnObjects(
  scene: Phaser.Scene,
  mapDef: MapDefinition,
): InteractableObject[] {
  const gm = GameManager.getInstance();
  const objects: InteractableObject[] = [];

  for (const def of mapDef.objects) {
    if (def.requireFlag) {
      const negate = def.requireFlag.startsWith('!');
      const flagName = negate ? def.requireFlag.slice(1) : def.requireFlag;
      const flagVal = gm.getFlag(flagName);
      if (negate ? flagVal : !flagVal) continue;
    }
    const obj = new InteractableObject(
      scene, def.tileX, def.tileY,
      def.textureKey, def.id, def.objectType, def.dialogue,
    );
    obj.setScale(2);
    obj.setDepth(1);
    obj.spawnDef = def;
    objects.push(obj);
  }

  return objects;
}

/**
 * Apply NPC schedules when the time period changes.
 * Repositions scheduled NPCs or hides/shows them as needed.
 * Returns true if any NPC was added or removed (requiring a full respawn).
 */
export function applyNpcSchedules(
  npcs: NPC[],
  mapDef: MapDefinition,
  timePeriod: TimePeriod,
): boolean {
  let needsRespawn = false;

  for (const def of mapDef.npcs) {
    if (!def.schedule) continue;

    const entry = def.schedule[timePeriod];
    const existing = npcs.find(n => n.npcId === def.id);

    if (entry === 'hidden') {
      // NPC should be hidden this period — if it exists, we need a respawn
      if (existing) {
        needsRespawn = true;
      }
    } else if (entry) {
      // NPC should be at a specific position
      if (existing) {
        existing.setPosition(entry.x * TILE_SIZE + TILE_SIZE / 2, entry.y * TILE_SIZE + TILE_SIZE / 2);
      } else {
        // NPC was hidden last period but should now appear — need respawn
        needsRespawn = true;
      }
    } else {
      // No schedule entry for this period — use default position
      if (existing) {
        existing.setPosition(def.tileX * TILE_SIZE + TILE_SIZE / 2, def.tileY * TILE_SIZE + TILE_SIZE / 2);
      } else {
        // Was hidden, now should show at default — need respawn
        needsRespawn = true;
      }
    }
  }

  return needsRespawn;
}
