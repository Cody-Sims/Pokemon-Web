/** Show a queue of messages sequentially with a delay, then run callback. */
export function showMessageQueue(
  scene: Phaser.Scene,
  messages: string[],
  idx: number,
  setMessage: (text: string) => void,
  callback: () => void,
  delayMs = 900,
): void {
  if (idx >= messages.length) { callback(); return; }
  setMessage(messages[idx]);
  scene.time.delayedCall(delayMs, () => showMessageQueue(scene, messages, idx + 1, setMessage, callback, delayMs));
}
