// Download and organize map tileset and character sprites from OpenGameArt (CC-licensed)
const https = require('https');
const fs = require('fs');
const path = require('path');

const downloads = [
  {
    url: 'https://opengameart.org/sites/default/files/BFT%20-%20Legend%20Of%20Pocket%20Monsters%20Tileset_0.png',
    dest: 'frontend/public/assets/tilesets/overworld.png',
    name: 'Overworld tileset (CC-BY 3.0, Chad Wolfe)',
  },
  {
    url: 'https://opengameart.org/sites/default/files/RPG_assets.png',
    dest: 'frontend/public/assets/sprites/player/RPG_assets.png',
    name: 'RPG character sprites (CC0, GrafxKid)',
  },
  {
    url: 'https://opengameart.org/sites/default/files/32_Characters.zip',
    dest: 'frontend/public/assets/sprites/npcs/32_Characters.zip',
    name: 'Tiny Characters Set (CC0, Fleurman)',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    
    const request = (reqUrl) => {
      const mod = reqUrl.startsWith('https') ? require('https') : require('http');
      mod.get(reqUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${reqUrl}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    
    request(url);
  });
}

async function main() {
  for (const dl of downloads) {
    if (fs.existsSync(dl.dest)) {
      console.log(`Skipping ${dl.name} (already exists)`);
      continue;
    }
    process.stdout.write(`Downloading ${dl.name}...`);
    try {
      await download(dl.url, dl.dest);
      const stats = fs.statSync(dl.dest);
      console.log(` OK (${(stats.size / 1024).toFixed(1)} KB) -> ${dl.dest}`);
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
  }

  // Unzip character sprites if needed
  const npcsDir = 'frontend/public/assets/sprites/npcs';
  const zipFile = path.join(npcsDir, '32_Characters.zip');
  if (fs.existsSync(zipFile) && !fs.existsSync(path.join(npcsDir, 'Males'))) {
    const { execSync } = require('child_process');
    execSync(`cd "${npcsDir}" && unzip -o 32_Characters.zip`, { stdio: 'inherit' });
  }

  // Create atlas JSON helper for 4-col × 3-row character sprites (16x17 frames)
  // Layout: Row 0 = Down, Row 1 = Side (left), Row 2 = Up
  function createCharacterAtlas(frameW = 16, frameH = 17) {
    const frames = {};
    const dirs = [
      { name: 'down', row: 0 },
      { name: 'left', row: 1 },
      { name: 'up', row: 2 },
    ];
    for (const dir of dirs) {
      for (let col = 0; col < 4; col++) {
        frames[`walk-${dir.name}-${col}`] = {
          frame: { x: col * frameW, y: dir.row * frameH, w: frameW, h: frameH },
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
          sourceSize: { w: frameW, h: frameH },
        };
      }
    }
    // Right = same frames as Left (flipX handled at runtime)
    for (let col = 0; col < 4; col++) {
      frames[`walk-right-${col}`] = { ...frames[`walk-left-${col}`] };
    }
    return { frames };
  }

  // Set up player sprite
  const playerSrc = path.join(npcsDir, 'Males', 'M_01.png');
  const playerDest = 'frontend/public/assets/sprites/player/player-walk.png';
  const playerAtlas = 'frontend/public/assets/sprites/player/player-walk.json';
  if (fs.existsSync(playerSrc)) {
    fs.copyFileSync(playerSrc, playerDest);
    fs.writeFileSync(playerAtlas, JSON.stringify(createCharacterAtlas(), null, 2));
    console.log(`Created player sprite: ${playerDest}`);
    console.log(`Created player atlas:  ${playerAtlas}`);
  }

  // Set up NPC sprites
  const npcMappings = [
    { src: 'Males/M_06.png', key: 'rival' },
    { src: 'Males/M_03.png', key: 'generic-trainer' },
  ];
  for (const npc of npcMappings) {
    const src = path.join(npcsDir, npc.src);
    const destPng = path.join(npcsDir, `${npc.key}.png`);
    const destJson = path.join(npcsDir, `${npc.key}.json`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, destPng);
      fs.writeFileSync(destJson, JSON.stringify(createCharacterAtlas(), null, 2));
      console.log(`Created NPC sprite: ${destPng}`);
    }
  }

  console.log('\nDone! Asset summary:');
  console.log('  Tileset:  frontend/public/assets/tilesets/overworld.png (448x848, CC-BY 3.0)');
  console.log('  Player:   frontend/public/assets/sprites/player/player-walk.{png,json}');
  console.log('  NPCs:     frontend/public/assets/sprites/npcs/{rival,generic-trainer}.{png,json}');
  console.log('\nCredits (include in your project):');
  console.log('  - Tileset: "200+ Tileset - Legend of Pocket Monsters" by Chad Wolfe (Chloe Wolfe), CC-BY 3.0');
  console.log('  - Characters: "Tiny Characters Set" by Fleurman, CC0 (based on GrafxKid\'s "RPG Character Sprites", CC0)');
}

main();
