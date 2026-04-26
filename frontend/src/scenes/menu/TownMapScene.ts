import Phaser from 'phaser';
import { ui } from '@utils/ui-layout';
import { layoutOn } from '@utils/layout-on';
import { COLORS, FONTS, mobileFontSize, MOBILE_SCALE, isMobile } from '@ui/theme';
import { NinePatchPanel } from '@ui/widgets/NinePatchPanel';
import { AudioManager } from '@managers/AudioManager';
import { GameManager } from '@managers/GameManager';
import { SFX } from '@utils/audio-keys';
import { mapRegistry } from '@data/maps';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';
import { ConfirmBox } from '@ui/widgets/ConfirmBox';
import { TouchControls } from '@ui/controls/TouchControls';

// ─── Region Map Data ───

/** A location node on the region map. */
interface MapNode {
  /** Map registry key (or 'group:' prefix for grouped dungeons). */
  mapKey: string;
  /** Display name on the map. */
  label: string;
  /** Grid column (0-based). */
  col: number;
  /** Grid row (0-based, 0 = top/north). */
  row: number;
  /** Node type affects icon shape and color. */
  type: 'town' | 'route' | 'dungeon' | 'landmark';
  /** If true, this node is a flyable city. */
  flyable?: boolean;
  /** Interior map keys that should count toward 'visited' for this node. */
  childMaps?: string[];
}

/**
 * Connections between map nodes drawn as lines.
 * Each entry is [sourceIndex, targetIndex] into REGION_NODES.
 */
type MapEdge = [number, number];

// Layout: The Aurum region from south to north
// Row 0 = northernmost, row 8 = southernmost
const REGION_NODES: MapNode[] = [
  // ── Southern towns (Act 1) ──
  { mapKey: 'pallet-town',        label: 'Littoral Town',       col: 2, row: 8, type: 'town',     flyable: true },
  { mapKey: 'route-1',            label: 'Route 1',             col: 2, row: 7, type: 'route' },
  { mapKey: 'viridian-city',      label: 'Viridian City',       col: 2, row: 6, type: 'town',     flyable: true },
  { mapKey: 'route-2',            label: 'Route 2',             col: 2, row: 5, type: 'route' },
  { mapKey: 'viridian-forest',    label: 'Viridian Forest',     col: 1, row: 5, type: 'dungeon' },
  { mapKey: 'pewter-city',        label: 'Pewter City',         col: 2, row: 4, type: 'town',     flyable: true },

  // ── Act 2: Eastern branch ──
  { mapKey: 'route-3',            label: 'Route 3',             col: 3, row: 4, type: 'route' },
  { mapKey: 'coral-harbor',       label: 'Coral Harbor',        col: 4, row: 4, type: 'town',     flyable: true },
  { mapKey: 'crystal-cavern',     label: 'Crystal Cavern',      col: 4, row: 5, type: 'dungeon',
    childMaps: ['crystal-cavern-depths'] },
  { mapKey: 'route-4',            label: 'Route 4',             col: 4, row: 3, type: 'route' },
  { mapKey: 'ember-mines',        label: 'Ember Mines',         col: 5, row: 3, type: 'dungeon' },
  { mapKey: 'ironvale-city',      label: 'Ironvale City',       col: 4, row: 2, type: 'town',     flyable: true },

  // ── Act 2 continued: Central/Western branch ──
  { mapKey: 'route-5',            label: 'Route 5',             col: 5, row: 2, type: 'route' },
  { mapKey: 'verdantia-village',  label: 'Verdantia Village',   col: 6, row: 2, type: 'town',     flyable: true },
  { mapKey: 'verdantia-lab',      label: 'Verdantia Lab',       col: 7, row: 2, type: 'dungeon' },
  { mapKey: 'voltara-city',       label: 'Voltara City',        col: 6, row: 1, type: 'town',     flyable: true },

  // ── Act 3: Northern region ──
  { mapKey: 'route-6',            label: 'Route 6',             col: 4, row: 1, type: 'route' },
  { mapKey: 'wraithmoor-town',    label: 'Wraithmoor Town',     col: 3, row: 1, type: 'town',     flyable: true },
  { mapKey: 'route-7',            label: 'Route 7',             col: 5, row: 1, type: 'route' },
  { mapKey: 'scalecrest-citadel', label: 'Scalecrest Citadel',  col: 5, row: 0, type: 'town',     flyable: true },
  { mapKey: 'cinderfall-town',    label: 'Cinderfall Town',     col: 7, row: 0, type: 'town',     flyable: true },
  { mapKey: 'route-8',            label: 'Route 8',             col: 6, row: 0, type: 'route' },

  // ── Act 3 climax dungeon ──
  { mapKey: 'abyssal-spire-f1',   label: 'Abyssal Spire',      col: 3, row: 0, type: 'dungeon',
    childMaps: ['abyssal-spire-f2', 'abyssal-spire-f3', 'abyssal-spire-f4', 'abyssal-spire-f5'] },

  // ── Act 4: Endgame ──
  { mapKey: 'victory-road',       label: 'Victory Road',        col: 1, row: 1, type: 'dungeon' },
  { mapKey: 'pokemon-league',     label: 'Pokémon League',      col: 1, row: 0, type: 'landmark',
    childMaps: ['pokemon-league-nerida', 'pokemon-league-theron', 'pokemon-league-lysandra',
                'pokemon-league-ashborne', 'pokemon-league-champion'] },

  // ── Post-game ──
  { mapKey: 'aether-sanctum',      label: 'Aether Sanctum',     col: 0, row: 0, type: 'dungeon' },
  { mapKey: 'shattered-isles-shore', label: 'Shattered Isles',  col: 0, row: 8, type: 'dungeon',
    childMaps: ['shattered-isles-ruins', 'shattered-isles-temple'] },
];

