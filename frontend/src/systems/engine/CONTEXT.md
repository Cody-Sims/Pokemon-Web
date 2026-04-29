# Engine Systems

Core engine services that wrap or extend Phaser framework functionality.

## Files

| File | Class | Purpose |
|---|---|---|
| `InputManager.ts` | `InputManager` | Unified keyboard, touch, and gamepad input. Wraps Phaser input. |
| `GameClock.ts` | `GameClock` | In-game day/night cycle timer and time-of-day events |
| `MapPreloader.ts` | `MapPreloader` | Preloads adjacent map assets for seamless transitions |
| `CutsceneEngine.ts` | `CutsceneEngine` | Scripted sequence player for story events (reads from `data/cutscene-data.ts`) |
| `ChallengeRules.ts` | (helpers) | B.4 Challenge mode rule gates (catch / party-add / item-use). |
| `SpeedrunRecords.ts` | `SpeedrunRecords` | B.3 Lifetime speed-run PB store + JSON export (separate localStorage key). |
| `BattleTowerStreak.ts` | (pure helpers) | A.1 Battle Tower streak resume state machine (post-battle decision logic). |
