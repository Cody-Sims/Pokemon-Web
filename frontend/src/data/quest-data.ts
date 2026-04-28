// ─── Quest Data ───
// Side quest definitions tracked via GameManager.flags

export type QuestStatus = 'not-started' | 'active' | 'complete';

export interface QuestStep {
  description: string;
  /** Flag that marks this step as complete when set to true. */
  completionFlag: string;
  /** If set, this step auto-completes when this game flag becomes true. */
  triggerFlag?: string;
  /** If set, this step auto-completes when this event is emitted. */
  triggerEvent?: string;
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
      { description: 'Deliver package to Viridian City', completionFlag: 'quest_lostDelivery_viridian', triggerFlag: 'delivery-viridian' },
      { description: 'Deliver package to Pewter City', completionFlag: 'quest_lostDelivery_pewter', triggerFlag: 'delivery-pewter' },
      { description: 'Return to Pip in Littoral Town', completionFlag: 'quest_lostDelivery_complete', triggerFlag: 'delivery-returned' },
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
      { description: 'Search Viridian Forest for Geodude', completionFlag: 'quest_lostPokemon_found', triggerEvent: 'map-entered:viridian-forest' },
      { description: 'Return Geodude to Jerome', completionFlag: 'quest_lostPokemon_complete', triggerFlag: 'geodude-returned' },
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
      { description: 'Enter the abandoned mine', completionFlag: 'quest_mineClearance_entered', triggerEvent: 'map-entered:ember-mines' },
      { description: 'Defeat grunt on Floor 1', completionFlag: 'quest_mineClearance_f1', triggerFlag: 'mine-grunt-1-defeated' },
      { description: 'Defeat grunt on Floor 2', completionFlag: 'quest_mineClearance_f2', triggerFlag: 'mine-grunt-2-defeated' },
      { description: 'Defeat grunt on Floor 3', completionFlag: 'quest_mineClearance_f3', triggerFlag: 'mine-grunt-3-defeated' },
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
      { description: 'Recover engine part from Route 3 grunt', completionFlag: 'quest_sternEngine_part1', triggerEvent: 'trainer-defeated:stern-grunt-1' },
      { description: 'Recover engine part from Coral Harbor docks grunt', completionFlag: 'quest_sternEngine_part2', triggerEvent: 'trainer-defeated:stern-grunt-2' },
      { description: 'Recover engine part from Coral Harbor beach grunt', completionFlag: 'quest_sternEngine_part3', triggerEvent: 'trainer-defeated:stern-grunt-3' },
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
      { description: 'Bring an Oran Berry', completionFlag: 'quest_chef_oran', triggerFlag: 'chef-oran-given' },
      { description: 'Bring a Pecha Berry', completionFlag: 'quest_chef_pecha', triggerFlag: 'chef-pecha-given' },
      { description: 'Bring a Rawst Berry', completionFlag: 'quest_chef_rawst', triggerFlag: 'chef-rawst-given' },
      { description: 'Bring a Cheri Berry', completionFlag: 'quest_chef_cheri', triggerFlag: 'chef-cheri-given' },
      { description: 'Bring an Aspear Berry', completionFlag: 'quest_chef_aspear', triggerFlag: 'chef-aspear-given' },
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
      { description: 'Repair conduit near the Gym', completionFlag: 'quest_powerRestore_gym', triggerFlag: 'conduit-1-repaired' },
      { description: 'Repair conduit near the PokéCenter', completionFlag: 'quest_powerRestore_center', triggerFlag: 'conduit-2-repaired' },
      { description: 'Repair conduit at the north gate', completionFlag: 'quest_powerRestore_north', triggerFlag: 'conduit-3-repaired' },
      { description: 'Report back to Engineer Sparks', completionFlag: 'quest_powerRestore_complete', triggerFlag: 'power-reported' },
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
      { description: 'Find memory fragment near the graveyard', completionFlag: 'quest_restlessSpirit_frag1', triggerFlag: 'memory-1-found' },
      { description: 'Find memory fragment in the old library', completionFlag: 'quest_restlessSpirit_frag2', triggerFlag: 'memory-2-found' },
      { description: 'Find memory fragment at the ruined shrine', completionFlag: 'quest_restlessSpirit_frag3', triggerFlag: 'memory-3-found' },
      { description: 'Return to the Ghost Girl', completionFlag: 'quest_restlessSpirit_complete', triggerFlag: 'spirit-reported' },
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
      { description: 'Gather herb from Verdantia Village', completionFlag: 'quest_dragonLament_herb', triggerFlag: 'dragon-herb-found' },
      { description: 'Gather mineral from Ember Mines', completionFlag: 'quest_dragonLament_mineral', triggerFlag: 'dragon-mineral-found' },
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
      { description: 'Record vent 1 (east ridge)', completionFlag: 'quest_volcanicSurvey_vent1', triggerFlag: 'vent-1-recorded' },
      { description: 'Record vent 2 (south crater)', completionFlag: 'quest_volcanicSurvey_vent2', triggerFlag: 'vent-2-recorded' },
      { description: 'Record vent 3 (lava tube)', completionFlag: 'quest_volcanicSurvey_vent3', triggerFlag: 'vent-3-recorded' },
      { description: 'Record vent 4 (caldera rim)', completionFlag: 'quest_volcanicSurvey_vent4', triggerFlag: 'vent-4-recorded' },
      { description: 'Record vent 5 (summit)', completionFlag: 'quest_volcanicSurvey_vent5', triggerFlag: 'vent-5-recorded' },
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