/** Edges connecting adjacent nodes (by index into REGION_NODES). */
const REGION_EDGES: MapEdge[] = [
  // Act 1: pallet -> route1 -> viridian -> route2 -> pewter
  [0, 1], [1, 2], [2, 3], [3, 5],
  // Viridian forest off route2
  [3, 4],
  // Act 2: pewter -> route3 -> coral
  [5, 6], [6, 7],
  // Crystal cavern off coral
  [7, 8],
  // Coral -> route4 -> ironvale
  [7, 9], [9, 11],
  // Ember mines off route4
  [9, 10],
  // Ironvale -> route5 -> verdantia
  [11, 12], [12, 13],
  // Verdantia lab off verdantia
  [13, 14],
  // Verdantia -> voltara (implied via route5 area)
  [13, 15],
  // Act 3: ironvale -> route6 -> wraithmoor
  [11, 16], [16, 17],
  // Route7 -> scalecrest
  [15, 18], [18, 19],
  // Route8 -> cinderfall
  [19, 21], [21, 20],
  // Abyssal Spire off wraithmoor
  [17, 22],
  // Act 4: wraithmoor -> victory-road -> pokemon league
  [17, 23], [23, 24],
  // Post-game
  [24, 25],
  // Shattered Isles off pallet
  [0, 26],
];

/** Color constants for node types. */
const NODE_COLORS = {
  town:       0xffcc00,
  route:      0x6699cc,
  dungeon:    0xcc6644,
  landmark:   0xee88ff,
  unvisited:  0x444466,
  current:    0x55ff88,
  edge:       0x3a3a5a,
  edgeVisited: 0x5a5a8a,
} as const;

// ─── Helpers to resolve which node the player is on ───

/** Map from interior/child map key to parent node index. */
function buildChildLookup(): Map<string, number> {
  const lookup = new Map<string, number>();
  REGION_NODES.forEach((node, idx) => {
    if (node.childMaps) {
      for (const child of node.childMaps) {
        lookup.set(child, idx);
      }
    }
  });
  return lookup;
}

/**
 * Resolve a map key (possibly interior) to the index in REGION_NODES.
 * Falls back to matching by prefix (e.g. 'pewter-pokecenter' -> 'pewter-city').
 */
function resolveNodeIndex(mapKey: string): number {
  // Direct match
  const direct = REGION_NODES.findIndex(n => n.mapKey === mapKey);
  if (direct >= 0) return direct;

  // Child map match
  const childLookup = buildChildLookup();
  const child = childLookup.get(mapKey);
  if (child !== undefined) return child;

  // Prefix heuristic: 'pewter-pokecenter' -> 'pewter-city'
  // Extract the town prefix before the first known suffix
  const suffixes = ['-pokecenter', '-pokemart', '-gym', '-museum', '-house-', '-lab'];
  for (const suffix of suffixes) {
    if (mapKey.includes(suffix)) {
      const prefix = mapKey.substring(0, mapKey.indexOf(suffix));
      const match = REGION_NODES.findIndex(n =>
        n.mapKey.startsWith(prefix) && n.type === 'town');
      if (match >= 0) return match;
    }
  }

  return -1;
}

