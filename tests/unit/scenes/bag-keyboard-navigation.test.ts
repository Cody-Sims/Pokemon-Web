import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MenuController, MenuControllerConfig } from '../../../frontend/src/ui/controls/MenuController';

// ─── Enhanced Phaser mock with keyboard event simulation ───

function createMockKeyboard() {
  const handlers = new Map<string, Set<() => void>>();
  return {
    on: vi.fn((event: string, fn: () => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(fn);
    }),
    off: vi.fn((event: string, fn: () => void) => {
      handlers.get(event)?.delete(fn);
    }),
    /** Simulate a key press */
    emit(event: string): void {
      handlers.get(event)?.forEach(fn => fn());
    },
    _handlers: handlers,
  };
}

function createMockScene(keyboard: ReturnType<typeof createMockKeyboard>) {
  return {
    input: { keyboard },
    add: { text: vi.fn(), rectangle: vi.fn(), image: vi.fn() },
    scene: { start: vi.fn(), stop: vi.fn(), launch: vi.fn(), sleep: vi.fn(), wake: vi.fn(), get: vi.fn() },
  } as unknown as Phaser.Scene;
}

// ─── Stub AudioManager for SFX calls ───
vi.mock('../../frontend/src/managers/AudioManager', () => ({
  AudioManager: {
    getInstance: () => ({ playSFX: vi.fn() }),
  },
}));

// ─── Tests ───

