import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { COLORS, FONTS, mobileFontSize, MOBILE_SCALE, MIN_TOUCH_TARGET, isMobile } from '@ui/theme';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import { AchievementManager } from '@managers/AchievementManager';
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
    this.cards = [];
    const layout = ui(this);

    // Darken background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, 0x000000, 0.7);

    // Adapt to portrait — narrow viewport stacks cards vertically and uses
    // smaller cards so all three fit without overlapping or clipping.
    const isPortrait = layout.h > layout.w;
    // Title (smaller in portrait so it doesn't dominate)
    const titleFontPx = isPortrait ? 18 : 24;
    this.add.text(layout.cx, isPortrait ? 28 : 50, 'Choose Your Starter Pokémon!', {
      ...FONTS.title, fontSize: mobileFontSize(titleFontPx),
    }).setOrigin(0.5);

    // Card sizing & layout
    let cardW: number;
    let cardH: number;
    let positions: { x: number; y: number }[];
    if (isPortrait) {
      // Vertical stack with 12px gaps. Reserve top (title ~50) and bottom
      // (hint ~50) so all 3 cards + spacing fit.
      const topReserve = 60;
      const bottomReserve = 70;
      const available = layout.h - topReserve - bottomReserve;
      const gap = 8;
      cardH = Math.min(190, Math.floor((available - gap * 2) / 3));
      cardW = Math.min(layout.w - 32, 320);
      positions = [0, 1, 2].map(i => ({
        x: layout.cx,
        y: topReserve + cardH / 2 + i * (cardH + gap),
      }));
    } else {
      cardW = 180;
      cardH = 240;
      const cardSpacing = Math.min(220, (layout.w - 60) / 3);
      const startX = layout.cx - cardSpacing;
      positions = [0, 1, 2].map(i => ({
        x: startX + i * cardSpacing,
        y: layout.cy - 20,
      }));
    }

    for (let i = 0; i < 3; i++) {
      const s = this.starters[i];
      const { x: cx, y: cy } = positions[i];

      const container = this.add.container(cx, cy);

      // Card background
      const bg = this.add.rectangle(0, 0, cardW, cardH, 0x222222, 0.9)
        .setStrokeStyle(3, s.color);
      container.add(bg);

      // In portrait we lay the card out horizontally: sprite on the left,
      // name + type + level stacked on the right. Landscape keeps the
      // legacy vertical layout (sprite on top, text below).
      const data = pokemonData[s.id];
      if (isPortrait) {
        const spriteX = -cardW / 2 + cardH / 2;
        if (data) {
          const sprite = this.add.image(spriteX, 0, data.spriteKeys.front).setScale(1.6);
          container.add(sprite);
        }
        const textX = spriteX + cardH / 2 + 12;
        const nameText = this.add.text(textX, -cardH * 0.20, s.name, {
          fontSize: mobileFontSize(18), color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        container.add(nameText);
        const typeText = this.add.text(textX, 4, s.type, {
          fontSize: mobileFontSize(13), color: '#cccccc',
        }).setOrigin(0, 0.5);
        container.add(typeText);
        const lvlText = this.add.text(textX, cardH * 0.20, 'Lv. 5', {
          fontSize: mobileFontSize(13), color: '#aaaaaa',
        }).setOrigin(0, 0.5);
        container.add(lvlText);
      } else {
        if (data) {
          const sprite = this.add.image(0, -40, data.spriteKeys.front).setScale(2);
          container.add(sprite);
        }
        const nameText = this.add.text(0, 50, s.name, {
          fontSize: mobileFontSize(18), color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(nameText);
        const typeText = this.add.text(0, 75, s.type, {
          fontSize: mobileFontSize(14), color: '#cccccc',
        }).setOrigin(0.5);
        container.add(typeText);
        const lvlText = this.add.text(0, 95, 'Lv. 5', {
          fontSize: mobileFontSize(14), color: '#aaaaaa',
        }).setOrigin(0.5);
        container.add(lvlText);
      }

      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { this.cursor = i; this.updateCursor(); });
      bg.on('pointerdown', () => { this.cursor = i; this.selectStarter(); });

      this.cards.push(container);
    }

    // Hint text
    const hint = isMobile()
      ? (isPortrait ? 'Tap a card to choose' : 'Swipe or tap to choose')
      : 'Use ← → to choose, Enter to confirm';
    this.add.text(layout.cx, layout.h - (isPortrait ? 28 : 50), hint, {
      fontSize: mobileFontSize(13), color: '#888888',
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
    // Portrait stack — also wire UP/DOWN so arrow keys feel natural.
    this.input.keyboard!.on('keydown-UP', () => {
      this.cursor = (this.cursor - 1 + 3) % 3;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-DOWN', () => {
      this.cursor = (this.cursor + 1) % 3;
      this.updateCursor();
      AudioManager.getInstance().playSFX(SFX.CURSOR);
    });
    this.input.keyboard!.on('keydown-ENTER', () => this.selectStarter());
    this.input.keyboard!.on('keydown-SPACE', () => this.selectStarter());
    // BUG-079: Add back/cancel handler
    this.input.keyboard!.on('keydown-ESC', () => this.goBack());

    // Re-layout on resize / orientation change
    let resizeInit = false;
    layoutOn(this, () => {
      if (!resizeInit) { resizeInit = true; return; }
      this.cards = [];
      this.scene.restart();
    });
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

    // Lock in the monotype rule from the starter's primary type so the
    // catch/party gates know which type to enforce. Idempotent if not in
    // monotype mode.
    if (gm.hasChallengeMode('monotype') && !gm.getMonotypeLock()) {
      const data = pokemonData[choice.id];
      if (data?.types?.[0]) gm.setMonotypeLock(data.types[0]);
    }

    // Achievement: first Pokémon received
    AchievementManager.getInstance().unlock('first-pokemon');

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