  // ───── A.2 expansion: 8 new quests (#13–#20) ─────

  // 13 — Regional exploration. Six anomaly sites scattered across Aurum.
  'aether-anomalies': {
    id: 'aether-anomalies',
    name: 'Aether Anomalies',
    description: 'Survey six Aether anomaly sites across the Aurum Region.',
    startFlag: 'quest_aetherAnomalies_started',
    completeFlag: 'quest_aetherAnomalies_complete',
    steps: [
      { description: 'Survey the Littoral Pier anomaly', completionFlag: 'quest_aetherAnomalies_a1', triggerFlag: 'aether-anomaly-littoral' },
      { description: 'Survey the Viridian Forest anomaly', completionFlag: 'quest_aetherAnomalies_a2', triggerFlag: 'aether-anomaly-viridian-forest' },
      { description: 'Survey the Crystal Cavern anomaly', completionFlag: 'quest_aetherAnomalies_a3', triggerFlag: 'aether-anomaly-crystal-cavern' },
      { description: 'Survey the Wraithmoor ruin anomaly', completionFlag: 'quest_aetherAnomalies_a4', triggerFlag: 'aether-anomaly-wraithmoor' },
      { description: 'Survey the Cinderfall caldera anomaly', completionFlag: 'quest_aetherAnomalies_a5', triggerFlag: 'aether-anomaly-cinderfall' },
      { description: 'Survey the Shattered Isles anomaly', completionFlag: 'quest_aetherAnomalies_a6', triggerFlag: 'aether-anomaly-shattered-isles' },
      { description: 'Report findings to the Aether Surveyor in Voltara', completionFlag: 'quest_aetherAnomalies_complete', triggerFlag: 'aether-anomaly-reported' },
    ],
    rewards: [
      { itemId: 'aether-charm', quantity: 1 },
    ],
    rewardMoney: 3000,
  },

  // 14 — Photographer routes 1–8.
  'photographer': {
    id: 'photographer',
    name: 'The Photographer',
    description: 'Help a roaming photographer capture Pokémon across all eight routes.',
    startFlag: 'quest_photographer_started',
    completeFlag: 'quest_photographer_complete',
    steps: [
      { description: 'Receive the Camera in Littoral Town', completionFlag: 'quest_photographer_camera', triggerFlag: 'photographer-camera-received' },
      { description: 'Photograph a Route 1 Pokémon', completionFlag: 'quest_photographer_r1', triggerFlag: 'photo-route-1' },
      { description: 'Photograph a Route 3 Pokémon', completionFlag: 'quest_photographer_r3', triggerFlag: 'photo-route-3' },
      { description: 'Photograph a Route 5 Pokémon', completionFlag: 'quest_photographer_r5', triggerFlag: 'photo-route-5' },
      { description: 'Photograph a Route 7 Pokémon', completionFlag: 'quest_photographer_r7', triggerFlag: 'photo-route-7' },
      { description: 'Return the album to the photographer', completionFlag: 'quest_photographer_complete', triggerFlag: 'photographer-album-returned' },
    ],
    rewards: [
      { itemId: 'camera', quantity: 1 },
    ],
    rewardMoney: 1200,
  },

