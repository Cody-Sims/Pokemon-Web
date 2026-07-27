import Phaser from 'phaser';
import { gameConfig } from '@config/game-config';
import { resetSafeAreaCache } from '@utils/safe-area';
import { syncAccessibilitySettings } from '@utils/accessibility';
import { computeGameDimensions } from '@utils/constants';
import { AudioManager } from '@managers/AudioManager';
import { isMobile } from '@ui/theme';

const game = new Phaser.Game(gameConfig);

declare global {
  interface Window {
    __pokemonPlaytest?: Readonly<{
      snapshot: () => {
        activeScenes: string[];
        loadedScenes: string[];
        visibleScenes: string[];
        sceneText: Record<string, string[]>;
        interactiveObjects: Array<{
          scene: string;
          type: string;
          width: number;
          height: number;
          visible: boolean;
        }>;
        textObjects: Array<{
          scene: string;
          text: string;
          fontSize: number;
          x: number;
          y: number;
          width: number;
          height: number;
          visible: boolean;
        }>;
        canvas: { width: number; height: number };
        shell: {
          blockingOverlays: string[];
          shellPaused: boolean;
          rotatePromptVisible: boolean;
          iosInstallVisible: boolean;
          installBannerVisible: boolean;
        };
      };
    }>;
  }
}

const isLocalPlaytest = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
if (isLocalPlaytest) {
  Object.defineProperty(window, '__pokemonPlaytest', {
    configurable: true,
    value: Object.freeze({
      snapshot: () => ({
        activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
        loadedScenes: game.scene.getScenes(false).map((scene) => scene.scene.key),
        visibleScenes: game.scene.getScenes(false)
          .filter((scene) => scene.sys.settings.visible)
          .map((scene) => scene.scene.key),
        sceneText: Object.fromEntries(game.scene.getScenes(false).map((scene) => [
          scene.scene.key,
          scene.children.list
            .filter((child): child is Phaser.GameObjects.Text => (
              child instanceof Phaser.GameObjects.Text && child.visible
            ))
            .map((text) => text.text),
        ])),
        interactiveObjects: game.scene.getScenes(false).flatMap((scene) => (
          scene.children.list.flatMap((child) => {
            if (!(child instanceof Phaser.GameObjects.Rectangle) || !child.input?.enabled) return [];
            return [{
              scene: scene.scene.key,
              type: child.type,
              width: child.displayWidth,
              height: child.displayHeight,
              visible: child.visible,
            }];
          })
        )),
        textObjects: game.scene.getScenes(false).flatMap((scene) => (
          scene.children.list.flatMap((child) => {
            if (!(child instanceof Phaser.GameObjects.Text)) return [];
            return [{
              scene: scene.scene.key,
              text: child.text,
              fontSize: Number.parseFloat(String(child.style.fontSize)),
              x: child.x,
              y: child.y,
              width: child.displayWidth,
              height: child.displayHeight,
              visible: child.visible,
            }];
          })
        )),
        canvas: { width: game.canvas.width, height: game.canvas.height },
        shell: getShellDebugState(),
      }),
    }),
  });
}

const PORTRAIT_OPT_OUT_KEY = 'pokemon-web-portrait-ok';
const IOS_INSTALL_DISMISSED_KEY = 'pokemon-web-ios-install-dismissed';
const LEGACY_IOS_INSTALL_DISMISSED_KEY = 'ios-install-dismissed';
const WEB_INSTALL_DISMISSED_KEY = 'pokemon-web-install-dismissed';
const ORIENTATION_OVERLAY = 'orientation';

const shellBlockingOverlays = new Set<string>();
let shellPaused = false;
let iosInstallPromptBound = false;
let iosInstallPromptTimer: ReturnType<typeof setTimeout> | null = null;

function storageValue(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or quota errors should not break the shell.
  }
}

function isShellBlocking(): boolean {
  return shellBlockingOverlays.size > 0;
}

function getShellDebugState(): {
  blockingOverlays: string[];
  shellPaused: boolean;
  rotatePromptVisible: boolean;
  iosInstallVisible: boolean;
  installBannerVisible: boolean;
} {
  const rotatePrompt = document.getElementById('rotate-prompt');
  const iosInstall = document.getElementById('ios-install-prompt');
  return {
    blockingOverlays: Array.from(shellBlockingOverlays),
    shellPaused,
    rotatePromptVisible: rotatePrompt ? getComputedStyle(rotatePrompt).display !== 'none' : false,
    iosInstallVisible: iosInstall ? getComputedStyle(iosInstall).display !== 'none' : false,
    installBannerVisible: Boolean(document.getElementById('install-banner')),
  };
}

