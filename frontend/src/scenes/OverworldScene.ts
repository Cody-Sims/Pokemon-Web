import Phaser from 'phaser';
import { TILE_SIZE } from '@utils/constants';
import { Player } from '@entities/Player';
import { AnimationHelper } from '@systems/AnimationHelper';
import { Direction } from '@utils/type-helpers';
import { GameManager } from '@managers/GameManager';
import { EncounterSystem } from '@systems/EncounterSystem';

// Tile type constants for the procedural map
const T = {
  GRASS: 0,
  PATH: 1,
  TALL_GRASS: 2,
  TREE: 3,
  WATER: 4,
  HOUSE_WALL: 5,
  HOUSE_ROOF: 6,
  HOUSE_DOOR: 7,
  FENCE: 8,
  FLOWER: 9,
} as const;

// Colors for each tile type
const TILE_COLORS: Record<number, number> = {
  [T.GRASS]:      0x5a9e3e,
  [T.PATH]:       0xc4a45a,
  [T.TALL_GRASS]: 0x3d7a28,
  [T.TREE]:       0x2d5a1e,
  [T.WATER]:      0x3a7ecf,
  [T.HOUSE_WALL]: 0xd4c4a0,
  [T.HOUSE_ROOF]: 0xb04040,
  [T.HOUSE_DOOR]: 0x6b4226,
  [T.FENCE]:      0x8b7355,
  [T.FLOWER]:     0xe8c040,
};

// Simple Pallet Town-style map (25 wide × 19 tall = 800×608)
// prettier-ignore
const MAP_DATA: number[][] = [
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,2,2,0,0,6,6,6,0,0,1,0,0,6,6,6,0,0,2,2,0,0,3],
  [3,0,0,2,2,0,0,5,5,5,0,0,1,0,0,5,5,5,0,0,2,2,0,0,3],
  [3,0,0,0,0,0,0,5,7,5,0,0,1,0,0,5,7,5,0,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,3],
  [3,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,0,9,0,0,0,0,0,9,0,0,1,0,0,9,0,0,0,0,0,9,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,8,8,0,0,0,2,2,2,0,0,0,1,0,0,0,4,4,4,0,0,0,8,8,3],
  [3,0,0,0,0,0,2,2,2,0,0,0,1,0,0,0,4,4,4,0,0,0,0,0,3],
  [3,0,0,0,0,0,2,2,2,0,0,0,1,0,0,0,4,4,4,0,0,0,0,0,3],
  [3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,3],
  [3,0,9,0,0,6,6,6,0,0,0,0,1,0,0,0,0,0,6,6,6,0,0,9,3],
  [3,0,0,0,0,5,5,5,0,0,0,0,1,0,0,0,0,0,5,5,5,0,0,0,3],
  [3,0,0,0,0,5,7,5,0,0,0,0,1,0,0,0,0,0,5,7,5,0,0,0,3],
  [3,0,0,0,0,0,1,0,0,0,1,1,1,1,1,0,0,0,0,1,0,0,0,0,3],
  [3,3,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3],
];

export class OverworldScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  create(): void {
    // Ensure player has a starter Pokemon
    const gm = GameManager.getInstance();
    if (gm.getParty().length === 0) {
      const starter = EncounterSystem.createWildPokemon(1, 5);
      starter.nickname = 'Bulbasaur';
      gm.addToParty(starter);
    }

    const { width, height } = this.cameras.main;
    const mapW = MAP_DATA[0].length;
    const mapH = MAP_DATA.length;