  // 15 — Voltorb Tournament minigame in Voltara City.
  'voltorb-tournament': {
    id: 'voltorb-tournament',
    name: 'Voltorb Tournament',
    description: 'Win the Voltorb Flip tournament hosted at the Voltara Game Corner.',
    startFlag: 'quest_voltorbTournament_started',
    completeFlag: 'quest_voltorbTournament_complete',
    steps: [
      { description: 'Sign up at the Game Corner counter', completionFlag: 'quest_voltorbTournament_signup', triggerFlag: 'voltorb-tournament-signup' },
      { description: 'Win Round 1 (Bronze bracket)', completionFlag: 'quest_voltorbTournament_r1', triggerFlag: 'voltorb-tournament-bronze' },
      { description: 'Win Round 2 (Silver bracket)', completionFlag: 'quest_voltorbTournament_r2', triggerFlag: 'voltorb-tournament-silver' },
      { description: 'Win the Gold final', completionFlag: 'quest_voltorbTournament_complete', triggerFlag: 'voltorb-tournament-gold' },
    ],
    rewards: [
      { itemId: 'coin-case', quantity: 1 },
    ],
    rewardMoney: 2000,
  },

  // 16 — Fossil Collector. Cross-references the new fossil Pokémon (A.3).
  'fossil-collector': {
    id: 'fossil-collector',
    name: 'The Fossil Collector',
    description: 'Help the Pewter Museum recover and revive both Aurum fossils.',
    startFlag: 'quest_fossilCollector_started',
    completeFlag: 'quest_fossilCollector_complete',
    steps: [
      { description: 'Recover the Claw Fossil from Crystal Cavern Depths', completionFlag: 'quest_fossilCollector_claw', triggerFlag: 'crystalDepthsClawFossil' },
      { description: 'Recover the Wing Fossil from Ember Mines', completionFlag: 'quest_fossilCollector_wing', triggerFlag: 'emberMinesWingFossil' },
      { description: 'Revive Lithoclaw at the Pewter Museum', completionFlag: 'quest_fossilCollector_lithoclaw', triggerFlag: 'lithoclaw-revived' },
      { description: 'Revive Aerolith at the Pewter Museum', completionFlag: 'quest_fossilCollector_aerolith', triggerFlag: 'aerolith-revived' },
      { description: 'Report back to the Museum Curator', completionFlag: 'quest_fossilCollector_complete', triggerFlag: 'fossil-collector-reported' },
    ],
    rewards: [
      { itemId: 'rare-candy', quantity: 2 },
      { itemId: 'heart-scale', quantity: 3 },
    ],
    rewardMoney: 5000,
  },

  // 17 — Post-game story. Rook joins as optional partner.
  'rooks-redemption': {
    id: 'rooks-redemption',
    name: "Rook's Redemption",
    description: 'Track Rook through the Shattered Isles and offer him a chance at redemption.',
    startFlag: 'quest_rooksRedemption_started',
    completeFlag: 'quest_rooksRedemption_complete',
    steps: [
      { description: 'Find Rook on Shattered Isles - West Beach', completionFlag: 'quest_rooksRedemption_west', triggerFlag: 'rook-west-beach-met' },
      { description: 'Beat Rook in a battle of conviction', completionFlag: 'quest_rooksRedemption_battle', triggerFlag: 'rook-redemption-battle-won' },
      { description: 'Walk Rook back to the Verdantia Lab', completionFlag: 'quest_rooksRedemption_walk', triggerFlag: 'rook-walked-to-lab' },
      { description: 'Speak with Rook one final time', completionFlag: 'quest_rooksRedemption_complete', triggerFlag: 'rook-joined-as-partner' },
    ],
    rewards: [
      { itemId: 'rare-candy', quantity: 3 },
    ],
    rewardMoney: 10000,
  },