function pauseGameForShellOverlay(): void {
  if (shellPaused) return;
  shellPaused = true;
  document.body.dataset.shellBlocked = 'true';
  try {
    game.sound.pauseAll();
  } catch { /* sound manager may not be ready yet */ }
  try {
    AudioManager.getInstance().pauseBGM();
  } catch { /* no BGM yet */ }
  game.loop.sleep();
}

function resumeGameAfterShellOverlay(): void {
  if (!shellPaused) return;
  shellPaused = false;
  delete document.body.dataset.shellBlocked;
  if (document.hidden) return;
  try {
    game.sound.resumeAll();
  } catch { /* sound manager may not be ready yet */ }
  try {
    AudioManager.getInstance().resumeBGM();
  } catch { /* no BGM yet */ }
  game.loop.wake();
  game.scale.refresh();
}

function hideInstallPromptsWhileBlocked(): void {
  document.getElementById('ios-install-prompt')?.style.setProperty('display', 'none');
  document.getElementById('install-banner')?.remove();
}

function setBlockingOverlay(name: string, visible: boolean): void {
  const wasBlocking = isShellBlocking();
  if (visible) shellBlockingOverlays.add(name);
  else shellBlockingOverlays.delete(name);

  if (!wasBlocking && isShellBlocking()) {
    hideInstallPromptsWhileBlocked();
    pauseGameForShellOverlay();
  } else if (wasBlocking && !isShellBlocking()) {
    resumeGameAfterShellOverlay();
    scheduleIOSInstallPrompt();
    showInstallBanner();
  }
}

function eventStartedInsideShell(event: Event): boolean {
  const path = event.composedPath();
  return path.some(target => {
    if (!(target instanceof HTMLElement)) return false;
    return target.id === 'rotate-prompt'
      || target.id === 'ios-install-prompt'
      || target.id === 'install-banner'
      || Boolean(target.closest?.('#rotate-prompt, #ios-install-prompt, #install-banner'));
  });
}

