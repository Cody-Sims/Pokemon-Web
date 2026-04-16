import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { moveTutorData, tmData, canLearnMove } from '@data/tm-data';
import type { MoveTutorData } from '@data/tm-data';
import { moveData } from '@data/moves';
import { pokemonData } from '@data/pokemon';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { MenuController } from '@ui/controls/MenuController';
import { COLORS, FONTS, TYPE_COLORS } from '@ui/theme';
import { SFX } from '@utils/audio-keys';
import type { PokemonInstance, MoveInstance, MoveData } from '@data/interfaces';

type TutorMode = 'move-list' | 'party-select' | 'move-replace' | 'confirm' | 'message';

interface SceneData {
  tutorId?: string;
  /** When launched from inventory for TM usage */
  tmMode?: boolean;
  tmMoveId?: string;
}

export class MoveTutorScene extends Phaser.Scene {
  private mode: TutorMode = 'move-list';
  private tutor!: MoveTutorData;
  private tmMode = false;
  private tmMoveId = '';

  // Move list state
  private moveListPanel?: NinePatchPanel;
  private moveTexts: Phaser.GameObjects.Text[] = [];
  private moveController?: MenuController;
  private selectedMoveIdx = 0;
  private moveScrollOffset = 0;
  private readonly moveMaxVisible = 6;

  // Party select state
  private partyPanel?: NinePatchPanel;
  private partyTexts: Phaser.GameObjects.Text[] = [];
  private partyController?: MenuController;
  private eligibleParty: { pokemon: PokemonInstance; partyIdx: number }[] = [];

  // Move replace state
  private replacePanel?: NinePatchPanel;
  private replaceTexts: Phaser.GameObjects.Text[] = [];
  private replaceController?: MenuController;
  private replacePokemon?: PokemonInstance;

