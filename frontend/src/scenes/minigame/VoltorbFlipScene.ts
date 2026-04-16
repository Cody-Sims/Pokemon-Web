import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { COLORS, FONTS, mobileFontSize } from '@ui/theme';
import { NinePatchPanel } from '@ui/NinePatchPanel';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';

interface CardData {
  value: number; // 0 = Voltorb, 1-3 = multiplier
  flipped: boolean;
}

export class VoltorbFlipScene extends Phaser.Scene {
  private grid: CardData[][] = [];
  private cardSprites: Phaser.GameObjects.Container[][] = [];
  private cursorX = 0;
  private cursorY = 0;
  private cursorRect!: Phaser.GameObjects.Graphics;
  private score = 0;
  private roundScore = 1;
  private level = 1;
  private totalCoins = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private totalText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private gameOver = false;
  private rowHints: { sum: number; voltorbs: number }[] = [];
  private colHints: { sum: number; voltorbs: number }[] = [];

  constructor() {
    super({ key: 'VoltorbFlipScene' });
  }

  create(): void {
    this.gameOver = false;
    this.score = 0;
    this.roundScore = 1;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark);

    new NinePatchPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 760, 560, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 30, 'VOLTORB FLIP', {
      ...FONTS.heading, fontSize: mobileFontSize(22), color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Generate board
    this.generateBoard();
    this.drawBoard();
    this.drawHints();

    // HUD
    this.levelText = this.add.text(40, 70, `Level: ${this.level}`, {
      ...FONTS.body, fontSize: mobileFontSize(14),
    });
    this.scoreText = this.add.text(40, 95, `Round: ×${this.roundScore}`, {
      ...FONTS.body, fontSize: mobileFontSize(14),
    });
    this.totalText = this.add.text(40, 120, `Total Coins: ${this.totalCoins}`, {
      ...FONTS.body, fontSize: mobileFontSize(14),
    });
    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '', {
      ...FONTS.body, fontSize: mobileFontSize(14), color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Cursor
    this.cursorX = 0;
    this.cursorY = 0;
    this.cursorRect = this.add.graphics();
    this.updateCursor();

    // Input
    this.input.keyboard!.on('keydown-UP', () => { if (!this.gameOver) { this.cursorY = (this.cursorY - 1 + 5) % 5; this.updateCursor(); } });
    this.input.keyboard!.on('keydown-DOWN', () => { if (!this.gameOver) { this.cursorY = (this.cursorY + 1) % 5; this.updateCursor(); } });
    this.input.keyboard!.on('keydown-LEFT', () => { if (!this.gameOver) { this.cursorX = (this.cursorX - 1 + 5) % 5; this.updateCursor(); } });
    this.input.keyboard!.on('keydown-RIGHT', () => { if (!this.gameOver) { this.cursorX = (this.cursorX + 1) % 5; this.updateCursor(); } });
    this.input.keyboard!.on('keydown-ENTER', () => this.onConfirm());
    this.input.keyboard!.on('keydown-ESC', () => this.exitGame());

    // Close hint
    this.add.text(GAME_WIDTH - 30, GAME_HEIGHT - 20, 'ESC to quit', {
      ...FONTS.caption,
    }).setOrigin(1, 1);
  }

  private generateBoard(): void {
    // Determine voltorb count and point distribution based on level
    const voltorbCount = Math.min(6 + this.level, 15);
    const twoCount = Math.max(3, 6 - Math.floor(this.level / 2));
    const threeCount = Math.min(this.level, 5);

    // Fill grid with 1s first
    this.grid = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => ({ value: 1, flipped: false }))
    );

