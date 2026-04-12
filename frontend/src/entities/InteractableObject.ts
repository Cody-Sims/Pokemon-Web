import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';

/** Signs, PCs, item balls, doors — anything the player can interact with. */
export class InteractableObject extends Phaser.GameObjects.Sprite {
  public objectId: string;
  public interactionType: 'sign' | 'pc' | 'item' | 'door';
  private onInteract: () => void;

  constructor(
    scene: Phaser.Scene,
    tileX: number,
    tileY: number,
    textureKey: string,
    objectId: string,
    interactionType: 'sign' | 'pc' | 'item' | 'door',
    onInteract: () => void
  ) {
    super(scene, tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, textureKey);
    scene.add.existing(this);
    this.objectId = objectId;
    this.interactionType = interactionType;
    this.onInteract = onInteract;
  }

  interact(): void {
    this.onInteract();
  }
}
