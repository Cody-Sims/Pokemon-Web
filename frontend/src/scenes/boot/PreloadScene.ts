import Phaser from 'phaser';
import { pokemonData } from '@data/pokemon';
import { BGM, SFX } from '@utils/audio-keys';
import { AudioManager } from '@managers/AudioManager';
import { mobileFontSize } from '@ui/theme';

// ── Manifest types ───────────────────────────────────────────────────

/** A single entry in the manifest's asset arrays. */
interface ManifestAsset {
  key: string;
  /** For image / spritesheet / audio entries. */
  path?: string;
  /** For atlas entries — the .png texture path. */
  texture?: string;
  /** For atlas entries — the .json atlas path. */
  atlas?: string;
  /** Per-asset override when the category is "mixed". */
  loadType?: string;
  /** Spritesheet frame dimensions. */
  frameWidth?: number;
  frameHeight?: number;
}

/** A category grouping in the manifest. */
interface ManifestCategory {
  loadType: string;
  /** If true this category is NOT loaded at boot (handled by MapPreloader). */
  deferred?: boolean;
  assets: ManifestAsset[];
}

/** Top-level manifest shape written by generate-atlas.js. */
interface AssetManifest {
  version: number;
  categories: Record<string, ManifestCategory>;
}

// ── Scene ────────────────────────────────────────────────────────────

export class PreloadScene extends Phaser.Scene {
  private manifest: AssetManifest | null = null;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  /** Receive the manifest (or null) from BootScene. */
  init(data: { manifest?: AssetManifest }): void {
    this.manifest = data?.manifest ?? null;
  }

  preload(): void {
    // ── Progress bar ─────────────────────────────────────────────
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: mobileFontSize(20),
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // ── Queue assets ─────────────────────────────────────────────
    if (this.manifest?.version && this.manifest.categories) {
      this.loadFromManifest(this.manifest);
    } else {
      this.loadFallback();
    }

    // ── Pixel font (always loaded; 1.1 KB shared by all scenes) ──
    this.load.bitmapFont(
      'aurum-pixel',
      'assets/fonts/aurum-pixel.png',
      'assets/fonts/aurum-pixel.xml',
    );
  }

  // ── Manifest-driven loading ────────────────────────────────────

  /** Iterate every non-deferred category and queue the right loader call. */
  private loadFromManifest(manifest: AssetManifest): void {
    for (const category of Object.values(manifest.categories)) {
      if (category.deferred) continue;

      for (const asset of category.assets) {
        const type = asset.loadType ?? category.loadType;

        switch (type) {
          case 'image':
            this.load.image(asset.key, asset.path!);
            break;
          case 'atlas':
            this.load.atlas(asset.key, asset.texture!, asset.atlas!);
            break;
          case 'spritesheet':
            this.load.spritesheet(asset.key, asset.path!, {
              frameWidth: asset.frameWidth!,
              frameHeight: asset.frameHeight!,
            });
            break;
          case 'audio':
            this.load.audio(asset.key, asset.path!);
            break;
        }
      }
    }
  }

  // ── Hardcoded fallback (dev without running generate-atlas) ────

