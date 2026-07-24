import Phaser from 'phaser';
import type { RegionMapEdge, RegionMapNode } from '@data/region-map';
import { ui } from '@utils/ui-layout';
import { COLORS, FONTS, mobileFontSize, mobileScale, isMobile } from '@ui/theme';
import { NinePatchPanel } from './NinePatchPanel';

interface GridArea {
  areaX: number;
  areaY: number;
  areaW: number;
  areaH: number;
  cellW: number;
  cellH: number;
  maxCol: number;
  maxRow: number;
}

export interface RegionMapViewState {
  nodes: readonly RegionMapNode[];
  edges: readonly RegionMapEdge[];
  selectedNodeIndex: number;
  currentNodeIndex: number;
  canFly: boolean;
  infoText: string;
  isVisited: (nodeIndex: number) => boolean;
  canActivateNode: (nodeIndex: number) => boolean;
  onNodeSelected: (nodeIndex: number) => void;
  onNodeActivated: (nodeIndex: number) => void;
}

const NODE_COLORS = {
  town: 0xffcc00,
  route: 0x6699cc,
  dungeon: 0xcc6644,
  landmark: 0xee88ff,
  unvisited: 0x444466,
  current: 0x55ff88,
  edge: 0x3a3a5a,
  edgeVisited: 0x5a5a8a,
} as const;

export class RegionMapView {
  private overlay?: Phaser.GameObjects.Rectangle;
  private panel?: NinePatchPanel;
  private titleText?: Phaser.GameObjects.Text;
  private infoText?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;
  private edgeGraphics?: Phaser.GameObjects.Graphics;
  private nodeGraphics?: Phaser.GameObjects.Graphics;
  private playerMarker?: Phaser.GameObjects.Text;
  private pulseTimer?: Phaser.Time.TimerEvent;
  private labels: Phaser.GameObjects.Text[] = [];
  private state?: RegionMapViewState;

  constructor(private readonly scene: Phaser.Scene) {}

