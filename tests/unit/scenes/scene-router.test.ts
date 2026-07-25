import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { REGISTERED_SCENE_KEYS, SceneKey } from '../../../frontend/src/scenes/scene-keys';
import { SceneRouter } from '../../../frontend/src/scenes/SceneRouter';

describe('scene keys', () => {
  it('covers every registered scene in game config', () => {
    const configSource = readFileSync('frontend/src/config/game-config.ts', 'utf8');
    const sceneBlock = configSource.split('scene: [')[1]?.split('],')[0] ?? '';
    const registered = [...sceneBlock.matchAll(/\b(\w+Scene)\b/g)].map(match => match[1]);
    expect(REGISTERED_SCENE_KEYS).toHaveLength(registered.length);
    expect(new Set(REGISTERED_SCENE_KEYS)).toEqual(new Set(registered));
    expect(new Set(REGISTERED_SCENE_KEYS)).toEqual(new Set(registered));
  });
});

describe('SceneRouter', () => {
  it('forwards typed scene operations to the Phaser scene plugin', () => {
    const plugin = {
      start: vi.fn(),
      launch: vi.fn(),
      stop: vi.fn(),
      sleep: vi.fn(),
      wake: vi.fn(),
      resume: vi.fn(),
      pause: vi.fn(),
      get: vi.fn(() => ({ scene: { key: SceneKey.Overworld } })),
      isActive: vi.fn(() => true),
      isSleeping: vi.fn(() => false),
    };
    const router = new SceneRouter(plugin);

    router.start(SceneKey.Overworld, { resume: true });
    router.launch(SceneKey.Settings, { returnScene: SceneKey.Title });
    router.stop(SceneKey.Menu);
    router.sleep(SceneKey.Overworld);
    router.wake(SceneKey.Overworld);
    router.pause(SceneKey.BattleUI);
    router.resume(SceneKey.BattleUI);
    router.get(SceneKey.Overworld);

    expect(plugin.start).toHaveBeenCalledWith(SceneKey.Overworld, { resume: true });
    expect(plugin.launch).toHaveBeenCalledWith(SceneKey.Settings, { returnScene: SceneKey.Title });
    expect(plugin.stop).toHaveBeenCalledWith(SceneKey.Menu);
    expect(plugin.sleep).toHaveBeenCalledWith(SceneKey.Overworld);
    expect(plugin.wake).toHaveBeenCalledWith(SceneKey.Overworld);
    expect(plugin.pause).toHaveBeenCalledWith(SceneKey.BattleUI);
    expect(plugin.resume).toHaveBeenCalledWith(SceneKey.BattleUI);
    expect(plugin.get).toHaveBeenCalledWith(SceneKey.Overworld);
  });
});
