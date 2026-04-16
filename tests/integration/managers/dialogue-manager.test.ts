import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DialogueManager } from '../../../frontend/src/managers/DialogueManager';

describe('DialogueManager', () => {
  let dm: DialogueManager;

  beforeEach(() => {
    // @ts-expect-error private access for test reset
    DialogueManager.instance = undefined;
    dm = DialogueManager.getInstance();
  });

  it('should be a singleton', () => {
    expect(DialogueManager.getInstance()).toBe(dm);
  });

  it('should start with empty queue', () => {
    expect(dm.getQueue()).toEqual([]);
  });

  it('should set dialogue queue', () => {
    dm.setDialogue(['Hello!', 'How are you?']);
    expect(dm.getQueue()).toEqual(['Hello!', 'How are you?']);
  });

  it('should replace existing queue', () => {
    dm.setDialogue(['Line 1']);
    dm.setDialogue(['Line A', 'Line B']);
    expect(dm.getQueue()).toEqual(['Line A', 'Line B']);
  });

  it('should clear queue', () => {
    dm.setDialogue(['Line 1', 'Line 2']);
    dm.clear();
    expect(dm.getQueue()).toEqual([]);
  });

  it('should copy input array (no shared reference)', () => {
    const lines = ['Hello', 'World'];
    dm.setDialogue(lines);
    lines.push('Extra');
    expect(dm.getQueue()).toEqual(['Hello', 'World']); // Original not modified
  });

  it('should handle empty array', () => {
    dm.setDialogue([]);
    expect(dm.getQueue()).toEqual([]);
  });

  it('should handle single line', () => {
    dm.setDialogue(['Solo line']);
    expect(dm.getQueue()).toHaveLength(1);
  });

  it('should handle many lines', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i}`);
    dm.setDialogue(lines);
    expect(dm.getQueue()).toHaveLength(50);
  });
});
