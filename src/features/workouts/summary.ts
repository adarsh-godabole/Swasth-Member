import type { MuscleGroup } from '../../api/types';
import { muscleLabel } from './muscles';

/** "Chest · Biceps · Abs" — the one-line answer to "what did I do that day". */
export const musclesLabel = (muscles: MuscleGroup[]) =>
  muscles.map(muscleLabel).join(' · ');
