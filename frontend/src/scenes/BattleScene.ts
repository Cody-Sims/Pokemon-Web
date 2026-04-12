import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon-data';
import { BattleManager, BattleConfig } from '@battle/BattleManager';
import { EncounterSystem } from '@systems/EncounterSystem';
import { GameManager } from '@managers/GameManager';
import { ExperienceCalculator } from '@battle/ExperienceCalculator';

export class BattleScene extends Phaser.Scene {
  public battleManager!: BattleManager;
  public playerPokemon!: PokemonInstance;
  public enemyPokemon!: PokemonInstance;

  // Visual elements accessible by BattleUIScene
  public enemySprite!: Phaser.GameObjects.Image;
  public playerSprite!: Phaser.GameObjects.Image;
  public enemyNameText!: Phaser.GameObjects.Text;
  public playerNameText!: Phaser.GameObjects.Text;
  public playerLevelText!: Phaser.GameObjects.Text;
  public enemyHpBar!: Phaser.GameObjects.Rectangle;
  public enemyHpBg!: Phaser.GameObjects.Rectangle;
  public playerHpBar!: Phaser.GameObjects.Rectangle;
  public playerHpBg!: Phaser.GameObjects.Rectangle;
  public enemyHpText!: Phaser.GameObjects.Text;
  public playerHpText!: Phaser.GameObjects.Text;
  public expBar!: Phaser.GameObjects.Rectangle;
  public expBarBg!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(data?: { enemyPokemon?: PokemonInstance }): void {
    const gm = GameManager.getInstance();

    // Initialize starter if party is empty
    if (gm.getParty().length === 0) {
      const starter = EncounterSystem.createWildPokemon(1, 5);
      starter.nickname = 'Bulbasaur';
      gm.addToParty(starter);
    }

    // Use first alive party member
    this.playerPokemon = gm.getParty().find(p => p.currentHp > 0) ?? gm.getParty()[0];

    // Create enemy pokemon
    this.enemyPokemon = data?.enemyPokemon ?? EncounterSystem.createWildPokemon(16, 3);

    const enemyData = pokemonData[this.enemyPokemon.dataId];
    const playerData = pokemonData[this.playerPokemon.dataId];

    // Setup BattleManager
    const config: BattleConfig = {
      type: 'wild',
      playerParty: gm.getParty(),
      enemyParty: [this.enemyPokemon],
    };
    this.battleManager = new BattleManager(config);

    // ── Draw battle scene ──
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // Ground areas
    this.add.ellipse(550, 200, 200, 50, 0x2d4a22);
    this.add.ellipse(200, 420, 240, 60, 0x2d4a22);

    // Enemy pokemon sprite (front view)
    this.enemySprite = this.add.image(550, 150, enemyData.spriteKeys.front).setScale(2);

    // Player pokemon sprite (back view, larger)
    this.playerSprite = this.add.image(200, 370, playerData.spriteKeys.back).setScale(3);

    // ── Enemy info box (top-left) ──
    this.add.rectangle(170, 55, 300, 60, 0x222222, 0.85).setStrokeStyle(1, 0x888888);
    this.enemyNameText = this.add.text(40, 35, `${enemyData?.name ?? '???'}`, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' });
    this.add.text(240, 35, `Lv${this.enemyPokemon.level}`, { fontSize: '14px', color: '#ffffff' });
    this.enemyHpBg = this.add.rectangle(40, 62, 220, 10, 0x333333).setOrigin(0, 0.5);
    this.enemyHpBar = this.add.rectangle(40, 62, 220, 10, 0x4caf50).setOrigin(0, 0.5);

    // ── Player info box (bottom-right) ──
    this.add.rectangle(GAME_WIDTH - 170, 325, 300, 100, 0x222222, 0.85).setStrokeStyle(1, 0x888888);
    this.playerNameText = this.add.text(GAME_WIDTH - 310, 285, `${playerData?.name ?? '???'}`, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' });
    this.playerLevelText = this.add.text(GAME_WIDTH - 120, 285, `Lv${this.playerPokemon.level}`, { fontSize: '14px', color: '#ffffff' });
    this.playerHpBg = this.add.rectangle(GAME_WIDTH - 310, 310, 220, 10, 0x333333).setOrigin(0, 0.5);
    this.playerHpBar = this.add.rectangle(GAME_WIDTH - 310, 310, 220, 10, 0x4caf50).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(GAME_WIDTH - 310, 320, `${this.playerPokemon.currentHp} / ${this.playerPokemon.stats.hp}`, { fontSize: '12px', color: '#ffffff' });

    // EXP bar
    const expX = GAME_WIDTH - 310;
    const expY = 338;
    this.add.text(expX - 30, expY - 3, 'EXP', { fontSize: '10px', color: '#aaaaaa' });
    this.expBarBg = this.add.rectangle(expX, expY, 220, 6, 0x333333).setOrigin(0, 0.5);
    this.expBar = this.add.rectangle(expX, expY, 220 * this.getExpPercent(), 6, 0x4488ff).setOrigin(0, 0.5);

    // Launch battle UI overlay
    this.scene.launch('BattleUIScene');
  }

  /** Get EXP progress as 0-1 fraction toward next level. */
  getExpPercent(): number {
    const currentLevelExp = ExperienceCalculator.expForLevel(this.playerPokemon.level);
    const nextLevelExp = ExperienceCalculator.expForLevel(this.playerPokemon.level + 1);
    const range = nextLevelExp - currentLevelExp;
    if (range <= 0) return 1;
    const progress = this.playerPokemon.exp - currentLevelExp;
    return Math.max(0, Math.min(1, progress / range));
  }

  /** Update HP bar widths based on current HP values. */
  updateHpBars(): void {
    const enemyPct = Math.max(0, this.enemyPokemon.currentHp / this.enemyPokemon.stats.hp);
    const playerPct = Math.max(0, this.playerPokemon.currentHp / this.playerPokemon.stats.hp);

    this.tweens.add({ targets: this.enemyHpBar, displayWidth: 220 * enemyPct, duration: 400 });
    this.tweens.add({ targets: this.playerHpBar, displayWidth: 220 * playerPct, duration: 400 });

    this.enemyHpBar.fillColor = enemyPct > 0.5 ? 0x4caf50 : enemyPct > 0.2 ? 0xffeb3b : 0xf44336;
    this.playerHpBar.fillColor = playerPct > 0.5 ? 0x4caf50 : playerPct > 0.2 ? 0xffeb3b : 0xf44336;

    this.playerHpText.setText(`${Math.max(0, this.playerPokemon.currentHp)} / ${this.playerPokemon.stats.hp}`);
  }

  /** Animate the EXP bar filling. */
  animateExpBar(targetPercent: number, duration = 600): void {
    this.tweens.add({
      targets: this.expBar,
      displayWidth: 220 * targetPercent,
      duration,
    });
  }

  /** Update the level display after leveling up. */
  updateLevelDisplay(): void {
    this.playerLevelText.setText(`Lv${this.playerPokemon.level}`);
    // Heal HP to new max after level up (stat recalculated by ExperienceCalculator)
    this.playerHpText.setText(`${this.playerPokemon.currentHp} / ${this.playerPokemon.stats.hp}`);
  }

  /** Flash a sprite to indicate taking damage. */
  flashSprite(sprite: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: sprite,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 2,
    });
  }

  /** Faint animation — sprite drops and fades. */
  faintSprite(sprite: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: sprite,
      y: sprite.y + 40,
      alpha: 0,
      duration: 600,
    });
  }
}
