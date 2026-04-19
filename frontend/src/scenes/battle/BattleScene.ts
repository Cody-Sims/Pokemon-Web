import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { BattleManager, BattleConfig } from '@battle/core/BattleManager';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { BGM } from '@utils/audio-keys';
import { ExperienceCalculator } from '@battle/calculation/ExperienceCalculator';
import { COLORS, STATUS_BADGE_FRAMES, mobileFontSize } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';

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
  public enemyStatusImg!: Phaser.GameObjects.Image;
  public playerStatusImg!: Phaser.GameObjects.Image;
  public expBarBg!: Phaser.GameObjects.Rectangle;
  public expBarFill!: Phaser.GameObjects.Rectangle;

  // Double battle support
  public isDouble = false;
  public victoryFlag = '';
  public playerSprites: Phaser.GameObjects.Image[] = [];
  public enemySprites: Phaser.GameObjects.Image[] = [];
  public playerPokemonSlots: (PokemonInstance | null)[] = [];
  public enemyPokemonSlots: (PokemonInstance | null)[] = [];
  public playerHpBars: Phaser.GameObjects.Rectangle[] = [];
  public enemyHpBars: Phaser.GameObjects.Rectangle[] = [];
  public playerNameTexts: Phaser.GameObjects.Text[] = [];
  public enemyNameTexts: Phaser.GameObjects.Text[] = [];

  // Synthesis aura
  private synthesisAura?: Phaser.GameObjects.Ellipse;

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
    this.isDouble = (data?.isDouble as boolean) ?? false;
    this.victoryFlag = (data?.victoryFlag as string) ?? '';

    // Guard: cannot battle without Pokemon
    if (gm.getParty().length === 0) {
      console.error('[BattleScene] Cannot start battle with empty party!');
      this.scene.start('OverworldScene');
      return;
    }

    // Use first alive party member
    this.playerPokemon = gm.getParty().find(p => p.currentHp > 0) ?? gm.getParty()[0];

    // Create enemy pokemon (BUG-093: log warning for missing encounter data)
    if (!data?.enemyPokemon) {
      console.warn('[BattleScene] No enemy Pokémon provided — encounter data may be missing for this map.');
    }
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

    const { w, h, cx, cy } = ui(this);

    // ── Draw battle scene background ──
    const battleBg = data?.battleBg as string | undefined;
    if (battleBg && this.textures.exists(battleBg)) {
      // Use image-based battle background
      const bg = this.add.image(cx, cy, battleBg);
      bg.setDisplaySize(w, h);
    } else {
      // Fallback: procedural solid background
      this.add.rectangle(cx, cy, w, h, COLORS.bgPanel);
    }

    // Enemy battle platform (layered pixel-art style)
    this.add.ellipse(550, 203, 200, 50, 0x1a2e14, 0.5); // shadow
    this.add.ellipse(550, 200, 200, 50, 0x2d4a22);       // base
    this.add.ellipse(550, 198, 180, 40, 0x3a6030, 0.6);   // mid highlight
    this.add.ellipse(550, 195, 140, 25, 0x4a7a3e, 0.3);   // top highlight

    // Player battle platform (layered pixel-art style)
    this.add.ellipse(200, 423, 240, 60, 0x1a2e14, 0.5); // shadow
    this.add.ellipse(200, 420, 240, 60, 0x2d4a22);       // base
    this.add.ellipse(200, 418, 220, 48, 0x3a6030, 0.6);   // mid highlight
    this.add.ellipse(200, 415, 170, 30, 0x4a7a3e, 0.3);   // top highlight

    // ── Trainer sprites behind Pokémon (trainer battles only) ──
    const trainerSpriteKey = data?.trainerSpriteKey as string | undefined;
    if (this.isTrainerBattle && trainerSpriteKey && this.textures.exists(trainerSpriteKey)) {
      // Enemy trainer stands behind their Pokémon (upper-right, larger than pokemon)
      const enemyTrainer = this.add.image(w + 100, 120, trainerSpriteKey, 0);
      enemyTrainer.setScale(8).setAlpha(0.85).setDepth(0);
      this.tweens.add({ targets: enemyTrainer, x: 620, duration: 600, delay: 200, ease: 'Power2' });
    }
    // Enemy pokemon sprite (front view) — starts offscreen right, white tinted
    this.enemySprite = this.add.image(w + 100, 150, enemyData.spriteKeys.front)
      .setScale(2).setTint(0xffffff).setAlpha(0);

    // Player pokemon sprite (back view, larger) — starts offscreen left, white tinted
    this.playerSprite = this.add.image(-100, 370, playerData.spriteKeys.back)
      .setScale(4).setTint(0xffffff).setAlpha(0);

    // ── Enemy info box (top-left) — starts above screen ──
    const enemyInfoPanel = new NinePatchPanel(this, 170, -60, 300, 60, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.92,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 6,
      shadowAlpha: 0.3,
    });
    const enemyInfoBox = enemyInfoPanel.getGraphics();
    this.enemyNameText = this.add.text(40, -80, `${this.enemyPokemon.nickname ?? enemyData?.name ?? '???'}`, { fontSize: mobileFontSize(16), color: '#ffffff', fontStyle: 'bold' });
    const enemyLvlText = this.add.text(240, -80, `Lv${this.enemyPokemon.level}`, { fontSize: mobileFontSize(14), color: '#ffffff' });
    this.enemyHpBg = this.add.rectangle(40, -55, 220, 10, 0x333333).setOrigin(0, 0.5);
    this.enemyHpBar = this.add.rectangle(40, -55, 220, 10, 0x4caf50).setOrigin(0, 0.5);
    this.enemyStatusImg = this.add.image(270, -80, 'status-badges', 0).setScale(2).setVisible(false);

    // ── Player info box (bottom-right) — starts below screen ──
    const playerInfoPanel = new NinePatchPanel(this, w - 170, h + 60, 300, 70, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.92,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 6,
      shadowAlpha: 0.3,
    });
    const playerInfoBox = playerInfoPanel.getGraphics();
    this.playerNameText = this.add.text(w - 310, h + 40, `${this.playerPokemon.nickname ?? playerData?.name ?? '???'}`, { fontSize: mobileFontSize(16), color: '#ffffff', fontStyle: 'bold' });
    this.playerLevelText = this.add.text(w - 120, h + 40, `Lv${this.playerPokemon.level}`, { fontSize: mobileFontSize(14), color: '#ffffff' });
    this.playerHpBg = this.add.rectangle(w - 310, h + 70, 180, 10, 0x333333).setOrigin(0, 0.5);
    this.playerHpBar = this.add.rectangle(w - 310, h + 70, 180, 10, 0x4caf50).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(w - 122, h + 65, `${this.playerPokemon.currentHp}/${this.playerPokemon.stats.hp}`, { fontSize: mobileFontSize(12), color: '#ffffff' });
    this.playerStatusImg = this.add.image(w - 310, h + 85, 'status-badges', 0).setScale(2).setVisible(false);

    // ── EXP bar (below player HP) ──
    this.expBarBg = this.add.rectangle(w - 310, h + 82, 180, 4, 0x222233).setOrigin(0, 0.5);
    const expPct = this.getExpPercent();
    this.expBarFill = this.add.rectangle(w - 310, h + 82, 180 * expPct, 4, 0x4488ff).setOrigin(0, 0.5);

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
        AudioManager.getInstance().playCry(this.enemyPokemon.dataId);
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
        AudioManager.getInstance().playCry(this.playerPokemon.dataId);
      },
    });

    // Enemy info slides down from top
    const enemyInfoTargets = [enemyInfoBox, this.enemyNameText, enemyLvlText, this.enemyHpBg, this.enemyHpBar, this.enemyStatusImg];
    this.tweens.add({ targets: enemyInfoBox, y: 55, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.enemyNameText, enemyLvlText, this.enemyStatusImg], y: 35, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.enemyHpBg, this.enemyHpBar], y: 62, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });

    // Player info slides up from bottom
    this.tweens.add({ targets: playerInfoBox, y: 310, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.playerNameText, this.playerLevelText], y: 285, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.playerHpBg, this.playerHpBar], y: 315, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.playerHpText, y: 309, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.playerStatusImg, y: 330, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.expBarBg, y: 328, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.expBarFill, y: 328, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });

    // ── Audio: play battle BGM ──
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    audio.stopLowHpWarning();
    let battleBgm: string = BGM.BATTLE_WILD;
    if (this.isTrainerBattle) {
      if (data?.isGymLeader) battleBgm = BGM.GYM_LEADER_BATTLE;
      else if (data?.isRival) battleBgm = BGM.RIVAL_BATTLE;
      else if (data?.isLegendary) battleBgm = BGM.LEGENDARY;
      else if (data?.isVillain) battleBgm = BGM.VILLAIN;
      else battleBgm = BGM.BATTLE_TRAINER;
    }
    audio.playBGM(battleBgm);

    // Double battle layout setup
    if (this.isDouble && data?.enemyParty) {
      const enemyParty = data.enemyParty as PokemonInstance[];
      const gm2 = GameManager.getInstance();
      const allyParty = data.allyParty as PokemonInstance[] | undefined;
      if (allyParty && allyParty.length > 0) {
        const lead = gm2.getParty().find(p => p.currentHp > 0) ?? gm2.getParty()[0];
        this.setupDoubleBattle([lead, allyParty[0]], enemyParty);
      } else {
        this.setupDoubleBattle(gm2.getParty(), enemyParty);
      }
    }

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
        { fontSize: mobileFontSize(16), color: '#ffee44' },
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
    const playerStatus = this.playerPokemon.status;
    const playerFrame = playerStatus ? STATUS_BADGE_FRAMES[playerStatus] : undefined;
    if (playerFrame !== undefined) {
      this.playerStatusImg.setFrame(playerFrame).setVisible(true);
    } else {
      this.playerStatusImg.setVisible(false);
    }

    const enemyStatus = this.enemyPokemon.status;
    const enemyFrame = enemyStatus ? STATUS_BADGE_FRAMES[enemyStatus] : undefined;
    if (enemyFrame !== undefined) {
      this.enemyStatusImg.setFrame(enemyFrame).setVisible(true);
    } else {
      this.enemyStatusImg.setVisible(false);
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

  /** Show a pulsing cyan aura behind the player Pokémon after Synthesis activation. */
  showSynthesisAura(): void {
    if (this.synthesisAura) return;
    const sprite = this.playerSprite;
    this.synthesisAura = this.add.ellipse(sprite.x, sprite.y + 5, 80, 50, 0x00ffdd, 0.3)
      .setDepth(sprite.depth - 1);
    this.tweens.add({
      targets: this.synthesisAura,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Show a synthesis aura around the enemy sprite for boss battles. */
  showEnemySynthesisAura(): void {
    const sprite = this.enemySprite;
    const aura = this.add.ellipse(sprite.x, sprite.y + 5, 80, 50, 0xff00dd, 0.3)
      .setDepth(sprite.depth - 1);
    this.tweens.add({
      targets: aura,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Hide the synthesis aura. */
  hideSynthesisAura(): void {
    if (this.synthesisAura) {
      this.synthesisAura.destroy();
      this.synthesisAura = undefined;
    }
  }

  /** Set up additional sprites for a double battle (4 Pokémon on screen). */
  setupDoubleBattle(
    playerParty: PokemonInstance[],
    enemyParty: PokemonInstance[],
  ): void {
    // Player slot 0: x=200, y=350 (already placed as playerSprite)
    // Player slot 1: x=350, y=370
    this.playerSprite.setScale(3);
    this.playerPokemonSlots = [playerParty[0] ?? null, playerParty[1] ?? null];
    this.enemyPokemonSlots = [enemyParty[0] ?? null, enemyParty[1] ?? null];
    this.playerSprites = [this.playerSprite];
    this.enemySprites = [this.enemySprite];

    // Reposition primary sprites for double layout
    this.playerSprite.setPosition(200, 350);
    this.enemySprite.setPosition(500, 140).setScale(1.5);

    // Add second player Pokémon
    if (this.playerPokemonSlots[1]) {
      const p1 = this.playerPokemonSlots[1];
      const p1Data = pokemonData[p1.dataId];
      if (p1Data) {
        const spr = this.add.image(350, 370, p1Data.spriteKeys.back).setScale(3).setAlpha(0);
        this.playerSprites.push(spr);
        this.tweens.add({ targets: spr, alpha: 1, duration: 600, delay: 400, ease: 'Power2', onComplete: () => spr.clearTint() });
      }
    }

    // Add second enemy Pokémon
    if (this.enemyPokemonSlots[1]) {
      const e1 = this.enemyPokemonSlots[1];
      const e1Data = pokemonData[e1.dataId];
      if (e1Data) {
        const spr = this.add.image(650, 120, e1Data.spriteKeys.front).setScale(1.5).setAlpha(0);
        this.enemySprites.push(spr);
        this.tweens.add({ targets: spr, alpha: 1, duration: 600, delay: 400, ease: 'Power2', onComplete: () => spr.clearTint() });
      }
    }
  }
}
