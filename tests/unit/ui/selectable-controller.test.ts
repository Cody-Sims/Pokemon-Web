import { describe, expect, it, vi } from 'vitest';
import { SelectableController } from '@ui/controls/SelectableController';

describe('SelectableController', () => {
  it('wraps one-dimensional list navigation by default', () => {
    const controller = new SelectableController({ itemCount: 3 });

    controller.navigate('up');
    expect(controller.getCursor()).toBe(2);

    controller.navigate('down');
    expect(controller.getCursor()).toBe(0);
  });

  it('clamps at list edges when wrap is disabled', () => {
    const controller = new SelectableController({ itemCount: 3, wrap: false });

    expect(controller.navigate('up')).toBe(false);
    expect(controller.getCursor()).toBe(0);

    controller.setCursor(2);
    expect(controller.navigate('down')).toBe(false);
    expect(controller.getCursor()).toBe(2);
  });

  it('moves through a two-dimensional grid', () => {
    const moves: number[] = [];
    const controller = new SelectableController({
      itemCount: 4,
      columns: 2,
      wrap: false,
      onMove: (index) => moves.push(index),
    });

    controller.navigate('right');
    expect(controller.getCursor()).toBe(1);
    controller.navigate('down');
    expect(controller.getCursor()).toBe(3);
    controller.navigate('left');
    expect(controller.getCursor()).toBe(2);
    controller.navigate('up');
    expect(controller.getCursor()).toBe(0);
    expect(moves).toEqual([1, 3, 2, 0]);
  });

  it('wraps independently by axis for ragged grids', () => {
    const controller = new SelectableController({
      itemCount: 5,
      columns: 2,
      wrap: { horizontal: false, vertical: true },
      initialIndex: 1,
    });

    controller.navigate('down');
    expect(controller.getCursor()).toBe(3);
    controller.navigate('down');
    expect(controller.getCursor()).toBe(4);
    controller.navigate('down');
    expect(controller.getCursor()).toBe(0);

    expect(controller.navigate('left')).toBe(false);
    expect(controller.getCursor()).toBe(0);
  });

  it('skips disabled entries during navigation and selection', () => {
    const confirmed = vi.fn();
    const controller = new SelectableController({
      itemCount: 5,
      disabledIndices: [1, 3],
      onConfirm: confirmed,
    });

    controller.navigate('down');
    expect(controller.getCursor()).toBe(2);
    expect(controller.setCursor(3)).toBe(false);
    expect(controller.hoverIndex(1)).toBe(false);
    expect(controller.clickIndex(1)).toBe(false);
    expect(confirmed).not.toHaveBeenCalled();

    expect(controller.clickIndex(4)).toBe(true);
    expect(controller.getCursor()).toBe(4);
    expect(confirmed).toHaveBeenCalledWith(4);
  });

  it('skips disabled cells in a two-dimensional column', () => {
    const controller = new SelectableController({
      itemCount: 6,
      columns: 2,
      disabledIndices: [2],
      wrap: false,
    });

    controller.navigate('down');
    expect(controller.getCursor()).toBe(4);
  });

  it('keeps the cursor inside a scroll window and reports range changes', () => {
    const ranges: Array<[number, number]> = [];
    const controller = new SelectableController({
      itemCount: 10,
      visibleCount: 5,
      onWindowChange: (range) => ranges.push([range.start, range.end]),
    });

    for (let step = 0; step < 5; step++) controller.navigate('down');
    expect(controller.getCursor()).toBe(5);
    expect(controller.getWindowRange()).toEqual({ start: 1, end: 6, size: 5 });

    controller.setCursor(0);
    expect(controller.getWindowRange()).toEqual({ start: 0, end: 5, size: 5 });
    controller.setWindowStart(99);
    expect(controller.getWindowStart()).toBe(5);
    expect(ranges).toContainEqual([1, 6]);
    expect(ranges).toContainEqual([0, 5]);
  });

  it('fires confirm, cancel, and sound hooks only when enabled', () => {
    const confirm = vi.fn();
    const cancel = vi.fn();
    const moveSound = vi.fn();
    const confirmSound = vi.fn();
    const cancelSound = vi.fn();
    const controller = new SelectableController({
      itemCount: 2,
      onConfirm: confirm,
      onCancel: cancel,
      sounds: { move: moveSound, confirm: confirmSound, cancel: cancelSound },
    });

    controller.navigate('down');
    controller.confirm();
    controller.cancel();
    expect(moveSound).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(1);
    expect(confirmSound).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancelSound).toHaveBeenCalledTimes(1);

    controller.setDisabled(true);
    expect(controller.navigate('up')).toBe(false);
    expect(controller.confirm()).toBe(false);
    expect(controller.cancel()).toBe(false);
  });
});
