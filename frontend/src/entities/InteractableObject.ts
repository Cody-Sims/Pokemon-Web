import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';
import type { ObjectSpawn, ObjectType } from '@data/maps';

/** Signs, PCs, item balls, doors — anything the player can interact with that is NOT an NPC. */
export class InteractableObject extends Phaser.GameObjects.Sprite {
  public objectId: string;
  public objectType: ObjectType;
  public dialogue: string[];
  public spawnDef?: ObjectSpawn;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    textureKey: string,
    objectId: string,
    objectType: ObjectType,
    dialogue: string[],
  ) {
    super(scene, tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, textureKey);
    scene.add.existing(this);
    this.objectId = objectId;
    this.objectType = objectType;
    this.dialogue = dialogue;
  }
}
