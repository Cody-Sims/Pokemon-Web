// ─── Resize-safe layout utility ───
// Wraps a layout callback so it runs on create and re-runs on every
// resize / orientation change, cleaning up automatically on scene shutdown.

/**
 * Run `fn` immediately for initial layout, then re-run it whenever the
 * Phaser scale manager fires a `resize` event (orientation change, address
 * bar toggle, browser resize, etc.).  Automatically unsubscribes when the
 * scene shuts down.
 */
export function layoutOn(scene: Phaser.Scene, fn: () => void): void {
  fn(); // initial layout
  const handler = () => fn();
  scene.scale.on('resize', handler);
  scene.events.once('shutdown', () => scene.scale.off('resize', handler));
}
