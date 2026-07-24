import Phaser from 'phaser';
import type { IntroSlide } from '@data/intro-slides';
import { hintText } from '@utils/hint-text';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';

export class ProfessorIntroView {
  private readonly background: Phaser.GameObjects.Rectangle;
  private readonly professorSprite: Phaser.GameObjects.Image;
  private pokemonSprite?: Phaser.GameObjects.Image;
  private readonly textObject: Phaser.GameObjects.Text;
  private readonly hint?: Phaser.GameObjects.Text;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(private readonly scene: Phaser.Scene, options: { showHint?: boolean } = {}) {
    const { width, height } = scene.cameras.main;
    const portrait = height > width;
    this.background = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000);
    this.objects.push(this.background);

    this.professorSprite = scene.add.image(width / 2, this.spriteY(), 'npc-oak', 0)
      .setScale(portrait ? 5 : 6)
      .setAlpha(0);
    this.objects.push(this.professorSprite);

    const textY = portrait ? height - 80 : height * 0.72;
    const textOriginY = portrait ? 1 : 0;
    this.textObject = scene.add.text(width / 2, textY, '', {
      ...FONTS.body,
      fontSize: mobileFontSize(portrait ? 16 : 18),
      color: COLORS.textWhite,
      align: 'center',
      wordWrap: { width: width * 0.86 },
      lineSpacing: 6,
    }).setOrigin(0.5, textOriginY).setAlpha(0);
    this.objects.push(this.textObject);

    if (options.showHint ?? true) {
      this.hint = scene.add.text(width / 2, height - 24, hintText('advance'), {
        ...FONTS.caption,
        color: COLORS.textDim,
      }).setOrigin(0.5, 1);
      this.objects.push(this.hint);
    }
  }

  showSlide(slide: IntroSlide, onComplete: () => void): void {
    const targets = [this.textObject, this.professorSprite, this.pokemonSprite].filter((target): target is Phaser.GameObjects.Text | Phaser.GameObjects.Image => target !== undefined);
    this.scene.tweens.add({
      targets,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.textObject.setText(slide.text);
        if (slide.showProfessor) {
          this.professorSprite.setPosition(this.scene.cameras.main.width / 2, this.spriteY());
          this.scene.tweens.add({ targets: this.professorSprite, alpha: 1, duration: 300 });
        }
        if (slide.showPokemon) {
          const pokemon = this.ensurePokemonSprite();
          pokemon.setPosition(this.scene.cameras.main.width / 2, this.spriteY());
          this.scene.tweens.add({ targets: pokemon, alpha: 1, duration: 300 });
        }
        this.scene.tweens.add({
          targets: this.textObject,
          alpha: 1,
          duration: 300,
          onComplete,
        });
      },
    });
  }

  fadeOut(onComplete: () => void): void {
    this.scene.tweens.add({
      targets: this.objects,
      alpha: 0,
      duration: 300,
      onComplete,
    });
  }

  showConfirmation(name: string, onComplete: () => void): void {
    const { width, height } = this.scene.cameras.main;
    const portrait = height > width;
    this.hint?.destroy();
    this.pokemonSprite?.destroy();
    this.pokemonSprite = undefined;
    this.professorSprite.setPosition(width / 2, this.spriteY()).setScale(portrait ? 5 : 6).setAlpha(1);
    const confirmY = portrait ? height - 56 : height * 0.68;
    const confirmOriginY = portrait ? 1 : 0;
    this.textObject.setPosition(width / 2, confirmY)
      .setOrigin(0.5, confirmOriginY)
      .setStyle({
        ...FONTS.body,
        fontSize: mobileFontSize(portrait ? 14 : 16),
        color: COLORS.textWhite,
        align: 'center',
        wordWrap: { width: width * 0.86 },
        lineSpacing: 5,
      })
      .setText(`Right! So your name is ${name}!\n\nYour very own POKéMON legend\nis about to unfold!\n\nA world of dreams and\nadventures with POKéMON\nawaits! Let's go!`)
      .setAlpha(0);
    this.scene.tweens.add({ targets: this.textObject, alpha: 1, duration: 400, onComplete });
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.objects);
    this.objects.forEach(object => object.destroy());
    this.objects.length = 0;
  }

  private ensurePokemonSprite(): Phaser.GameObjects.Image {
    if (this.pokemonSprite) return this.pokemonSprite;
    const spriteKey = this.scene.textures.exists('pikachu-front') ? 'pikachu-front' : 'pikachu-icon';
    this.pokemonSprite = this.scene.add.image(this.scene.cameras.main.width / 2, this.spriteY(), spriteKey)
      .setScale(this.scene.textures.exists('pikachu-front') ? 3 : 6)
      .setAlpha(0);
    this.objects.push(this.pokemonSprite);
    return this.pokemonSprite;
  }

  private spriteY(): number {
    const { width, height } = this.scene.cameras.main;
    return height > width ? height * 0.28 : height * 0.35;
  }
}
