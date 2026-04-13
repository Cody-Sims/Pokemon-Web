import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@utils/constants';
import { PokemonInstance } from '@data/interfaces';
import { pokemonData } from '@data/pokemon';
import { moveData } from '@data/moves';
import { ExperienceCalculator, getNatureMultiplier, getNatureDescription } from '@battle/ExperienceCalculator';
import { COLORS, FONTS, SPACING, TYPE_COLORS, CATEGORY_COLORS, drawPanel, drawTypeBadge, drawHpBar, drawButton, hpColor } from '@ui/theme';

type Tab = 'INFO' | 'STATS' | 'MOVES';

export class SummaryScene extends Phaser.Scene {
  private pokemon!: PokemonInstance;
  private partyIndex = 0;
  private currentTab: Tab = 'INFO';
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private contentGroup!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'SummaryScene' });
  }

  init(data: { pokemon: PokemonInstance; partyIndex?: number }): void {
    this.pokemon = data.pokemon;
    this.partyIndex = data.partyIndex ?? 0;
  }

  create(): void {
    this.contentGroup = this.add.group();

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.bgDark);
    drawPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 20, GAME_HEIGHT - 20);

    // Pokemon name + level header
    const pData = pokemonData[this.pokemon.dataId];
    const name = this.pokemon.nickname ?? pData?.name ?? '???';
    this.add.text(40, 22, name, { ...FONTS.heading });
    this.add.text(GAME_WIDTH - 150, 22, `Lv. ${this.pokemon.level}`, { ...FONTS.heading, color: COLORS.textHighlight });

    // Type badges
    if (pData) {
      pData.types.forEach((type, i) => {
        drawTypeBadge(this, 40 + i * 74 + 32, 52, type);
      });
    }

    // Close button
    drawButton(this, GAME_WIDTH - 40, 25, '✕', () => this.scene.stop(), 40, 30);

    // Tabs
    const tabs: Tab[] = ['INFO', 'STATS', 'MOVES'];
    this.tabTexts = tabs.map((tab, i) => {
      const t = this.add.text(120 + i * 240, 80, tab, { ...FONTS.body, color: COLORS.textGray })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { this.currentTab = tab; this.updateTabs(); this.drawContent(); });
      return t;
    });

    // Divider
    this.add.rectangle(GAME_WIDTH / 2, 98, GAME_WIDTH - 50, 2, COLORS.border, 0.5);

    // Keyboard
    this.input.keyboard!.on('keydown-LEFT', () => {
      const idx = tabs.indexOf(this.currentTab);
      this.currentTab = tabs[(idx - 1 + tabs.length) % tabs.length];
      this.updateTabs(); this.drawContent();
    });
    this.input.keyboard!.on('keydown-RIGHT', () => {
      const idx = tabs.indexOf(this.currentTab);
      this.currentTab = tabs[(idx + 1) % tabs.length];
      this.updateTabs(); this.drawContent();
    });
    this.input.keyboard!.on('keydown-ESC', () => this.scene.stop());

    this.updateTabs();
    this.drawContent();
  }

  private updateTabs(): void {
    const tabs: Tab[] = ['INFO', 'STATS', 'MOVES'];
    this.tabTexts.forEach((t, i) => {
      t.setColor(tabs[i] === this.currentTab ? COLORS.textHighlight : COLORS.textGray);
      t.setFontStyle(tabs[i] === this.currentTab ? 'bold' : '');
    });
  }

  private drawContent(): void {
    this.contentGroup.clear(true, true);
    switch (this.currentTab) {
      case 'INFO': this.drawInfoTab(); break;
      case 'STATS': this.drawStatsTab(); break;
      case 'MOVES': this.drawMovesTab(); break;
    }
  }

  // ─── INFO TAB ───
  private drawInfoTab(): void {
    const p = this.pokemon;
    const pData = pokemonData[p.dataId];
    const x = 50;
    let y = 120;
    const lineH = 28;

    // Pokemon sprite
    const spriteKey = pData?.spriteKeys.front;
    const spriteX = GAME_WIDTH - 110;
    const spriteY = 190;
    // Background box
    const spriteBox = this.add.rectangle(spriteX, spriteY, 120, 120, COLORS.bgCard).setStrokeStyle(2, COLORS.border);
    this.contentGroup.add(spriteBox);
    if (spriteKey && this.textures.exists(spriteKey)) {
      const img = this.add.image(spriteX, spriteY, spriteKey).setScale(2);
      this.contentGroup.add(img);
    } else {
      const label = this.add.text(spriteX, spriteY, `#${String(p.dataId).padStart(3, '0')}`, { ...FONTS.heading, color: COLORS.textDim }).setOrigin(0.5);
      this.contentGroup.add(label);
    }
    const spriteHint = this.add.text(spriteX, 260, pData?.name ?? '', { ...FONTS.caption }).setOrigin(0.5);
    this.contentGroup.add(spriteHint);

    // Info rows
    const rows: [string, string][] = [
      ['Species', pData?.name ?? '???'],
      ['Dex No.', `#${String(p.dataId).padStart(3, '0')}`],
      ['Nature', `${p.nature.charAt(0).toUpperCase() + p.nature.slice(1)} (${getNatureDescription(p.nature)})`],
      ['Status', p.status ?? 'Healthy'],
      ['Friendship', `${p.friendship}`],
    ];

    rows.forEach(([label, value]) => {
      const lbl = this.add.text(x, y, label, { fontSize: '15px', color: '#aaaaaa' });
      const val = this.add.text(x + 180, y, value, { fontSize: '15px', color: '#ffffff' });
      this.contentGroup.add(lbl);
      this.contentGroup.add(val);
      y += lineH;
    });

    // EXP info
    y += 10;
    const currentLevelExp = ExperienceCalculator.expForLevel(p.level);
    const nextLevelExp = ExperienceCalculator.expForLevel(p.level + 1);
    const expToNext = Math.max(0, nextLevelExp - p.exp);
    const expRange = nextLevelExp - currentLevelExp;
    const expProgress = Math.max(0, p.exp - currentLevelExp);

    const expRows: [string, string][] = [
      ['Total EXP', `${p.exp}`],
      ['To Next Lv.', `${Math.max(0, expToNext)}`],
    ];
    expRows.forEach(([label, value]) => {
      const lbl = this.add.text(x, y, label, { fontSize: '15px', color: '#aaaaaa' });
      const val = this.add.text(x + 180, y, value, { fontSize: '15px', color: '#ffffff' });
      this.contentGroup.add(lbl);
      this.contentGroup.add(val);
      y += lineH;
    });

    // EXP bar
    y += 4;
    const barW = 300;
    const bg = this.add.rectangle(x, y, barW, 12, 0x333333).setOrigin(0, 0.5);
    const pct = expRange > 0 ? Math.max(0, Math.min(1, expProgress / expRange)) : 1;
    const fill = this.add.rectangle(x, y, barW * pct, 12, 0x4488ff).setOrigin(0, 0.5);
    const expLabel = this.add.text(x + barW + 10, y, `${expProgress}/${expRange}`, { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0, 0.5);
    this.contentGroup.add(bg);
    this.contentGroup.add(fill);
    this.contentGroup.add(expLabel);

    // HP display
    y += 30;
    const hpLbl = this.add.text(x, y, 'HP', { fontSize: '15px', color: '#aaaaaa' });
    const hpVal = this.add.text(x + 180, y, `${p.currentHp} / ${p.stats.hp}`, { fontSize: '15px', color: '#ffffff' });
    this.contentGroup.add(hpLbl);
    this.contentGroup.add(hpVal);
    y += 4;
    const hpBg = this.add.rectangle(x, y + 20, barW, 10, 0x333333).setOrigin(0, 0.5);
    const hpPct = p.stats.hp > 0 ? p.currentHp / p.stats.hp : 0;
    const hpColor = hpPct > 0.5 ? 0x4caf50 : hpPct > 0.2 ? 0xffeb3b : 0xf44336;
    const hpFill = this.add.rectangle(x, y + 20, barW * hpPct, 10, hpColor).setOrigin(0, 0.5);
    this.contentGroup.add(hpBg);
    this.contentGroup.add(hpFill);
  }

  // ─── STATS TAB ───
  private drawStatsTab(): void {
    const p = this.pokemon;
    const pData = pokemonData[p.dataId];
    const x = 50;
    let y = 120;
    const lineH = 38;

    const statLabels: { key: keyof import('@utils/type-helpers').Stats; label: string }[] = [
      { key: 'hp', label: 'HP' },
      { key: 'attack', label: 'Attack' },
      { key: 'defense', label: 'Defense' },
      { key: 'spAttack', label: 'Sp. Atk' },
      { key: 'spDefense', label: 'Sp. Def' },
      { key: 'speed', label: 'Speed' },
    ];

    // Header
    const hdr = this.add.text(x, y, 'Stat', { fontSize: '13px', color: '#888888' });
    const hdr2 = this.add.text(x + 110, y, 'Value', { fontSize: '13px', color: '#888888' });
    const hdr3 = this.add.text(x + 180, y, 'Base', { fontSize: '13px', color: '#888888' });
    const hdr4 = this.add.text(x + 230, y, 'IV', { fontSize: '13px', color: '#888888' });
    const hdr5 = this.add.text(x + 270, y, 'EV', { fontSize: '13px', color: '#888888' });
    const hdr6 = this.add.text(x + 320, y, 'Bar', { fontSize: '13px', color: '#888888' });
    this.contentGroup.add(hdr); this.contentGroup.add(hdr2); this.contentGroup.add(hdr3);
    this.contentGroup.add(hdr4); this.contentGroup.add(hdr5); this.contentGroup.add(hdr6);
    y += 28;

    const maxStat = 200; // scale bar against this

    statLabels.forEach(({ key, label }) => {
      const statVal = p.stats[key];
      const baseVal = pData?.baseStats[key] ?? 0;
      const ivVal = p.ivs[key];
      const evVal = p.evs[key];

      // Nature-influenced color for non-HP stats
      let labelColor = '#ffffff';
      if (key !== 'hp') {
        const natMod = getNatureMultiplier(p.nature, key);
        if (natMod > 1) labelColor = '#ff6666'; // boosted
        else if (natMod < 1) labelColor = '#6688ff'; // lowered
      }

      const lbl = this.add.text(x, y, label, { fontSize: '15px', color: labelColor });
      const val = this.add.text(x + 110, y, `${statVal}`, { fontSize: '15px', color: '#ffffff', fontStyle: 'bold' });
      const bv = this.add.text(x + 180, y, `${baseVal}`, { fontSize: '13px', color: '#aaaaaa' });
      const iv = this.add.text(x + 230, y, `${ivVal}`, { fontSize: '13px', color: '#88cc88' });
      const ev = this.add.text(x + 270, y, `${evVal}`, { fontSize: '13px', color: '#cccc88' });

      // Stat bar
      const barW = 200;
      const barBg = this.add.rectangle(x + 320, y + 8, barW, 12, 0x333333).setOrigin(0, 0.5);
      const barPct = Math.min(1, statVal / maxStat);
      const barColor = statVal >= 100 ? 0x4caf50 : statVal >= 60 ? 0xffeb3b : 0xf44336;
      const barFill = this.add.rectangle(x + 320, y + 8, barW * barPct, 12, barColor).setOrigin(0, 0.5);

      [lbl, val, bv, iv, ev, barBg, barFill].forEach(obj => this.contentGroup.add(obj));
      y += lineH;
    });

    // Totals
    y += 10;
    const totalStats = Object.values(p.stats).reduce((a, b) => a + b, 0);
    const totalIvs = Object.values(p.ivs).reduce((a, b) => a + b, 0);
    const totalEvs = Object.values(p.evs).reduce((a, b) => a + b, 0);
    const totLine = this.add.text(x, y, `Total: ${totalStats}`, { fontSize: '15px', color: '#ffcc00', fontStyle: 'bold' });
    const ivTot = this.add.text(x + 230, y, `${totalIvs}`, { fontSize: '13px', color: '#88cc88' });
    const evTot = this.add.text(x + 270, y, `${totalEvs}/510`, { fontSize: '13px', color: '#cccc88' });
    this.contentGroup.add(totLine); this.contentGroup.add(ivTot); this.contentGroup.add(evTot);

    // Nature note
    y += 35;
    const natNote = this.add.text(x, y, `Nature: ${p.nature.charAt(0).toUpperCase() + p.nature.slice(1)} — ${getNatureDescription(p.nature)}`, {
      fontSize: '13px', color: '#aaaaaa',
    });
    this.contentGroup.add(natNote);
    const natHint = this.add.text(x, y + 20, 'Red = boosted by nature   Blue = lowered by nature', { fontSize: '11px', color: '#666688' });
    this.contentGroup.add(natHint);
  }

  // ─── MOVES TAB ───
  private drawMovesTab(): void {
    const p = this.pokemon;
    const x = 50;
    let y = 120;

    if (p.moves.length === 0) {
      const noMoves = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No moves', { fontSize: '18px', color: '#888888' }).setOrigin(0.5);
      this.contentGroup.add(noMoves);
      return;
    }

    p.moves.forEach((m, i) => {
      const md = moveData[m.moveId];
      if (!md) return;

      // Move card background — full width
      const cardBg = this.add.rectangle(GAME_WIDTH / 2, y + 45, GAME_WIDTH - 50, 90, COLORS.bgCard, 0.9).setStrokeStyle(1, COLORS.border);
      this.contentGroup.add(cardBg);

      // Type badge
      const typeBadgeC = drawTypeBadge(this, x + 35, y + 10, md.type);
      this.contentGroup.add(typeBadgeC);

      // Category badge
      const catBadge = this.add.rectangle(x + 115, y + 10, 70, 18, CATEGORY_COLORS[md.category] ?? 0x888899).setStrokeStyle(1, 0xffffff);
      const catLabel = this.add.text(x + 115, y + 10, md.category.toUpperCase(), { ...FONTS.label, color: '#ffffff' }).setOrigin(0.5);
      this.contentGroup.add(catBadge);
      this.contentGroup.add(catLabel);

      // Move name
      const moveName = this.add.text(x + 170, y + 3, md.name, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' });
      this.contentGroup.add(moveName);

      // PP
      const pp = this.add.text(GAME_WIDTH - 100, y + 3, `PP ${m.currentPp}/${md.pp}`, { fontSize: '14px', color: '#aaaaaa' });
      this.contentGroup.add(pp);

      // Power / Accuracy
      const details: string[] = [];
      if (md.power !== null) details.push(`Power: ${md.power}`);
      details.push(`Acc: ${md.accuracy}%`);
      if (md.priority && md.priority !== 0) details.push(`Priority: ${md.priority > 0 ? '+' : ''}${md.priority}`);
      const detailText = this.add.text(x + 10, y + 30, details.join('   |   '), { fontSize: '12px', color: '#aaaaaa' });
      this.contentGroup.add(detailText);

      // Effect description
      if (md.effect) {
        let effectStr = '';
        if (md.effect.type === 'status' && md.effect.status) {
          effectStr = `${md.effect.chance ?? 100}% chance: ${md.effect.status}`;
        } else if (md.effect.type === 'stat-change' && md.effect.stat) {
          const dir = (md.effect.stages ?? 0) > 0 ? '↑' : '↓';
          effectStr = `${md.effect.target === 'self' ? 'Self' : 'Target'} ${md.effect.stat} ${dir}${Math.abs(md.effect.stages ?? 1)}`;
        } else if (md.effect.type === 'drain') {
          effectStr = 'Drains HP';
        } else if (md.effect.type === 'flinch') {
          effectStr = `${md.effect.chance ?? 0}% flinch`;
        }
        if (effectStr) {
          const eff = this.add.text(x + 10, y + 48, effectStr, { fontSize: '11px', color: '#888888' });
          this.contentGroup.add(eff);
        }
      }

      y += 100;
    });
  }
}
