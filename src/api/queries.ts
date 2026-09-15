import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  checkInsApi,
  gymsApi,
  plansApi,
  usersApi,
  workoutsApi,
} from './endpoints';
import type {
  CheckIn,
  CheckInSummary,
  Me,
  UpdateMePayload,
  UpsertWorkoutPayload,
  Workout,
} from './types';

export const queryKeys = {
  gym: ['gym', 'current'] as const,
  me: ['users', 'me'] as const,
  plans: ['plans'] as const,
  checkInSummary: ['check-ins', 'summary'] as const,
  checkInHistory: (limit: number) => ['check-ins', 'history', limit] as const,
  workoutHistory: (limit: number) => ['workouts', 'history', limit] as const,
  workoutSummary: (days: number) => ['workouts', 'summary', days] as const,
};

export function useGym() {
  return useQuery({
    queryKey: queryKeys.gym,
    queryFn: gymsApi.current,
    staleTime: 1000 * 60 * 60,
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: usersApi.me,
    enabled,
    staleTime: 1000 * 30,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans,
    queryFn: plansApi.list,
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMePayload) => usersApi.update(payload),
    onSuccess: (me: Me) => queryClient.setQueryData(queryKeys.me, me),
  });
}

export function useCheckInSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.checkInSummary,
    queryFn: checkInsApi.summary,
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useCheckInHistory(limit = 30, enabled = true) {
  return useQuery({
    queryKey: queryKeys.checkInHistory(limit),
    queryFn: () => checkInsApi.history(limit),
    enabled,
  });
}

export function useCheckIn() {
  return useCheckInMutation(checkInsApi.create);
}

/** The QR path. Identical cache handling — only the call differs. */
export function useCheckInByCode() {
  return useCheckInMutation((code: string) => checkInsApi.createFromCode(code));
}

function useCheckInMutation<TArg>(mutationFn: (arg: TArg) => Promise<CheckIn>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (checkIn: CheckIn) => {
      // The summary is server-computed (streaks included), so refetch rather
      // than deriving anything locally.
      queryClient.setQueryData(queryKeys.checkInSummary, (prev?: CheckInSummary) =>
        prev
          ? { ...prev, checkedInToday: true, checkedInAt: checkIn.checkedInAt }
          : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.me }); // lastVisitAt
    },
  });
}

export function useWorkoutHistory(limit = 30, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workoutHistory(limit),
    queryFn: () => workoutsApi.history(limit),
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useWorkoutSummary(days = 30, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workoutSummary(days),
    queryFn: () => workoutsApi.summary(days),
    enabled,
    staleTime: 1000 * 30,
  });
}

/**
 * Saves the whole body-map selection. Called on every tap, so the returned
 * workout is written straight into the cached histories rather than triggering
 * a refetch per tap — the server's response is already the authoritative row.
 */
export function useUpsertWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertWorkoutPayload) =>
      workoutsApi.upsertToday(payload),
    onSuccess: (workout: Workout) => {
      queryClient.setQueriesData(
        { queryKey: ['workouts', 'history'] },
        (prev?: Workout[]) => {
          if (!prev) return prev;
          const rest = prev.filter((row) => row.id !== workout.id);
          // Today's workout sorts first; the list is newest day first.
          return [workout, ...rest];
        },
      );
      // The tally is server-computed over a window, so it has to be refetched.
      queryClient.invalidateQueries({ queryKey: ['workouts', 'summary'] });
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.completeOnboarding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  });
}
