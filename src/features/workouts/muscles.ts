import type { MuscleGroup } from '../../api/types';

/**
 * Labels and geometry for the body map. The vocabulary itself is the server's
 * `MuscleGroup` enum — these strings go over the wire untouched, so the labels
 * below are the only place they are ever prettied up.
 */

export type BodySide = 'FRONT' | 'BACK';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  CHEST: 'Chest',
  SHOULDERS: 'Shoulders',
  BICEPS: 'Biceps',
  TRICEPS: 'Triceps',
  FOREARMS: 'Forearms',
  ABS: 'Abs / core',
  TRAPS: 'Traps',
  LATS: 'Back / lats',
  LOWER_BACK: 'Lower back',
  GLUTES: 'Glutes',
  HAMSTRINGS: 'Hamstrings',
  QUADS: 'Quads',
  CALVES: 'Calves',
  CARDIO: 'Cardio',
  FULL_BODY: 'Full body',
};

export const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleGroup[];

/** Falls back to the raw enum if the server ever adds one the app doesn't know. */
export const muscleLabel = (id: MuscleGroup) => MUSCLE_LABELS[id] ?? id;

/**
 * A patch on the figure, in percentages of the figure box, so the map scales
 * with the screen instead of being pinned to a pixel size.
 */
export type Region = {
  id: MuscleGroup;
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

/** Limbs come in pairs; both halves toggle the same muscle. */
const pair = (id: MuscleGroup, geom: Omit<Region, 'id' | 'left'>, left: number, right: number): Region[] => [
  { id, left, ...geom },
  { id, left: right, ...geom },
];

export const FRONT_REGIONS: Region[] = [
  { id: 'CHEST', left: 33, top: 12, width: 34, height: 10, radius: 10 },
  ...pair('SHOULDERS', { top: 11.5, width: 17, height: 8, radius: 12 }, 14, 69),
  ...pair('BICEPS', { top: 20.5, width: 14, height: 12, radius: 9 }, 12, 74),
  { id: 'ABS', left: 35, top: 23, width: 30, height: 15, radius: 9 },
  ...pair('FOREARMS', { top: 33.5, width: 13, height: 13, radius: 8 }, 9, 78),
  ...pair('QUADS', { top: 42, width: 17, height: 18, radius: 10 }, 31, 52),
  ...pair('CALVES', { top: 63, width: 15, height: 16, radius: 9 }, 32.5, 52.5),
];

export const BACK_REGIONS: Region[] = [
  { id: 'TRAPS', left: 34, top: 11.5, width: 32, height: 8, radius: 10 },
  ...pair('SHOULDERS', { top: 11.5, width: 17, height: 8, radius: 12 }, 14, 69),
  { id: 'LATS', left: 32, top: 20.5, width: 36, height: 12, radius: 10 },
  ...pair('TRICEPS', { top: 20.5, width: 14, height: 12, radius: 9 }, 12, 74),
  { id: 'LOWER_BACK', left: 36, top: 33, width: 28, height: 6, radius: 8 },
  ...pair('FOREARMS', { top: 33.5, width: 13, height: 13, radius: 8 }, 9, 78),
  { id: 'GLUTES', left: 31, top: 40, width: 38, height: 9, radius: 12 },
  ...pair('HAMSTRINGS', { top: 50, width: 17, height: 16, radius: 10 }, 31, 52),
  ...pair('CALVES', { top: 67, width: 15, height: 14, radius: 9 }, 32.5, 52.5),
];

export const regionsFor = (side: BodySide) =>
  side === 'FRONT' ? FRONT_REGIONS : BACK_REGIONS;

/** The chip row under the figure — the figure alone never says which blob is which. */
export const musclesFor = (side: BodySide): MuscleGroup[] => {
  const seen: MuscleGroup[] = [];
  for (const region of regionsFor(side)) {
    if (!seen.includes(region.id)) seen.push(region.id);
  }
  return seen;
};

/** Not on the figure: you can't tap a treadmill. */
export const OFF_BODY_MUSCLES: MuscleGroup[] = ['CARDIO', 'FULL_BODY'];
