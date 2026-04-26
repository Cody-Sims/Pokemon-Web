# Rendering Systems

Visual effects layered on top of the base scene rendering.

## Files

| File | Class | Purpose |
|---|---|---|
| `WeatherRenderer.ts` | `WeatherRenderer` | Rain, snow, sandstorm, and sun particle effects |
| `LightingSystem.ts` | `LightingSystem` | Day/night cycle tinting and cave darkness overlays |
| `GlowEmitterSystem.ts` | `GlowEmitterSystem` | Pulse-glow overlays for aether crystals, Voltara conduits, and window light shafts |
| `AnimationHelper.ts` | `AnimationHelper` | Sprite animation creation and playback utilities |
| `EmoteBubble.ts` | `EmoteBubble` | NPC emotion indicator bubbles (!, ?, ♥, etc.) |
| `TilemapBuilder.ts` | `buildTilemap`, `redrawTilemapTile` | Converts a `MapDefinition` ground grid into 3 Phaser TilemapLayers + animated water/grass/lava sprites |
