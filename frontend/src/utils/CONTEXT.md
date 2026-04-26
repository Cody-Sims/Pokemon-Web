# Utilities

Pure helper functions and constants with no game framework dependencies. Safe to
import anywhere without creating circular dependencies.

## Files

| File | Purpose |
|---|---|
| `constants.ts` | Game-wide constants: tile size (16px), screen dimensions, speeds, timing values |
| `type-helpers.ts` | `PokemonType` enum, `Stats` interface, `MoveEffect` type, type utility functions |
| `math-helpers.ts` | Clamping, random ranges, weighted random selection |
| `seeded-random.ts` | Deterministic PRNG for reproducible test/generation results |
| `audio-keys.ts` | Registry of all audio asset keys (BGM and SFX) |
| `accessibility.ts` | Screen reader, reduced motion, and theme accessibility utilities |
| `haptics.ts` | Vibration API wrappers for mobile feedback |
| `hint-text.ts` | Context-sensitive hint text generation |
| `layout-on.ts` | Responsive layout breakpoint helpers |
| `ui-layout.ts` | UI positioning and scaling calculations |
| `safe-area.ts` | Mobile safe area inset calculations |
| `perf-profile.ts` | Performance profiling utilities |

## Conventions

- Every function here must be pure (no side effects, no game state access).
- `type-helpers.ts` is imported by almost every module — keep it lean.
- `constants.ts` is the single source for magic numbers — never hardcode tile sizes,
  speeds, or timing values elsewhere.
