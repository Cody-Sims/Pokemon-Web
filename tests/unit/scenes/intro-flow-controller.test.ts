import { describe, expect, it } from 'vitest';
import {
  IntroFlowController,
  canAppendNameCharacter,
  normalizePlayerName,
  sanitizeNameInput,
} from '@scenes/title/IntroFlowController';

describe('IntroFlowController', () => {
  it('advances from intro slides to naming and from confirmation to done', () => {
    const flow = new IntroFlowController();

    expect(flow.advance(2)).toBe('slide');
    expect(flow.getState().slideIndex).toBe(1);
    expect(flow.advance(2)).toBe('naming');
    expect(flow.getState().phase).toBe('naming');

    flow.setNameInput('Leaf');
    flow.confirmName();
    flow.confirmAppearance();
    expect(flow.advance(2)).toBe('done');
    expect(flow.getState().phase).toBe('done');
  });

  it('sanitizes player names and enforces max length before appending characters', () => {
    expect(sanitizeNameInput('A$sh! Ketchum-999')).toBe('Ash Ketchum-');
    expect(canAppendNameCharacter('Red', 'é')).toBe(false);
    expect(canAppendNameCharacter('Red', '-')).toBe(true);
    expect(canAppendNameCharacter('123456789012', '3')).toBe(false);
    expect(normalizePlayerName('   ')).toBe('Red');
  });

  it('keeps name editing pure and normalizes the confirmed player name', () => {
    const flow = new IntroFlowController({ difficulty: 'hard', challengeModes: ['monotype'] });

    expect(flow.appendNameCharacter('A')).toBe('A');
    expect(flow.appendNameCharacter('$')).toBe('A');
    expect(flow.appendNameCharacter('b')).toBe('Ab');
    expect(flow.backspaceName()).toBe('A');
    expect(flow.setNameInput('  Blue  ')).toBe('  Blue  ');
    expect(flow.confirmName()).toBe('Blue');

    const state = flow.getState();
    expect(state).toMatchObject({
      phase: 'appearance',
      playerName: 'Blue',
      difficulty: 'hard',
      challengeModes: ['monotype'],
    });
  });

  it('records the selected appearance before confirmation', () => {
    const flow = new IntroFlowController();

    flow.confirmName();
    flow.selectAppearance('girl');

    expect(flow.confirmAppearance()).toBe('girl');
    expect(flow.getState()).toMatchObject({ phase: 'confirm', appearance: 'girl' });
  });
});
