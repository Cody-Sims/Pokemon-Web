# Boot Scenes

Asset loading pipeline. These scenes run first when the game starts.

## Files

| File | Scene | Purpose |
|---|---|---|
| `BootScene.ts` | `BootScene` | Loads minimal assets needed to display the loading bar, then starts PreloadScene |
| `PreloadScene.ts` | `PreloadScene` | Loads all game assets (sprites, audio, tilesets, fonts) with a progress bar, then starts TitleScene |

## Load Order

`BootScene` → `PreloadScene` → `TitleScene`

## Notes

- `PreloadScene` contains the complete asset manifest — update it when adding new sprites, audio, or tilesets.
- Loading errors are caught and displayed to the user.
