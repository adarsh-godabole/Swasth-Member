import type { ActivityLevel, FitnessGoal, Gender, Subscription } from '../api/types';

const GOAL_LABELS: Record<FitnessGoal, string> = {
  WEIGHT_LOSS: 'Lose weight',
  MUSCLE_GAIN: 'Build muscle',
  GENERAL_FITNESS: 'General fitness',
  ENDURANCE: 'Endurance',
  REHAB: 'Rehab / recovery',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  BEGINNER: 'Just starting out',
  OCCASIONAL: 'Occasional',
  REGULAR: 'Regular',
};

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  UNDISCLOSED: 'Prefer not to say',
};

export const goalLabel = (v: FitnessGoal | null) => (v ? GOAL_LABELS[v] : null);
export const activityLabel = (v: ActivityLevel | null) => (v ? ACTIVITY_LABELS[v] : null);
export const genderLabel = (v: Gender | null) => (v ? GENDER_LABELS[v] : null);

export function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function firstName(fullName: string | null) {
  return fullName?.trim().split(/\s+/)[0] ?? null;
}

/**
 * daysRemaining is 0 on the last valid day and negative afterwards — never
 * render "-3 days left".
 */
export function remainingLabel(sub: Subscription) {
  if (sub.daysRemaining < 0) return 'Expired';
  if (sub.daysRemaining === 0) return 'Expires today';
  return `${sub.daysRemaining} ${sub.daysRemaining === 1 ? 'day' : 'days'} left`;
}

/**
 * When a renewal is queued, endDate is only the current term's end —
 * coveredUntil is the real answer to "how long am I covered".
 */
export function coverageDate(sub: Subscription) {
  return formatDate(sub.hasRenewalQueued ? sub.coveredUntil : sub.endDate);
}
