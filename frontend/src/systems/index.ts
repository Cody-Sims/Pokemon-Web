// ── Audio ────────────────────────────────────────────────────
export { ProceduralAudio } from './audio/ProceduralAudio';
export { CryGenerator } from './audio/CryGenerator';
export { AmbientSFX } from './audio/AmbientSFX';

// ── Overworld ────────────────────────────────────────────────
export { GridMovement } from './overworld/GridMovement';
export { NPCBehaviorController } from './overworld/NPCBehavior';
export type { NPCBehaviorConfig } from './overworld/NPCBehavior';
export { EncounterSystem } from './overworld/EncounterSystem';
export { OverworldAbilities } from './overworld/OverworldAbilities';
export { BerryGarden } from './overworld/BerryGarden';
export { hiddenItemData, getHiddenItemAt, scanHiddenItems } from './overworld/HiddenItems';
export type { HiddenItem } from './overworld/HiddenItems';

// ── Rendering ────────────────────────────────────────────────
export { WeatherRenderer } from './rendering/WeatherRenderer';
export { LightingSystem } from './rendering/LightingSystem';
export { AnimationHelper } from './rendering/AnimationHelper';
export { EmoteBubble } from './rendering/EmoteBubble';

// ── Engine ───────────────────────────────────────────────────
export { InputManager } from './engine/InputManager';
export { GameClock } from './engine/GameClock';
export { MapPreloader } from './engine/MapPreloader';
export { CutsceneEngine } from './engine/CutsceneEngine';
