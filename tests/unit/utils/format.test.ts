import { describe, expect, it } from 'vitest';
import {
  capitalize,
  formatClockTime,
  formatDexNumber,
  formatMoney,
  formatPlaytime,
  formatTime,
  padNumber,
  titleCase,
} from '@utils/format';

describe('format utilities', () => {
  it('capitalizes display labels without altering the rest of the string', () => {
    expect(capitalize('hardy')).toBe('Hardy');
    expect(capitalize('mR. mime')).toBe('MR. mime');
    expect(capitalize('')).toBe('');
  });

  it('title-cases hyphen, underscore, and whitespace separated names', () => {
    expect(titleCase('thunder-punch')).toBe('Thunder Punch');
    expect(titleCase('  heart_scale  ')).toBe('Heart Scale');
    expect(titleCase('FIRE   STONE')).toBe('Fire Stone');
  });

  it('pads finite integers and treats invalid display numbers as zero', () => {
    expect(padNumber(7, 3)).toBe('007');
    expect(padNumber(-7, 3)).toBe('-007');
    expect(padNumber(7.9, 2)).toBe('07');
    expect(padNumber(Number.NaN, 2)).toBe('00');
  });

  it('formats dex numbers and money using existing display conventions', () => {
    expect(formatDexNumber(25)).toBe('#025');
    expect(formatMoney(123456)).toBe('₽ 123,456');
    expect(formatMoney(5000, { space: false, useGrouping: false })).toBe('₽5000');
    expect(formatMoney(Number.NaN)).toBe('₽ 0');
  });

  it('formats battle and speedrun clocks with automatic hours', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(65, 'always')).toBe('0:01:05');
    expect(formatTime(-10)).toBe('0:00');
  });

  it('formats clock minutes and playtime variants used by menus', () => {
    expect(formatClockTime(75)).toBe('01:15');
    expect(formatClockTime(24 * 60 + 5)).toBe('00:05');
    expect(formatPlaytime(3661)).toBe('1:01:01');
    expect(formatPlaytime(3661, 'hours-minutes')).toBe('1h 1m');
    expect(formatPlaytime(3661, 'trainer-card')).toBe('01:01');
  });
});
