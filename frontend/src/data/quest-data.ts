// ─── Quest Data ───
// Side quest definitions tracked via GameManager.flags

export type QuestStatus = 'not-started' | 'active' | 'complete';

export interface QuestStep {
  description: string;
  /** Flag that marks this step as complete when set to true. */
  completionFlag: string;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  /** Flag that starts the quest (set when player accepts). */
  startFlag: string;
  /** Flag set when entire quest is complete. */
  completeFlag: string;
  /** Ordered steps. Quest advances as step flags are set. */
  steps: QuestStep[];
  /** Reward items given on completion. */
  rewards: { itemId: string; quantity: number }[];
  /** Money reward on completion. */
  rewardMoney: number;
}

export const questData: Record<string, QuestDefinition> = {
  'lost-delivery': {
    id: 'lost-delivery',
    name: 'The Lost Delivery',
    description: 'Help Delivery Girl Pip deliver packages across three towns.',
    startFlag: 'quest_lostDelivery_started',
    completeFlag: 'quest_lostDelivery_complete',
    steps: [
      { description: 'Deliver package to Viridian City', completionFlag: 'quest_lostDelivery_viridian' },
      { description: 'Deliver package to Pewter City', completionFlag: 'quest_lostDelivery_pewter' },
      { description: 'Return to Pip in Littoral Town', completionFlag: 'quest_lostDelivery_complete' },
    ],
    rewards: [
      { itemId: 'rare-candy', quantity: 1 },
      { itemId: 'super-potion', quantity: 5 },
    ],
    rewardMoney: 1000,
  },

  'collectors-challenge': {
    id: 'collectors-challenge',
    name: "The Collector's Challenge",
    description: 'Show Collector Magnus in Viridian City 10 specific Pokémon.',
    startFlag: 'quest_collector_started',
    completeFlag: 'quest_collector_complete',
    steps: [
      { description: 'Show a Water-type Pokémon', completionFlag: 'quest_collector_water' },
      { description: 'Show a Fire-type Pokémon', completionFlag: 'quest_collector_fire' },
      { description: 'Show a Flying-type Pokémon', completionFlag: 'quest_collector_flying' },
      { description: 'Return to Magnus for your reward', completionFlag: 'quest_collector_complete' },
    ],
    rewards: [
      { itemId: 'leftovers', quantity: 1 },
    ],
    rewardMoney: 2000,
  },

  'lost-pokemon': {
    id: 'lost-pokemon',
    name: 'The Lost Pokémon',
    description: "Find Hiker Jerome's Geodude that wandered into Viridian Forest.",
    startFlag: 'quest_lostPokemon_started',
    completeFlag: 'quest_lostPokemon_complete',
    steps: [
      { description: 'Find Geodude in Viridian Forest', completionFlag: 'quest_lostPokemon_found' },
      { description: 'Return to Jerome in Pewter City', completionFlag: 'quest_lostPokemon_complete' },
    ],
    rewards: [],
    rewardMoney: 500,
  },

  'mine-clearance': {
    id: 'mine-clearance',
    name: 'Mine Clearance',
    description: 'Clear Synthesis Collective agents from the abandoned mine near Ironvale.',
    startFlag: 'quest_mineClearance_started',
    completeFlag: 'quest_mineClearance_complete',
    steps: [
      { description: 'Defeat grunt on Floor 1', completionFlag: 'quest_mineClearance_f1' },
      { description: 'Defeat grunt on Floor 2', completionFlag: 'quest_mineClearance_f2' },
      { description: 'Defeat grunt on Floor 3', completionFlag: 'quest_mineClearance_f3' },
      { description: 'Report back to Miner Gil', completionFlag: 'quest_mineClearance_complete' },
    ],
    rewards: [
      { itemId: 'fire-stone', quantity: 1 },
    ],
    rewardMoney: 1500,
  },

  'berry-farming': {
    id: 'berry-farming',
    name: 'Berry Farming',
    description: 'Help Berry Farmer Hana tend Berry trees across the region.',
    startFlag: 'quest_berryFarming_started',
    completeFlag: 'quest_berryFarming_complete',
    steps: [
      { description: 'Plant Berry in Route 1', completionFlag: 'quest_berryFarming_route1' },
      { description: 'Plant Berry in Route 2', completionFlag: 'quest_berryFarming_route2' },
      { description: 'Plant Berry in Viridian Forest', completionFlag: 'quest_berryFarming_forest' },
      { description: 'Return to Hana', completionFlag: 'quest_berryFarming_complete' },
    ],
    rewards: [
      { itemId: 'sitrus-berry', quantity: 5 },
      { itemId: 'lum-berry', quantity: 3 },
    ],
    rewardMoney: 800,
  },
};
