import { NPC } from '@entities/NPC';
import { Trainer } from '@entities/Trainer';
import { GameManager } from '@managers/GameManager';
import { NPCBehaviorController } from '@systems/overworld/NPCBehavior';
import { trainerData } from '@data/trainer-data';
import { SOLID_TILES } from '@data/maps';
import type { MapDefinition, NpcSpawn } from '@data/maps';
import { TILE_SIZE } from '@utils/constants';

export interface SpawnedNPCs {
  npcs: NPC[];
  behaviors: NPCBehaviorController[];
}

/** Spawn all flag-gated NPCs from the map definition. */
export function spawnNPCs(
  scene: Phaser.Scene,
  mapDef: MapDefinition,
  player: { x: number; y: number },
  existingNpcs: NPC[],
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
    const npc = new NPC(
      scene, def.tileX, def.tileY,
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
