import { NPC } from '@entities/NPC';
import { Trainer } from '@entities/Trainer';
import { InteractableObject } from '@entities/InteractableObject';
import { GameManager } from '@managers/GameManager';
import { EventManager } from '@managers/EventManager';
import { AchievementManager } from '@managers/AchievementManager';
import { EncounterSystem } from '@systems/overworld/EncounterSystem';
import { OverworldAbilities } from '@systems/overworld/OverworldAbilities';
import { Tile } from '@data/maps';
import type { MapDefinition, NpcSpawn, ObjectSpawn } from '@data/maps';
import { trainerData } from '@data/trainer-data';
import { pokemonData } from '@data/pokemon';
import { cutsceneData } from '@data/cutscene-data';
import { TILE_SIZE } from '@utils/constants';
import type { Direction } from '@utils/type-helpers';
import type { PokemonInstance } from '@data/interfaces';
import type { CutsceneDefinition } from '@systems/engine/CutsceneEngine';

export interface InteractionContext {
  scene: Phaser.Scene;
  mapDef: MapDefinition;
  player: { getTilePosition(): { x: number; y: number }; getFacing(): Direction };
  npcs: NPC[];
  mapObjects: InteractableObject[];
  surfing: boolean;
  cutsceneEngine: { play(cutscene: CutsceneDefinition): void };
  triggerTrainerBattle(trainer: Trainer): void;
  triggerWildEncounter(pokemon: PokemonInstance): void;
  healParty(): void;
  launchStarterSelection(): void;
  launchNicknameInput(pokemon: PokemonInstance, speciesName: string, callback: () => void): void;
  redrawTile(tx: number, ty: number): void;
  showFieldAbilityPopup(text: string): void;
  pushBoulder(bx: number, by: number, dir: Direction): void;
  tryFishing(): void;
}