// ─── Scene ───

export class TownMapScene extends Phaser.Scene {
  private cursor = 0;
  private selectableIndices: number[] = [];
  private nodeGraphics!: Phaser.GameObjects.Graphics;
  private edgeGraphics!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private panel!: NinePatchPanel;
  private titleText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Rectangle;
  private playerMarker!: Phaser.GameObjects.Text;
  private pulseTimer?: Phaser.Time.TimerEvent;
  private confirmBox?: ConfirmBox;
  private canFly = false;
  private currentNodeIndex = -1;

  constructor() {
    super({ key: 'TownMapScene' });
  }

  create(): void {
    const gm = GameManager.getInstance();
    this.canFly = OverworldAbilities.canUse('fly');
    this.currentNodeIndex = resolveNodeIndex(gm.getCurrentMap());

    // Build selectable node indices (all visible nodes)
    this.selectableIndices = [];
    for (let i = 0; i < REGION_NODES.length; i++) {
      this.selectableIndices.push(i);
    }

    // Default cursor to current location
    const cursorIdx = this.selectableIndices.indexOf(this.currentNodeIndex);
    this.cursor = cursorIdx >= 0 ? cursorIdx : 0;

    this.drawMap();

    // Keyboard input
    this.input.keyboard!.on('keydown-UP', this.moveCursorUp, this);
    this.input.keyboard!.on('keydown-DOWN', this.moveCursorDown, this);
    this.input.keyboard!.on('keydown-LEFT', this.moveCursorLeft, this);
    this.input.keyboard!.on('keydown-RIGHT', this.moveCursorRight, this);
    this.input.keyboard!.on('keydown-ENTER', this.handleSelect, this);
    this.input.keyboard!.on('keydown-SPACE', this.handleSelect, this);
    this.input.keyboard!.on('keydown-ESC', this.close, this);

    // Re-layout on resize
    layoutOn(this, () => {
      this.rebuildVisuals();
    });
  }

  update(): void {
    const tc = TouchControls.getInstance();
    if (tc?.consumeCancel()) {
      this.close();
    }
  }

  // ─── Drawing ───

  private drawMap(): void {
    const layout = ui(this);

    // Full screen dark background
    this.overlay = this.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark, 1);

