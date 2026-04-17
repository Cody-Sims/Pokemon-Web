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
      rfs.call(el).then(() => tryLockOrientation()).catch(() => {
        // Fullscreen API not supported (e.g. iOS Safari) — use scroll trick
        collapseIOSSafariChrome();
      });
    } else {
      // No fullscreen API at all (iOS Safari) — use scroll trick
      collapseIOSSafariChrome();
    }
  }

  document.removeEventListener('pointerdown', onFirstInteraction);
}
document.addEventListener('pointerdown', onFirstInteraction, { once: true });

// ── iOS Safari chrome collapse ──
// iOS Safari hides the address/tab bar when the page scrolls.
// Temporarily allow scrolling, scroll by 1px, then lock scrolling again.
function collapseIOSSafariChrome(): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  const html = document.documentElement;
  const body = document.body;

  // Temporarily make body scrollable
  html.style.overflow = 'auto';
  body.style.overflow = 'auto';
  body.style.position = 'relative';
  body.style.height = 'calc(100vh + 1px)';

  // Scroll to collapse the chrome
  requestAnimationFrame(() => {
    window.scrollTo(0, 1);
    // Re-lock scrolling after the chrome collapses
    setTimeout(() => {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.height = '100dvh';
      // Trigger Phaser resize to use reclaimed space
      game.scale.refresh();
    }, 300);
  });
}

// Re-collapse iOS Safari chrome after orientation change
window.addEventListener('orientationchange', () => {
  setTimeout(collapseIOSSafariChrome, 500);
});

// ── iOS "Add to Home Screen" install prompt ──
function showIOSInstallPrompt(): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Only show in Safari (not in standalone/PWA mode)
  const isStandalone = ('standalone' in navigator && (navigator as unknown as Record<string, boolean>).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
  if (!isIOS || isStandalone) return;

  // Check if user already dismissed
  const dismissed = localStorage.getItem('ios-install-dismissed');
  if (dismissed) return;

  const banner = document.getElementById('ios-install-prompt');
  if (!banner) return;
  banner.style.display = 'flex';

  const dismissBtn = document.getElementById('ios-install-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      localStorage.setItem('ios-install-dismissed', '1');
    });
  }
}

// Show after a short delay so it doesn't compete with the rotate prompt
setTimeout(showIOSInstallPrompt, 3000);

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
