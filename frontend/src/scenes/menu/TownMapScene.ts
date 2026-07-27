import Phaser from 'phaser';
import { layoutOn } from '@utils/layout-on';
import { AudioManager, GameManager } from '@managers/index';
import { SFX } from '@utils/audio-keys';
import { mapRegistry } from '@data/maps';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';
import { ConfirmBox } from '@ui/widgets/ConfirmBox';
import { TouchControls } from '@ui/controls/TouchControls';
import { SceneRouter } from '@scenes/SceneRouter';
import { SceneKey } from '@scenes/scene-keys';
import { SceneInputRegistry } from '@scenes/SceneInputRegistry';
import { RegionMapService, type RegionMapDirection } from '@systems/overworld/RegionMapService';
import { RegionMapView } from '@ui/widgets/RegionMapView';

export class TownMapScene extends Phaser.Scene {
  private cursor = 0;
  private selectableIndices: number[] = [];
  private confirmBox?: ConfirmBox;
  private canFly = false;
  private currentNodeIndex = -1;
  private view?: RegionMapView;

  private readonly inputRegistry = new SceneInputRegistry(this);
  private readonly regionMap = new RegionMapService();

  constructor() {
    super({ key: SceneKey.TownMap });
  }

  create(): void {
    const gm = GameManager.getInstance();
    this.canFly = OverworldAbilities.canUse('fly');
    this.currentNodeIndex = this.regionMap.resolveNodeIndex(gm.getCurrentMap());
    this.selectableIndices = this.regionMap.getSelectableIndices();
    const cursorIdx = this.selectableIndices.indexOf(this.currentNodeIndex);
    this.cursor = cursorIdx >= 0 ? cursorIdx : 0;

    layoutOn(this, () => this.rebuildVisuals());
    this.bindInput();
    this.events.once('shutdown', this.shutdown, this);
  }

  update(): void {
    const touchControls = TouchControls.getInstance();
    if (touchControls?.consumeCancel()) this.close();
  }

  shutdown(): void {
    this.inputRegistry.clear();
    this.view?.destroy();
    this.view = undefined;
    this.confirmBox?.destroy();
    this.confirmBox = undefined;
  }

  private bindInput(): void {
    this.inputRegistry.bindKey('keydown-UP', () => this.moveCursor('up'));
    this.inputRegistry.bindKey('keydown-DOWN', () => this.moveCursor('down'));
    this.inputRegistry.bindKey('keydown-LEFT', () => this.moveCursor('left'));
    this.inputRegistry.bindKey('keydown-RIGHT', () => this.moveCursor('right'));
    this.inputRegistry.bindKey('keydown-ENTER', () => this.handleSelect());
    this.inputRegistry.bindKey('keydown-SPACE', () => this.handleSelect());
    this.inputRegistry.bindKey('keydown-ESC', () => this.close());
  }

  private rebuildVisuals(): void {
    this.view ??= new RegionMapView(this);
    this.view.render({
      nodes: this.regionMap.getNodes(),
      edges: this.regionMap.getEdges(),
      selectedNodeIndex: this.selectedNodeIndex(),
      currentNodeIndex: this.currentNodeIndex,
      canFly: this.canFly,
      infoText: this.selectionInfo(this.selectedNodeIndex()),
      isVisited: (nodeIndex) => this.isNodeVisited(nodeIndex),
      canActivateNode: (nodeIndex) => this.canActivateNode(nodeIndex),
      onNodeSelected: (nodeIndex) => this.selectNode(nodeIndex),
      onNodeActivated: () => this.handleSelect(),
    });
  }

  private selectedNodeIndex(): number {
    return this.selectableIndices[this.cursor] ?? 0;
  }

  private selectNode(nodeIndex: number): void {
    const cursor = this.selectableIndices.indexOf(nodeIndex);
    if (cursor < 0) return;
    this.cursor = cursor;
    this.refreshSelection();
  }

  private isNodeVisited(nodeIndex: number): boolean {
    const gm = GameManager.getInstance();
    return this.regionMap.isNodeVisited(nodeIndex, mapKey => gm.hasVisitedMap(mapKey));
  }

  private canActivateNode(nodeIndex: number): boolean {
    const gm = GameManager.getInstance();
    return this.regionMap.isNodeFlyable(nodeIndex, this.canFly, mapKey => gm.hasVisitedMap(mapKey));
  }

  private selectionInfo(nodeIndex: number): string {
    const node = this.regionMap.getNodes()[nodeIndex];
    if (!node) return '';
    const visited = this.isNodeVisited(nodeIndex);
    const isCurrent = nodeIndex === this.currentNodeIndex;

    if (!visited) return `${node.label} — ???`;
    const mapDef = mapRegistry[node.mapKey];
    const displayName = mapDef?.displayName ?? node.label;
    if (isCurrent) return `${displayName} (You are here)`;
    if (this.canFly && node.flyable) return `${displayName} — Press ENTER to Fly`;
    return displayName;
  }

  private moveCursor(direction: RegionMapDirection): void {
    const next = this.regionMap.findNearestCursor(this.selectableIndices, this.cursor, direction);
    if (next === this.cursor) return;
    this.cursor = next;
    this.refreshSelection();
  }

  private refreshSelection(): void {
    AudioManager.getInstance().playSFX(SFX.CURSOR);
    const selected = this.selectedNodeIndex();
    this.view?.updateSelection(selected, this.selectionInfo(selected));
  }

  private handleSelect(): void {
    if (this.confirmBox) return;

    const selected = this.selectedNodeIndex();
    const node = this.regionMap.getNodes()[selected];
    if (!node || !this.canActivateNode(selected)) return;

    if (selected === this.currentNodeIndex) {
      AudioManager.getInstance().playSFX(SFX.CANCEL);
      return;
    }

    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    this.confirmBox = new ConfirmBox(this, 0, 0, `Fly to ${node.label}?`, (confirmed) => {
      this.confirmBox = undefined;
      if (confirmed) this.flyTo(node.mapKey);
    });
  }

  private flyTo(mapKey: string): void {
    AudioManager.getInstance().playSFX(SFX.CONFIRM);
    const router = SceneRouter.for(this);
    router.stop(SceneKey.Menu);
    router.stop(SceneKey.Overworld);
    router.transitionTo(SceneKey.Overworld, {
      flyTo: mapKey,
      spawnId: 'default',
    });
  }

  private close = (): void => {
    AudioManager.getInstance().playSFX(SFX.CANCEL);
    this.scene.stop();
  };
}
