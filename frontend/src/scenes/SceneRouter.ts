import type Phaser from 'phaser';
import { TransitionManager } from '@managers/TransitionManager';
import type { SceneDataArgs } from './scene-data';
import type { SceneKeyName } from './scene-keys';

type ScenePluginLike = Pick<
  Phaser.Scenes.ScenePlugin,
  'get' | 'start' | 'launch' | 'stop' | 'sleep' | 'wake' | 'resume' | 'pause' | 'isActive' | 'isSleeping'
>;

type SceneHost = Phaser.Scene | ScenePluginLike;

function isSceneHost(host: SceneHost): host is Phaser.Scene {
  const maybeScene = (host as { scene?: Partial<ScenePluginLike> }).scene;
  return typeof maybeScene?.start === 'function'
    && typeof maybeScene.launch === 'function';
}

export class SceneRouter {
  private readonly plugin: ScenePluginLike;
  private readonly owner?: Phaser.Scene;

  constructor(host: SceneHost) {
    this.plugin = isSceneHost(host) ? host.scene : host;
    this.owner = isSceneHost(host) ? host : undefined;
  }

  static for(host: SceneHost): SceneRouter {
    return new SceneRouter(host);
  }

  start<K extends SceneKeyName>(key: K, ...[data]: SceneDataArgs<K>): void {
    this.plugin.start(key, data);
  }

  transitionTo<K extends SceneKeyName>(key: K, ...[data]: SceneDataArgs<K>): void {
    if (!this.owner) {
      this.plugin.start(key, data);
      return;
    }
    TransitionManager.getInstance().fadeTransition(this.owner, () => {
      this.plugin.start(key, data);
    });
  }

  launch<K extends SceneKeyName>(key: K, ...[data]: SceneDataArgs<K>): void {
    this.plugin.launch(key, data);
  }

  stop(): void;
  stop(key: SceneKeyName): void;
  stop(key?: SceneKeyName): void {
    this.plugin.stop(key);
  }

  sleep(): void;
  sleep(key: SceneKeyName): void;
  sleep(key?: SceneKeyName): void {
    this.plugin.sleep(key);
  }

  wake(): void;
  wake(key: SceneKeyName): void;
  wake(key?: SceneKeyName): void {
    this.plugin.wake(key);
  }

  resume(): void;
  resume(key: SceneKeyName): void;
  resume(key?: SceneKeyName): void {
    this.plugin.resume(key);
  }

  pause(): void;
  pause(key: SceneKeyName): void;
  pause(key?: SceneKeyName): void {
    this.plugin.pause(key);
  }

  get<K extends SceneKeyName>(key: K): Phaser.Scene {
    return this.plugin.get(key);
  }

  isActive(key: SceneKeyName): boolean {
    return this.plugin.isActive(key);
  }

  isSleeping(key: SceneKeyName): boolean {
    return this.plugin.isSleeping(key);
  }
}