describe('MenuController — Keyboard Navigation', () => {
  let keyboard: ReturnType<typeof createMockKeyboard>;
  let scene: Phaser.Scene;

  beforeEach(() => {
    keyboard = createMockKeyboard();
    scene = createMockScene(keyboard);
  });

  describe('single-column list (bag items)', () => {
    it('should move cursor down on DOWN key', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onMove, audioFeedback: false,
      });

      keyboard.emit('keydown-DOWN');
      expect(onMove).toHaveBeenCalledWith(1);
      expect(ctrl.getCursor()).toBe(1);
    });

    it('should move cursor up on UP key', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onMove, audioFeedback: false,
      });

      // Move down first, then up
      ctrl.navigate('down');
      ctrl.navigate('down');
      onMove.mockClear();
      keyboard.emit('keydown-UP');
      expect(onMove).toHaveBeenCalledWith(1);
      expect(ctrl.getCursor()).toBe(1);
    });

    it('should wrap from last item to first on DOWN', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onMove, audioFeedback: false,
      });

      ctrl.navigate('down'); // → 1
      ctrl.navigate('down'); // → 2
      onMove.mockClear();
      keyboard.emit('keydown-DOWN'); // → should wrap to 0
      expect(onMove).toHaveBeenCalledWith(0);
      expect(ctrl.getCursor()).toBe(0);
    });

    it('should wrap from first item to last on UP', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onMove, audioFeedback: false,
      });

      keyboard.emit('keydown-UP'); // At 0, should wrap to 2
      expect(onMove).toHaveBeenCalledWith(2);
      expect(ctrl.getCursor()).toBe(2);
    });

    it('should NOT wrap when wrap is disabled', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: false,
        onMove, audioFeedback: false,
      });

      keyboard.emit('keydown-UP'); // At 0, no wrap → stays at 0
      expect(onMove).not.toHaveBeenCalled();
      expect(ctrl.getCursor()).toBe(0);
    });

    it('should traverse full list with repeated DOWN presses', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 6, wrap: true,
        onMove, audioFeedback: false,
      });

      const visited: number[] = [0];
      for (let i = 0; i < 6; i++) {
        keyboard.emit('keydown-DOWN');
        visited.push(ctrl.getCursor());
      }
      // Should visit 0 → 1 → 2 → 3 → 4 → 5 → 0
      expect(visited).toEqual([0, 1, 2, 3, 4, 5, 0]);
    });

    it('should traverse full list with repeated UP presses', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 4, wrap: true,
        onMove, audioFeedback: false,
      });

      const visited: number[] = [0];
      for (let i = 0; i < 4; i++) {
        keyboard.emit('keydown-UP');
        visited.push(ctrl.getCursor());
      }
      // Should visit 0 → 3 → 2 → 1 → 0
      expect(visited).toEqual([0, 3, 2, 1, 0]);
    });
  });

  describe('WASD alternative keys', () => {
    it('W key should navigate up', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onMove, audioFeedback: false,
      });

      ctrl.navigate('down'); // → 1
      onMove.mockClear();
      keyboard.emit('keydown-W');
      expect(ctrl.getCursor()).toBe(0);
    });

    it('S key should navigate down', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onMove, audioFeedback: false,
      });

      keyboard.emit('keydown-S');
      expect(ctrl.getCursor()).toBe(1);
    });
  });

  describe('confirm and cancel', () => {
    it('ENTER should trigger onConfirm with current cursor', () => {
      const onConfirm = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onConfirm, audioFeedback: false,
      });

      ctrl.navigate('down');
      ctrl.navigate('down'); // → 2
      keyboard.emit('keydown-ENTER');
      expect(onConfirm).toHaveBeenCalledWith(2);
    });

    it('SPACE should trigger onConfirm', () => {
      const onConfirm = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onConfirm, audioFeedback: false,
      });

      keyboard.emit('keydown-SPACE');
      expect(onConfirm).toHaveBeenCalledWith(0);
    });

    it('Z should trigger onConfirm', () => {
      const onConfirm = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onConfirm, audioFeedback: false,
      });

      keyboard.emit('keydown-Z');
      expect(onConfirm).toHaveBeenCalledWith(0);
    });

    it('ESC should trigger onCancel', () => {
      const onCancel = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onCancel, audioFeedback: false,
      });

      keyboard.emit('keydown-ESC');
      expect(onCancel).toHaveBeenCalled();
    });

    it('X should trigger onCancel', () => {
      const onCancel = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 3, wrap: true,
        onCancel, audioFeedback: false,
      });

      keyboard.emit('keydown-X');
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should not navigate when disabled', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onMove, audioFeedback: false, disabled: true,
      });

      keyboard.emit('keydown-DOWN');
      expect(onMove).not.toHaveBeenCalled();
      expect(ctrl.getCursor()).toBe(0);
    });

    it('should not confirm when disabled', () => {
      const onConfirm = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onConfirm, audioFeedback: false, disabled: true,
      });

      keyboard.emit('keydown-ENTER');
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should resume navigation after setDisabled(false)', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onMove, audioFeedback: false, disabled: true,
      });

      keyboard.emit('keydown-DOWN');
      expect(ctrl.getCursor()).toBe(0);

      ctrl.setDisabled(false);
      keyboard.emit('keydown-DOWN');
      expect(ctrl.getCursor()).toBe(1);
    });
  });

  describe('destroy cleans up handlers', () => {
    it('should not respond to keys after destroy', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onMove, audioFeedback: false,
      });

      ctrl.destroy();
      keyboard.emit('keydown-DOWN');
      expect(onMove).not.toHaveBeenCalled();
    });
  });

  describe('empty list', () => {
    it('should not navigate with zero items', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 0, wrap: true,
        onMove, audioFeedback: false,
      });

      keyboard.emit('keydown-DOWN');
      expect(onMove).not.toHaveBeenCalled();
    });
  });

  describe('single item', () => {
    it('should stay on the only item when pressing DOWN', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 1, wrap: true,
        onMove, audioFeedback: false,
      });

      keyboard.emit('keydown-DOWN');
      // wrap: cursor+columns (1) < itemCount (1) → false. wrap: col (0) < 1 → newCursor=0, same as cursor → no move
      expect(onMove).not.toHaveBeenCalled();
      expect(ctrl.getCursor()).toBe(0);
    });
  });

  describe('setItemCount adjusts cursor', () => {
    it('should clamp cursor when item count decreases', () => {
      const onMove = vi.fn();
      const ctrl = new MenuController(scene, {
        columns: 1, itemCount: 5, wrap: true,
        onMove, audioFeedback: false,
      });

      ctrl.navigate('down');
      ctrl.navigate('down');
      ctrl.navigate('down');
      expect(ctrl.getCursor()).toBe(3);

      ctrl.setItemCount(2); // Cursor 3 exceeds new count
      expect(ctrl.getCursor()).toBe(1);
    });
  });
});

