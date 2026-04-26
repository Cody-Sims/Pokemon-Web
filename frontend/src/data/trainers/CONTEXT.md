# Trainers

Trainer data organized by category. Each file exports trainer definitions following
the `TrainerData` interface.

## Files

| File | Category | Content |
|---|---|---|
| `rival.ts` | Rival | Rival encounters across the storyline |
| `gym-leaders.ts` | Gym Leaders | 8 gym leaders with badges and progressively harder teams |
| `elite-four.ts` | Elite Four + Champion | Elite Four members and champion Aldric |
| `route-trainers.ts` | Route Trainers | Bug catchers, hikers, lasses, etc. placed on routes |
| `team-grunts.ts` | Team Eclipse | Villain team grunts and admins |
| `rematch.ts` | Post-game Rematches | Harder versions of gym leaders and key trainers |
| `index.ts` | — | Barrel: re-exports all trainer categories |

## Conventions

- Follow the `TrainerData` interface from `data/interfaces.ts`
- Import via barrel: `import { trainerData } from '@data/trainers'`
- Set `victoryFlag` for story-gating trainers
- Set `badgeReward` for gym leaders
- Set `useSynthesis` / `synthesisSlot` for trainers using Synthesis Mode
