import { TrainerData } from '../interfaces';
import { rivalTrainers } from './rival';
import { gymLeaderTrainers } from './gym-leaders';
import { eliteFourTrainers } from './elite-four';
import { routeTrainers } from './route-trainers';
import { teamGruntTrainers } from './team-grunts';

export const trainerData: Record<string, TrainerData> = {
  ...rivalTrainers,
  ...gymLeaderTrainers,
  ...eliteFourTrainers,
  ...routeTrainers,
  ...teamGruntTrainers,
};

export { rivalTrainers } from './rival';
export { gymLeaderTrainers } from './gym-leaders';
export { eliteFourTrainers } from './elite-four';
export { routeTrainers } from './route-trainers';
export { teamGruntTrainers } from './team-grunts';
