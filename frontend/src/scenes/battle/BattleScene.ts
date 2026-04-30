import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { BattleManager, BattleConfig } from '@battle/core/BattleManager';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import { GameManager } from '@managers/GameManager';
import { AudioManager } from '@managers/AudioManager';
import { BGM, SFX } from '@utils/audio-keys';
import { ExperienceCalculator } from '@battle/calculation/ExperienceCalculator';
import { COLORS, STATUS_BADGE_FRAMES, mobileFontSize } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { BarFrame } from '@ui/widgets/BarFrame';
import {
  BattlePlatform,
  PLATFORM_PALETTE_CAVE,
  PLATFORM_PALETTE_SAND,
  PLATFORM_PALETTE_VOLCANIC,
  PLATFORM_PALETTE_TECH,
} from '@ui/widgets/BattlePlatform';

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
  public playerHpTexts: Phaser.GameObjects.Text[] = [];
  public enemyHpTexts: Phaser.GameObjects.Text[] = [];
  public playerNameTexts: Phaser.GameObjects.Text[] = [];
  public enemyNameTexts: Phaser.GameObjects.Text[] = [];
  public playerLevelTexts: Phaser.GameObjects.Text[] = [];
  public enemyLevelTexts: Phaser.GameObjects.Text[] = [];
  public playerHpBarBgs: Phaser.GameObjects.Rectangle[] = [];
  public enemyHpBarBgs: Phaser.GameObjects.Rectangle[] = [];

  // Synthesis aura
  private synthesisAura?: Phaser.GameObjects.Ellipse;
  /** Enemy-side synthesis aura tracked so update() can keep it parented to the sprite (BUG-035). */
  private enemySynthesisAura?: Phaser.GameObjects.Ellipse;

  // BUG-001: Base transform of the player sprite captured at create() time so
  // the switch handler can restore visibility after faintSprite() shrinks it.
  public playerSpriteBaseScale = 4;
  public playerSpriteBaseY = 0;

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

    // Sleep overworld HUD overlays so they don't render on top of the
    // battle scene (minimap, quest tracker, party row would otherwise sit
    // above the player HP bar / action menu).
    this.hideOverworldHud();

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

    // ── Proportional battle positions ──
    // Enemy side: upper-right area; Player side: lower-left area
    // Portrait viewports are very tall, so move both Pokemon higher and
    // tighter together — otherwise the player back sprite collides with
    // the message bar / action menu reserved at the bottom.
    const isPortraitBattle = h > w;
    const enemyX = Math.round(w * 0.65);
    const enemyY = Math.round(h * (isPortraitBattle ? 0.22 : 0.30));
    const playerX = Math.round(w * 0.25);
    const playerY = Math.round(h * (isPortraitBattle ? 0.50 : 0.65));
    const platformYOffset = Math.round(h * 0.05); // platform sits slightly below sprite

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
    const platformPalette = pickPlatformPalette(battleBg);
    const enemyPlatform = new BattlePlatform(this, enemyX, enemyY + platformYOffset, 200, 50, {
      variant: 'enemy',
      palette: platformPalette,
      spriteShadowY: enemyY + platformYOffset - 4,
      spriteShadowWidth: 130,
    });
    enemyPlatform.setDepth(0);

    // Player battle platform (layered pixel-art style)
    const playerPlatform = new BattlePlatform(this, playerX, playerY + platformYOffset, 240, 60, {
      variant: 'player',
      palette: platformPalette,
      spriteShadowY: playerY + platformYOffset - 4,
      spriteShadowWidth: 170,
    });
    playerPlatform.setDepth(0);

    // ── Trainer sprites behind Pokémon (trainer battles only) ──
    const trainerSpriteKey = data?.trainerSpriteKey as string | undefined;
    if (this.isTrainerBattle && trainerSpriteKey && this.textures.exists(trainerSpriteKey)) {
      // Enemy trainer stands behind their Pokémon (further right, behind enemy)
      const trainerX = Math.round(w * 0.78);
      // BUG-013: Cap trainer scale on narrow / short viewports so the
      // silhouette doesn't crash into the enemy info box and Pokémon sprite.
      const trainerScale = isPortraitBattle ? 4 : Math.min(8, Math.max(4, w / 160));
      const enemyTrainer = this.add.image(w + 100, enemyY - 30, trainerSpriteKey, 0);
      enemyTrainer.setScale(trainerScale).setAlpha(0.85).setDepth(0);
      this.tweens.add({ targets: enemyTrainer, x: trainerX, duration: 600, delay: 200, ease: 'Power2' });
    }
    // Enemy pokemon sprite (front view) — starts offscreen right, white tinted
    this.enemySprite = this.add.image(w + 100, enemyY - 20, enemyData.spriteKeys.front)
      .setScale(2).setTint(0xffffff).setAlpha(0);

    // Player pokemon sprite (back view, larger) — starts offscreen left, white tinted
    this.playerSprite = this.add.image(-100, playerY - 20, playerData.spriteKeys.back)
      .setScale(4).setTint(0xffffff).setAlpha(0);
    // Capture base transform so resetPlayerSprite() can restore visibility
    // after faintSprite() collapses scale/alpha (BUG-001).
    this.playerSpriteBaseScale = 4;
    this.playerSpriteBaseY = playerY - 20;

    // ── Enemy info box (top-left) — starts above screen ──
    // Portrait viewports are too narrow for the legacy 300 px panel; shrink
    // the panel + HP bar and clamp the panel center so neither edge runs
    // off the canvas.
    const infoMargin = 16;
    const infoPanelW = isPortraitBattle ? Math.min(260, w - infoMargin * 2) : 300;
    const enemyHpBarW = isPortraitBattle ? Math.min(180, infoPanelW - 70) : 220;
    const playerHpBarW = isPortraitBattle ? Math.min(160, infoPanelW - 90) : 180;
    // Anchor: enemy box hugs the left edge, player box hugs the right edge.
    const enemyInfoX = isPortraitBattle ? infoMargin + infoPanelW / 2 : Math.round(w * 0.18);
    const playerInfoX = isPortraitBattle ? w - infoMargin - infoPanelW / 2 : Math.round(w * 0.78);

    const enemyInfoPanel = new NinePatchPanel(this, enemyInfoX, -60, infoPanelW, 60, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.92,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 6,
      shadowAlpha: 0.3,
    });
    const enemyInfoBox = enemyInfoPanel.getGraphics();
    // Position child elements relative to the panel's left edge so they
    // always sit inside the panel border, regardless of viewport width.
    const enemyTextLeft = enemyInfoX - infoPanelW / 2 + 12;
    const enemyTextRight = enemyInfoX + infoPanelW / 2 - 12;
    this.enemyNameText = this.add.text(enemyTextLeft, -80, `${this.enemyPokemon.nickname ?? enemyData?.name ?? '???'}`, { fontSize: mobileFontSize(16), color: '#ffffff', fontStyle: 'bold' });
    const enemyLvlText = this.add.text(enemyTextRight, -80, `Lv${this.enemyPokemon.level}`, { fontSize: mobileFontSize(14), color: '#ffffff' }).setOrigin(1, 0);
    this.enemyHpBg = this.add.rectangle(enemyTextLeft, -55, enemyHpBarW, 10, 0x333333).setOrigin(0, 0.5);
    this.enemyHpBar = this.add.rectangle(enemyTextLeft, -55, enemyHpBarW, 10, 0x4caf50).setOrigin(0, 0.5);
    new BarFrame(this, enemyTextLeft, -55, enemyHpBarW, 10, { accentColor: 0xff5544 });
    this.enemyStatusImg = this.add.image(enemyTextRight - 30, -80, 'status-badges', 0).setScale(2).setVisible(false);

    // Initialize enemy HP bar to actual fill (round-5 bug: bars were
    // created at full width and never refreshed before the first turn).
    {
      const enemyPct = Math.max(0, this.enemyPokemon.currentHp / Math.max(1, this.enemyPokemon.stats.hp));
      this.enemyHpBar.displayWidth = enemyHpBarW * enemyPct;
      this.enemyHpBar.fillColor = enemyPct > 0.5 ? 0x4caf50 : enemyPct > 0.2 ? 0xffeb3b : 0xf44336;
    }

    // ── Player info box (bottom-right) — starts below screen ──
    const playerInfoPanel = new NinePatchPanel(this, playerInfoX, h + 60, infoPanelW, 70, {
      fillColor: COLORS.bgCard,
      fillAlpha: 0.92,
      borderColor: COLORS.borderLight,
      borderWidth: 2,
      cornerRadius: 6,
      shadowAlpha: 0.3,
    });
    const playerInfoBox = playerInfoPanel.getGraphics();
    const playerTextLeft = playerInfoX - infoPanelW / 2 + 12;
    const playerTextRight = playerInfoX + infoPanelW / 2 - 12;
    this.playerNameText = this.add.text(playerTextLeft, h + 40, `${this.playerPokemon.nickname ?? playerData?.name ?? '???'}`, { fontSize: mobileFontSize(16), color: '#ffffff', fontStyle: 'bold' });
    this.playerLevelText = this.add.text(playerTextRight, h + 40, `Lv${this.playerPokemon.level}`, { fontSize: mobileFontSize(14), color: '#ffffff' }).setOrigin(1, 0);
    this.playerHpBg = this.add.rectangle(playerTextLeft, h + 70, playerHpBarW, 10, 0x333333).setOrigin(0, 0.5);
    this.playerHpBar = this.add.rectangle(playerTextLeft, h + 70, playerHpBarW, 10, 0x4caf50).setOrigin(0, 0.5);
    new BarFrame(this, playerTextLeft, h + 70, playerHpBarW, 10, { accentColor: 0x44d068 });
    this.playerHpText = this.add.text(playerTextRight, h + 65, `${this.playerPokemon.currentHp}/${this.playerPokemon.stats.hp}`, { fontSize: mobileFontSize(12), color: '#ffffff' }).setOrigin(1, 0);
    this.playerStatusImg = this.add.image(playerTextLeft, h + 85, 'status-badges', 0).setScale(2).setVisible(false);

    // Initialize player HP bar to actual fill (round-5 bug: a wounded
    // lead Pokemon entering battle showed a full green bar until the
    // first updateHpBars() call after turn 1).
    {
      const playerPct = Math.max(0, this.playerPokemon.currentHp / Math.max(1, this.playerPokemon.stats.hp));
      this.playerHpBar.displayWidth = playerHpBarW * playerPct;
      this.playerHpBar.fillColor = playerPct > 0.5 ? 0x4caf50 : playerPct > 0.2 ? 0xffeb3b : 0xf44336;
    }

    // ── EXP bar (below player HP) ──
    this.expBarBg = this.add.rectangle(playerTextLeft, h + 82, playerHpBarW, 4, 0x222233).setOrigin(0, 0.5);
    const expPct = this.getExpPercent();
    this.expBarFill = this.add.rectangle(playerTextLeft, h + 82, playerHpBarW * expPct, 4, 0x4488ff).setOrigin(0, 0.5);
    new BarFrame(this, playerTextLeft, h + 82, playerHpBarW, 4, { shadowAlpha: 0.4 });

    // ── Slide-in animation ──
    const introDelay = 200;
    const slideDuration = 600;

    // Enemy sprite slides in from right + emerge from ball
    this.tweens.add({
      targets: this.enemySprite,
      x: enemyX,
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
      x: playerX,
      alpha: 1,
      duration: slideDuration,
      delay: introDelay + 100,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(150, () => this.playerSprite.clearTint());
        AudioManager.getInstance().playCry(this.playerPokemon.dataId);
      },
    });

    // Enemy info slides down — target Y positions proportional to viewport
    const enemyInfoY = Math.round(h * 0.09);
    const enemyNameY = enemyInfoY - 20;
    const enemyHpY = enemyInfoY + 7;
    this.tweens.add({ targets: enemyInfoBox, y: enemyInfoY, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.enemyNameText, enemyLvlText, this.enemyStatusImg], y: enemyNameY, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.enemyHpBg, this.enemyHpBar], y: enemyHpY, duration: 400, delay: introDelay + slideDuration, ease: 'Back.easeOut' });

    // Player info slides up — target Y positions proportional to viewport
    const playerInfoY = Math.round(h * (isPortraitBattle ? 0.40 : 0.52));
    const playerNameY = playerInfoY - 25;
    const playerHpY = playerInfoY + 5;
    const playerHpTextY = playerHpY - 6;
    const playerStatusY = playerInfoY + 20;
    const playerExpY = playerInfoY + 18;
    this.tweens.add({ targets: playerInfoBox, y: playerInfoY, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.playerNameText, this.playerLevelText], y: playerNameY, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [this.playerHpBg, this.playerHpBar], y: playerHpY, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.playerHpText, y: playerHpTextY, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.playerStatusImg, y: playerStatusY, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.expBarBg, y: playerExpY, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.expBarFill, y: playerExpY, duration: 400, delay: introDelay + slideDuration + 100, ease: 'Back.easeOut' });

    // ── Audio: save route theme and play battle BGM with optional stinger ──
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    audio.stopLowHpWarning();
    audio.saveBgmState();
    let battleBgm: string = BGM.BATTLE_WILD;
    if (this.isTrainerBattle) {
      if (data?.isGymLeader) battleBgm = BGM.GYM_LEADER_BATTLE;
      else if (data?.isRival) battleBgm = BGM.RIVAL_BATTLE;
      else if (data?.isLegendary) battleBgm = BGM.LEGENDARY;
      else if (data?.isVillain) battleBgm = BGM.VILLAIN;
      else battleBgm = BGM.BATTLE_TRAINER;
    }
    audio.playBGMWithStinger(SFX.BATTLE_INTRO, battleBgm);

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

    // Use the matching background bar's width as the source of truth so
    // these stay in sync if the panel is resized for portrait mobile.
    const enemyMaxW = this.enemyHpBg.width;
    const playerMaxW = this.playerHpBg.width;
    this.tweens.add({ targets: this.enemyHpBar, displayWidth: enemyMaxW * enemyPct, duration: 400 });
    this.tweens.add({ targets: this.playerHpBar, displayWidth: playerMaxW * playerPct, duration: 400 });

    this.enemyHpBar.fillColor = enemyPct > 0.5 ? 0x4caf50 : enemyPct > 0.2 ? 0xffeb3b : 0xf44336;
    this.playerHpBar.fillColor = playerPct > 0.5 ? 0x4caf50 : playerPct > 0.2 ? 0xffeb3b : 0xf44336;

    this.playerHpText.setText(`${Math.max(0, this.playerPokemon.currentHp)}/${this.playerPokemon.stats.hp}`);
    this.updateStatusIndicators();

    // ── Double battle: update partner and second enemy HP bars ──
    if (this.isDouble) {
      // Partner HP bar (slot index 0 in playerHpBars array = the partner, i.e., playerPokemonSlots[1])
      const partner = this.playerPokemonSlots[1];
      if (partner && this.playerHpBars.length > 0) {
        const pPct = Math.max(0, partner.currentHp / partner.stats.hp);
        // BUG-011: read max width from the matching bg rectangle so portrait/landscape stay in sync
        const maxW = this.playerHpBarBgs[0]?.width ?? 150;
        this.tweens.add({ targets: this.playerHpBars[0], displayWidth: maxW * pPct, duration: 400 });
        this.playerHpBars[0].fillColor = pPct > 0.5 ? 0x4caf50 : pPct > 0.2 ? 0xffeb3b : 0xf44336;
        if (this.playerHpTexts.length > 0) {
          this.playerHpTexts[0].setText(`${Math.max(0, partner.currentHp)}/${partner.stats.hp}`);
        }
      }

      // Second enemy HP bar (slot index 0 in enemyHpBars array = enemyPokemonSlots[1])
      const enemy2 = this.enemyPokemonSlots[1];
      if (enemy2 && this.enemyHpBars.length > 0) {
        const ePct = Math.max(0, enemy2.currentHp / enemy2.stats.hp);
        const maxW = this.enemyHpBarBgs[0]?.width ?? 180;
        this.tweens.add({ targets: this.enemyHpBars[0], displayWidth: maxW * ePct, duration: 400 });
        this.enemyHpBars[0].fillColor = ePct > 0.5 ? 0x4caf50 : ePct > 0.2 ? 0xffeb3b : 0xf44336;
        // BUG-010: keep the slot-1 enemy HP text in sync — was created with '' and never updated.
        if (this.enemyHpTexts.length > 0) {
          this.enemyHpTexts[0].setText(`${Math.max(0, enemy2.currentHp)}/${enemy2.stats.hp}`);
        }
      }
    }
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

  /**
   * BUG-001: Restore the player sprite's transform after faintSprite() has
   * shrunk it to scaleY=0/alpha=0. Called when a switched-in Pokémon needs
   * to become visible at the player slot again. Plays a short emerge-from-ball
   * tween so the swap reads as a Pokémon being sent out.
   */
  resetPlayerSprite(): void {
    const base = this.playerSpriteBaseScale;
    const targetY = this.playerSpriteBaseY;
    // Kill any in-flight faint/scale tweens still targeting the sprite so
    // they don't fight the reset.
    this.tweens.killTweensOf(this.playerSprite);
    this.playerSprite.setAlpha(0).setScale(base, 0).setY(targetY).setTint(0xffffff);
    this.tweens.add({
      targets: this.playerSprite,
      scaleY: base,
      alpha: 1,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(120, () => this.playerSprite.clearTint());
      },
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
    // BUG-012: Use the EXP bar bg width (matches the player HP bar width
    // for the current viewport) instead of a hard-coded 180 so the fill
    // doesn't overflow the bar frame on portrait mobile.
    const maxW = this.expBarBg?.width ?? 180;
    this.tweens.add({
      targets: this.expBarFill,
      displayWidth: maxW * pct,
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
    if (this.enemySynthesisAura) return;
    const sprite = this.enemySprite;
    this.enemySynthesisAura = this.add.ellipse(sprite.x, sprite.y + 5, 80, 50, 0xff00dd, 0.3)
      .setDepth(sprite.depth - 1);
    this.tweens.add({
      targets: this.enemySynthesisAura,
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
    if (this.enemySynthesisAura) {
      this.enemySynthesisAura.destroy();
      this.enemySynthesisAura = undefined;
    }
  }

  /**
   * BUG-035: Keep synthesis auras parented to their sprites every frame so
   * faint / switch / slide-in tweens don't leave the aura hovering at the
   * old slot. Phaser scenes call update() automatically.
   */
  update(): void {
    if (this.synthesisAura && this.playerSprite) {
      this.synthesisAura.setPosition(this.playerSprite.x, this.playerSprite.y + 5);
    }
    if (this.enemySynthesisAura && this.enemySprite) {
      this.enemySynthesisAura.setPosition(this.enemySprite.x, this.enemySprite.y + 5);
    }
  }

  /** Set up additional sprites for a double battle (4 Pokémon on screen). */
  setupDoubleBattle(
    playerParty: PokemonInstance[],
    enemyParty: PokemonInstance[],
  ): void {
    const { w, h } = ui(this);

    // BUG-004: Double-battle slot positions are now proportional to the
    // viewport so the second enemy / partner stay on-screen on portrait
    // mobile (the legacy 200/350/500/140/650/120 pixel coords pushed slot 1
    // off the right edge on a 400-px-wide canvas).
    const isPortrait = h > w;
    const enemy0 = { x: Math.round(w * (isPortrait ? 0.55 : 0.55)), y: Math.round(h * (isPortrait ? 0.20 : 0.22)) };
    const enemy1 = { x: Math.round(w * (isPortrait ? 0.78 : 0.78)), y: Math.round(h * (isPortrait ? 0.16 : 0.18)) };
    const player0 = { x: Math.round(w * (isPortrait ? 0.22 : 0.25)), y: Math.round(h * (isPortrait ? 0.50 : 0.65)) };
    const player1 = { x: Math.round(w * (isPortrait ? 0.42 : 0.40)), y: Math.round(h * (isPortrait ? 0.55 : 0.68)) };
    const playerScale = isPortrait ? 2.5 : 3;
    const enemyScale = isPortrait ? 1.25 : 1.5;

    this.playerSprite.setScale(playerScale);
    // Track double-battle base scale so resetPlayerSprite() restores the
    // correct size after a faint switch (BUG-001).
    this.playerSpriteBaseScale = playerScale;
    this.playerPokemonSlots = [playerParty[0] ?? null, playerParty[1] ?? null];
    this.enemyPokemonSlots = [enemyParty[0] ?? null, enemyParty[1] ?? null];
    this.playerSprites = [this.playerSprite];
    this.enemySprites = [this.enemySprite];

    // Reposition primary sprites for double layout
    this.playerSprite.setPosition(player0.x, player0.y);
    this.playerSpriteBaseY = player0.y;
    this.enemySprite.setPosition(enemy0.x, enemy0.y).setScale(enemyScale);

    // Add second player Pokémon
    if (this.playerPokemonSlots[1]) {
      const p1 = this.playerPokemonSlots[1];
      const p1Data = pokemonData[p1.dataId];
      if (p1Data) {
        const spr = this.add.image(player1.x, player1.y, p1Data.spriteKeys.back).setScale(playerScale).setAlpha(0);
        this.playerSprites.push(spr);
        this.tweens.add({ targets: spr, alpha: 1, duration: 600, delay: 400, ease: 'Power2', onComplete: () => spr.clearTint() });
      }
    }

    // Add second enemy Pokémon
    if (this.enemyPokemonSlots[1]) {
      const e1 = this.enemyPokemonSlots[1];
      const e1Data = pokemonData[e1.dataId];
      if (e1Data) {
        const spr = this.add.image(enemy1.x, enemy1.y, e1Data.spriteKeys.front).setScale(enemyScale).setAlpha(0);
        this.enemySprites.push(spr);
        this.tweens.add({ targets: spr, alpha: 1, duration: 600, delay: 400, ease: 'Power2', onComplete: () => spr.clearTint() });
      }
    }

    // ── Double battle HUD: partner HP bar (below player's HUD) ──
    if (this.playerPokemonSlots[1]) {
      const p1 = this.playerPokemonSlots[1];
      const p1Data = pokemonData[p1.dataId];
      const partnerInfoX = Math.round(w * 0.78);
      const partnerInfoY = Math.round(h * 0.62);
      const partnerNameY = partnerInfoY - 10;
      const partnerHpY = partnerInfoY + 8;

      new NinePatchPanel(this, partnerInfoX, partnerInfoY, 240, 44, {
        fillColor: COLORS.bgCard, fillAlpha: 0.85,
        borderColor: 0x6688aa, borderWidth: 1, cornerRadius: 4, shadowAlpha: 0.2,
      });

      const nameText = this.add.text(
        partnerInfoX - 100, partnerNameY,
        `${p1.nickname ?? p1Data?.name ?? '???'}`,
        { fontSize: mobileFontSize(13), color: '#aaddff', fontStyle: 'bold' },
      );
      this.playerNameTexts.push(nameText);

      const lvlText = this.add.text(
        partnerInfoX + 50, partnerNameY,
        `Lv${p1.level}`,
        { fontSize: mobileFontSize(11), color: '#aaddff' },
      );
      this.playerLevelTexts.push(lvlText);

      const hpBg = this.add.rectangle(partnerInfoX - 100, partnerHpY, 150, 7, 0x333333).setOrigin(0, 0.5);
      this.playerHpBarBgs.push(hpBg);

      const hpPct = Math.max(0, p1.currentHp / p1.stats.hp);
      const hpBar = this.add.rectangle(partnerInfoX - 100, partnerHpY, 150 * hpPct, 7, 0x4caf50).setOrigin(0, 0.5);
      this.playerHpBars.push(hpBar);
      new BarFrame(this, partnerInfoX - 100, partnerHpY, 150, 7, { accentColor: 0x44d068 });

      const hpText = this.add.text(
        partnerInfoX + 56, partnerHpY - 5,
        `${p1.currentHp}/${p1.stats.hp}`,
        { fontSize: mobileFontSize(10), color: '#aaddff' },
      );
      this.playerHpTexts.push(hpText);
    }

    // ── Double battle HUD: second enemy HP bar (right of first enemy's HUD) ──
    if (this.enemyPokemonSlots[1]) {
      const e1 = this.enemyPokemonSlots[1];
      const e1Data = pokemonData[e1.dataId];
      const enemyInfoX2 = Math.round(w * 0.55);
      const enemyInfoY2 = Math.round(h * 0.09);
      const enemyNameY2 = enemyInfoY2 - 10;
      const enemyHpY2 = enemyInfoY2 + 8;

      new NinePatchPanel(this, enemyInfoX2, enemyInfoY2, 240, 44, {
        fillColor: COLORS.bgCard, fillAlpha: 0.85,
        borderColor: 0xaa6666, borderWidth: 1, cornerRadius: 4, shadowAlpha: 0.2,
      });

      const nameText = this.add.text(
        enemyInfoX2 - 100, enemyNameY2,
        `${e1.nickname ?? e1Data?.name ?? '???'}`,
        { fontSize: mobileFontSize(13), color: '#ffffff', fontStyle: 'bold' },
      );
      this.enemyNameTexts.push(nameText);

      const lvlText = this.add.text(
        enemyInfoX2 + 50, enemyNameY2,
        `Lv${e1.level}`,
        { fontSize: mobileFontSize(11), color: '#ffffff' },
      );
      this.enemyLevelTexts.push(lvlText);

      const hpBg = this.add.rectangle(enemyInfoX2 - 100, enemyHpY2, 180, 7, 0x333333).setOrigin(0, 0.5);
      this.enemyHpBarBgs.push(hpBg);

      const hpPct = Math.max(0, e1.currentHp / e1.stats.hp);
      const hpBar = this.add.rectangle(enemyInfoX2 - 100, enemyHpY2, 180 * hpPct, 7, 0x4caf50).setOrigin(0, 0.5);
      this.enemyHpBars.push(hpBar);
      new BarFrame(this, enemyInfoX2 - 100, enemyHpY2, 180, 7, { accentColor: 0xff5544 });

      const hpText = this.add.text(
        enemyInfoX2 + 86, enemyHpY2 - 5,
        '',
        { fontSize: mobileFontSize(10), color: '#ffffff' },
      );
      this.enemyHpTexts.push(hpText);
    }
  }

  /** AUDIT-057: Clean up tweens and event listeners on scene shutdown. */
  shutdown(): void {
    this.tweens.killAll();
    this.time.removeAllEvents();
    // Wake the overworld HUD overlays so they reappear when we return to
    // the OverworldScene.
    this.showOverworldHud();
  }

  /** Overworld HUD scenes that render above the canvas — sleep during battle. */
  private readonly hudOverlayKeys = [
    'MinimapScene',
    'QuestTrackerScene',
    'PartyQuickViewScene',
  ];

  private hideOverworldHud(): void {
    for (const key of this.hudOverlayKeys) {
      if (this.scene.isActive(key)) this.scene.sleep(key);
    }
  }

  private showOverworldHud(): void {
    for (const key of this.hudOverlayKeys) {
      if (this.scene.isSleeping(key)) this.scene.wake(key);
    }
  }
}

/**
 * Pick a battle platform palette based on the active battle background key.
 * Falls back to the default grass palette when the background isn't recognised.
 */
function pickPlatformPalette(battleBg: string | undefined): [number, number, number, number] | undefined {
  if (!battleBg) return undefined;
  if (battleBg.includes('cave') || battleBg.includes('dungeon')) return PLATFORM_PALETTE_CAVE;
  if (battleBg.includes('coast') || battleBg.includes('beach') || battleBg.includes('sand')) return PLATFORM_PALETTE_SAND;
  if (battleBg.includes('volcan') || battleBg.includes('ember') || battleBg.includes('fire')) return PLATFORM_PALETTE_VOLCANIC;
  if (battleBg.includes('industrial') || battleBg.includes('lab') || battleBg.includes('synthesis')) return PLATFORM_PALETTE_TECH;
  return undefined;
}
