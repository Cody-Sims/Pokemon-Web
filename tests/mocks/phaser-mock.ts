import { vi } from 'vitest';

export const createMockScene = () => ({
  add: { text: vi.fn(), image: vi.fn(), sprite: vi.fn(), rectangle: vi.fn() },
  cameras: { main: { fadeIn: vi.fn(), fadeOut: vi.fn() } },
  input: { keyboard: { addKeys: vi.fn(), on: vi.fn() } },
  scene: { start: vi.fn(), launch: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn() },
  time: { delayedCall: vi.fn(), addEvent: vi.fn() },
  tweens: { add: vi.fn() },
  sound: { add: vi.fn(), play: vi.fn() },
  load: { image: vi.fn(), spritesheet: vi.fn(), audio: vi.fn(), tilemapTiledJSON: vi.fn() },
  sys: { events: { on: vi.fn(), emit: vi.fn() } },
});