  // UI groups for cleanup
  private moveGroup!: Phaser.GameObjects.Group;
  private partyGroup!: Phaser.GameObjects.Group;
  private replaceGroup!: Phaser.GameObjects.Group;
  private headerText?: Phaser.GameObjects.Text;
  private costText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MoveTutorScene' });
  }

  create(data: SceneData): void {
    this.moveGroup = this.add.group();
    this.partyGroup = this.add.group();
    this.replaceGroup = this.add.group();
    this.tmMode = data.tmMode ?? false;

    if (this.tmMode && data.tmMoveId) {
      // TM usage mode — go straight to party select for a single move
      this.tmMoveId = data.tmMoveId;
      const move = moveData[this.tmMoveId];
      // Build a fake tutor with one move
      this.tutor = {
        id: '__tm__',
        name: 'TM',
        location: '',
        moves: [{ moveId: this.tmMoveId, cost: 0, costType: 'money' }],
      };
      this.drawBackground();
      this.headerText = this.add.text(GAME_WIDTH / 2, 28, `Teach ${move?.name ?? this.tmMoveId}?`, {
        ...FONTS.heading, fontSize: '22px',
      }).setOrigin(0.5);
      this.selectedMoveIdx = 0;
      this.showPartySelect();
      return;
    }

    const tutorId = data.tutorId ?? '';
    this.tutor = moveTutorData[tutorId];
    if (!this.tutor) {
      this.scene.stop();
      return;
    }

    this.drawBackground();
    this.headerText = this.add.text(GAME_WIDTH / 2, 28, this.tutor.name, {
      ...FONTS.heading, fontSize: '22px',
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 52, 'Which move would you like to teach?', FONTS.bodySmall).setOrigin(0.5);

    this.showMoveList();
    this.input.keyboard!.on('keydown-ESC', () => this.handleCancel());
  }

  private drawBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark);
    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 20, GAME_HEIGHT - 20, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });
  }

  // ─── Move List ───
  private showMoveList(): void {
    this.mode = 'move-list';
    this.clearGroup(this.moveGroup);
    this.moveTexts = [];
    this.moveScrollOffset = 0;

    this.moveListPanel = new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, GAME_WIDTH - 60, 280, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.7,
      borderColor: COLORS.border,
      cornerRadius: 6,
    });
    this.moveGroup.add(this.moveListPanel.getGraphics());

    this.renderMoveItems();

    this.moveController = new MenuController(this, {
      columns: 1,
      itemCount: this.tutor.moves.length,
      wrap: true,
      onMove: (idx) => {
        this.ensureMoveVisible(idx);
        this.highlightMoveItem(idx);
      },
      onConfirm: (idx) => {
        this.selectedMoveIdx = idx;
        AudioManager.getInstance().playSFX(SFX.CONFIRM);
        this.showPartySelect();
      },
      onCancel: () => this.handleCancel(),
      audioFeedback: true,
    });
    this.highlightMoveItem(0);
  }

  private renderMoveItems(): void {
    this.moveTexts.forEach(t => t.destroy());
    this.moveTexts = [];
    // Remove old move text items from group
    this.moveGroup.getChildren().forEach(c => {
      if (c instanceof Phaser.GameObjects.Text) c.destroy();
    });

    const startY = 100;
    const itemH = 40;
    const endIdx = Math.min(this.moveScrollOffset + this.moveMaxVisible, this.tutor.moves.length);

    for (let vi = this.moveScrollOffset; vi < endIdx; vi++) {
      const entry = this.tutor.moves[vi];
      const move = moveData[entry.moveId];
      const y = startY + (vi - this.moveScrollOffset) * itemH;

      // Type color dot
      const typeColor = TYPE_COLORS[move?.type ?? 'normal'] ?? 0xa8a878;
      const dot = this.add.circle(50, y + 10, 6, typeColor);
      this.moveGroup.add(dot);

      // Move name
      const nameT = this.add.text(65, y, move?.name ?? entry.moveId, {
        ...FONTS.body, fontSize: '15px',
      });
      this.moveGroup.add(nameT);
      this.moveTexts.push(nameT);

      // PP / Power
      const pp = move?.pp ?? '—';
      const power = move?.power ?? '—';
      const statsT = this.add.text(350, y, `PP: ${pp}  Pow: ${power}`, FONTS.bodySmall);
      this.moveGroup.add(statsT);

      // Cost
      const costLabel = entry.costType === 'money'
        ? `₽${entry.cost}`
        : `${entry.cost} Heart Scale${entry.cost !== 1 ? 's' : ''}`;
      const costT = this.add.text(550, y, costLabel, {
        ...FONTS.bodySmall, color: COLORS.textHighlight,
      });
      this.moveGroup.add(costT);
    }

    // Scroll indicators
    if (this.moveScrollOffset > 0) {
      const up = this.add.text(GAME_WIDTH / 2, startY - 16, '▲', {
        ...FONTS.caption, color: COLORS.textHighlight,
      }).setOrigin(0.5);
      this.moveGroup.add(up);
    }
    if (endIdx < this.tutor.moves.length) {
      const down = this.add.text(GAME_WIDTH / 2, startY + this.moveMaxVisible * itemH, '▼', {
        ...FONTS.caption, color: COLORS.textHighlight,
      }).setOrigin(0.5);
      this.moveGroup.add(down);
    }
  }

  private ensureMoveVisible(idx: number): void {
    if (idx < this.moveScrollOffset) {
      this.moveScrollOffset = idx;
      this.renderMoveItems();
    } else if (idx >= this.moveScrollOffset + this.moveMaxVisible) {
      this.moveScrollOffset = idx - this.moveMaxVisible + 1;
      this.renderMoveItems();
    }
  }

  private highlightMoveItem(idx: number): void {
    const viewIdx = idx - this.moveScrollOffset;
    this.moveTexts.forEach((t, i) => {
      t.setColor(i === viewIdx ? COLORS.textHighlight : COLORS.textWhite);
    });
  }

  // ─── Party Select ───
  private showPartySelect(): void {
    this.mode = 'party-select';
    this.moveController?.setDisabled(true);
    this.clearGroup(this.partyGroup);
    this.partyTexts = [];

    const tutorMove = this.tutor.moves[this.selectedMoveIdx];
    const moveId = tutorMove.moveId;
    const gm = GameManager.getInstance();
    const party = gm.getParty();

    this.eligibleParty = party
      .map((p, i) => ({ pokemon: p, partyIdx: i }))
      .filter(({ pokemon }) => {
        // Check compatibility
        if (!canLearnMove(pokemon.dataId, moveId)) return false;
        // Check if already knows this move
        if (pokemon.moves.some(m => m.moveId === moveId)) return false;
        return true;
      });

    if (this.eligibleParty.length === 0) {
      this.showMessage('No Pokémon in your party can learn this move.');
      return;
    }

    // Check cost affordability
    if (!this.tmMode) {
      if (tutorMove.costType === 'money' && gm.getMoney() < tutorMove.cost) {
        this.showMessage("You don't have enough money!");
        return;
      }
      if (tutorMove.costType === 'heart-scale' && gm.getItemCount('heart-scale') < tutorMove.cost) {
        this.showMessage("You don't have enough Heart Scales!");
        return;
      }
    }

    const panelH = this.eligibleParty.length * 44 + 40;
    this.partyPanel = new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 400, panelH, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      cornerRadius: 6,
    });
    this.partyGroup.add(this.partyPanel.getGraphics());

    const titleT = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40 - panelH / 2 + 12, 'Select a Pokémon:', {
      ...FONTS.bodySmall, color: COLORS.textHighlight,
    }).setOrigin(0.5);
    this.partyGroup.add(titleT);

    this.partyTexts = this.eligibleParty.map(({ pokemon }, i) => {
      const pData = pokemonData[pokemon.dataId];
      const name = pokemon.nickname ?? pData?.name ?? '???';
      const typesStr = pData?.types.join('/') ?? '';
      const label = `${name}  Lv.${pokemon.level}  (${typesStr})`;
      const startOffset = GAME_HEIGHT / 2 + 40 - panelH / 2 + 36;
      const t = this.add.text(GAME_WIDTH / 2, startOffset + i * 44, label, {
        ...FONTS.body, fontSize: '14px',
      }).setOrigin(0.5);
      this.partyGroup.add(t);
      return t;
    });

    this.partyTexts[0]?.setColor(COLORS.textHighlight);

    this.partyController = new MenuController(this, {
      columns: 1,
      itemCount: this.eligibleParty.length,
      wrap: true,
      onMove: (idx) => {
        this.partyTexts.forEach((t, i) => t.setColor(i === idx ? COLORS.textHighlight : COLORS.textWhite));
      },
      onConfirm: (idx) => {
        AudioManager.getInstance().playSFX(SFX.CONFIRM);
        this.selectPokemon(idx);
      },
      onCancel: () => {
        this.clearGroup(this.partyGroup);
        this.partyController?.destroy();
        if (this.tmMode) {
          this.scene.stop();
        } else {
          this.moveController?.setDisabled(false);
          this.mode = 'move-list';
        }
      },
      audioFeedback: true,
    });
  }

  private selectPokemon(eligibleIdx: number): void {
    const { pokemon } = this.eligibleParty[eligibleIdx];
    this.replacePokemon = pokemon;
    const moveId = this.tutor.moves[this.selectedMoveIdx].moveId;
    const move = moveData[moveId];

    if (pokemon.moves.length < 4) {
      // Learn immediately
      this.teachMove(pokemon, moveId);
    } else {
      // Need to replace a move
      this.showMoveReplace(pokemon, moveId);
    }
  }

  // ─── Move Replace ───
  private showMoveReplace(pokemon: PokemonInstance, newMoveId: string): void {
    this.mode = 'move-replace';
    this.partyController?.setDisabled(true);
    this.clearGroup(this.replaceGroup);
    this.replaceTexts = [];

    const newMove = moveData[newMoveId];
    const panelH = 5 * 40 + 50;
    this.replacePanel = new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 500, panelH, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.97,
      borderColor: COLORS.borderHighlight,
      cornerRadius: 6,
    });
    this.replaceGroup.add(this.replacePanel.getGraphics());

    const pData = pokemonData[pokemon.dataId];
    const pokeName = pokemon.nickname ?? pData?.name ?? '???';
    const headerT = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 16,
      `${pokeName} wants to learn ${newMove?.name ?? newMoveId}.`, {
        ...FONTS.bodySmall, color: COLORS.textHighlight,
      }).setOrigin(0.5);
    this.replaceGroup.add(headerT);

    const subT = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - panelH / 2 + 36,
      'Choose a move to forget:', FONTS.caption).setOrigin(0.5);
    this.replaceGroup.add(subT);

    // Show current 4 moves + "Don't learn" option
    const options = [...pokemon.moves.map(m => {
      const md = moveData[m.moveId];
      return md ? `${md.name} (${md.type} PP:${m.currentPp}/${md.pp})` : m.moveId;
    }), "Don't learn"];

    const startY = GAME_HEIGHT / 2 - panelH / 2 + 60;
    this.replaceTexts = options.map((label, i) => {
      const t = this.add.text(GAME_WIDTH / 2, startY + i * 40, label, {
        ...FONTS.body, fontSize: '14px',
      }).setOrigin(0.5);
      this.replaceGroup.add(t);
      return t;
    });

    this.replaceTexts[0]?.setColor(COLORS.textHighlight);

    this.replaceController = new MenuController(this, {
      columns: 1,
      itemCount: options.length,
      wrap: true,
      onMove: (idx) => {
        this.replaceTexts.forEach((t, i) => t.setColor(i === idx ? COLORS.textHighlight : COLORS.textWhite));
      },
      onConfirm: (idx) => {
        if (idx === pokemon.moves.length) {
          // "Don't learn"
          AudioManager.getInstance().playSFX(SFX.CANCEL);
          this.closeReplace();
          return;
        }
        // Forget the selected move and replace
        const forgottenMove = moveData[pokemon.moves[idx].moveId];
        pokemon.moves[idx] = { moveId: newMoveId, currentPp: moveData[newMoveId]?.pp ?? 5 };
        this.deductCost();
        AudioManager.getInstance().playSFX(SFX.CONFIRM);
        this.closeReplace();
        this.clearGroup(this.partyGroup);
        this.partyController?.destroy();
        const newMoveName = moveData[newMoveId]?.name ?? newMoveId;
        const pName = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
        this.showMessage(`${pName} forgot ${forgottenMove?.name ?? 'a move'} and learned ${newMoveName}!`, true);
      },
      onCancel: () => {
        AudioManager.getInstance().playSFX(SFX.CANCEL);
        this.closeReplace();
      },
      audioFeedback: true,
    });
  }

  private closeReplace(): void {
    this.replaceController?.destroy();
    this.clearGroup(this.replaceGroup);
    if (this.mode === 'move-replace') {
      this.partyController?.setDisabled(false);
      this.mode = 'party-select';
    }
  }

  // ─── Teach Move ───
  private teachMove(pokemon: PokemonInstance, moveId: string): void {
    const move = moveData[moveId];
    pokemon.moves.push({ moveId, currentPp: move?.pp ?? 5 });
    this.deductCost();
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.clearGroup(this.partyGroup);
    this.partyController?.destroy();
    const pName = pokemon.nickname ?? pokemonData[pokemon.dataId]?.name ?? '???';
    const moveName = move?.name ?? moveId;
    this.showMessage(`${pName} learned ${moveName}!`, true);
  }

  private deductCost(): void {
    if (this.tmMode) return; // TMs are free to use
    const tutorMove = this.tutor.moves[this.selectedMoveIdx];
    const gm = GameManager.getInstance();
    if (tutorMove.costType === 'money') {
      gm.spendMoney(tutorMove.cost);
    } else {
      gm.removeItem('heart-scale', tutorMove.cost);
    }
  }

  // ─── Message ───
  private showMessage(text: string, exitAfter = false): void {
    this.mode = 'message';
    this.moveController?.setDisabled(true);

    const msgPanel = new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT - 60, GAME_WIDTH - 60, 60, {
      fillColor: 0x0a0a18,
      fillAlpha: 0.95,
      borderColor: COLORS.borderLight,
      cornerRadius: 6,
    });

    const msgText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, text, {
      ...FONTS.body, fontSize: '15px', color: COLORS.textSuccess,
      wordWrap: { width: GAME_WIDTH - 100 },
    }).setOrigin(0.5);

    const dismiss = () => {
      msgPanel.destroy();
      msgText.destroy();
      if (exitAfter) {
        this.scene.stop();
      } else {
        this.moveController?.setDisabled(false);
        this.mode = this.tmMode ? 'party-select' : 'move-list';
      }
    };

    this.input.keyboard!.once('keydown-ENTER', dismiss);
    this.input.keyboard!.once('keydown-SPACE', dismiss);
    this.input.keyboard!.once('keydown-ESC', dismiss);
  }

  private handleCancel(): void {
    if (this.mode === 'message') return;
    if (this.mode === 'move-replace') {
      this.closeReplace();
      return;
    }
    if (this.mode === 'party-select') {
      this.clearGroup(this.partyGroup);
      this.partyController?.destroy();
      if (this.tmMode) {
        this.scene.stop();
      } else {
        this.moveController?.setDisabled(false);
        this.mode = 'move-list';
      }
      return;
    }
    this.scene.stop();
  }

  private clearGroup(group: Phaser.GameObjects.Group): void {
    group.clear(true, true);
  }
}
