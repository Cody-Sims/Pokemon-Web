import { trainerData } from '@data/trainer-data';
import { rivalStarterStages } from '@data/trainers';
import { GameManager } from '@managers/GameManager';
import type { TrainerData } from '@data/trainers/types';

function getRivalStarterBase(): number {
  const gm = GameManager.getInstance();
  if (gm.getFlag('starterChoice_1')) return 4;
  if (gm.getFlag('starterChoice_4')) return 7;
  if (gm.getFlag('starterChoice_7')) return 1;
  return 4;
}

export function getTrainerData(trainerId: string): TrainerData | undefined {
  const trainer = trainerData[trainerId];
  const starterStage = rivalStarterStages[trainerId];
  if (!trainer || starterStage === undefined) return trainer;

  const [starter, ...rest] = trainer.party;
  if (!starter) return trainer;

  return {
    ...trainer,
    party: [
      { ...starter, pokemonId: getRivalStarterBase() + starterStage },
      ...rest,
    ],
  };
}
