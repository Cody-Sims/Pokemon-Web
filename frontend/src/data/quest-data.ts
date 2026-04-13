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

  // ─── Quests 6–12: Previously missing definitions ───

  'stern-engine': {
    id: 'stern-engine',
    name: "Captain Stern's Engine",
    description: 'Find 3 engine parts stolen by Synthesis Grunts near Coral Harbor.',
    startFlag: 'quest_sternEngine_started',
    completeFlag: 'quest_sternEngine_complete',
    steps: [
      { description: 'Recover engine part from Route 3 grunt', completionFlag: 'quest_sternEngine_part1' },
      { description: 'Recover engine part from Coral Harbor docks grunt', completionFlag: 'quest_sternEngine_part2' },
      { description: 'Recover engine part from Coral Harbor beach grunt', completionFlag: 'quest_sternEngine_part3' },
      { description: 'Return parts to Captain Stern', completionFlag: 'quest_sternEngine_complete' },
    ],
    rewards: [
      { itemId: 'mystic-water', quantity: 1 },
    ],
    rewardMoney: 1200,
  },

  'chef-special': {
    id: 'chef-special',
    name: "The Chef's Special",
    description: 'Bring Chef Marco in Coral Harbor 5 different Berry types.',
    startFlag: 'quest_chef_started',
    completeFlag: 'quest_chef_complete',
    steps: [
      { description: 'Bring an Oran Berry', completionFlag: 'quest_chef_oran' },
      { description: 'Bring a Pecha Berry', completionFlag: 'quest_chef_pecha' },
      { description: 'Bring a Rawst Berry', completionFlag: 'quest_chef_rawst' },
      { description: 'Bring a Cheri Berry', completionFlag: 'quest_chef_cheri' },
      { description: 'Bring an Aspear Berry', completionFlag: 'quest_chef_aspear' },
      { description: 'Return to Chef Marco', completionFlag: 'quest_chef_complete' },
    ],
    rewards: [
      { itemId: 'rare-candy', quantity: 2 },
    ],
    rewardMoney: 600,
  },

  'power-restore': {
    id: 'power-restore',
    name: 'Power Restoration',
    description: 'Repair 3 Aether conduits around Voltara City to restore full power.',
    startFlag: 'quest_powerRestore_started',
    completeFlag: 'quest_powerRestore_complete',
    steps: [
      { description: 'Repair conduit near the Gym', completionFlag: 'quest_powerRestore_gym' },
      { description: 'Repair conduit near the PokéCenter', completionFlag: 'quest_powerRestore_center' },
      { description: 'Repair conduit at the north gate', completionFlag: 'quest_powerRestore_north' },
      { description: 'Report back to Engineer Sparks', completionFlag: 'quest_powerRestore_complete' },
    ],
    rewards: [
      { itemId: 'thunder-stone', quantity: 1 },
    ],
    rewardMoney: 2000,
  },

  'restless-spirit': {
    id: 'restless-spirit',
    name: 'The Restless Spirit',
    description: 'Find 3 memory fragments hidden around Wraithmoor Town.',
    startFlag: 'quest_restlessSpirit_started',
    completeFlag: 'quest_restlessSpirit_complete',
    steps: [
      { description: 'Find memory fragment near the graveyard', completionFlag: 'quest_restlessSpirit_frag1' },
      { description: 'Find memory fragment in the old library', completionFlag: 'quest_restlessSpirit_frag2' },
      { description: 'Find memory fragment at the ruined shrine', completionFlag: 'quest_restlessSpirit_frag3' },
      { description: 'Return to the Ghost Girl', completionFlag: 'quest_restlessSpirit_complete' },
    ],
    rewards: [
      { itemId: 'spell-tag', quantity: 1 },
    ],
    rewardMoney: 1500,
  },

  'dragon-lament': {
    id: 'dragon-lament',
    name: "The Dragon's Lament",
    description: 'Find Aether Salve ingredients to heal a suffering Dragonair.',
    startFlag: 'quest_dragonLament_started',
    completeFlag: 'quest_dragonLament_complete',
    steps: [
      { description: 'Gather herb from Verdantia Village', completionFlag: 'quest_dragonLament_herb' },
      { description: 'Gather mineral from Ember Mines', completionFlag: 'quest_dragonLament_mineral' },
      { description: 'Craft Aether Salve and return to Wren', completionFlag: 'quest_dragonLament_complete' },
    ],
    rewards: [
      { itemId: 'dragon-scale', quantity: 1 },
    ],
    rewardMoney: 2500,
  },

  'volcanic-survey': {
    id: 'volcanic-survey',
    name: 'Volcanic Survey',
    description: 'Record temperatures at 5 volcanic vents near Cinderfall Town for Dr. Ash.',
    startFlag: 'quest_volcanicSurvey_started',
    completeFlag: 'quest_volcanicSurvey_complete',
    steps: [
      { description: 'Record vent 1 (east ridge)', completionFlag: 'quest_volcanicSurvey_vent1' },
      { description: 'Record vent 2 (south crater)', completionFlag: 'quest_volcanicSurvey_vent2' },
      { description: 'Record vent 3 (lava tube)', completionFlag: 'quest_volcanicSurvey_vent3' },
      { description: 'Record vent 4 (caldera rim)', completionFlag: 'quest_volcanicSurvey_vent4' },
      { description: 'Record vent 5 (summit)', completionFlag: 'quest_volcanicSurvey_vent5' },
      { description: 'Return data to Dr. Ash', completionFlag: 'quest_volcanicSurvey_complete' },
    ],
    rewards: [
      { itemId: 'fire-stone', quantity: 1 },
      { itemId: 'charcoal', quantity: 1 },
    ],
    rewardMoney: 1800,
  },

  'father-trail': {
    id: 'father-trail',
    name: "The Father's Trail",
    description: "Follow clues in your father's journal to 5 locations across Aurum.",
    startFlag: 'quest_fatherTrail_started',
    completeFlag: 'quest_fatherTrail_complete',
    steps: [
      { description: 'Investigate the note in Littoral Town', completionFlag: 'quest_fatherTrail_clue1' },
      { description: 'Follow the trail to Crystal Cavern', completionFlag: 'quest_fatherTrail_clue2' },
      { description: 'Decode the message at Wraithmoor ruins', completionFlag: 'quest_fatherTrail_clue3' },
      { description: 'Search the Ember Mines depths', completionFlag: 'quest_fatherTrail_clue4' },
      { description: 'Reach the Shattered Isles temple', completionFlag: 'quest_fatherTrail_clue5' },
      { description: 'Find your father at the convergence point', completionFlag: 'quest_fatherTrail_complete' },
    ],
    rewards: [
      { itemId: 'master-ball', quantity: 1 },
    ],
    rewardMoney: 0,
  },
};
