import Phaser from 'phaser';
import { MAX_PARTY_SIZE } from '@utils/constants';
import { ui } from '@utils/ui-layout';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { pokemonData } from '@data/pokemon';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { COLORS, FONTS, TYPE_COLORS, mobileFontSize, isMobile, MOBILE_SCALE, MIN_TOUCH_TARGET } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import type { PokemonInstance } from '@data/interfaces';

const BOXES_COUNT = 12;
const BOX_CAPACITY = 30;
const GRID_COLS = 6;
const GRID_ROWS = 5;

type PCMode = 'box' | 'party' | 'moving';

export class PCScene extends Phaser.Scene {
  private currentBox = 0;
  private boxCursor = 0;
  private partyCursor = 0;
  private mode: PCMode = 'box';
  private heldPokemon: { pokemon: PokemonInstance; source: 'box' | 'party'; boxIndex?: number; slotIndex: number } | null = null;

  // UI refs
  private boxNameText!: Phaser.GameObjects.Text;
  private boxGroup!: Phaser.GameObjects.Group;
  private partyGroup!: Phaser.GameObjects.Group;
  private boxSlots: Phaser.GameObjects.Rectangle[] = [];
  private boxLabels: Phaser.GameObjects.Text[] = [];
  private partySlots: Phaser.GameObjects.Rectangle[] = [];
  private partyLabels: Phaser.GameObjects.Text[] = [];
  private detailText!: Phaser.GameObjects.Text;
  private heldIndicator?: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PCScene' });
  }

  create(): void {
    const layout = ui(this);
    this.boxGroup = this.add.group();
    this.partyGroup = this.add.group();
    this.currentBox = 0;
    this.boxCursor = 0;
    this.partyCursor = 0;
    this.mode = 'box';
    this.heldPokemon = null;

    // Background
    this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark);
    new NinePatchPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Title
    this.add.text(layout.cx, 24, 'PC STORAGE', { ...FONTS.heading, fontSize: mobileFontSize(22) }).setOrigin(0.5);

    // Box name + arrows
    this.add.text(layout.cx - 140, 50, '◀', { ...FONTS.heading, color: COLORS.textHighlight })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchBox(-1));
    this.boxNameText = this.add.text(layout.cx, 50, '', { ...FONTS.body, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(layout.cx + 140, 50, '▶', { ...FONTS.heading, color: COLORS.textHighlight })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchBox(1));

    // Party panel (right side)
    new NinePatchPanel(this, layout.w - 95, layout.cy + 10, 160, layout.h - 90, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.7,
      borderColor: COLORS.border,
      cornerRadius: 6,
    });
    this.add.text(layout.w - 95, 58, 'PARTY', { ...FONTS.bodySmall, fontStyle: 'bold' }).setOrigin(0.5);

    // Detail text at bottom
    this.detailText = this.add.text(20, layout.h - 58, '', FONTS.bodySmall);

    // Mode indicator
    this.modeText = this.add.text(20, layout.h - 36, '', FONTS.caption);

    // Help text / tappable exit button
    if (isMobile()) {
      const exitBtn = this.add.text(layout.cx, layout.h - 14, '✕  EXIT', {
        ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      exitBtn.setPadding(16, 8, 16, 8);
      exitBtn.on('pointerdown', () => this.handleCancel());
    } else {
      this.add.text(layout.cx, layout.h - 14, 'TAB: switch focus  |  ENTER: pick/place  |  Q/E: switch box  |  ESC: exit', FONTS.caption).setOrigin(0.5);
    }

    this.bindKeys();
    this.renderBox();
    this.renderParty();
    this.updateSelection();
  }

  private bindKeys(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.navigate('left'));
    kb.on('keydown-RIGHT', () => this.navigate('right'));
    kb.on('keydown-UP', () => this.navigate('up'));
    kb.on('keydown-DOWN', () => this.navigate('down'));
    kb.on('keydown-ENTER', () => this.confirmAction());
    kb.on('keydown-Z', () => this.confirmAction());
    kb.on('keydown-SPACE', () => this.confirmAction());
    kb.on('keydown-ESC', () => this.handleCancel());
    kb.on('keydown-X', () => this.handleCancel());
    kb.on('keydown-TAB', () => this.toggleFocus());
    kb.on('keydown-Q', () => this.switchBox(-1));
    kb.on('keydown-E', () => this.switchBox(1));
  }

  private switchBox(delta: number): void {
    this.currentBox = (this.currentBox + delta + BOXES_COUNT) % BOXES_COUNT;
    // BUG-095: Reset cursor when switching boxes to avoid out-of-range index
    this.boxCursor = 0;
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    this.renderBox();
    this.updateSelection();
  }

  private toggleFocus(): void {
    if (this.mode === 'moving') return; // can't switch focus while holding
    this.mode = this.mode === 'box' ? 'party' : 'box';
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    this.updateSelection();
  }

  private navigate(dir: 'left' | 'right' | 'up' | 'down'): void {
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    if (this.mode === 'box' || this.mode === 'moving') {
      if (this.mode === 'moving' && this.heldPokemon?.source === 'party') {
        // Navigating in party while moving from party
        this.navigateParty(dir);
        return;
      }
      this.navigateBox(dir);
    } else {
      this.navigateParty(dir);
    }
  }

  private navigateBox(dir: string): void {
    const col = this.boxCursor % GRID_COLS;
    const row = Math.floor(this.boxCursor / GRID_COLS);
    switch (dir) {
      case 'left':  this.boxCursor = row * GRID_COLS + ((col - 1 + GRID_COLS) % GRID_COLS); break;
      case 'right': this.boxCursor = row * GRID_COLS + ((col + 1) % GRID_COLS); break;
      case 'up':    this.boxCursor = ((row - 1 + GRID_ROWS) % GRID_ROWS) * GRID_COLS + col; break;
      case 'down':  this.boxCursor = ((row + 1) % GRID_ROWS) * GRID_COLS + col; break;
    }
    this.updateSelection();
  }

  private navigateParty(dir: string): void {
    const gm = GameManager.getInstance();
    const partySize = gm.getParty().length;
    if (partySize === 0) return;
    switch (dir) {
      case 'up':
      case 'left':
        this.partyCursor = (this.partyCursor - 1 + MAX_PARTY_SIZE) % MAX_PARTY_SIZE;
        break;
      case 'down':
      case 'right':
        this.partyCursor = (this.partyCursor + 1) % MAX_PARTY_SIZE;
        break;
    }
    this.updateSelection();
  }

  private confirmAction(): void {
    const gm = GameManager.getInstance();

    if (this.heldPokemon) {
      // Place the held Pokémon
      this.placePokemon(gm);
      return;
    }

    // Pick up a Pokémon
    if (this.mode === 'box') {
      const box = gm.getBox(this.currentBox);
      if (this.boxCursor < box.length) {
        const pokemon = gm.withdrawPokemon(this.currentBox, this.boxCursor);
        if (pokemon) {
          this.heldPokemon = { pokemon, source: 'box', boxIndex: this.currentBox, slotIndex: this.boxCursor };
          this.mode = 'moving';
          AudioManager.getInstance().playSFX(SFX.CONFIRM);
          this.renderBox();
          this.renderParty();
          this.updateSelection();
        }
      }
    } else if (this.mode === 'party') {
      const party = gm.getParty();
      if (this.partyCursor < party.length && party.length > 1) {
        const pokemon = gm.removeFromParty(this.partyCursor);
        if (pokemon) {
          this.heldPokemon = { pokemon, source: 'party', slotIndex: this.partyCursor };
          this.mode = 'moving';
          AudioManager.getInstance().playSFX(SFX.CONFIRM);
          this.renderBox();
          this.renderParty();
          this.updateSelection();
        }
      } else if (party.length === 1) {
        // Can't remove last Pokémon
        AudioManager.getInstance().playSFX(SFX.ERROR);
      }
    }
  }

  private placePokemon(gm: GameManager): void {
    if (!this.heldPokemon) return;

    // NEW-013: Determine target from current cursor focus, not stale highlight data
    const lastFocus = this.partySlots[this.partyCursor]?.getData('highlighted') === true ? 'party' : 'box';
    const targetIsBox = lastFocus === 'box';
    const targetIsParty = lastFocus === 'party';

    if (targetIsBox || (!targetIsParty && this.heldPokemon.source === 'party')) {
      // Place into box
      const box = gm.getBox(this.currentBox);
      if (box.length >= BOX_CAPACITY) {
        AudioManager.getInstance().playSFX(SFX.ERROR);
        return;
      }
      gm.depositPokemon(this.currentBox, this.heldPokemon.pokemon);
      AudioManager.getInstance().playSFX(SFX.CONFIRM);
    } else {
      // Place into party
      if (gm.getParty().length >= MAX_PARTY_SIZE) {
        AudioManager.getInstance().playSFX(SFX.ERROR);
        return;
      }
      gm.addToParty(this.heldPokemon.pokemon);
      AudioManager.getInstance().playSFX(SFX.CONFIRM);
    }

    this.heldPokemon = null;
    this.mode = 'box';
    this.renderBox();
    this.renderParty();
    this.updateSelection();
  }

  private handleCancel(): void {
    if (this.heldPokemon) {
      // Put the Pokémon back where it came from
      const gm = GameManager.getInstance();
      if (this.heldPokemon.source === 'box') {
        gm.depositPokemon(this.heldPokemon.boxIndex ?? 0, this.heldPokemon.pokemon);
      } else {
        gm.addToParty(this.heldPokemon.pokemon);
      }
      this.heldPokemon = null;
      this.mode = 'box';
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      this.renderBox();
      this.renderParty();
      this.updateSelection();
      return;
    }
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  }

  private renderBox(): void {
    this.boxGroup.clear(true, true);
    this.boxSlots = [];
    this.boxLabels = [];

    const gm = GameManager.getInstance();
    const box = gm.getBox(this.currentBox);
    this.boxNameText.setText(gm.getBoxNames()[this.currentBox]);

    const layout = ui(this);
    const startX = 20;
    const startY = 70;
    const cellW = Math.floor((layout.w - 200) / GRID_COLS);
    const cellH = 68;

    for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = startX + col * cellW + cellW / 2;
      const y = startY + row * cellH + cellH / 2;

      const slot = this.add.rectangle(x, y, cellW - 4, cellH - 4, COLORS.bgCard, 0.6)
        .setStrokeStyle(1, COLORS.border)
        .setInteractive({ useHandCursor: true });
      slot.setData('highlighted', false);
      slot.on('pointerdown', () => {
        this.mode = 'box';
        this.boxCursor = i;
        this.updateSelection();
        this.confirmAction();
      });
      this.boxGroup.add(slot);
      this.boxSlots.push(slot);

      const pokemon = box[i];
      if (pokemon) {
        const pData = pokemonData[pokemon.dataId];
        const name = pokemon.nickname ?? pData?.name ?? '???';
        const label = this.add.text(x, y - 10, name, { ...FONTS.caption, fontSize: mobileFontSize(10) }).setOrigin(0.5);
        this.boxGroup.add(label);
        this.boxLabels.push(label);

        const lvl = this.add.text(x, y + 8, `Lv.${pokemon.level}`, { ...FONTS.label, fontSize: mobileFontSize(10) }).setOrigin(0.5);
        this.boxGroup.add(lvl);

        // Type dot
        if (pData) {
          const typeColor = TYPE_COLORS[pData.types[0]] ?? 0xaaaaaa;
          const dot = this.add.circle(x, y + 22, 4, typeColor);
          this.boxGroup.add(dot);
        }

        // Icon sprite if available
        const iconKey = pData?.spriteKeys.icon;
        if (iconKey && this.textures.exists(iconKey)) {
          const icon = this.add.image(x, y - 4, iconKey).setScale(1);
          this.boxGroup.add(icon);
          label.setY(y + 16);
        }
      } else {
        const empty = this.add.text(x, y, '—', { ...FONTS.caption, color: COLORS.textDim }).setOrigin(0.5);
        this.boxGroup.add(empty);
        this.boxLabels.push(empty);
      }
    }
  }

  private renderParty(): void {
    this.partyGroup.clear(true, true);
    this.partySlots = [];
    this.partyLabels = [];

    const layout = ui(this);
    const gm = GameManager.getInstance();
    const party = gm.getParty();
    const startX = layout.w - 95;
    const startY = 78;
    const slotH = 62;

    for (let i = 0; i < MAX_PARTY_SIZE; i++) {
      const y = startY + i * slotH;
      const pokemon = party[i];

      const slot = this.add.rectangle(startX, y + slotH / 2 - 4, 140, slotH - 8,
        pokemon ? COLORS.bgCard : COLORS.bgDark, pokemon ? 0.8 : 0.4)
        .setStrokeStyle(1, pokemon ? COLORS.border : 0x2a2a3a)
        .setInteractive({ useHandCursor: !!pokemon });
      slot.setData('highlighted', false);
      const slotIdx = i;
      slot.on('pointerdown', () => {
        if (!gm.getParty()[slotIdx]) return;
        this.mode = 'party';
        this.partyCursor = slotIdx;
        this.updateSelection();
        this.confirmAction();
      });
      this.partyGroup.add(slot);
      this.partySlots.push(slot);

      if (pokemon) {
        const pData = pokemonData[pokemon.dataId];
        const name = pokemon.nickname ?? pData?.name ?? '???';

        const nameText = this.add.text(startX - 60, y + 8, name, { ...FONTS.caption, fontSize: mobileFontSize(11) });
        this.partyGroup.add(nameText);
        this.partyLabels.push(nameText);

        const lvl = this.add.text(startX - 60, y + 24, `Lv.${pokemon.level}`, FONTS.label);
        this.partyGroup.add(lvl);

        // HP fraction
        const hp = this.add.text(startX + 30, y + 8, `${pokemon.currentHp}/${pokemon.stats.hp}`, {
          ...FONTS.label, fontSize: mobileFontSize(10),
        });
        this.partyGroup.add(hp);

        if (pokemon.currentHp <= 0) {
          const fnt = this.add.text(startX + 50, y + 24, 'FNT', { ...FONTS.label, color: '#ff5555' });
          this.partyGroup.add(fnt);
        }
      } else {
        const empty = this.add.text(startX, y + slotH / 2 - 4, '—', { ...FONTS.caption, color: COLORS.textDim }).setOrigin(0.5);
        this.partyGroup.add(empty);
        this.partyLabels.push(empty);
      }
    }
  }

  private updateSelection(): void {
    const layout = ui(this);
    const gm = GameManager.getInstance();

    // Reset all slot highlights
    this.boxSlots.forEach(s => {
      s.setStrokeStyle(1, COLORS.border);
      s.setData('highlighted', false);
    });
    this.partySlots.forEach(s => {
      s.setStrokeStyle(1, COLORS.border);
      s.setData('highlighted', false);
    });

    // Held indicator
    this.heldIndicator?.destroy();
    if (this.heldPokemon) {
      const pData = pokemonData[this.heldPokemon.pokemon.dataId];
      const name = this.heldPokemon.pokemon.nickname ?? pData?.name ?? '???';
      this.heldIndicator = this.add.text(layout.cx, layout.h - 76, `✋ Holding: ${name}`, {
        ...FONTS.body, color: COLORS.textHighlight,
      }).setOrigin(0.5);
    }

    if (this.mode === 'box' || (this.mode === 'moving' && this.heldPokemon?.source !== 'party')) {
      // Highlight box slot
      const slot = this.boxSlots[this.boxCursor];
      if (slot) {
        slot.setStrokeStyle(2, COLORS.borderHighlight);
        slot.setData('highlighted', true);
      }

      // Detail text
      const box = gm.getBox(this.currentBox);
      const pokemon = box[this.boxCursor];
      this.showDetail(pokemon);
    } else {
      // Highlight party slot
      const slot = this.partySlots[this.partyCursor];
      if (slot) {
        slot.setStrokeStyle(2, COLORS.borderHighlight);
        slot.setData('highlighted', true);
      }

      const party = gm.getParty();
      const pokemon = party[this.partyCursor];
      this.showDetail(pokemon);
    }

    // Mode text
    if (this.heldPokemon) {
      this.modeText.setText('ENTER: place  |  ESC: put back');
    } else if (this.mode === 'box') {
      this.modeText.setText('Box mode  |  ENTER: pick up');
    } else {
      this.modeText.setText('Party mode  |  ENTER: pick up');
    }
  }

  private showDetail(pokemon?: PokemonInstance): void {
    if (!pokemon) {
      this.detailText.setText('Empty slot');
      return;
    }
    const pData = pokemonData[pokemon.dataId];
    const name = pokemon.nickname ?? pData?.name ?? '???';
    const types = pData?.types.join('/') ?? '???';
    this.detailText.setText(`${name}  Lv.${pokemon.level}  ${types}  HP: ${pokemon.currentHp}/${pokemon.stats.hp}`);
  }
}
