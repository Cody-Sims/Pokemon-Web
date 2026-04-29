import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { COLORS, FONTS, drawPanel, mobileFontSize, MOBILE_SCALE } from '@ui/theme';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';
import {
  battleTowerData,
  fullClearBpReward,
  type BattleTowerTier,
} from '@data/battle-tower-data';
import { healParty } from '@scenes/overworld';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import {
  computeStreakResume,
  type TowerStreakState,
} from '@systems/engine/BattleTowerStreak';

/**
 * In-flight streak state passed through the BattleScene return path.
 *
 * The scene is started fresh each time via `this.scene.start(returnScene, returnData)`,
 * so any persistent streak context lives on this payload (not on PlayerStateManager —
 * the streak itself is volatile and never survives a save).
 */
// `TowerStreakState` is imported above so the scene and the pure helper share
// a single shape definition.

/**
 * A.1 Battle Tower lobby + streak driver.
 *
 * Two modes:
 *   1. **Lobby**: no `_towerState` on entry → renders the tier-select panel,
 *      Battle Points balance, and best streaks. Selecting a tier seeds the
 *      streak state, heals the party, and launches battle 0.
 *   2. **Streak resume**: returning from `BattleScene` with `_towerState` set
 *      → reads the party state. If anything is alive: it's a victory.
 *      Increment, accumulate BP, launch the next battle (or pay out + return
 *      to lobby on full clear). If wiped: end streak, pay out partial BP,
 *      return to lobby.
 *
 * Party heal: at streak start only. No between-battle heals (canon Frontier).
 *
 * The lobby is reachable via `interactionType: 'battle-tower'` on an NPC; the
 * scene also accepts an `exitScene` payload field so callers can route the
 * lobby back to wherever the player came from (defaults to OverworldScene).
 */