  private loadFallback(): void {
    // Load Pokemon icon sprites (small; needed everywhere: menus, party, PC).
    // Front/back battle sprites are loaded on demand by MapPreloader as the
    // player approaches each route.
    for (const data of Object.values(pokemonData)) {
      const name = data.name.toLowerCase();
      this.load.image(data.spriteKeys.icon, `assets/sprites/pokemon/${name}-icon.png`);
    }

    // Load tilesets
    this.load.image('overworld-tiles', 'assets/tilesets/overworld.png');
    this.load.spritesheet('tileset', 'assets/tilesets/tileset.png', {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Load player character atlases (male + female, walk + cycle)
    this.load.atlas('player-walk', 'assets/sprites/player/player-walk.png', 'assets/sprites/player/player-walk.json');
    this.load.atlas('player-walk-female', 'assets/sprites/player/player-walk-female.png', 'assets/sprites/player/player-walk-female.json');
    this.load.atlas('player-cycle', 'assets/sprites/player/player-cycle.png', 'assets/sprites/player/player-cycle.json');
    this.load.atlas('player-cycle-female', 'assets/sprites/player/player-cycle-female.png', 'assets/sprites/player/player-cycle-female.json');

    // Load a Pokemon front sprite for the intro scene
    this.load.image('pikachu-front', 'assets/sprites/pokemon/pikachu-front.png');

    // ── NPC Sprites ──
    const npcBase = 'assets/sprites/npcs';

    // Generic male NPCs (Males/) — 5 generic + 6 role-based
    for (let i = 1; i <= 5; i++) {
      const key = `npc-male-${i}`;
      this.load.atlas(key, `${npcBase}/Males/${key}.png`, `${npcBase}/Males/${key}.json`);
    }
    for (const key of ['npc-clerk', 'npc-oldman', 'npc-hiker', 'npc-scientist', 'npc-swimmer', 'npc-sailor']) {
      this.load.atlas(key, `${npcBase}/Males/${key}.png`, `${npcBase}/Males/${key}.json`);
    }

    // Generic female NPCs (Females/) — 9 generic + 2 descriptive
    for (let i = 1; i <= 9; i++) {
      const key = `npc-female-${i}`;
      this.load.atlas(key, `${npcBase}/Females/${key}.png`, `${npcBase}/Females/${key}.json`);
    }
    for (const key of ['npc-nurse', 'npc-lass']) {
      this.load.atlas(key, `${npcBase}/Females/${key}.png`, `${npcBase}/Females/${key}.json`);
    }

    // Story characters (story/) — includes npc-rook (forest-green scout)
    for (const key of ['rival', 'npc-oak', 'npc-mom', 'npc-marina', 'npc-blitz', 'npc-rook']) {
      this.load.atlas(key, `${npcBase}/story/${key}.png`, `${npcBase}/story/${key}.json`);
    }

    // Trainer classes (trainers/) — sign-post and item-ball were migrated
    // to assets/sprites/objects/ as plain images.
    for (const key of ['generic-trainer', 'npc-ace-trainer', 'npc-ace-trainer-f', 'npc-bug-catcher', 'npc-psychic']) {
      this.load.atlas(key, `${npcBase}/trainers/${key}.png`, `${npcBase}/trainers/${key}.json`);
    }

    // Gym leaders (gym-leaders/)
    for (const key of ['npc-gym-brock', 'npc-gym-blitz', 'npc-gym-ferris', 'npc-gym-coral', 'npc-gym-ivy', 'npc-gym-morwen', 'npc-gym-drake', 'npc-gym-solara', 'npc-gym-giovanni']) {
      this.load.atlas(key, `${npcBase}/gym-leaders/${key}.png`, `${npcBase}/gym-leaders/${key}.json`);
    }

    // Elite Four & Champion (elite-four/)
    for (const key of ['npc-e4-nerida', 'npc-e4-theron', 'npc-e4-lysandra', 'npc-e4-ashborne', 'npc-champion-aldric']) {
      this.load.atlas(key, `${npcBase}/elite-four/${key}.png`, `${npcBase}/elite-four/${key}.json`);
    }

    // Villains (villains/) — includes npc-zara (purple admin)
    for (const key of ['npc-grunt', 'npc-admin-vex', 'npc-vex', 'npc-zara']) {
      this.load.atlas(key, `${npcBase}/villains/${key}.png`, `${npcBase}/villains/${key}.json`);
    }

    // ── Static map objects (assets/sprites/objects/) ──
    // Plain 16×16 images for non-NPC interactables: PCs, signs, item balls,
    // berry trees, vents, conduits, fossils, runes, pedestals, doors,
    // memory fragments, crystal clusters. No atlas, no animation.
    const objectsBase = 'assets/sprites/objects';
    for (const key of [
      'sign-post', 'item-ball',
      'pc-terminal', 'door',
      'berry-tree', 'berry-tree-oran', 'berry-tree-pecha', 'berry-tree-sitrus',
      'vent', 'conduit-broken', 'conduit-fixed',
      'crystal-cluster', 'fossil-claw',
      'aether-rune', 'ruins-pedestal', 'memory-fragment',
    ]) {
      this.load.image(key, `${objectsBase}/${key}.png`);
    }

    // UI badge spritesheets
    this.load.spritesheet('type-badges', 'assets/ui/type-badges.png', {
      frameWidth: 32,
      frameHeight: 14,
    });
    this.load.spritesheet('status-badges', 'assets/ui/status-badges.png', {
      frameWidth: 32,
      frameHeight: 14,
    });

    // ── Audio: BGM ──
    for (const key of Object.values(BGM)) {
      this.load.audio(key, `assets/audio/bgm/${key}.wav`);
    }

    // ── Audio: SFX ──
    for (const key of Object.values(SFX)) {
      this.load.audio(key, `assets/audio/sfx/${key}.wav`);
    }
  }

  create(): void {
    // All static object sprites now ship as plain 16×16 PNGs under
    // assets/sprites/objects/ — no runtime procedural generation needed.

    // Initialize cry generator with audio context
    const audio = AudioManager.getInstance();
    audio.setScene(this);
    audio.initCryGenerator();

    this.scene.start('TitleScene');
  }
}