/** Handle player interact action — NPC dialogue/dispatch and tile interactions. */
export function tryInteract(ctx: InteractionContext): void {
  const { scene, mapDef, player, npcs } = ctx;
  const sm = scene.scene; // Phaser ScenePlugin
  const { x: px, y: py } = player.getTilePosition();
  const facing = player.getFacing();

  let targetX = px;
  let targetY = py;
  switch (facing) {
    case 'up':    targetY--; break;
    case 'down':  targetY++; break;
    case 'left':  targetX--; break;
    case 'right': targetX++; break;
  }

  // Check the tile directly in front; if it's a counter, also check one tile further
  const tilesToCheck: { tx: number; ty: number }[] = [{ tx: targetX, ty: targetY }];
  if (
    targetY >= 0 && targetY < mapDef.height &&
    targetX >= 0 && targetX < mapDef.width
  ) {
    const frontTile = mapDef.ground[targetY][targetX];
    if (frontTile === Tile.COUNTER || frontTile === Tile.PINK_COUNTER) {
      let behindX = targetX;
      let behindY = targetY;
      switch (facing) {
        case 'up':    behindY--; break;
        case 'down':  behindY++; break;
        case 'left':  behindX--; break;
        case 'right': behindX++; break;
      }
      tilesToCheck.push({ tx: behindX, ty: behindY });
    }
  }

  for (const npc of npcs) {
    const npcTX = Math.floor(npc.x / TILE_SIZE);
    const npcTY = Math.floor(npc.y / TILE_SIZE);
    if (tilesToCheck.some(t => t.tx === npcTX && t.ty === npcTY)) {
      // NPC turns to face the player
      npc.faceDirection(NPC.getOpposite(facing));

      // Capture the NPC's sprite key for optional portrait display in dialogue
      const npcPortraitKey = npc.texture?.key;

      // Undefeated trainer → trigger battle
      if (npc instanceof Trainer && !npc.defeated) {
        ctx.triggerTrainerBattle(npc);
        return;
      }

      // Get spawn def for special interactions
      const spawnDef = (npc as NPC & { spawnDef?: NpcSpawn }).spawnDef;
      const gm = GameManager.getInstance();

      // Derive a speaker name from spawnDef.name or NPC id
      const npcSpeaker = spawnDef?.name;

      // Determine the right dialogue (flag-gated overrides)
      let dialogue = npc.dialogue;
      if (spawnDef?.flagDialogue) {
        for (const fd of spawnDef.flagDialogue) {
          if (gm.getFlag(fd.flag)) {
            dialogue = fd.dialogue;
            break;
          }
        }
      }

      // Set flag on interaction if configured (from matched flagDialogue or setsFlag)
      if (spawnDef?.flagDialogue) {
        for (const fd of spawnDef.flagDialogue) {
          if (gm.getFlag(fd.flag) && fd.setFlag && !gm.getFlag(fd.setFlag)) {
            gm.setFlag(fd.setFlag);
            EventManager.getInstance().emit('flag-set', fd.setFlag);
            break;
          }
        }
      }
      if (spawnDef?.setsFlag && !gm.getFlag(spawnDef.setsFlag)) {
        gm.setFlag(spawnDef.setsFlag);
        EventManager.getInstance().emit('flag-set', spawnDef.setsFlag);

        // Give item if configured (only once, gated by the flag)
        if (spawnDef.givesItem) {
          gm.addItem(spawnDef.givesItem);
          // Achievement: hidden item discovery
          if (spawnDef.setsFlag.startsWith('hidden-')) {
            AchievementManager.getInstance().unlock('hidden-item');
          }
        }
      }

      // Special: Oak parcel delivery triggers multiple flags
      if (spawnDef?.id === 'lab-oak-after' && gm.getFlag('hasParcel') && !gm.getFlag('receivedPokedex')) {
        gm.setFlag('deliveredParcel');
        gm.setFlag('receivedPokedex');
        EventManager.getInstance().emit('flag-set', 'deliveredParcel');
        EventManager.getInstance().emit('flag-set', 'receivedPokedex');
      }

      // Handle special interaction types
      if (spawnDef?.interactionType === 'heal') {
        sm.pause();
        sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
        sm.get('DialogueScene').events.once('shutdown', () => {
          ctx.healParty();
          sm.resume();
        });
        return;
      }

      if (spawnDef?.interactionType === 'shop') {
        sm.pause();
        sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
        sm.get('DialogueScene').events.once('shutdown', () => {
          sm.launch('ShopScene', { shopId: gm.getCurrentMap() });
          sm.get('ShopScene').events.once('shutdown', () => {
            sm.resume();
          });
        });
        return;
      }

      if (spawnDef?.interactionType === 'pc') {
        sm.pause();
        sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
        sm.get('DialogueScene').events.once('shutdown', () => {
          sm.launch('PCScene');
          sm.get('PCScene').events.once('shutdown', () => {
            sm.resume();
          });
        });
        return;
      }

      if (spawnDef?.interactionType === 'move-tutor') {
        const tutorId = spawnDef.interactionData ?? spawnDef.id;
        sm.pause();
        sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
        sm.get('DialogueScene').events.once('shutdown', () => {
          sm.launch('MoveTutorScene', { tutorId });
          sm.get('MoveTutorScene').events.once('shutdown', () => {
            sm.resume();
          });
        });
        return;
      }

      if (spawnDef?.interactionType === 'starter-select' && !gm.getFlag('receivedStarter')) {
        sm.pause();
        sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
        sm.get('DialogueScene').events.once('shutdown', () => {
          sm.resume();
          ctx.launchStarterSelection();
        });
        return;
      }

      if (spawnDef?.interactionType === 'name-rater') {
        sm.pause();
        sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
        sm.get('DialogueScene').events.once('shutdown', () => {
          // Launch party selection, then naming input for the chosen Pokémon
          sm.launch('PartyScene', { selectMode: true });
          sm.get('PartyScene').events.once('pokemon-selected', (index: number) => {
            sm.stop('PartyScene');
            const party = gm.getParty();
            const selected = party[index];
            if (!selected) { sm.resume(); return; }
            const speciesName = pokemonData[selected.dataId]?.name ?? '???';
            ctx.launchNicknameInput(selected, speciesName, () => {
              sm.resume();
            });
          });
          sm.get('PartyScene').events.once('shutdown', () => {
            // If PartyScene shut down without selection, just resume
            sm.resume();
          });
        });
        return;
      }

      // ── Tag-battle handler ──
      if (spawnDef?.interactionType === 'tag-battle' && spawnDef.interactionData) {
        const [allyId, enemy1Id, enemy2Id, wonFlag] = spawnDef.interactionData.split('|');
        if (wonFlag && gm.getFlag(wonFlag)) {
          // Already completed – show regular dialogue
        } else {
          const allyData = trainerData[allyId];
          const e1Data = trainerData[enemy1Id];
          const e2Data = trainerData[enemy2Id];
          if (allyData && e1Data && e2Data) {
            const allyParty = allyData.party.map(p => EncounterSystem.createWildPokemon(p.pokemonId, p.level));
            const enemyParty1 = e1Data.party.map(p => EncounterSystem.createWildPokemon(p.pokemonId, p.level));
            const enemyParty2 = e2Data.party.map(p => EncounterSystem.createWildPokemon(p.pokemonId, p.level));
            sm.pause();
            sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
            sm.get('DialogueScene').events.once('shutdown', () => {
              sm.start('TransitionScene', {
                targetScene: 'BattleScene',
                targetData: {
                  isDouble: true,
                  allyParty,
                  enemyParty: [...enemyParty1, ...enemyParty2],
                  trainerId: enemy1Id,
                  victoryFlag: wonFlag ?? '',
                },
              });
            });
            return;
          }
        }
      }

      // ── Show-pokemon handler (Collector's Challenge) ──
      if (spawnDef?.interactionType === 'show-pokemon' && spawnDef.interactionData) {
        const requirements = spawnDef.interactionData.split('|').map(r => {
          const [type, flag] = r.split(':');
          return { type, flag };
        });
        const nextReq = requirements.find(r => !gm.getFlag(r.flag));
        if (nextReq) {
          sm.pause();
          sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
          sm.get('DialogueScene').events.once('shutdown', () => {
            sm.launch('PartyScene', { selectMode: true });
            sm.get('PartyScene').events.once('pokemon-selected', (index: number) => {
              sm.stop('PartyScene');
              const party = gm.getParty();
              const selected = party[index];
              if (!selected) { sm.resume(); return; }
              const pData = pokemonData[selected.dataId];
              if (pData && pData.types.some((t: string) => t === nextReq.type)) {
                gm.setFlag(nextReq.flag);
                EventManager.getInstance().emit('flag-set', nextReq.flag);
                sm.launch('DialogueScene', { dialogue: [`Magnificent! A fine ${nextReq.type}-type indeed!`], speaker: npcSpeaker, portraitKey: npcPortraitKey });
                sm.get('DialogueScene').events.once('shutdown', () => sm.resume());
              } else {
                sm.launch('DialogueScene', { dialogue: [`Hmm, that's not the ${nextReq.type}-type I'm looking for.`], speaker: npcSpeaker, portraitKey: npcPortraitKey });
                sm.get('DialogueScene').events.once('shutdown', () => sm.resume());
              }
            });
            sm.get('PartyScene').events.once('shutdown', () => sm.resume());
          });
          return;
        }
      }

      // ── Wild-encounter handler (Lost Pokémon trigger) ──
      if (spawnDef?.interactionType === 'wild-encounter' && spawnDef.interactionData) {
        const [speciesId, lvl] = spawnDef.interactionData.split('-').map(Number);
        if (speciesId && lvl) {
          sm.pause();
          sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
          sm.get('DialogueScene').events.once('shutdown', () => {
            const wild = EncounterSystem.createWildPokemon(speciesId, lvl);
            ctx.triggerWildEncounter(wild);
          });
          return;
        }
      }

      // Cutscene trigger (overrides regular dialogue unless already completed)
      if (spawnDef?.triggerCutscene && cutsceneData[spawnDef.triggerCutscene]) {
        const cutscene = cutsceneData[spawnDef.triggerCutscene];
        const setFlagActions = cutscene.actions.filter(
          (a): a is Extract<typeof a, { type: 'setFlag' }> => a.type === 'setFlag'
        );
        const alreadyPlayed = setFlagActions.length > 0 &&
          setFlagActions.every(a => gm.getFlag(a.flag));
        if (!alreadyPlayed) {
          ctx.cutsceneEngine.play(cutscene);
          return;
        }
      }

      // Regular dialogue
      sm.pause();
      sm.launch('DialogueScene', { dialogue, speaker: npcSpeaker, portraitKey: npcPortraitKey });
      sm.get('DialogueScene').events.once('shutdown', () => {
        sm.resume();
      });
      return;
    }
  }

  // ── Interactable object interactions (signs, item balls, PCs, doors) ──
  for (const obj of ctx.mapObjects) {
    const objTX = Math.floor(obj.x / TILE_SIZE);
    const objTY = Math.floor(obj.y / TILE_SIZE);
    if (tilesToCheck.some(t => t.tx === objTX && t.ty === objTY)) {
      // Objects do NOT face the player (they are static sprites)
      const spawnDef = obj.spawnDef;
      const gm = GameManager.getInstance();

      // Determine the right dialogue (flag-gated overrides)
      let dialogue = obj.dialogue;
      if (spawnDef?.flagDialogue) {
        for (const fd of spawnDef.flagDialogue) {
          if (gm.getFlag(fd.flag)) {
            dialogue = fd.dialogue;
            break;
          }
        }
      }

      // Set flag on interaction if configured (from matched flagDialogue or setsFlag)
      if (spawnDef?.flagDialogue) {
        for (const fd of spawnDef.flagDialogue) {
          if (gm.getFlag(fd.flag) && fd.setFlag && !gm.getFlag(fd.setFlag)) {
            gm.setFlag(fd.setFlag);
            EventManager.getInstance().emit('flag-set', fd.setFlag);
            break;
          }
        }
      }
      if (spawnDef?.setsFlag && !gm.getFlag(spawnDef.setsFlag)) {
        gm.setFlag(spawnDef.setsFlag);
        EventManager.getInstance().emit('flag-set', spawnDef.setsFlag);

        // Give item if configured (only once, gated by the flag)
        if (spawnDef.givesItem) {
          gm.addItem(spawnDef.givesItem);
          // Achievement: hidden item discovery
          if (spawnDef.setsFlag.startsWith('hidden-')) {
            AchievementManager.getInstance().unlock('hidden-item');
          }
        }
      }

      // Handle special interaction types
      if (spawnDef?.interactionType === 'pc') {
        sm.pause();
        sm.launch('DialogueScene', { dialogue });
        sm.get('DialogueScene').events.once('shutdown', () => {
          sm.launch('PCScene');
          sm.get('PCScene').events.once('shutdown', () => {
            sm.resume();
          });
        });
        return;
      }

      // Cutscene trigger (overrides regular dialogue unless already completed)
      if (spawnDef?.triggerCutscene && cutsceneData[spawnDef.triggerCutscene]) {
        const cutscene = cutsceneData[spawnDef.triggerCutscene];
        const setFlagActions = cutscene.actions.filter(
          (a): a is Extract<typeof a, { type: 'setFlag' }> => a.type === 'setFlag'
        );
        const alreadyPlayed = setFlagActions.length > 0 &&
          setFlagActions.every(a => gm.getFlag(a.flag));
        if (!alreadyPlayed) {
          ctx.cutsceneEngine.play(cutscene);
          return;
        }
      }

      // Regular dialogue
      sm.pause();
      sm.launch('DialogueScene', { dialogue });
      sm.get('DialogueScene').events.once('shutdown', () => {
        sm.resume();
      });
      return;
    }
  }

  // ── Tile interactions: check the tile the player is facing ──
  if (targetY >= 0 && targetY < mapDef.height && targetX >= 0 && targetX < mapDef.width) {
    const tile = mapDef.ground[targetY][targetX];

    // Cut tree
    if (tile === Tile.CUT_TREE && OverworldAbilities.canUse('cut')) {
      mapDef.ground[targetY][targetX] = Tile.GRASS;
      ctx.redrawTile(targetX, targetY);
      ctx.showFieldAbilityPopup('CUT!');
      return;
    }

    // Rock Smash
    if (tile === Tile.CRACKED_ROCK && OverworldAbilities.canUse('rock-smash')) {
      mapDef.ground[targetY][targetX] = Tile.GRASS;
      ctx.redrawTile(targetX, targetY);
      ctx.showFieldAbilityPopup('SMASH!');
      return;
    }

    // Strength: push boulder
    if (tile === Tile.STRENGTH_BOULDER && OverworldAbilities.canUse('strength')) {
      ctx.pushBoulder(targetX, targetY, facing);
      return;
    }

    // Starter Poké Ball on table
    if (tile === Tile.POKEBALL_ITEM) {
      const gm = GameManager.getInstance();
      if (!gm.getFlag('receivedStarter')) {
        if (gm.getFlag('oakOfferedStarter')) {
          ctx.launchStarterSelection();
        } else {
          sm.pause();
          sm.launch('DialogueScene', { dialogue: ['There are three Poké Balls on the table.'] });
          sm.get('DialogueScene').events.once('shutdown', () => sm.resume());
        }
        return;
      }
    }

    // Surf: start surfing on water
    if (tile === Tile.WATER && !ctx.surfing && OverworldAbilities.canUse('surf')) {
      ctx.showFieldAbilityPopup('SURF!');
      // AUDIT-016: Actually enable surfing
      (ctx as unknown as { surfing: boolean }).surfing = true;
      // Auto-dismount bicycle when entering water
      (ctx as unknown as { isCycling: boolean }).isCycling = false;
      AchievementManager.getInstance().unlock('surf-first');
      return;
    }

    // Fishing: check if facing a water tile with a rod
    if (tile === Tile.WATER) {
      ctx.tryFishing();
      return;
    }
  }
}
