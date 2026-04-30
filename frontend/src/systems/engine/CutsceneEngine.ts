import Phaser from 'phaser';
import { Direction } from '@utils/type-helpers';
import { TILE_SIZE, WALK_DURATION } from '@utils/constants';
import { EmoteBubble, EmoteType } from '@systems/rendering/EmoteBubble';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { EventManager } from '@managers/EventManager';
import { SaveManager } from '@managers/SaveManager';

// ─── CutsceneAction union type ──────────────────────────────

export type CutsceneAction =
  | { type: 'dialogue'; speaker?: string; portraitKey?: string; lines: string[] }
  | { type: 'moveCameraTo'; x: number; y: number; duration?: number }
  | { type: 'moveNPC'; npcId: string; direction: Direction; tiles: number; speed?: number }
  | { type: 'faceNPC'; npcId: string; direction: Direction }
  | { type: 'facePlayer'; direction: Direction }
  | { type: 'wait'; ms: number }
  | { type: 'fadeToBlack'; duration?: number }
  | { type: 'fadeFromBlack'; duration?: number }
  | { type: 'flashScreen'; color?: number; duration?: number }
  | { type: 'playBGM'; key: string }
  | { type: 'playSFX'; key: string }
  | { type: 'screenShake'; intensity?: number; duration?: number }
  | { type: 'showEmote'; targetId: string; emote: string }
  | { type: 'setFlag'; flag: string; value?: boolean }
  | { type: 'parallel'; actions: CutsceneAction[] }
  | { type: 'movePlayer'; direction: Direction; tiles: number };

export interface CutsceneDefinition {
  id: string;
  actions: CutsceneAction[];
}

// ─── Minimal interface so CutsceneEngine doesn't depend on the concrete OverworldScene class ───

export interface CutsceneSceneAccess {
  npcs: { npcId: string; x: number; y: number; faceDirection(dir: Direction): void; playWalkAnim(duration: number): void; stopWalkAnim(): void; setFrame(frame: string): void; setFlipX(flip: boolean): void; texture: { key: string } }[];
  player: {
    x: number; y: number;
    gridMovement: {
      getFacing(): Direction;
      move(direction: Direction): boolean;
      getIsMoving(): boolean;
    };
    play(key: string, ignoreIfPlaying?: boolean): Phaser.GameObjects.Sprite;
    setFlipX(flip: boolean): Phaser.GameObjects.Sprite;
  };
}

// ─── CutsceneEngine ─────────────────────────────────────────

export class CutsceneEngine {
  private scene: Phaser.Scene;
  private running = false;
  private sceneAccess: CutsceneSceneAccess | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Provide access to NPCs and the player from the overworld scene. */
  setSceneAccess(access: CutsceneSceneAccess): void {
    this.sceneAccess = access;
  }

  /** Play a cutscene. Returns a Promise that resolves when complete. */
  async play(cutscene: CutsceneDefinition): Promise<void> {
    if (this.running) return;
    this.running = true;
    // MED-22: Block saves during cutscenes
    SaveManager.blockSaves();
    // HIGH-14: Block player input during cutscene
    if (this.sceneAccess) {
      this.scene.input?.keyboard?.resetKeys();
      if (this.scene.input) this.scene.input.enabled = false;
    }
    try {
      for (const action of cutscene.actions) {
        await this.executeAction(action);
      }
    } catch (err) {
      console.warn(`CutsceneEngine: playback of '${cutscene.id}' failed, resuming overworld:`, err);
      // Ensure the overworld scene resumes if it was paused by a dialogue action
      try {
        if (!this.scene.scene.isActive()) {
          this.scene.scene.resume(this.scene.scene.key);
        }
      } catch { /* scene may already be stopped */ }
    } finally {
      this.running = false;
      // MED-22: Unblock saves after cutscene completes
      SaveManager.unblockSaves();
      // HIGH-14: Re-enable player input after cutscene
      if (this.sceneAccess && this.scene.input) {
        this.scene.input.enabled = true;
      }
    }
  }