  render(state: RegionMapViewState): void {
    this.destroy();
    this.state = state;
    const layout = ui(this.scene);
    this.overlay = this.scene.add.rectangle(layout.cx, layout.cy, layout.w, layout.h, COLORS.bgDark, 1);

    const panelW = Math.min(layout.w - 16, 700);
    const panelH = Math.min(layout.h - 16, 520);
    this.panel = new NinePatchPanel(this.scene, layout.cx, layout.cy, panelW, panelH, {
      fillColor: COLORS.bgPanel,
      borderColor: COLORS.border,
      cornerRadius: 8,
    });

    this.titleText = this.scene.add.text(layout.cx, layout.cy - panelH / 2 + 20, 'TOWN MAP — Aurum Region', {
      ...FONTS.heading,
      fontSize: mobileFontSize(18),
      color: COLORS.textHighlight,
    }).setOrigin(0.5);

    const hintStr = state.canFly
      ? (isMobile() ? 'Tap city to fly  |  B to close' : 'ENTER to fly  |  ESC to close')
      : (isMobile() ? 'Tap to inspect  |  B to close' : 'Arrow keys to browse  |  ESC to close');
    this.hintText = this.scene.add.text(layout.cx, layout.cy + panelH / 2 - 18, hintStr, {
      ...FONTS.caption,
      fontSize: mobileFontSize(10),
      color: COLORS.textDim,
    }).setOrigin(0.5);

    this.infoText = this.scene.add.text(layout.cx, layout.cy + panelH / 2 - 40, state.infoText, {
      ...FONTS.bodySmall,
      fontSize: mobileFontSize(12),
      color: COLORS.textGray,
    }).setOrigin(0.5);

    const grid = this.getGridArea(state.nodes, layout.cx, layout.cy, panelW, panelH);
    this.edgeGraphics = this.scene.add.graphics();
    this.drawEdges(grid, state);
    this.nodeGraphics = this.scene.add.graphics();
    this.drawNodes(grid, state);

    this.playerMarker = this.scene.add.text(0, 0, '\u25BC', {
      fontSize: mobileFontSize(14),
      color: COLORS.textSuccess,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    this.positionPlayerMarker(grid, state);
    this.startPulse();
    this.updateSelection(state.selectedNodeIndex, state.infoText);
  }

  updateSelection(selectedNodeIndex: number, info: string): void {
    const state = this.state;
    if (!state) return;
    this.infoText?.setText(info);
    this.labels.forEach((label, index) => {
      const isSelected = index === selectedNodeIndex;
      const visited = state.isVisited(index);
      const current = index === state.currentNodeIndex;
      if (isSelected) {
        label.setColor(COLORS.textHighlight);
        label.setAlpha(1);
      } else if (current) {
        label.setColor(COLORS.textSuccess);
        label.setAlpha(1);
      } else if (visited) {
        label.setColor(COLORS.textWhite);
        label.setAlpha(1);
      } else {
        label.setColor(COLORS.textDim);
        label.setAlpha(0.5);
      }
    });
  }

  destroy(): void {
    if (this.pulseTimer) {
      this.pulseTimer.destroy();
      this.pulseTimer = undefined;
    }
    this.panel?.destroy();
    this.panel = undefined;
    this.overlay?.destroy();
    this.titleText?.destroy();
    this.infoText?.destroy();
    this.hintText?.destroy();
    this.edgeGraphics?.destroy();
    this.nodeGraphics?.destroy();
    this.playerMarker?.destroy();
    this.labels.forEach(label => label.destroy());
    this.labels = [];
    this.state = undefined;
  }

  private getGridArea(nodes: readonly RegionMapNode[], cx: number, cy: number, panelW: number, panelH: number): GridArea {
    const maxCol = Math.max(...nodes.map(node => node.col));
    const maxRow = Math.max(...nodes.map(node => node.row));
    const marginX = 60 * mobileScale();
    const marginTop = 50 * mobileScale();
    const marginBottom = 60 * mobileScale();
    const areaX = cx - panelW / 2 + marginX;
    const areaY = cy - panelH / 2 + marginTop;
    const areaW = panelW - marginX * 2;
    const areaH = panelH - marginTop - marginBottom;
    return {
      areaX,
      areaY,
      areaW,
      areaH,
      cellW: areaW / Math.max(maxCol, 1),
      cellH: areaH / Math.max(maxRow, 1),
      maxCol,
      maxRow,
    };
  }

  private nodePos(node: RegionMapNode, grid: GridArea): { x: number; y: number } {
    return {
      x: grid.areaX + node.col * grid.cellW,
      y: grid.areaY + node.row * grid.cellH,
    };
  }

  private drawEdges(grid: GridArea, state: RegionMapViewState): void {
    this.edgeGraphics?.clear();
    state.edges.forEach(([a, b]) => {
      const nodeA = state.nodes[a];
      const nodeB = state.nodes[b];
      if (!nodeA || !nodeB) return;
      const posA = this.nodePos(nodeA, grid);
      const posB = this.nodePos(nodeB, grid);
      const visitedA = state.isVisited(a);
      const visitedB = state.isVisited(b);
      const edgeColor = visitedA && visitedB ? NODE_COLORS.edgeVisited : NODE_COLORS.edge;
      const alpha = visitedA || visitedB ? 0.7 : 0.3;
      this.edgeGraphics?.lineStyle(2, edgeColor, alpha);
      this.edgeGraphics?.beginPath();
      this.edgeGraphics?.moveTo(posA.x, posA.y);
      this.edgeGraphics?.lineTo(posB.x, posB.y);
      this.edgeGraphics?.strokePath();
    });
  }

  private drawNodes(grid: GridArea, state: RegionMapViewState): void {
    this.nodeGraphics?.clear();
    const fontSize = mobileFontSize(9);
    state.nodes.forEach((node, index) => {
      const pos = this.nodePos(node, grid);
      const visited = state.isVisited(index);
      const isCurrent = index === state.currentNodeIndex;
      const fillColor = isCurrent ? NODE_COLORS.current : (visited ? NODE_COLORS[node.type] : NODE_COLORS.unvisited);
      const alpha = visited || isCurrent ? 1 : 0.5;
      this.drawNodeShape(node, pos, fillColor, alpha, isCurrent);
      const label = this.scene.add.text(pos.x, pos.y + 12, node.label, {
        fontSize,
        color: isCurrent ? COLORS.textSuccess : (visited ? COLORS.textWhite : COLORS.textDim),
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setAlpha(alpha).setInteractive({ useHandCursor: true });
      label.on('pointerdown', () => {
        state.onNodeSelected(index);
        if (state.canActivateNode(index)) state.onNodeActivated(index);
      });
      this.labels.push(label);
    });
  }

  private drawNodeShape(
    node: RegionMapNode,
    pos: { x: number; y: number },
    fillColor: number,
    alpha: number,
    isCurrent: boolean,
  ): void {
    const graphics = this.nodeGraphics;
    if (!graphics) return;
    graphics.fillStyle(fillColor, alpha);
    if (node.type === 'town') {
      const radius = isCurrent ? 8 : 6;
      graphics.fillCircle(pos.x, pos.y, radius);
      graphics.lineStyle(1.5, 0xffffff, alpha * 0.6);
      graphics.strokeCircle(pos.x, pos.y, radius);
      return;
    }
    if (node.type === 'landmark') {
      const size = isCurrent ? 9 : 7;
      graphics.beginPath();
      graphics.moveTo(pos.x, pos.y - size);
      graphics.lineTo(pos.x + size, pos.y);
      graphics.lineTo(pos.x, pos.y + size);
      graphics.lineTo(pos.x - size, pos.y);
      graphics.closePath();
      graphics.fillPath();
      graphics.lineStyle(1.5, 0xffffff, alpha * 0.6);
      graphics.strokePath();
      return;
    }
    if (node.type === 'dungeon') {
      const size = isCurrent ? 6 : 5;
      graphics.fillRect(pos.x - size, pos.y - size, size * 2, size * 2);
      graphics.lineStyle(1.5, 0xffffff, alpha * 0.3);
      graphics.strokeRect(pos.x - size, pos.y - size, size * 2, size * 2);
      return;
    }
    graphics.fillCircle(pos.x, pos.y, 3);
  }

  private positionPlayerMarker(grid: GridArea, state: RegionMapViewState): void {
    const currentNode = state.nodes[state.currentNodeIndex];
    if (!currentNode) {
      this.playerMarker?.setVisible(false);
      return;
    }
    const pos = this.nodePos(currentNode, grid);
    this.playerMarker?.setPosition(pos.x, pos.y - 12);
    this.playerMarker?.setVisible(true);
  }

  private startPulse(): void {
    this.pulseTimer = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.playerMarker) this.playerMarker.setAlpha(this.playerMarker.alpha > 0.5 ? 0.3 : 1);
      },
    });
  }
}