function blockInputBehindShell(event: Event): void {
  if (!isShellBlocking() || eventStartedInsideShell(event)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

[
  'keydown', 'keyup', 'keypress',
  'pointerdown', 'pointerup', 'pointermove',
  'touchstart', 'touchend', 'touchmove',
  'mousedown', 'mouseup', 'mousemove',
  'wheel',
].forEach(eventName => {
  document.addEventListener(eventName, blockInputBehindShell, { capture: true, passive: false });
});

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
  // Don't request fullscreen on the first tap — it disrupts the title screen
  // interaction by consuming the gesture and triggering viewport changes.
  // Fullscreen will be requested on a subsequent interaction instead.
  document.removeEventListener('pointerdown', onFirstInteraction);
  // Re-register for a second tap to do fullscreen
  document.addEventListener('pointerdown', requestFullscreenOnce, { once: true });
}

function requestFullscreenOnce(): void {
  if (isMobile()) {
    // Defer the fullscreen request so it doesn't consume/block the current
    // user gesture (e.g. tapping "Press Start" on the title screen).
    setTimeout(() => {
      const el = document.documentElement;
      const rfs = el.requestFullscreen ?? (el as unknown as Record<string, () => Promise<void>>).webkitRequestFullscreen;
      if (rfs) {
        rfs.call(el).then(() => tryLockOrientation()).catch(() => {
          collapseIOSSafariChrome();
        });
      } else {
        collapseIOSSafariChrome();
      }
    }, 100);
  }
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

// ── Dynamic game resize — adapt to viewport on resize/orientation change ──
let resizeTimer: ReturnType<typeof setTimeout> | null = null;
let lastResizePortrait = window.innerHeight > window.innerWidth;

function isEditableFocused(): boolean {
  const active = document.activeElement;
  if (!active) return false;
  return active instanceof HTMLInputElement
    || active instanceof HTMLTextAreaElement
    || (active instanceof HTMLElement && active.isContentEditable);
}

function keyboardLikelyShrankVisualViewport(currentPortrait: boolean): boolean {
  if (!window.visualViewport || !isEditableFocused()) return false;
  const heightRatio = window.visualViewport.height / window.innerHeight;
  return currentPortrait === lastResizePortrait && heightRatio > 0 && heightRatio < 0.82;
}

function handleViewportResize(): void {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resetSafeAreaCache();
    const currentPortrait = window.innerHeight > window.innerWidth;
    if (keyboardLikelyShrankVisualViewport(currentPortrait)) {
      game.scale.refresh();
      return;
    }
    // Force a body reflow before reading dimensions so iOS Safari uses
    // the post-rotation client size (it sometimes caches the pre-rotation
    // values until the next layout pass). Toggle a harmless transform on
    // the body to nudge the layout engine.
    if (typeof document !== 'undefined' && document.body) {
      // Reading offsetHeight forces synchronous reflow, which makes
      // body.clientWidth/Height match the actual viewport on rotation.
      void document.body.offsetHeight;
    }
    const { width, height } = computeGameDimensions();
    const current = game.scale.gameSize;
    if (current.width !== width || current.height !== height) {
      // FIT mode needs setGameSize() so Phaser recalculates the CSS display
      // size against the current viewport. resize() only changes the canvas
      // backing size and can leave stale letterboxed gutters after rotation.
      game.scale.setGameSize(width, height);
    }
    // Always call refresh — even when dims are unchanged, the canvas DOM
    // rect can shift after the address bar collapses, and refresh() syncs
    // the input coordinates and active scenes' camera viewports.
    game.scale.refresh();
    // Manually emit a resize event on the scale manager so scenes that
    // registered `layoutOn(...)` re-run their layout pass even when the
    // logical game dimensions didn't change but the viewport rect did.
    try {
      game.scale.emit('resize', game.scale.gameSize, game.scale.baseSize);
    } catch { /* defensive — older Phaser versions */ }
    lastResizePortrait = currentPortrait;
  }, 80);
}
function scheduleOrientationResize(): void {
  // iOS Safari reports stale viewport dimensions immediately after rotation.
  // Fire several times to catch the eventual updated layout.
  handleViewportResize();
  setTimeout(handleViewportResize, 60);
  setTimeout(handleViewportResize, 200);
  setTimeout(handleViewportResize, 500);
  setTimeout(handleViewportResize, 1000);
}
window.addEventListener('resize', handleViewportResize);
window.addEventListener('orientationchange', scheduleOrientationResize);
// `screen.orientation.change` is more reliable than the legacy event on
// modern browsers, especially in installed PWAs where orientation is locked.
try {
  screen.orientation?.addEventListener?.('change', scheduleOrientationResize);
} catch { /* not supported */ }
// `visualViewport` reports the actual visible viewport (excluding browser
// chrome) and fires when the iOS address bar collapses or device rotates.
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', handleViewportResize);
}
// Listen on orientation media-query changes — fires reliably on rotation
// even when `orientationchange` is throttled by the browser.
try {
  const mq = window.matchMedia('(orientation: portrait)');
  const onMQ = () => scheduleOrientationResize();
  if ('addEventListener' in mq) mq.addEventListener('change', onMQ);
  else (mq as MediaQueryList & { addListener: (cb: () => void) => void }).addListener(onMQ);
} catch { /* not supported */ }
// Fullscreen changes also alter the viewport — trigger resize
document.addEventListener('fullscreenchange', () => {
  handleViewportResize();
  setTimeout(handleViewportResize, 200);
});

// ── iOS "Add to Home Screen" install prompt ──
function hasDismissedInstallPrompt(): boolean {
  return storageValue(IOS_INSTALL_DISMISSED_KEY) === '1'
    || storageValue(LEGACY_IOS_INSTALL_DISMISSED_KEY) === '1'
    || storageValue(WEB_INSTALL_DISMISSED_KEY) === '1';
}

function dismissInstallPrompts(): void {
  setStorageValue(IOS_INSTALL_DISMISSED_KEY, '1');
  setStorageValue(WEB_INSTALL_DISMISSED_KEY, '1');
  document.getElementById('ios-install-prompt')?.style.setProperty('display', 'none');
  document.getElementById('install-banner')?.remove();
  deferredInstallPrompt = null;
}

function scheduleIOSInstallPrompt(delay = 3000): void {
  if (iosInstallPromptTimer) clearTimeout(iosInstallPromptTimer);
  iosInstallPromptTimer = setTimeout(showIOSInstallPrompt, delay);
}

