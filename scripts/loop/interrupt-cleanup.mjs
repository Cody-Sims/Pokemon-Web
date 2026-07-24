const cleanupCallbacks = new Set();
let handlersInstalled = false;
let handlingSignal = false;

function runCleanups(signal) {
  if (handlingSignal) return;
  handlingSignal = true;
  for (const cleanup of cleanupCallbacks) {
    try {
      cleanup();
    } catch {
      // Best effort during process termination.
    }
  }
  process.exit(signal === 'SIGINT' ? 130 : 143);
}

function installHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  process.on('SIGINT', () => runCleanups('SIGINT'));
  process.on('SIGTERM', () => runCleanups('SIGTERM'));
}

export function registerInterruptCleanup(cleanup) {
  installHandlers();
  cleanupCallbacks.add(cleanup);
  return () => cleanupCallbacks.delete(cleanup);
}
