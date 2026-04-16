/** Show a floating damage number that rises and fades. */
export function showDamagePopup(
  scene: Phaser.Scene,
  sprite: { x: number; y: number },
  damage: number,
  effectiveness: number,
): void {
  const x = sprite.x;
  const y = sprite.y - 30;
  let color = '#ffffff';
  if (effectiveness > 1) color = '#ff5555';
  else if (effectiveness < 1 && effectiveness > 0) color = '#8888aa';
  else if (effectiveness === 0) color = '#666666';

  const popup = scene.add.text(x, y, `-${damage}`, {
    fontSize: '22px', color, fontFamily: 'monospace', fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(100);

  scene.tweens.add({
    targets: popup,
    y: y - 40,
    alpha: 0,
    duration: 900,
    ease: 'Power2',
    onComplete: () => popup.destroy(),
  });
}
