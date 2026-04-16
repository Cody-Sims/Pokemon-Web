import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { BattleManager, BattleConfig } from '@battle/BattleManager';
import { EncounterSystem } from '@systems/EncounterSystem';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { BGM } from '@utils/audio-keys';
import { ExperienceCalculator } from '@battle/ExperienceCalculator';
import { COLORS } from '@ui/theme';

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
  public returnScene = 'OverworldScene';
  public returnData: Record<string, unknown> = {};
  public isTrainerBattle = false;
  public trainerId = '';
  public enemyStatusText!: Phaser.GameObjects.Text;
  public playerStatusText!: Phaser.GameObjects.Text;
  public expBarBg!: Phaser.GameObjects.Rectangle;
  public expBarFill!: Phaser.GameObjects.Rectangle;

  private initData?: Record<string, unknown>;

  constructor() {
    super({ key: 'BattleScene' });
  }

  /** Capture scene data early so preload() can queue missing sprites. */
  init(data?: Record<string, unknown>): void {
    this.initData = data;
  }

  /** Ensure player + enemy front/back sprites are in the texture cache. */
  preload(): void {
    const data = this.initData;
    const gm = GameManager.getInstance();

    const enemy = data?.enemyPokemon as PokemonInstance | undefined;
    const player = gm.getParty().find(p => p.currentHp > 0) ?? gm.getParty()[0];

    const ids = new Set<number>();
    if (player) ids.add(player.dataId);
    if (enemy) ids.add(enemy.dataId);

    for (const id of ids) {
      const d = pokemonData[id];
      if (!d) continue;
      const name = d.name.toLowerCase();
      if (!this.textures.exists(d.spriteKeys.front)) {
        this.load.image(d.spriteKeys.front, `assets/sprites/pokemon/${name}-front.png`);
      }
      if (!this.textures.exists(d.spriteKeys.back)) {
        this.load.image(d.spriteKeys.back, `assets/sprites/pokemon/${name}-back.png`);
      }
    }
  }

  create(): void {
    const data = this.initData;
    const gm = GameManager.getInstance();

    // Store return info passed through from TransitionScene
    this.returnScene = (data?._returnScene as string) ?? 'OverworldScene';
    this.returnData = (data?._returnData as Record<string, unknown>) ?? {};
    this.isTrainerBattle = (data?.isTrainer as boolean) ?? false;
    this.trainerId = (data?.trainerId as string) ?? '';

    // Initialize starter if party is empty
    if (gm.getParty().length === 0) {
      const starter = EncounterSystem.createWildPokemon(1, 5);
      starter.nickname = 'Bulbasaur';
      gm.addToParty(starter);
    }

    // Use first alive party member
    this.playerPokemon = gm.getParty().find(p => p.currentHp > 0) ?? gm.getParty()[0];

    // Create enemy pokemon
    this.enemyPokemon = data?.enemyPokemon as PokemonInstance ?? EncounterSystem.createWildPokemon(16, 3);

    const enemyData = pokemonData[this.enemyPokemon.dataId];
    const playerData = pokemonData[this.playerPokemon.dataId];

    // Setup BattleManager
    const config: BattleConfig = {
      type: 'wild',
      playerParty: gm.getParty(),
      enemyParty: [this.enemyPokemon],
    };
    this.battleManager = new BattleManager(config);

    // ── Draw battle scene background ──
    const battleBg = data?.battleBg as string | undefined;
    if (battleBg && this.textures.exists(battleBg)) {
      // Use image-based battle background
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, battleBg);
      bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    } else {
      // Fallback: procedural solid background
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgPanel);
    }

    // Ground areas
    this.add.ellipse(550, 200, 200, 50, 0x2d4a22);
    this.add.ellipse(200, 420, 240, 60, 0x2d4a22);

    // ── Trainer sprites behind Pokémon (trainer battles only) ──
    const trainerSpriteKey = data?.trainerSpriteKey as string | undefined;
    if (this.isTrainerBattle && trainerSpriteKey && this.textures.exists(trainerSpriteKey)) {
      // Enemy trainer stands behind their Pokémon (upper-right, larger than pokemon)
      const enemyTrainer = this.add.image(GAME_WIDTH + 100, 120, trainerSpriteKey, 0);
      enemyTrainer.setScale(8).setAlpha(0.85).setDepth(0);
      this.tweens.add({ targets: enemyTrainer, x: 620, duration: 600, delay: 200, ease: 'Power2' });
    }
    // Enemy pokemon sprite (front view) — starts offscreen right, white tinted
    this.enemySprite = this.add.image(GAME_WIDTH + 100, 150, enemyData.spriteKeys.front)
      .setScale(2).setTint(0xffffff).setAlpha(0);

    // Player pokemon sprite (back view, larger) — starts offscreen left, white tinted
    this.playerSprite = this.add.image(-100, 370, playerData.spriteKeys.back)
      .setScale(4).setTint(0xffffff).setAlpha(0);

    // ── Enemy info box (top-left) — starts above screen ──
    const enemyInfoBox = this.add.rectangle(170, -60, 300, 60, COLORS.bgCard, 0.9).setStrokeStyle(1, COLORS.border);
    this.enemyNameText = this.add.text(40, -80, `${enemyData?.name ?? '???'}`, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' });
    const enemyLvlText = this.add.text(240, -80, `Lv${this.enemyPokemon.level}`, { fontSize: '14px', color: '#ffffff' });
    this.enemyHpBg = this.add.rectangle(40, -55, 220, 10, 0x333333).setOrigin(0, 0.5);
    this.enemyHpBar = this.add.rectangle(40, -55, 220, 10, 0x4caf50).setOrigin(0, 0.5);
    this.enemyStatusText = this.add.text(270, -80, '', { fontSize: '12px', color: '#ff6666', fontStyle: 'bold' });

    // ── Player info box (bottom-right) — starts below screen ──
    const playerInfoBox = this.add.rectangle(GAME_WIDTH - 170, GAME_HEIGHT + 60, 300, 70, COLORS.bgCard, 0.9).setStrokeStyle(1, COLORS.border);
    this.playerNameText = this.add.text(GAME_WIDTH - 310, GAME_HEIGHT + 40, `${playerData?.name ?? '???'}`, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' });
    this.playerLevelText = this.add.text(GAME_WIDTH - 120, GAME_HEIGHT + 40, `Lv${this.playerPokemon.level}`, { fontSize: '14px', color: '#ffffff' });
    this.playerHpBg = this.add.rectangle(GAME_WIDTH - 310, GAME_HEIGHT + 70, 180, 10, 0x333333).setOrigin(0, 0.5);
    this.playerHpBar = this.add.rectangle(GAME_WIDTH - 310, GAME_HEIGHT + 70, 180, 10, 0x4caf50).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(GAME_WIDTH - 122, GAME_HEIGHT + 65, `${this.playerPokemon.currentHp}/${this.playerPokemon.stats.hp}`, { fontSize: '12px', color: '#ffffff' });
    this.playerStatusText = this.add.text(GAME_WIDTH - 310, GAME_HEIGHT + 85, '', { fontSize: '12px', color: '#ff6666', fontStyle: 'bold' });

    // ── EXP bar (below player HP) ──
    this.expBarBg = this.add.rectangle(GAME_WIDTH - 310, GAME_HEIGHT + 82, 180, 4, 0x222233).setOrigin(0, 0.5);
    const expPct = this.getExpPercent();
    this.expBarFill = this.add.rectangle(GAME_WIDTH - 310, GAME_HEIGHT + 82, 180 * expPct, 4, 0x4488ff).setOrigin(0, 0.5);

    // ── Slide-in animation ──
    const introDelay = 200;
    const slideDuration = 600;

    // Enemy sprite slides in from right + emerge from ball
    this.tweens.add({
      targets: this.enemySprite,
      x: 550,
      alpha: 1,
      duration: slideDuration,
      delay: introDelay,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(150, () => this.enemySprite.clearTint());
      },
    });

    // Player sprite slides in from left + emerge from ball
    this.tweens.add({
      targets: this.playerSprite,
      x: 200,
      alpha: 1,
      duration: slideDuration,
      delay: introDelay + 100,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(150, () => this.playerSprite.clearTint());
      },
    });

    // Enemy info slides down from top
    const enemyInfoTargets = [enemyInfoBox, this.enemyNameText, enemyLvlText, this.enemyHpBg, this.enemyHpBar, this.enemyStatusText];
    this.tweens.add({ targets: enemyInfoBox, y: 55, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.enemyNameText, enemyLvlText, this.enemyStatusText], y: 35, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.enemyHpBg, this.enemyHpBar], y: 62, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });

    // Player info slides up from bottom
    this.tweens.add({ targets: playerInfoBox, y: 310, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.playerNameText, this.playerLevelText], y: 285, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.playerHpBg, this.playerHpBar], y: 315, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.playerHpText, y: 309, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.playerStatusText, y: 330, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.expBarBg, y: 328, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.expBarFill, y: 328, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });

    // ── Audio: play battle BGM ──
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    const isTrainer = (data as Record<string, unknown>)?.isTrainer === true;
    audio.playBGM(isTrainer ? BGM.BATTLE_TRAINER : BGM.BATTLE_WILD);

    // Launch battle UI overlay
    this.scene.launch('BattleUIScene');

    // Shiny sparkle effect on intro
    if (this.enemyPokemon.isShiny) {
      this.time.delayedCall(introDelay + slideDuration + 200, () => {
        this.showShinySparkle(this.enemySprite);
      });
    }
    if (this.playerPokemon.isShiny) {
      this.time.delayedCall(introDelay + slideDuration + 300, () => {
        this.showShinySparkle(this.playerSprite);
      });
    }
  }

  /** Show shiny sparkle particle effect around a sprite. */
  private showShinySparkle(sprite: Phaser.GameObjects.Image): void {
    const sparkles = ['✦', '✧', '★', '✦'];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const dist = 25;
      const s = this.add.text(
        sprite.x + Math.cos(angle) * dist,
        sprite.y + Math.sin(angle) * dist,
        sparkles[i % sparkles.length],
        { fontSize: '16px', color: '#ffee44' },
      ).setOrigin(0.5).setDepth(50);
      this.tweens.add({
        targets: s,
        x: sprite.x + Math.cos(angle) * (dist + 20),
        y: sprite.y + Math.sin(angle) * (dist + 20),
        alpha: 0,
        duration: 600,
        delay: i * 80,
        onComplete: () => s.destroy(),
      });
    }
  }

  /** Update HP bar widths based on current HP values. */
  updateHpBars(): void {
    const enemyPct = Math.max(0, this.enemyPokemon.currentHp / this.enemyPokemon.stats.hp);
    const playerPct = Math.max(0, this.playerPokemon.currentHp / this.playerPokemon.stats.hp);

    this.tweens.add({ targets: this.enemyHpBar, displayWidth: 220 * enemyPct, duration: 400 });
    this.tweens.add({ targets: this.playerHpBar, displayWidth: 180 * playerPct, duration: 400 });

    this.enemyHpBar.fillColor = enemyPct > 0.5 ? 0x4caf50 : enemyPct > 0.2 ? 0xffeb3b : 0xf44336;
    this.playerHpBar.fillColor = playerPct > 0.5 ? 0x4caf50 : playerPct > 0.2 ? 0xffeb3b : 0xf44336;

    this.playerHpText.setText(`${Math.max(0, this.playerPokemon.currentHp)}/${this.playerPokemon.stats.hp}`);
    this.updateStatusIndicators();
  }

  /** Update status condition labels shown next to HP bars. */
  updateStatusIndicators(): void {
    const STATUS_LABELS: Record<string, { text: string; color: string }> = {
      burn:        { text: 'BRN', color: '#ff6633' },
      paralysis:   { text: 'PAR', color: '#ffcc00' },
      poison:      { text: 'PSN', color: '#aa55aa' },
      'bad-poison':{ text: 'PSN', color: '#aa55aa' },
      sleep:       { text: 'SLP', color: '#999999' },
      freeze:      { text: 'FRZ', color: '#66ccff' },
    };

    const playerStatus = this.playerPokemon.status;
    if (playerStatus && STATUS_LABELS[playerStatus]) {
      const s = STATUS_LABELS[playerStatus];
      this.playerStatusText.setText(s.text).setColor(s.color);
    } else {
      this.playerStatusText.setText('');
    }

    const enemyStatus = this.enemyPokemon.status;
    if (enemyStatus && STATUS_LABELS[enemyStatus]) {
      const s = STATUS_LABELS[enemyStatus];
      this.enemyStatusText.setText(s.text).setColor(s.color);
    } else {
      this.enemyStatusText.setText('');
    }
  }

  /** Update the level display after leveling up. */
  updateLevelDisplay(): void {
    this.playerLevelText.setText(`Lv${this.playerPokemon.level}`);
    this.playerHpText.setText(`${this.playerPokemon.currentHp}/${this.playerPokemon.stats.hp}`);
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

  /** Screen shake for critical hits. */
  critShake(): void {
    this.cameras.main.shake(300, 0.005);
  }

  /** Screen flash for super-effective hits. */
  superEffectiveFlash(): void {
    this.cameras.main.flash(200, 255, 255, 255);
  }

  /** Pokémon emerges from ball — white silhouette fades to full color. */
  emergeFromBall(sprite: Phaser.GameObjects.Image, onComplete?: () => void): void {
    sprite.setAlpha(0).setTint(0xffffff);
    this.tweens.add({
      targets: sprite,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          duration: 400,
          onStart: () => { sprite.clearTint(); },
          onComplete: () => { onComplete?.(); },
        });
      },
    });
  }

  /** Faint animation — sprite shrinks down and fades. */
  faintSprite(sprite: Phaser.GameObjects.Image): void {
    this.tweens.add({
      targets: sprite,
      y: sprite.y + 50,
      scaleX: sprite.scaleX * 0.3,
      scaleY: 0,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
    });
  }

  /** Get EXP progress as 0-1 fraction toward next level. */
  getExpPercent(): number {
    const p = this.playerPokemon;
    const currentLevelExp = ExperienceCalculator.expForLevel(p.level);
    const nextLevelExp = ExperienceCalculator.expForLevel(p.level + 1);
    const range = nextLevelExp - currentLevelExp;
    if (range <= 0) return 1;
    return Math.min(1, (p.exp - currentLevelExp) / range);
  }

  /** Animate the EXP bar fill. */
  animateExpBar(duration = 600): void {
    const pct = this.getExpPercent();
    this.tweens.add({
      targets: this.expBarFill,
      displayWidth: 180 * pct,
      duration,
    });
  }
}
