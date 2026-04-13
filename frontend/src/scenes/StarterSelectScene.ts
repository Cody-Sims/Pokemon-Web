import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { COLORS, FONTS } from '@ui/theme';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/EncounterSystem';
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
    // Ensure starter front sprites are loaded (they're not in encounter tables)
    let needsLoad = false;
    for (const s of this.starters) {
      const data = pokemonData[s.id];
      if (!data) continue;
      const name = data.name.toLowerCase();
      if (!this.textures.exists(data.spriteKeys.front)) {
        this.load.image(data.spriteKeys.front, `assets/sprites/pokemon/${name}-front.png`);
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
    // Darken background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    // Title
    this.add.text(GAME_WIDTH / 2, 50, 'Choose Your Starter Pokémon!', {
      ...FONTS.title, fontSize: '24px',
    }).setOrigin(0.5);

    // Draw three starter cards
    const startX = GAME_WIDTH / 2 - 220;
    for (let i = 0; i < 3; i++) {
      const s = this.starters[i];
      const cx = startX + i * 220;
      const cy = GAME_HEIGHT / 2 - 20;

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
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(nameText);

      // Type
      const typeText = this.add.text(0, 75, s.type, {
        fontSize: '14px', color: '#cccccc',
      }).setOrigin(0.5);
      container.add(typeText);

      // Level
      const lvlText = this.add.text(0, 95, 'Lv. 5', {
        fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5);
      container.add(lvlText);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      bg.on('pointerdown', () => { this.cursor = i; this.selectStarter(); });

      this.cards.push(container);
    }

    // Hint text
    const hintText = (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
      ? 'Swipe or tap to choose' : 'Use ← → to choose, Enter to confirm';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, hintText, {
      fontSize: '14px', color: '#888888',
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
