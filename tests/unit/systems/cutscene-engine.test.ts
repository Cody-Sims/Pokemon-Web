import { describe, it, expect, vi } from 'vitest';
import { CutsceneEngine, type CutsceneDialogueLauncher } from '../../../frontend/src/systems/engine/CutsceneEngine';

describe('CutsceneEngine dialogue launching', () => {
  it('uses an injected dialogue launcher instead of requiring a scene-layer import', async () => {
    const launcher: CutsceneDialogueLauncher = {
      showDialogue: vi.fn().mockResolvedValue(undefined),
    };
    const engine = new CutsceneEngine({} as Phaser.Scene, launcher);

    await engine.play({
      id: 'test-cutscene',
      actions: [{ type: 'dialogue', lines: ['Hello'], speaker: 'Guide' }],
    });

    expect(launcher.showDialogue).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lines: ['Hello'], speaker: 'Guide' }),
    );
  });
});