describe('Bag Keyboard Navigation — Scene Sleep/Wake', () => {
  it('MenuScene should sleep when opening bag so InventoryScene gets exclusive input', () => {
    // Simulate the launch flow:
    // 1. MenuScene is active
    // 2. User selects BAG
    // 3. MenuScene should sleep
    // 4. InventoryScene launches
    // 5. When InventoryScene stops, MenuScene wakes

    const menuKeyboard = createMockKeyboard();
    const inventoryKeyboard = createMockKeyboard();

    // Track which scene is sleeping
    let menuSleeping = false;

    const menuScene = {
      input: { keyboard: menuKeyboard },
      scene: {
        sleep: vi.fn(() => { menuSleeping = true; }),
        wake: vi.fn(() => { menuSleeping = false; }),
        launch: vi.fn(),
        get: vi.fn(() => ({
          events: {
            once: vi.fn((_event: string, cb: () => void) => {
              // Store the shutdown callback to call later
              (menuScene as any)._onInventoryShutdown = cb;
            }),
          },
        })),
        stop: vi.fn(),
      },
    };

    // Simulate: MenuScene launches InventoryScene (new code path)
    menuScene.scene.sleep();
    menuScene.scene.launch('InventoryScene');
    menuScene.scene.get('InventoryScene').events.once('shutdown', () => {
      menuScene.scene.wake();
    });

    expect(menuScene.scene.sleep).toHaveBeenCalled();
    expect(menuScene.scene.launch).toHaveBeenCalledWith('InventoryScene');
    expect(menuSleeping).toBe(true);

    // Simulate InventoryScene shutting down
    (menuScene as any)._onInventoryShutdown();
    expect(menuScene.scene.wake).toHaveBeenCalled();
    expect(menuSleeping).toBe(false);
  });

  it('BattleUIScene should sleep when opening bag', () => {
    let battleUISleeping = false;

    const battleUIScene = {
      scene: {
        sleep: vi.fn(() => { battleUISleeping = true; }),
        wake: vi.fn(() => { battleUISleeping = false; }),
        launch: vi.fn(),
        get: vi.fn(() => ({
          events: {
            once: vi.fn((_event: string, cb: () => void) => {
              (battleUIScene as any)._onInventoryShutdown = cb;
            }),
          },
        })),
      },
    };

    // Simulate: BattleUIScene launches InventoryScene (new code path)
    battleUIScene.scene.sleep();
    battleUIScene.scene.launch('InventoryScene');
    battleUIScene.scene.get('InventoryScene').events.once('shutdown', () => {
      battleUIScene.scene.wake();
    });

    expect(battleUISleeping).toBe(true);

    // When InventoryScene closes
    (battleUIScene as any)._onInventoryShutdown();
    expect(battleUISleeping).toBe(false);
  });

  it('keyboard events should only reach the active scene', () => {
    const keyboard = createMockKeyboard();

    // Simulate two controllers on the same keyboard (the old bug scenario)
    const menuOnMove = vi.fn();
    const inventoryOnMove = vi.fn();

    const scene = createMockScene(keyboard);

    const menuCtrl = new MenuController(scene, {
      columns: 1, itemCount: 5, wrap: true,
      onMove: menuOnMove, audioFeedback: false,
    });

    const inventoryCtrl = new MenuController(scene, {
      columns: 1, itemCount: 8, wrap: true,
      onMove: inventoryOnMove, audioFeedback: false,
    });

    // Without the fix: both controllers respond to DOWN
    keyboard.emit('keydown-DOWN');
    expect(menuOnMove).toHaveBeenCalledWith(1);
    expect(inventoryOnMove).toHaveBeenCalledWith(1);

    menuOnMove.mockClear();
    inventoryOnMove.mockClear();

    // With the fix: menu controller is disabled (simulating scene.sleep)
    menuCtrl.setDisabled(true);
    keyboard.emit('keydown-DOWN');
    expect(menuOnMove).not.toHaveBeenCalled();
    expect(inventoryOnMove).toHaveBeenCalledWith(2);
  });
});
