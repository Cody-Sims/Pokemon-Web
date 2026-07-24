import type { Direction } from '@utils/type-helpers';

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
