// ── Core ─────────────────────────────────────────────────────
export { BattleManager } from './core/BattleManager';
export type { BattleConfig, BattleType } from './core/BattleManager';
export { BattleStateMachine } from './core/BattleStateMachine';
export { DoubleBattleManager, getMoveTarget } from './core/DoubleBattleManager';
export { AIController } from './core/AIController';
export { PartnerAI } from './core/PartnerAI';

// ── Calculation ──────────────────────────────────────────────
export { DamageCalculator } from './calculation/DamageCalculator';
export type { DamageResult } from './calculation/DamageCalculator';
export { ExperienceCalculator, getNatureMultiplier, getNatureDescription } from './calculation/ExperienceCalculator';
export { CatchCalculator } from './calculation/CatchCalculator';

// ── Effects ──────────────────────────────────────────────────
export { StatusEffectHandler } from './effects/StatusEffectHandler';
export { AbilityHandler } from './effects/AbilityHandler';
export { HeldItemHandler } from './effects/HeldItemHandler';
export { WeatherManager } from './effects/WeatherManager';
export { SynthesisHandler } from './effects/SynthesisHandler';

// ── Execution ────────────────────────────────────────────────
export { MoveExecutor } from './execution/MoveExecutor';
export type { MoveExecutionResult } from './execution/MoveExecutor';
export { playMoveAnimation } from './execution/MoveAnimationPlayer';