  /** Check if a cutscene is currently running. */
  isRunning(): boolean {
    return this.running;
  }

  /** Execute a single action. */
  private async executeAction(action: CutsceneAction): Promise<void> {
    try {
      switch (action.type) {
        case 'dialogue':      return this.execDialogue(action);
        case 'moveCameraTo':  return this.execMoveCameraTo(action);
        case 'moveNPC':       return this.execMoveNPC(action);
        case 'faceNPC':       return this.execFaceNPC(action);
        case 'facePlayer':    return this.execFacePlayer(action);
        case 'wait':          return this.execWait(action);
        case 'fadeToBlack':   return this.execFadeToBlack(action);
        case 'fadeFromBlack': return this.execFadeFromBlack(action);
        case 'flashScreen':   return this.execFlashScreen(action);
        case 'playBGM':       return this.execPlayBGM(action);
        case 'playSFX':       return this.execPlaySFX(action);
        case 'screenShake':   return this.execScreenShake(action);
        case 'showEmote':     return this.execShowEmote(action);
        case 'setFlag':       return this.execSetFlag(action);
        case 'parallel':      return this.execParallel(action);
        case 'movePlayer':    return this.execMovePlayer(action);
      }
    } catch (err) {
      console.warn(`CutsceneEngine: action '${action.type}' failed:`, err);
    }
  }

  // ── Action implementations ──────────────────────────────

  private execDialogue(action: { speaker?: string; portraitKey?: string; lines: string[] }): Promise<void> {
    return new Promise<void>((resolve) => {
      this.scene.scene.pause();
      this.scene.scene.launch('DialogueScene', {
        dialogue: action.lines,
        speaker: action.speaker,
        portraitKey: action.portraitKey,
      });
      this.scene.scene.get('DialogueScene').events.once('shutdown', () => {
        this.scene.scene.resume(this.scene.scene.key);
        resolve();
      });
    });
  }