function showIOSInstallPrompt(): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Only show in Safari (not in standalone/PWA mode)
  const isStandalone = ('standalone' in navigator && (navigator as unknown as Record<string, boolean>).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
  if (!isIOS || isStandalone) return;
  if (hasDismissedInstallPrompt() || isShellBlocking()) return;

  const banner = document.getElementById('ios-install-prompt');
  if (!banner) return;
  banner.style.display = 'flex';

  const dismissBtn = document.getElementById('ios-install-dismiss');
  if (dismissBtn && !iosInstallPromptBound) {
    iosInstallPromptBound = true;
    dismissBtn.addEventListener('click', () => {
      dismissInstallPrompts();
    });
  }
}

// Show later and only after blocking orientation UI is gone.
scheduleIOSInstallPrompt(3000);

// ── Tab visibility — pause non-essential work when backgrounded ──
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.loop.sleep();
  } else {
    if (!shellPaused) game.loop.wake();
    game.scale.refresh();
  }
});

// ── Portrait orientation prompt ──
function hasPortraitOptOut(): boolean {
  return storageValue(PORTRAIT_OPT_OUT_KEY) === '1';
}

function isPortraitViewport(): boolean {
  return window.innerHeight > window.innerWidth;
}

function updateOrientationPrompt(): void {
  const overlay = document.getElementById('rotate-prompt');
  if (!overlay) return;
  const shouldShow = isMobile() && isPortraitViewport() && !hasPortraitOptOut();
  const wasVisible = getComputedStyle(overlay).display !== 'none';
  overlay.style.display = shouldShow ? 'flex' : 'none';
  setBlockingOverlay(ORIENTATION_OVERLAY, shouldShow);
  if (shouldShow && !wasVisible) {
    document.getElementById('rotate-dismiss')?.focus({ preventScroll: true });
  }
}

window.addEventListener('resize', updateOrientationPrompt);
window.addEventListener('orientationchange', updateOrientationPrompt);
window.addEventListener('pokemon-shell-overlay-dismissed', () => updateOrientationPrompt());
document.getElementById('rotate-dismiss')?.addEventListener('click', () => {
  setStorageValue(PORTRAIT_OPT_OUT_KEY, '1');
  updateOrientationPrompt();
});
// Initial check after a tick (canvas may not be laid out yet)
requestAnimationFrame(updateOrientationPrompt);

// ── PWA install prompt ──
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  if (hasDismissedInstallPrompt()) return;
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  showInstallBanner();
});

function showInstallBanner(): void {
  if (!deferredInstallPrompt || hasDismissedInstallPrompt() || isShellBlocking() || document.getElementById('install-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.className = 'shell-toast';
  banner.style.display = 'flex';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');

  const copy = document.createElement('div');
  copy.className = 'install-copy';
  const title = document.createElement('div');
  title.className = 'install-title';
  title.textContent = 'Install for quick play';
  const body = document.createElement('div');
  body.className = 'install-steps';
  body.textContent = 'Add Pokémon Aurum to your home screen for full-screen play.';
  copy.append(title, body);

  const accept = document.createElement('button');
  accept.id = 'install-accept';
  accept.type = 'button';
  accept.textContent = 'Install';

  const dismiss = document.createElement('button');
  dismiss.id = 'install-dismiss';
  dismiss.type = 'button';
  dismiss.textContent = 'Not Now';

  banner.append(copy, accept, dismiss);
  document.body.appendChild(banner);

  accept.addEventListener('click', async () => {
    banner.remove();
    await deferredInstallPrompt?.prompt();
    deferredInstallPrompt = null;
  });
  dismiss.addEventListener('click', dismissInstallPrompts);
}

// ── Desktop mute toggle via custom event from index.html ──
window.addEventListener('pokemon-mute-toggle', ((e: CustomEvent<{ muted: boolean }>) => {
  AudioManager.getInstance().setMuted(e.detail.muted);
}) as EventListener);

// ── Offline / Online status toasts ──
function showNetworkToast(message: string): void {
  const existing = document.getElementById('network-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'network-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(15,15,26,0.92)', color: '#e8e8f0', fontFamily: 'monospace',
    fontSize: '13px', padding: '8px 20px', borderRadius: '6px', zIndex: '9990',
    border: '1px solid rgba(255,204,0,0.3)', transition: 'opacity 0.5s',
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
  setTimeout(() => toast.remove(), 3600);
}

window.addEventListener('offline', () => showNetworkToast('Playing offline — progress saves locally'));
window.addEventListener('online', () => showNetworkToast('Back online'));
