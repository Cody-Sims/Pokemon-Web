# Moves

Per-type move data files. Each file exports an array of `MoveData` objects for that type.

## Files

| File | Type | Content |
|---|---|---|
| `normal.ts` | Normal | ~70 moves (Tackle, Hyper Beam, etc.) |
| `fire.ts` | Fire | Ember, Flamethrower, Fire Blast, etc. |
| `water.ts` | Water | Water Gun, Surf, Hydro Pump, etc. |
| `electric.ts` | Electric | Thunder Shock, Thunderbolt, Thunder, etc. |
| `grass.ts` | Grass | Vine Whip, Razor Leaf, Solar Beam, etc. |
| `ice.ts` | Ice | Ice Beam, Blizzard, etc. |
| `fighting.ts` | Fighting | Karate Chop, Cross Chop, etc. |
| `poison.ts` | Poison | Poison Sting, Sludge Bomb, etc. |
| `ground.ts` | Ground | Dig, Earthquake, etc. |
| `flying.ts` | Flying | Gust, Fly, Aerial Ace, etc. |
| `psychic.ts` | Psychic | Confusion, Psychic, etc. |
| `bug.ts` | Bug | Bug Bite, Signal Beam, etc. |
| `rock.ts` | Rock | Rock Throw, Rock Slide, etc. |
| `ghost.ts` | Ghost | Shadow Ball, Night Shade, etc. |
| `dragon.ts` | Dragon | Dragon Breath, Dragon Claw, etc. |
| `dark.ts` | Dark | Bite, Crunch, Dark Pulse, etc. |
| `steel.ts` | Steel | Iron Tail, Flash Cannon, etc. |
| `fairy.ts` | Fairy | Dazzling Gleam, Moonblast, etc. |
| `index.ts` | — | Barrel: combines all type files into `moveData` record |

## Conventions

- Follow the `MoveData` interface from `data/interfaces.ts`
- Import via barrel: `import { moveData } from '@data/moves'`
- Each move needs `id`, `name`, `type`, `category`, `power`, `accuracy`, `pp`