    // Draw the tile map
    for (let y = 0; y < mapH; y++) {
      for (let x = 0; x < mapW; x++) {
        const tile = MAP_DATA[y][x];
        const color = TILE_COLORS[tile] ?? 0x5a9e3e;
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, color);

        // Add subtle detail to some tiles
        if (tile === T.GRASS && ((x + y) % 5 === 0)) {
          // Occasional grass detail
          this.add.rectangle(px - 4, py - 2, 3, 3, 0x6db04e);
        }
        if (tile === T.TALL_GRASS) {
          // Grass blade marks
          this.add.rectangle(px - 4, py - 3, 2, 8, 0x4a8b32);
          this.add.rectangle(px + 4, py - 2, 2, 8, 0x4a8b32);
          this.add.rectangle(px, py - 4, 2, 8, 0x4a8b32);
        }
        if (tile === T.WATER) {
          // Wave highlight
          this.add.rectangle(px - 3, py - 2, 6, 2, 0x5a9edf).setAlpha(0.5);
        }
        if (tile === T.FLOWER) {
          // Flower petals
          this.add.circle(px, py - 2, 4, 0xf06060);
          this.add.circle(px, py - 2, 2, 0xf0e040);
        }
      }
    }

    // Register player animations and create player sprite
    AnimationHelper.registerPlayerAnimations(this);
    // Start the player on the path near center
    this.player = new Player(this, 12, 9);
    this.player.setScale(2);
    this.player.play('player-idle-down');

    // Set up collision: trees, water, houses, fences are solid
    const solidTiles = new Set<number>([T.TREE, T.WATER, T.HOUSE_WALL, T.HOUSE_ROOF, T.FENCE]);
    this.player.gridMovement.setCollisionCheck((tx, ty) => {
      if (tx < 0 || ty < 0 || ty >= mapH || tx >= mapW) return true;
      return solidTiles.has(MAP_DATA[ty][tx]);
    });

    // Camera follow
    this.cameras.main.startFollow(this.player, true);
    this.cameras.main.setBounds(0, 0, mapW * TILE_SIZE, mapH * TILE_SIZE);

    // Setup keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Instructions
    this.add.text(width / 2, 20, 'Arrow keys / WASD to move | B = Battle | ESC = Menu', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Clickable buttons (fixed to camera)
    const battleBtn = this.add.text(width / 2 - 80, height - 40, '⚔ Battle', {
      fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 },
    }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    battleBtn.on('pointerover', () => battleBtn.setColor('#ffcc00'));
    battleBtn.on('pointerout', () => battleBtn.setColor('#ffffff'));
    battleBtn.on('pointerdown', () => {
      this.scene.start('TransitionScene', { targetScene: 'BattleScene', returnScene: 'OverworldScene' });
    });

    const menuBtn = this.add.text(width / 2 + 40, height - 40, '☰ Menu', {
      fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 },
    }).setInteractive({ useHandCursor: true }).setScrollFactor(0);
    menuBtn.on('pointerover', () => menuBtn.setColor('#ffcc00'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('MenuScene');
    });

    // Keyboard shortcuts
    this.input.keyboard!.on('keydown-B', () => {
      this.scene.start('TransitionScene', {
        targetScene: 'BattleScene',
        returnScene: 'OverworldScene',
      });
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('MenuScene');
    });
  }

  update(): void {
    if (this.player.isMoving()) return;

    let direction: Direction | null = null;

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      direction = 'up';
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      direction = 'down';
    } else if (this.cursors.left.isDown || this.wasd.A.isDown) {
      direction = 'left';
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      direction = 'right';
    }

    if (!direction) {
      // Idle — show standing frame for current facing direction
      const facing = this.player.getFacing();
      const animDir = facing === 'right' ? 'left' : facing;
      const idleKey = `player-idle-${animDir}`;
      if (this.player.anims.currentAnim?.key !== idleKey) {
        this.player.play(idleKey);
      }
      this.player.setFlipX(facing === 'right');
      return;
    }

    // Determine the animation direction (right reuses left frames, flipped)
    const animDir = direction === 'right' ? 'left' : direction;
    this.player.setFlipX(direction === 'right');

    if (this.player.move(direction)) {
      // New move started — play walk animation
      this.player.play(`player-walk-${animDir}`, true);
    }
  }
}