  private execMoveCameraTo(action: { x: number; y: number; duration?: number }): Promise<void> {
    return new Promise<void>((resolve) => {
      const duration = action.duration ?? 1000;
      const cam = this.scene.cameras.main;
      cam.pan(action.x, action.y, duration, 'Sine.easeInOut', false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) resolve();
      });
    });
  }

  private async execMoveNPC(action: { npcId: string; direction: Direction; tiles: number; speed?: number }): Promise<void> {
    const npc = this.findNPC(action.npcId);
    if (!npc) return;

    const speed = action.speed ?? WALK_DURATION;
    const dx = action.direction === 'left' ? -1 : action.direction === 'right' ? 1 : 0;
    const dy = action.direction === 'up' ? -1 : action.direction === 'down' ? 1 : 0;

    for (let i = 0; i < action.tiles; i++) {
      const targetX = npc.x + dx * TILE_SIZE;
      const targetY = npc.y + dy * TILE_SIZE;
      npc.faceDirection(action.direction);
      npc.playWalkAnim(speed);
      await this.tweenTo(npc as unknown as Phaser.GameObjects.Sprite, targetX, targetY, speed);
    }
    npc.stopWalkAnim();
  }

  private execFaceNPC(action: { npcId: string; direction: Direction }): Promise<void> {
    const npc = this.findNPC(action.npcId);
    if (npc) npc.faceDirection(action.direction);
    return Promise.resolve();
  }

  private execFacePlayer(action: { direction: Direction }): Promise<void> {
    if (!this.sceneAccess) return Promise.resolve();
    const player = this.sceneAccess.player;
    const dir = action.direction;
    const animDir = dir === 'right' ? 'left' : dir;
    const prefix = GameManager.getInstance().getPlayerGender() === 'girl' ? 'player-girl-' : 'player-';
    player.play(`${prefix}idle-${animDir}`);
    player.setFlipX(dir === 'right');
    return Promise.resolve();
  }

  private execWait(action: { ms: number }): Promise<void> {
    return new Promise<void>((resolve) => {
      this.scene.time.delayedCall(action.ms, resolve);
    });
  }

  private execFadeToBlack(action: { duration?: number }): Promise<void> {
    return new Promise<void>((resolve) => {
      const duration = action.duration ?? 500;
      const cam = this.scene.cameras.main;
      cam.fade(duration, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) resolve();
      });
    });
  }

  private execFadeFromBlack(action: { duration?: number }): Promise<void> {
    return new Promise<void>((resolve) => {
      const duration = action.duration ?? 500;
      const cam = this.scene.cameras.main;
      cam.fadeIn(duration, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) resolve();
      });
    });
  }

  private execFlashScreen(action: { color?: number; duration?: number }): Promise<void> {
    return new Promise<void>((resolve) => {
      const duration = action.duration ?? 300;
      const color = action.color ?? 0xffffff;
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      const cam = this.scene.cameras.main;
      cam.flash(duration, r, g, b, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) resolve();
      });
    });
  }

  private execPlayBGM(action: { key: string }): Promise<void> {
    AudioManager.getInstance().playBGM(action.key);
    return Promise.resolve();
  }

  private execPlaySFX(action: { key: string }): Promise<void> {
    AudioManager.getInstance().playSFX(action.key);
    return Promise.resolve();
  }

  private execScreenShake(action: { intensity?: number; duration?: number }): Promise<void> {
    return new Promise<void>((resolve) => {
      const duration = action.duration ?? 300;
      const intensity = action.intensity ?? 0.01;
      const cam = this.scene.cameras.main;
      cam.shake(duration, intensity, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) resolve();
      });
    });
  }

  private execShowEmote(action: { targetId: string; emote: string }): Promise<void> {
    const sprite = this.findSpriteById(action.targetId);
    if (sprite) {
      EmoteBubble.show(this.scene, sprite, action.emote as EmoteType);
    }
    return Promise.resolve();
  }

  private execSetFlag(action: { flag: string; value?: boolean }): Promise<void> {
    GameManager.getInstance().setFlag(action.flag, action.value ?? true);
    EventManager.getInstance().emit('flag-set', action.flag);
    return Promise.resolve();
  }

  private async execParallel(action: { actions: CutsceneAction[] }): Promise<void> {
    // WARNING: Parallel actions that mutate game state (setFlag, givePokemon)
    // may race with movement actions. Keep state-mutating actions sequential.
    await Promise.all(action.actions.map(a => this.executeAction(a)));
  }

  private async execMovePlayer(action: { direction: Direction; tiles: number }): Promise<void> {
    if (!this.sceneAccess) return;
    const player = this.sceneAccess.player;

    for (let i = 0; i < action.tiles; i++) {
      const moved = player.gridMovement.move(action.direction);
      if (!moved) break;
      // Wait for movement to complete
      await this.waitForPlayerMove(player);
    }
  }

  // ── Helpers ─────────────────────────────────────────────

  private findNPC(npcId: string) {
    if (!this.sceneAccess) return null;
    return this.sceneAccess.npcs.find(n => n.npcId === npcId) ?? null;
  }

  private findSpriteById(id: string): Phaser.GameObjects.Sprite | null {
    if (!this.sceneAccess) return null;
    if (id === 'player') {
      return this.sceneAccess.player as unknown as Phaser.GameObjects.Sprite;
    }
    return (this.sceneAccess.npcs.find(n => n.npcId === id) as unknown as Phaser.GameObjects.Sprite) ?? null;
  }

  private tweenTo(target: Phaser.GameObjects.Sprite, x: number, y: number, duration: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.scene.tweens.add({
        targets: target,
        x, y,
        duration,
        onComplete: () => resolve(),
      });
    });
  }

  private waitForPlayerMove(player: CutsceneSceneAccess['player']): Promise<void> {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (!player.gridMovement.getIsMoving()) {
          resolve();
        } else {
          this.scene.time.delayedCall(16, check);
        }
      };
      // Start checking after a brief delay to let the move begin
      this.scene.time.delayedCall(16, check);
    });
  }
}