  // 18 — Post-game gym gauntlet at the Pokémon League.
  'gym-leader-gauntlet': {
    id: 'gym-leader-gauntlet',
    name: 'Gym Leader Gauntlet',
    description: 'Defeat all eight Gym Leaders back-to-back in the League lobby.',
    startFlag: 'quest_gauntlet_started',
    completeFlag: 'quest_gauntlet_complete',
    steps: [
      { description: 'Defeat Brock', completionFlag: 'quest_gauntlet_brock', triggerFlag: 'gauntlet-brock' },
      { description: 'Defeat Blitz', completionFlag: 'quest_gauntlet_blitz', triggerFlag: 'gauntlet-blitz' },
      { description: 'Defeat Ferris', completionFlag: 'quest_gauntlet_ferris', triggerFlag: 'gauntlet-ferris' },
      { description: 'Defeat Coral', completionFlag: 'quest_gauntlet_coral', triggerFlag: 'gauntlet-coral' },
      { description: 'Defeat Ivy', completionFlag: 'quest_gauntlet_ivy', triggerFlag: 'gauntlet-ivy' },
      { description: 'Defeat Morwen', completionFlag: 'quest_gauntlet_morwen', triggerFlag: 'gauntlet-morwen' },
      { description: 'Defeat Drake', completionFlag: 'quest_gauntlet_drake', triggerFlag: 'gauntlet-drake' },
      { description: 'Defeat Solara', completionFlag: 'quest_gauntlet_complete', triggerFlag: 'gauntlet-solara' },
    ],
    rewards: [
      { itemId: 'gold-trainer-card', quantity: 1 },
    ],
    rewardMoney: 25000,
  },

  // 19 — Marina's expedition unlocks 3 rare-encounter zones.
  'marinas-expedition': {
    id: 'marinas-expedition',
    name: "Marina's Expedition",
    description: 'Join Marina on a post-game expedition to three rare habitats.',
    startFlag: 'quest_marinaExpedition_started',
    completeFlag: 'quest_marinaExpedition_complete',
    steps: [
      { description: 'Receive the Expedition Pass from Marina', completionFlag: 'quest_marinaExpedition_pass', triggerFlag: 'expedition-pass-received' },
      { description: 'Survey the Tideglass Caverns', completionFlag: 'quest_marinaExpedition_tideglass', triggerFlag: 'tideglass-surveyed' },
      { description: 'Survey the Glacial Hollow', completionFlag: 'quest_marinaExpedition_glacial', triggerFlag: 'glacial-hollow-surveyed' },
      { description: 'Survey the Bramble Heath', completionFlag: 'quest_marinaExpedition_bramble', triggerFlag: 'bramble-heath-surveyed' },
      { description: 'Compare notes with Marina back at port', completionFlag: 'quest_marinaExpedition_complete', triggerFlag: 'marina-expedition-debrief' },
    ],
    rewards: [
      { itemId: 'expedition-pass', quantity: 1 },
      { itemId: 'max-revive', quantity: 3 },
    ],
    rewardMoney: 8000,
  },

  // 20 — Post-game synthesis cure for Synthetic Pokémon.
  'synthesis-cure': {
    id: 'synthesis-cure',
    name: 'The Synthesis Cure',
    description: 'Help Verdantia Lab synthesize a cure for Synthetic Pokémon.',
    startFlag: 'quest_synthCure_started',
    completeFlag: 'quest_synthCure_complete',
    steps: [
      { description: 'Collect 3 Aether Crystal samples', completionFlag: 'quest_synthCure_samples', triggerFlag: 'synthesis-cure-samples' },
      { description: 'Defeat the rogue Synthetic Mewtwo specimen', completionFlag: 'quest_synthCure_specimen', triggerFlag: 'synthesis-cure-specimen' },
      { description: 'Return to the Verdantia Lab', completionFlag: 'quest_synthCure_lab', triggerFlag: 'synthesis-cure-returned' },
      { description: 'Witness the cure synthesis', completionFlag: 'quest_synthCure_complete', triggerFlag: 'synthesis-cure-prepared' },
    ],
    rewards: [
      { itemId: 'synthesis-cure', quantity: 3 },
      { itemId: 'rare-candy', quantity: 2 },
    ],
    rewardMoney: 12000,
  },
};