    // Place Voltorbs
    const positions = this.getShuffledPositions();
    let idx = 0;
    for (let i = 0; i < voltorbCount && idx < positions.length; i++, idx++) {
      const [r, c] = positions[idx];
      this.grid[r][c].value = 0;
    }
    // Place 2s
    for (let i = 0; i < twoCount && idx < positions.length; i++, idx++) {
      const [r, c] = positions[idx];
      if (this.grid[r][c].value === 0) { i--; continue; }
      this.grid[r][c].value = 2;
    }
    // Place 3s
    for (let i = 0; i < threeCount && idx < positions.length; i++, idx++) {
      const [r, c] = positions[idx];
      if (this.grid[r][c].value === 0 || this.grid[r][c].value > 1) { i--; continue; }
      this.grid[r][c].value = 3;
    }

    // Compute hints
    this.rowHints = [];
    this.colHints = [];
    for (let r = 0; r < 5; r++) {
      let sum = 0, v = 0;
      for (let c = 0; c < 5; c++) {
        if (this.grid[r][c].value === 0) v++;
        else sum += this.grid[r][c].value;
      }
      this.rowHints.push({ sum, voltorbs: v });
    }
    for (let c = 0; c < 5; c++) {
      let sum = 0, v = 0;
      for (let r = 0; r < 5; r++) {
        if (this.grid[r][c].value === 0) v++;
        else sum += this.grid[r][c].value;
      }
      this.colHints.push({ sum, voltorbs: v });
    }
  }

  private getShuffledPositions(): [number, number][] {
    const positions: [number, number][] = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++)
        positions.push([r, c]);
    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    return positions;
  }

  private readonly GRID_X = 220;
  private readonly GRID_Y = 80;
  private readonly CELL_SIZE = 72;

  private drawBoard(): void {
    this.cardSprites = [];
    for (let r = 0; r < 5; r++) {
      this.cardSprites[r] = [];
      for (let c = 0; c < 5; c++) {
        const x = this.GRID_X + c * this.CELL_SIZE + this.CELL_SIZE / 2;
        const y = this.GRID_Y + r * this.CELL_SIZE + this.CELL_SIZE / 2;

        const container = this.add.container(x, y);

        // Card back
        const bg = this.add.graphics();
        bg.fillStyle(0x334466, 1);
        bg.fillRoundedRect(-30, -30, 60, 60, 6);
        bg.lineStyle(2, COLORS.border, 1);
        bg.strokeRoundedRect(-30, -30, 60, 60, 6);
        container.add(bg);

        const label = this.add.text(0, 0, '?', {
          fontSize: '28px', color: COLORS.textWhite, fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(label);

        // Click handler
        const hitArea = this.add.rectangle(0, 0, 60, 60).setInteractive({ useHandCursor: true });
        hitArea.setAlpha(0.001);
        container.add(hitArea);
        hitArea.on('pointerdown', () => {
          if (!this.gameOver) {
            this.cursorX = c;
            this.cursorY = r;
            this.updateCursor();
            this.flipCard(r, c);
          }
        });

        this.cardSprites[r][c] = container;
      }
    }
  }

  private drawHints(): void {
    // Row hints (right of grid)
    for (let r = 0; r < 5; r++) {
      const x = this.GRID_X + 5 * this.CELL_SIZE + 30;
      const y = this.GRID_Y + r * this.CELL_SIZE + this.CELL_SIZE / 2;
      this.add.text(x, y, `${this.rowHints[r].sum}`, {
        ...FONTS.body, fontSize: '16px', color: COLORS.textWhite,
      }).setOrigin(0.5);
      this.add.text(x, y + 16, `💣${this.rowHints[r].voltorbs}`, {
        fontSize: '12px', color: COLORS.textDanger, fontFamily: 'monospace',
      }).setOrigin(0.5);
    }
    // Column hints (below grid)
    for (let c = 0; c < 5; c++) {
      const x = this.GRID_X + c * this.CELL_SIZE + this.CELL_SIZE / 2;
      const y = this.GRID_Y + 5 * this.CELL_SIZE + 16;
      this.add.text(x, y, `${this.colHints[c].sum}`, {
        ...FONTS.body, fontSize: '16px', color: COLORS.textWhite,
      }).setOrigin(0.5);
      this.add.text(x, y + 16, `💣${this.colHints[c].voltorbs}`, {
        fontSize: '12px', color: COLORS.textDanger, fontFamily: 'monospace',
      }).setOrigin(0.5);
    }
  }

  private updateCursor(): void {
    this.cursorRect.clear();
    const x = this.GRID_X + this.cursorX * this.CELL_SIZE + this.CELL_SIZE / 2;
    const y = this.GRID_Y + this.cursorY * this.CELL_SIZE + this.CELL_SIZE / 2;
    this.cursorRect.lineStyle(3, 0xffcc00, 1);
    this.cursorRect.strokeRoundedRect(x - 33, y - 33, 66, 66, 8);
    this.cursorRect.setDepth(10);
  }

  private onConfirm(): void {
    if (this.gameOver) {
      // Restart or exit
      this.scene.restart();
      return;
    }
    this.flipCard(this.cursorY, this.cursorX);
  }

  private flipCard(r: number, c: number): void {
    const card = this.grid[r][c];
    if (card.flipped) return;
    card.flipped = true;

    // Update visual
    const container = this.cardSprites[r][c];
    container.removeAll(true);

    const bg = this.add.graphics();
    const val = card.value;

    if (val === 0) {
      // Voltorb!
      bg.fillStyle(0xcc3333, 1);
      bg.fillRoundedRect(-30, -30, 60, 60, 6);
      bg.lineStyle(2, 0xff4444, 1);
      bg.strokeRoundedRect(-30, -30, 60, 60, 6);
      container.add(bg);
      container.add(this.add.text(0, 0, 'V', {
        fontSize: '32px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5));

      AudioManager.getInstance().playSFX(SFX.ERROR);
      this.messageText.setText(`Voltorb! You lost ${this.roundScore > 1 ? this.roundScore + ' points' : 'this round'}!`);
      this.roundScore = 1;
      this.gameOver = true;
      this.revealAll();
      this.time.delayedCall(2000, () => {
        this.messageText.setText('Press ENTER to try again, ESC to quit.');
      });
    } else {
      // Number card
      const colors = [0, 0x446688, 0x448844, 0xccaa33];
      bg.fillStyle(colors[val], 1);
      bg.fillRoundedRect(-30, -30, 60, 60, 6);
      bg.lineStyle(2, 0x88aacc, 1);
      bg.strokeRoundedRect(-30, -30, 60, 60, 6);
      container.add(bg);
      container.add(this.add.text(0, 0, String(val), {
        fontSize: '32px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5));

      this.roundScore *= val;
      this.scoreText.setText(`Round: ×${this.roundScore}`);
      AudioManager.getInstance().playSFX(SFX.CONFIRM);

      // Check win: all non-voltorb tiles flipped
      if (this.checkWin()) {
        this.totalCoins += this.roundScore;
        this.totalText.setText(`Total Coins: ${this.totalCoins}`);
        this.messageText.setText(`Round clear! +${this.roundScore} coins!`);
        GameManager.getInstance().addMoney(this.roundScore * 10);
        this.gameOver = true;
        this.level++;
        this.revealAll();
        this.time.delayedCall(2000, () => {
          this.messageText.setText('Press ENTER for next level, ESC to quit.');
        });
      }
    }
  }

  private checkWin(): boolean {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (this.grid[r][c].value > 0 && !this.grid[r][c].flipped) return false;
      }
    }
    return true;
  }

  private revealAll(): void {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (!this.grid[r][c].flipped) {
          const container = this.cardSprites[r][c];
          container.setAlpha(0.5);
          const val = this.grid[r][c].value;
          // Update label
          const children = container.list;
          for (const child of children) {
            if (child instanceof Phaser.GameObjects.Text) {
              child.setText(val === 0 ? 'V' : String(val));
              child.setColor(val === 0 ? '#ff5555' : '#aaaacc');
            }
          }
        }
      }
    }
  }

  private exitGame(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
    this.scene.resume('OverworldScene');
  }
}
