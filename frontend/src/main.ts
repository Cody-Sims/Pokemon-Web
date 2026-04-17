import Phaser from 'phaser';
import { gameConfig } from '@config/game-config';

const game = new Phaser.Game(gameConfig);

// ── Orientation lock (works in fullscreen / installed PWA) ──
function tryLockOrientation(): void {
  try {
    const orientation = screen.orientation;
    if (orientation?.lock) {
      orientation.lock('landscape').catch(() => {
        // lock() only works in fullscreen or installed PWA — expected to fail otherwise
      });
    }
  } catch {
    // screen.orientation not supported
  }
}

// Attempt lock on first user interaction (browsers require a gesture)
function onFirstInteraction(): void {
  tryLockOrientation();

  // Also request fullscreen on mobile to maximise viewport
  if (navigator.maxTouchPoints > 0) {
    const el = document.documentElement;
    const rfs = el.requestFullscreen ?? (el as unknown as Record<string, () => Promise<void>>).webkitRequestFullscreen;
    if (rfs) {
      rfs.call(el).then(() => tryLockOrientation()).catch(() => {});
    }
  }

  document.removeEventListener('pointerdown', onFirstInteraction);
}
document.addEventListener('pointerdown', onFirstInteraction, { once: true });

// ── Portrait orientation prompt ──
function updateOrientationPrompt(): void {
  const overlay = document.getElementById('rotate-prompt');
  if (!overlay) return;
  const isPortrait = window.innerHeight > window.innerWidth;
  const isMobile = navigator.maxTouchPoints > 0;
  overlay.style.display = isMobile && isPortrait ? 'flex' : 'none';
}

window.addEventListener('resize', updateOrientationPrompt);
window.addEventListener('orientationchange', updateOrientationPrompt);
// Initial check after a tick (canvas may not be laid out yet)
requestAnimationFrame(updateOrientationPrompt);