export class BattleTowerScene extends Phaser.Scene {
  private initData?: Record<string, unknown>;
  private statusMsg?: Phaser.GameObjects.Text;
  private rebuildLayer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'BattleTowerScene' });
  }

  init(data?: Record<string, unknown>): void {
    this.initData = data;
  }

  create(): void {
    const data = this.initData ?? {};
    const towerState = data._towerState as TowerStreakState | undefined;

    if (towerState) {
      this.handleStreakResume(towerState);
      return;
    }

    this.buildLobby();
    layoutOn(this, () => this.buildLobby());
  }

  // ── Lobby ──────────────────────────────────────────────

  private buildLobby(): void {
    if (this.rebuildLayer) {
      this.rebuildLayer.destroy(true);
    }
    const layer = this.add.container(0, 0);
    this.rebuildLayer = layer;
    const layout = ui(this);
    const gm = GameManager.getInstance();

    layer.add(this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark));
    drawPanel(this, layout.cx, layout.cy, layout.w - 20, layout.h - 20);

    layer.add(this.add.text(layout.cx, 28, 'BATTLE TOWER', {
      ...FONTS.heading, color: COLORS.textHighlight,
    }).setOrigin(0.5));
    layer.add(this.add.text(layout.cx, 50, 'Endless streak gauntlet', {
      ...FONTS.caption, color: COLORS.textGray,
    }).setOrigin(0.5));

    // ── BP balance + clears summary ──
    const bp = gm.getBattlePoints();
    layer.add(this.add.text(layout.cx, 78, `Battle Points: ${bp} BP`, {
      ...FONTS.body, color: '#ffd86b', fontStyle: 'bold',
    }).setOrigin(0.5));

    const tiers: BattleTowerTier[] = ['normal', 'super', 'rental'];
    const cardH = Math.round(110 * MOBILE_SCALE);
    const startY = 110;
    const gap = 12;
    const cardW = Math.min(layout.w - 80, 480);

    tiers.forEach((tier, i) => {
      const cfg = battleTowerData[tier];
      const cy = startY + i * (cardH + gap) + cardH / 2;
      const cx = layout.cx;
      const locked = cfg.trainers.length === 0;

      const card = this.add.rectangle(cx, cy, cardW, cardH, locked ? 0x1f1f1f : COLORS.bgCard, 0.85)
        .setStrokeStyle(2, locked ? 0x444444 : COLORS.border);
      layer.add(card);

      layer.add(this.add.text(cx - cardW / 2 + 16, cy - cardH / 2 + 12, cfg.displayName, {
        ...FONTS.heading, color: locked ? '#666666' : COLORS.textHighlight,
        fontSize: mobileFontSize(16),
      }).setOrigin(0, 0));
      layer.add(this.add.text(cx - cardW / 2 + 16, cy - cardH / 2 + 36, cfg.description, {
        fontSize: mobileFontSize(12), color: locked ? '#555555' : '#cccccc',
        wordWrap: { width: cardW - 32 },
      }).setOrigin(0, 0));

      const best = gm.getTowerBestStreak(tier);
      const clears = gm.getTowerClears(tier);
      const fullClear = fullClearBpReward(tier);
      const stats = locked
        ? 'Roster locked — content TBA.'
        : `Best: ${best}/${cfg.battlesPerStreak} · Clears: ${clears} · Full clear: ${fullClear} BP`;
      layer.add(this.add.text(cx - cardW / 2 + 16, cy + cardH / 2 - 30, stats, {
        fontSize: mobileFontSize(11), color: locked ? '#555555' : '#a0a0a0',
      }).setOrigin(0, 0));

      if (!locked) {
        const btn = this.add.text(cx + cardW / 2 - 16, cy + cardH / 2 - 18, '[ START ]', {
          ...FONTS.body, color: COLORS.textHighlight, fontStyle: 'bold',
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => this.beginStreak(tier));
        btn.on('pointerover', () => btn.setColor('#ffd86b'));
        btn.on('pointerout', () => btn.setColor(COLORS.textHighlight));
        layer.add(btn);
      }
    });

    // Footer hints
    const closeBtn = this.add.text(layout.cx, layout.h - 28, '[ CLOSE ]', {
      ...FONTS.caption, color: COLORS.textDim,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    layer.add(closeBtn);

    // Display any pending status message (e.g. streak result on resume).
    if (this.statusMsg) {
      this.statusMsg.setPosition(layout.cx, 92);
      layer.add(this.statusMsg);
    }

    this.input.keyboard?.removeAllListeners();
    this.input.keyboard!.on('keydown-ESC', () => this.close());
    this.input.keyboard!.on('keydown-N', () => this.beginStreak('normal'));
    this.input.keyboard!.on('keydown-S', () => {
      if (battleTowerData.super.trainers.length > 0) this.beginStreak('super');
    });
  }

  /** Heal the party, seed streak state, launch battle 0. */
  private beginStreak(tier: BattleTowerTier): void {
    const cfg = battleTowerData[tier];
    if (cfg.trainers.length === 0) return;
    const gm = GameManager.getInstance();
    if (gm.getParty().length === 0) return;
    healParty();
    const exit = (this.initData?.exitScene as string) ?? 'OverworldScene';
    const state: TowerStreakState = {
      tier,
      battleIndex: 0,
      accumulatedBp: 0,
      exitScene: exit,
      startedPartySize: gm.getParty().length,
    };
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.launchBattleForState(state);
  }

  // ── Streak resume ──────────────────────────────────────

  private handleStreakResume(state: TowerStreakState): void {
    const gm = GameManager.getInstance();
    const aliveCount = gm.getParty().filter(p => p.currentHp > 0).length;
    const cfg = battleTowerData[state.tier];
    const trainer = cfg.trainers[state.battleIndex];
    const result = computeStreakResume(state, aliveCount, cfg, trainer);

    if (result.outcome === 'wipeout') {
      gm.recordTowerStreak(state.tier, state.battleIndex);
      gm.addBattlePoints(result.payout);
      this.statusMsg = this.add.text(0, 0,
        `Streak ended at ${state.battleIndex}/${cfg.battlesPerStreak}. Earned ${result.payout} BP.`,
        { ...FONTS.caption, color: '#ff8080' },
      ).setOrigin(0.5);
      this.buildLobby();
      layoutOn(this, () => this.buildLobby());
      return;
    }

    if (result.outcome === 'cleared') {
      gm.recordTowerStreak(state.tier, cfg.battlesPerStreak);
      gm.recordTowerClear(state.tier);
      gm.addBattlePoints(result.payout);
      this.statusMsg = this.add.text(0, 0,
        `Full clear of ${cfg.displayName}! Earned ${result.payout} BP.`,
        { ...FONTS.caption, color: '#ffd86b', fontStyle: 'bold' },
      ).setOrigin(0.5);
      this.buildLobby();
      layoutOn(this, () => this.buildLobby());
      return;
    }

    // continue
    const next = result.nextState!;
    gm.recordTowerStreak(state.tier, next.battleIndex);
    this.launchBattleForState(next);
  }

  private launchBattleForState(state: TowerStreakState): void {
    const cfg = battleTowerData[state.tier];
    const trainer = cfg.trainers[state.battleIndex];
    if (!trainer) {
      this.close();
      return;
    }
    const enemyParty = trainer.party.map(p =>
      EncounterSystem.createWildPokemon(p.pokemonId, p.level),
    );
    // Inject the trainer-supplied moveset onto the freshly created instances.
    enemyParty.forEach((mon, i) => {
      const tParty = trainer.party[i];
      if (tParty.moves) {
        mon.moves = tParty.moves.map(m => ({ moveId: m, currentPp: 30 }));
      }
    });

    this.scene.start('TransitionScene', {
      targetScene: 'BattleScene',
      returnScene: 'BattleTowerScene',
      targetData: {
        enemyPokemon: enemyParty[0],
        isTrainer: true,
        // Use a synthetic trainer id; reward handler tolerates unknown ids.
        trainerId: trainer.id,
        trainerSpriteKey: trainer.spriteKey,
        trainerName: trainer.name,
        battleBg: 'bg-league',
        isDouble: false,
        enemyParty,
        // Tower battles do not award money (BP comes via the tower scene itself).
        suppressMoneyReward: true,
      },
      returnData: { _towerState: state },
      style: 'stripes',
    });
  }

  // ── Exit ───────────────────────────────────────────────

  private close(): void {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    const exit = (this.initData?.exitScene as string) ?? 'OverworldScene';
    this.scene.start(exit);
  }
}

export type { TowerStreakState };