    // Panel
    const panelW = Math.min(layout.w - 16, 700);
    const panelH = Math.min(layout.h - 16, 520);
    this.panel = new NinePatchPanel(this, layout.cx, layout.cy, panelW, panelH, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    // Title
    this.titleText = this.add.text(layout.cx, layout.cy - panelH / 2 + 20, 'TOWN MAP — Aurum Region', {
      ...FONTS.heading,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    // Hint text at bottom
    const hintStr = this.canFly
      ? (isMobile() ? 'Tap city to fly  |  B to close' : 'ENTER to fly  |  ESC to close')
      : (isMobile() ? 'Tap to inspect  |  B to close' : 'Arrow keys to browse  |  ESC to close');
    this.hintText = this.add.text(layout.cx, layout.cy + panelH / 2 - 18, hintStr, {
      ...FONTS.caption,
      fontSize: mobileFontSize(10),
      color: COLORS.textDim,
    }).setOrigin(0.5);

    // Info text (selected location details)
    this.infoText = this.add.text(layout.cx, layout.cy + panelH / 2 - 40, '', {
      ...FONTS.bodySmall,
      fontSize: mobileFontSize(12),
      color: COLORS.textGray,
    }).setOrigin(0.5);

    // Compute grid dimensions
    const gridArea = this.getGridArea(layout, panelW, panelH);

    // Draw edges first (behind nodes)
    this.edgeGraphics = this.add.graphics();
    this.drawEdges(gridArea);

    // Draw nodes
    this.nodeGraphics = this.add.graphics();
    this.labels = [];
    this.drawNodes(gridArea);

    // Player marker (pulsing)
    this.playerMarker = this.add.text(0, 0, '\u25BC', {
      fontSize: mobileFontSize(14),
      color: COLORS.textSuccess,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    this.positionPlayerMarker(gridArea);
    this.startPulse();

    // Update info for initial cursor position
    this.updateSelection(gridArea);
  }

  private getGridArea(layout: ReturnType<typeof ui>, panelW: number, panelH: number) {
    // Grid spans columns 0-7, rows 0-8
    const maxCol = Math.max(...REGION_NODES.map(n => n.col));
    const maxRow = Math.max(...REGION_NODES.map(n => n.row));

    const marginX = 60 * MOBILE_SCALE;
    const marginTop = 50 * MOBILE_SCALE;
    const marginBottom = 60 * MOBILE_SCALE;

    const areaX = layout.cx - panelW / 2 + marginX;
    const areaY = layout.cy - panelH / 2 + marginTop;
    const areaW = panelW - marginX * 2;
    const areaH = panelH - marginTop - marginBottom;

    const cellW = areaW / Math.max(maxCol, 1);
    const cellH = areaH / Math.max(maxRow, 1);

    return { areaX, areaY, areaW, areaH, cellW, cellH, maxCol, maxRow };
  }

  private nodePos(node: MapNode, grid: ReturnType<typeof this.getGridArea>): { x: number; y: number } {
    return {
      x: grid.areaX + node.col * grid.cellW,
      y: grid.areaY + node.row * grid.cellH,
    };
  }

  private drawEdges(grid: ReturnType<typeof this.getGridArea>): void {
    const gm = GameManager.getInstance();
    this.edgeGraphics.clear();

    for (const [a, b] of REGION_EDGES) {
      const nodeA = REGION_NODES[a];
      const nodeB = REGION_NODES[b];
      const posA = this.nodePos(nodeA, grid);
      const posB = this.nodePos(nodeB, grid);

      const visitedA = this.isNodeVisited(a, gm);
      const visitedB = this.isNodeVisited(b, gm);
      const edgeColor = (visitedA && visitedB) ? NODE_COLORS.edgeVisited : NODE_COLORS.edge;
      const alpha = (visitedA || visitedB) ? 0.7 : 0.3;

      this.edgeGraphics.lineStyle(2, edgeColor, alpha);
      this.edgeGraphics.beginPath();
      this.edgeGraphics.moveTo(posA.x, posA.y);
      this.edgeGraphics.lineTo(posB.x, posB.y);
      this.edgeGraphics.strokePath();
    }
  }

  private drawNodes(grid: ReturnType<typeof this.getGridArea>): void {
    const gm = GameManager.getInstance();
    this.nodeGraphics.clear();
    // Destroy old labels
    this.labels.forEach(l => l.destroy());
    this.labels = [];

    const fontSize = mobileFontSize(9);

    for (let i = 0; i < REGION_NODES.length; i++) {
      const node = REGION_NODES[i];
      const pos = this.nodePos(node, grid);
      const visited = this.isNodeVisited(i, gm);
      const isCurrent = i === this.currentNodeIndex;

      // Choose color
      let fillColor: number;
      if (isCurrent) {
        fillColor = NODE_COLORS.current;
      } else if (visited) {
        fillColor = NODE_COLORS[node.type];
      } else {
        fillColor = NODE_COLORS.unvisited;
      }

      const alpha = visited || isCurrent ? 1 : 0.5;

      // Draw shape based on type
      this.nodeGraphics.fillStyle(fillColor, alpha);
      if (node.type === 'town') {
        // Circle for towns
        const radius = isCurrent ? 8 : 6;
        this.nodeGraphics.fillCircle(pos.x, pos.y, radius);
        this.nodeGraphics.lineStyle(1.5, 0xffffff, alpha * 0.6);
        this.nodeGraphics.strokeCircle(pos.x, pos.y, radius);
      } else if (node.type === 'landmark') {
        // Diamond for landmarks
        const s = isCurrent ? 9 : 7;
        this.nodeGraphics.fillStyle(fillColor, alpha);
        this.nodeGraphics.beginPath();
        this.nodeGraphics.moveTo(pos.x, pos.y - s);
        this.nodeGraphics.lineTo(pos.x + s, pos.y);
        this.nodeGraphics.lineTo(pos.x, pos.y + s);
        this.nodeGraphics.lineTo(pos.x - s, pos.y);
        this.nodeGraphics.closePath();
        this.nodeGraphics.fillPath();
        this.nodeGraphics.lineStyle(1.5, 0xffffff, alpha * 0.6);
        this.nodeGraphics.strokePath();
      } else if (node.type === 'dungeon') {
        // Square for dungeons
        const s = isCurrent ? 6 : 5;
        this.nodeGraphics.fillRect(pos.x - s, pos.y - s, s * 2, s * 2);
        this.nodeGraphics.lineStyle(1.5, 0xffffff, alpha * 0.3);
        this.nodeGraphics.strokeRect(pos.x - s, pos.y - s, s * 2, s * 2);
      } else {
        // Small dot for routes
        const radius = 3;
        this.nodeGraphics.fillCircle(pos.x, pos.y, radius);
      }

      // Label
      const labelColor = isCurrent
        ? COLORS.textSuccess
        : (visited ? COLORS.textWhite : COLORS.textDim);
      const label = this.add.text(pos.x, pos.y + 12, node.label, {
        fontSize,
        color: labelColor,
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setAlpha(alpha);

      // Make label interactive for touch
      label.setInteractive({ useHandCursor: true });
      const nodeIdx = i;
      label.on('pointerdown', () => {
        const selIdx = this.selectableIndices.indexOf(nodeIdx);
        if (selIdx >= 0) {
          this.cursor = selIdx;
          const la = ui(this);
          const pw = Math.min(la.w - 16, 700);
          const ph = Math.min(la.h - 16, 520);
          this.updateSelection(this.getGridArea(la, pw, ph));
          AudioManager.getInstance().playSFX(SFX.CURSOR);
          // Double-tap / single-tap to fly
          if (this.canFly && REGION_NODES[nodeIdx].flyable && this.isNodeVisited(nodeIdx, GameManager.getInstance())) {
            this.handleSelect();
          }
        }
      });

      this.labels.push(label);
    }
  }

  private isNodeVisited(nodeIndex: number, gm: GameManager): boolean {
    const node = REGION_NODES[nodeIndex];
    if (gm.hasVisitedMap(node.mapKey)) return true;
    if (node.childMaps) {
      return node.childMaps.some(m => gm.hasVisitedMap(m));
    }
    return false;
  }

  private positionPlayerMarker(grid: ReturnType<typeof this.getGridArea>): void {
    if (this.currentNodeIndex >= 0) {
      const pos = this.nodePos(REGION_NODES[this.currentNodeIndex], grid);
      this.playerMarker.setPosition(pos.x, pos.y - 12);
      this.playerMarker.setVisible(true);
    } else {
      this.playerMarker.setVisible(false);
    }
  }

  private startPulse(): void {
    if (this.pulseTimer) this.pulseTimer.destroy();
    this.pulseTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.playerMarker) {
          this.playerMarker.setAlpha(this.playerMarker.alpha > 0.5 ? 0.3 : 1);
        }
      },
    });
  }

  // ─── Selection and cursor ───

  private updateSelection(grid: ReturnType<typeof this.getGridArea>): void {
    const selNodeIdx = this.selectableIndices[this.cursor];
    const node = REGION_NODES[selNodeIdx];
    const gm = GameManager.getInstance();
    const visited = this.isNodeVisited(selNodeIdx, gm);
    const isCurrent = selNodeIdx === this.currentNodeIndex;

    // Highlight selected label
    this.labels.forEach((lbl, i) => {
      const isSelected = i === selNodeIdx;
      const v = this.isNodeVisited(i, gm);
      const c = i === this.currentNodeIndex;
      if (isSelected) {
        lbl.setColor(COLORS.textHighlight);
        lbl.setAlpha(1);
      } else if (c) {
        lbl.setColor(COLORS.textSuccess);
        lbl.setAlpha(1);
      } else if (v) {
        lbl.setColor(COLORS.textWhite);
        lbl.setAlpha(1);
      } else {
        lbl.setColor(COLORS.textDim);
        lbl.setAlpha(0.5);
      }
    });

    // Build info string
    let info = '';
    if (!visited) {
      info = `${node.label} — ???`;
    } else {
      const mapDef = mapRegistry[node.mapKey];
      const displayName = mapDef?.displayName ?? node.label;
      if (isCurrent) {
        info = `${displayName} (You are here)`;
      } else if (this.canFly && node.flyable) {
        info = `${displayName} — Press ENTER to Fly`;
      } else {
        info = displayName;
      }
    }
    this.infoText.setText(info);
  }

  /** Find the nearest selectable node in a direction. */
  private findNearest(dx: number, dy: number): number {
    const currentIdx = this.selectableIndices[this.cursor];
    const cur = REGION_NODES[currentIdx];
    let bestCursor = this.cursor;
    let bestDist = Infinity;

    for (let i = 0; i < this.selectableIndices.length; i++) {
      if (i === this.cursor) continue;
      const node = REGION_NODES[this.selectableIndices[i]];
      const dCol = node.col - cur.col;
      const dRow = node.row - cur.row;

      // Check direction alignment
      const aligned = (dx !== 0 && Math.sign(dCol) === dx) || (dy !== 0 && Math.sign(dRow) === dy);
      if (!aligned) continue;

      const dist = Math.abs(dCol) + Math.abs(dRow);
      // Penalize off-axis distance
      const offAxis = dx !== 0 ? Math.abs(dRow) : Math.abs(dCol);
      const score = dist + offAxis * 2;

      if (score < bestDist) {
        bestDist = score;
        bestCursor = i;
      }
    }
    return bestCursor;
  }

  private moveCursorUp = (): void => {
    const next = this.findNearest(0, -1);
    if (next !== this.cursor) {
      this.cursor = next;
      this.refreshSelection();
    }
  };

  private moveCursorDown = (): void => {
    const next = this.findNearest(0, 1);
    if (next !== this.cursor) {
      this.cursor = next;
      this.refreshSelection();
    }
  };

  private moveCursorLeft = (): void => {
    const next = this.findNearest(-1, 0);
    if (next !== this.cursor) {
      this.cursor = next;
      this.refreshSelection();
    }
  };

  private moveCursorRight = (): void => {
    const next = this.findNearest(1, 0);
    if (next !== this.cursor) {
      this.cursor = next;
      this.refreshSelection();
    }
  };

  private refreshSelection(): void {
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    const layout = ui(this);
    const panelW = Math.min(layout.w - 16, 700);
    const panelH = Math.min(layout.h - 16, 520);
    this.updateSelection(this.getGridArea(layout, panelW, panelH));
  }

  private handleSelect = (): void => {
    if (this.confirmBox) return; // Already showing a confirmation

    const selNodeIdx = this.selectableIndices[this.cursor];
    const node = REGION_NODES[selNodeIdx];
    const gm = GameManager.getInstance();

    if (!this.canFly || !node.flyable || !this.isNodeVisited(selNodeIdx, gm)) {
      return;
    }

    if (selNodeIdx === this.currentNodeIndex) {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      return;
    }

    AudioManager.getInstance().playSFX(SFX.CONFIRM);

    // Show fly confirmation
    const layout = ui(this);
    this.confirmBox = new ConfirmBox(
      this,
      layout.cx - 70,
      layout.cy - 45,
      `Fly to ${node.label}?`,
      (confirmed) => {
        this.confirmBox = undefined;
        if (confirmed) {
          this.flyTo(node.mapKey);
        }
      },
    );
  };

  private flyTo(mapKey: string): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.stop('MenuScene');
      this.scene.stop('OverworldScene');
      this.scene.start('OverworldScene', {
        flyTo: mapKey,
        spawnId: 'default',
      });
    });
  }

  private close = (): void => {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  };

  // ─── Rebuild on resize ───

  private rebuildVisuals(): void {
    // Destroy everything and redraw
    this.overlay?.destroy();
    this.panel?.destroy();
    this.titleText?.destroy();
    this.infoText?.destroy();
    this.hintText?.destroy();
    this.edgeGraphics?.destroy();
    this.nodeGraphics?.destroy();
    this.playerMarker?.destroy();
    this.labels.forEach(l => l.destroy());
    this.labels = [];
    if (this.pulseTimer) { this.pulseTimer.destroy(); this.pulseTimer = undefined; }

    this.drawMap();
  }

  // ─── Cleanup ───

  shutdown(): void {
    this.input.keyboard?.off('keydown-UP', this.moveCursorUp, this);
    this.input.keyboard?.off('keydown-DOWN', this.moveCursorDown, this);
    this.input.keyboard?.off('keydown-LEFT', this.moveCursorLeft, this);
    this.input.keyboard?.off('keydown-RIGHT', this.moveCursorRight, this);
    this.input.keyboard?.off('keydown-ENTER', this.handleSelect, this);
    this.input.keyboard?.off('keydown-SPACE', this.handleSelect, this);
    this.input.keyboard?.off('keydown-ESC', this.close, this);
    if (this.pulseTimer) { this.pulseTimer.destroy(); this.pulseTimer = undefined; }
    this.confirmBox?.destroy();
    this.confirmBox = undefined;
    this.labels = [];
  }
}
