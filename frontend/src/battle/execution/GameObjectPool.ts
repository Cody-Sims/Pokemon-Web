import Phaser from 'phaser';

/**
 * A simple pool of Phaser Image game objects to reduce allocation churn
 * during battle animations.
 */
export class GameObjectPool {
  private pool: Phaser.GameObjects.Image[] = [];
  private scene: Phaser.Scene;
  private textureKey: string;

  constructor(scene: Phaser.Scene, textureKey: string, initialSize = 20) {
    this.scene = scene;
    this.textureKey = textureKey;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createObject());
    }
  }

  private createObject(): Phaser.GameObjects.Image {
    const obj = this.scene.add.image(0, 0, this.textureKey);
    obj.setVisible(false);
    obj.setActive(false);
    return obj;
  }

  acquire(x: number, y: number): Phaser.GameObjects.Image {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createObject();
    }
    obj.setPosition(x, y);
    obj.setVisible(true);
    obj.setActive(true);
    obj.setAlpha(1);
    obj.setScale(1);
    obj.setTint(0xffffff);
    obj.setAngle(0);
    return obj;
  }

  release(obj: Phaser.GameObjects.Image): void {
    obj.setVisible(false);
    obj.setActive(false);
    this.pool.push(obj);
  }

  destroy(): void {
    for (const obj of this.pool) {
      obj.destroy();
    }
    this.pool = [];
  }
}
