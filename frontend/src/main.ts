import Phaser from 'phaser';
import { gameConfig } from '@config/game-config';
import { resetSafeAreaCache } from '@utils/safe-area';
import { syncAccessibilitySettings } from '@utils/accessibility';
import { computeGameWidth, GAME_HEIGHT } from '@utils/constants';
import { AudioManager } from '@managers/AudioManager';

const game = new Phaser.Game(gameConfig);

// ── Sync accessibility settings from saved preferences on boot ──
try {
  const raw = localStorage.getItem('pokemon-web-settings');
  if (raw) {
    const settings = JSON.parse(raw);
    syncAccessibilitySettings({
      textScale: settings.textScale,
      reducedMotion: settings.reducedMotion,
      colorblindMode: settings.colorblindMode,
    });
    // Apply saved colorblind filter to canvas once it exists
    if (settings.colorblindMode && settings.colorblindMode !== 'off') {
      game.events.once('ready', () => {
        const filterMap: Record<string, string> = {
          protanopia: 'url(#protanopia-filter)',
          deuteranopia: 'url(#deuteranopia-filter)',
        };
        game.canvas.style.filter = filterMap[settings.colorblindMode] ?? 'none';
      });
    }
  }
  // Restore mute state for desktop mute button
  if (localStorage.getItem('pokemon-web-muted') === '1') {
    AudioManager.getInstance().setMuted(true);
  }
} catch { /* no saved settings yet */ }

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
  resetSafeAreaCache();
  setTimeout(collapseIOSSafariChrome, 500);
});

// ── Dynamic game resize — fill the viewport after orientation or resize changes ──
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
function handleViewportResize(): void {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const newWidth = computeGameWidth();
    const current = game.scale.gameSize;
    if (current.width !== newWidth || current.height !== GAME_HEIGHT) {
      game.scale.resize(newWidth, GAME_HEIGHT);
    }
    game.scale.refresh();
  }, 150);
}
window.addEventListener('resize', handleViewportResize);
window.addEventListener('orientationchange', () => {
  // Delay a bit longer for orientation — the viewport needs time to settle
  setTimeout(handleViewportResize, 400);
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

// ── Tab visibility — pause non-essential work when backgrounded ──
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.loop.sleep();
  } else {
    game.loop.wake();
    game.scale.refresh();
  }
});

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

// ── PWA install prompt ──
let deferredInstallPrompt: Event | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

function showInstallBanner(): void {
  if (document.getElementById('install-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(26,26,46,0.95);border:1px solid #ffcc00;border-radius:8px;padding:12px 20px;z-index:9998;font-family:monospace;color:#fff;display:flex;align-items:center;gap:12px;';
  banner.innerHTML = '<span>📱 Add to Home Screen for the best experience</span><button id="install-accept" style="background:#ffcc00;color:#000;border:none;padding:6px 14px;border-radius:4px;font-family:monospace;cursor:pointer">Install</button><button id="install-dismiss" style="background:none;border:none;color:#888;font-family:monospace;cursor:pointer">✕</button>';
  document.body.appendChild(banner);

  document.getElementById('install-accept')?.addEventListener('click', async () => {
    banner.remove();
    if (deferredInstallPrompt && 'prompt' in deferredInstallPrompt) {
      (deferredInstallPrompt as any).prompt();
    }
    deferredInstallPrompt = null;
  });
  document.getElementById('install-dismiss')?.addEventListener('click', () => {
    banner.remove();
    deferredInstallPrompt = null;
  });
}

// ── Desktop mute toggle via custom event from index.html ──
window.addEventListener('pokemon-mute-toggle', ((e: CustomEvent<{ muted: boolean }>) => {
  AudioManager.getInstance().setMuted(e.detail.muted);
}) as EventListener);
