# Title Scenes

Main menu and new game setup flow.

## Files

| File | Scene | Purpose |
|---|---|---|
| `TitleScene.ts` | `TitleScene` | Main menu: New Game, Continue, Options. Entry point after loading completes. |
| `IntroScene.ts` | `IntroScene` | Professor intro, character naming, gender selection, new game setup. Transitions to OverworldScene. |

## Flow

`TitleScene` → (New Game) → `IntroScene` → `OverworldScene`
`TitleScene` → (Continue) → `OverworldScene` (loads save data)
