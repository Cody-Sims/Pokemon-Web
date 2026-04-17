import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize, MOBILE_SCALE, MIN_TOUCH_TARGET, isMobile } from '@ui/theme';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import { pokemonData } from '@data/pokemon';
import { AudioManager } from '@managers/AudioManager';
import { SFX } from '@utils/audio-keys';

/** Overlay scene for choosing a starter Pokémon. */
export class StarterSelectScene extends Phaser.Scene {
  private cursor = 0;
  private starters = [
    { id: 1, name: 'Bulbasaur', type: 'Grass/Poison', color: 0x78c850 },
    { id: 4, name: 'Charmander', type: 'Fire', color: 0xf08030 },
    { id: 7, name: 'Squirtle', type: 'Water', color: 0x6890f0 },
  ];
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'StarterSelectScene' });
  }

  create(): void {
    // Ensure starter front+back sprites are loaded (they're not in encounter tables
    // and the player's party was empty when the map preloader ran)
    let needsLoad = false;
    for (const s of this.starters) {
      const data = pokemonData[s.id];
      if (!data) continue;
      const name = data.name.toLowerCase();
      if (!this.textures.exists(data.spriteKeys.front)) {
        this.load.image(data.spriteKeys.front, `assets/sprites/pokemon/${name}-front.png`);
        needsLoad = true;
      }
      if (!this.textures.exists(data.spriteKeys.back)) {
        this.load.image(data.spriteKeys.back, `assets/sprites/pokemon/${name}-back.png`);
        needsLoad = true;
      }
    }
    if (needsLoad) {
      this.load.once('complete', () => this.buildUI());
      this.load.start();
    } else {
      this.buildUI();
    }
  }

  private buildUI(): void {
    const layout = ui(this);

    // Darken background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, 0x000000, 0.7);

    // Title
    this.add.text(layout.cx, 50, 'Choose Your Starter Pokémon!', {
      ...FONTS.title, fontSize: mobileFontSize(24),
    }).setOrigin(0.5);

    // Draw three starter cards (BUG-080: use relative spacing)
    const cardSpacing = Math.min(220, (layout.w - 60) / 3);
    const startX = layout.cx - cardSpacing;
    for (let i = 0; i < 3; i++) {
      const s = this.starters[i];
      const cx = startX + i * cardSpacing;
      const cy = layout.cy - 20;

      const container = this.add.container(cx, cy);

      // Card background
      const bg = this.add.rectangle(0, 0, 180, 240, 0x222222, 0.9)
        .setStrokeStyle(3, s.color);
      container.add(bg);

      // Pokémon sprite
      const data = pokemonData[s.id];
      if (data) {
        const sprite = this.add.image(0, -40, data.spriteKeys.front).setScale(2);
        container.add(sprite);
      }

      // Name
      const nameText = this.add.text(0, 50, s.name, {
        fontSize: mobileFontSize(18), color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(nameText);

      // Type
      const typeText = this.add.text(0, 75, s.type, {
        fontSize: mobileFontSize(14), color: '#cccccc',
      }).setOrigin(0.5);
      container.add(typeText);

      // Level
      const lvlText = this.add.text(0, 95, 'Lv. 5', {
        fontSize: mobileFontSize(14), color: '#aaaaaa',
      }).setOrigin(0.5);
      container.add(lvlText);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      bg.on('pointerdown', () => { this.cursor = i; this.selectStarter(); });

      this.cards.push(container);
    }

    // Hint text
    const hint = isMobile() ? 'Swipe or tap to choose' : 'Use ← → to choose, Enter to confirm';
    this.add.text(layout.cx, layout.h - 50, hint, {
      fontSize: mobileFontSize(14), color: '#888888',
    }).setOrigin(0.5);

    this.updateCursor();

    // Keyboard input
    this.input.keyboard!.on('keydown-LEFT', () => {
      this.cursor = (this.cursor - 1 + 3) % 3;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-RIGHT', () => {
      this.cursor = (this.cursor + 1) % 3;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-ENTER', () => this.selectStarter());
    this.input.keyboard!.on('keydown-SPACE', () => this.selectStarter());
    // BUG-079: Add back/cancel handler
    this.input.keyboard!.on('keydown-ESC', () => this.goBack());
  }

  private updateCursor(): void {
    this.cards.forEach((card, i) => {
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;
      if (i === this.cursor) {
        bg.setStrokeStyle(4, 0xffcc00);
        card.setScale(1.05);
      } else {
        bg.setStrokeStyle(3, this.starters[i].color);
        card.setScale(1);
      }
    });
  }

  /** BUG-079: Allow canceling out of starter selection to return to lab. */
  private goBack(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }

  private selectStarter(): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const choice = this.starters[this.cursor];
    const gm = GameManager.getInstance();

    // Create the starter at level 5
    const starter = EncounterSystem.createWildPokemon(choice.id, 5);
    starter.nickname = choice.name;
    starter.friendship = 70;

    // Clear party (remove the auto-generated starter) and add the chosen one
    gm.setParty([]);
    gm.addToParty(starter);
    gm.setFlag('receivedStarter');
    gm.setFlag(`starterChoice_${choice.id}`);
    gm.markSeen(choice.id);
    gm.markCaught(choice.id);

    // Flash and close
    this.cameras.main.flash(300, 255, 255, 255);

    this.time.delayedCall(400, () => {
      // Show confirmation dialogue
      this.scene.stop();
      const data = pokemonData[choice.id];
      this.scene.launch('DialogueScene', {
        dialogue: [
          `You received ${data?.name ?? choice.name}!`,
          'Take good care of it!',
        ],
      });
      this.scene.get('DialogueScene').events.once('shutdown', () => {
        this.scene.resume('OverworldScene');
      });
    });
  }
}
