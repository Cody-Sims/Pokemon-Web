import { MapDefinition, parseMap } from '../shared';

// Victory Road — Final dungeon before Pokémon League
// 25 wide x 35 tall cave with boulder puzzles, crystal caverns, and winding corridors
const victoryRoadGround = parseMap([
  // Row 0-1: Summit chamber — exit north to Pokémon League
  ';;;;;;;;;;;,,,,,;;;;;;;;;', // 0  (25)
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 1  (25)
  ';,,÷,,,,,,,,,,,,,,,÷,,,,;', // 2  (25) crystals flanking summit
  ';,,,,,,;,,,,,,,,,;,,,,,,;', // 3  (25) pillars in summit room
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 4  (25)
  ';;;,,,,,,,,,,,,,,,,,,,;;;', // 5  (25)
  // Row 6-9: Crystal cavern — upper-middle chamber
  ';;;,,÷,,,,,,,,,,,÷,,,,;;;', // 6  (25) crystal clusters
  ';,,,,,,,,÷,,,,,÷,,,,,,,,;', // 7  (25)
  ';,,÷,,,,,,,,,,,,,,,÷,,,,;', // 8  (25)
  ';,,,,,,÷,,,,,,,,,÷,,,,,,;', // 9  (25)
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 10 (25)
  ';;,,,,,,,,,;;;;;,,,,,,,;;', // 11 (25) narrow passage down
  // Row 12-16: Winding cave passage — mid section
  ';;,,,,,,,,,,,,,,,,,,,,,;;', // 12 (25)
  ';,,,q,,,,,,,,,,,,,,q,,,,;', // 13 (25)
  ';,,,,,,,,;;,,,;;,,,,,,,,;', // 14 (25)
  ';,,,,,,,,;;,,,;;,,,,,,,,;', // 15 (25)
  ',,,,,,,,,,,,,,,,,,,,,,,,,', // 16 (25) west passage to aether-sanctum
  ';,,,,,,,,;;,,,;;,,,,,,,,;', // 17 (25)
  ';;,,,,,,,,,,,,,,,,,,,,,;;', // 18 (25)
  ';;,,,,,,,,,;;;;;,,,,,,,;;', // 19 (25) narrow passage down
  // Row 20-27: Boulder puzzle section — lower-middle
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 20 (25)
  ';,,q,,,,q,,,,,,q,,,,q,,,;', // 21 (25) outer boulders
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 22 (25)
  ';,,,,,q,,,,,,,,,,q,,,,,,;', // 23 (25)
  ';,,,,,,,,,,q,,,,,,,,,,,,;', // 24 (25) center boulder
  ';,,,,,q,,,,,,,,,,q,,,,,,;', // 25 (25)
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 26 (25)
  ';,,q,,,,q,,,,,,q,,,,q,,,;', // 27 (25) outer boulders
  ';;,,,,,,,,,;;;;;,,,,,,,;;', // 28 (25) narrow passage down
  // Row 29-34: Entry chamber — south entrance from route-8
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 29 (25)
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 30 (25)
  ';,,q,,,,,,,,,,,,,,,,q,,,;', // 31 (25)
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 32 (25)
  ';,,,,,,,,,,,,,,,,,,,,,,,;', // 33 (25)
  ';;;;;;;;,,,,,,,,;;;;;;;;;', // 34 (25) entrance
]);

export const victoryRoad: MapDefinition = {
  key: 'victory-road', width: 25, height: 35, ground: victoryRoadGround,
  encounterTableKey: 'victory-road', battleBg: 'bg-cave', displayName: 'Victory Road',
  weather: 'fog',
  npcs: [
    { id: 'victory-sign', tileX: 12, tileY: 33, textureKey: 'sign-post', facing: 'up',
      dialogue: ['VICTORY ROAD', 'Only trainers with 8 Badges may pass!'] },
    // Volcanic Survey quest vents
    { id: 'vr-vent-1', tileX: 4, tileY: 7, textureKey: 'item-ball', facing: 'down',
      dialogue: ['The volcanic vent hisses with steam...', 'You record the temperature reading!'],
      requireFlag: '!vent-1-recorded', setsFlag: 'vent-1-recorded' },
    { id: 'vr-vent-2', tileX: 20, tileY: 14, textureKey: 'item-ball', facing: 'down',
      dialogue: ['Sulfurous gas billows from this vent...', 'Temperature recorded! That\'s hot!'],
      requireFlag: '!vent-2-recorded', setsFlag: 'vent-2-recorded' },
    { id: 'vr-vent-3', tileX: 6, tileY: 22, textureKey: 'item-ball', facing: 'down',
      dialogue: ['A deep rumble echoes from this lava tube...', 'Reading captured! The magma is active.'],
      requireFlag: '!vent-3-recorded', setsFlag: 'vent-3-recorded' },
    { id: 'vr-vent-4', tileX: 18, tileY: 26, textureKey: 'item-ball', facing: 'down',
      dialogue: ['The caldera rim glows orange here...', 'Data logged! Dr. Ash will love this.'],
      requireFlag: '!vent-4-recorded', setsFlag: 'vent-4-recorded' },
    { id: 'vr-vent-5', tileX: 12, tileY: 3, textureKey: 'item-ball', facing: 'down',
      dialogue: ['The summit vent erupts with a geyser of steam!', 'Final reading captured!'],
      requireFlag: '!vent-5-recorded', setsFlag: 'vent-5-recorded' },
  ],
  trainers: [
    { id: 'vr-rival-kael', name: 'Kael', trainerId: 'rival-5', tileX: 12, tileY: 30, textureKey: 'rival', facing: 'up', lineOfSight: 4 },
    { id: 'vr-ace-1', name: 'Ace Trainer', trainerId: 'ace-trainer-1', tileX: 6, tileY: 9, textureKey: 'npc-ace-trainer', facing: 'right', lineOfSight: 4 },
    { id: 'vr-ace-2', name: 'Ace Trainer', trainerId: 'ace-trainer-2', tileX: 18, tileY: 15, textureKey: 'npc-ace-trainer-f', facing: 'left', lineOfSight: 4 },
    { id: 'vr-ace-3', name: 'Ace Trainer', trainerId: 'ace-trainer-3', tileX: 6, tileY: 24, textureKey: 'npc-ace-trainer', facing: 'right', lineOfSight: 4 },
  ],
  warps: [
    { tileX: 10, tileY: 34, targetMap: 'route-8', targetSpawnId: 'from-victory-road' },
    { tileX: 11, tileY: 34, targetMap: 'route-8', targetSpawnId: 'from-victory-road' },
    { tileX: 12, tileY: 34, targetMap: 'route-8', targetSpawnId: 'from-victory-road' },
    { tileX: 13, tileY: 34, targetMap: 'route-8', targetSpawnId: 'from-victory-road' },
    { tileX: 11, tileY: 0, targetMap: 'pokemon-league', targetSpawnId: 'from-victory-road' },
    { tileX: 12, tileY: 0, targetMap: 'pokemon-league', targetSpawnId: 'from-victory-road' },
    // Post-game: side passage to Aether Sanctum
    { tileX: 0, tileY: 16, targetMap: 'aether-sanctum', targetSpawnId: 'from-victory-road' },
  ],
  spawnPoints: {
    'default': { x: 12, y: 33, direction: 'up' },
    'from-cinderfall': { x: 12, y: 33, direction: 'up' },
    'from-route-8': { x: 12, y: 33, direction: 'up' },
    'from-sanctum': { x: 12, y: 1, direction: 'down' },
    'from-league': { x: 12, y: 1, direction: 'down' },
  },
};
