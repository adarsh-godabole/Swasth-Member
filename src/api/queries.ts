import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { checkInsApi, gymsApi, plansApi, usersApi } from './endpoints';
import type { CheckIn, CheckInSummary, Me, UpdateMePayload } from './types';

export const queryKeys = {
  gym: ['gym', 'current'] as const,
  me: ['users', 'me'] as const,
  plans: ['plans'] as const,
  checkInSummary: ['check-ins', 'summary'] as const,
  checkInHistory: (limit: number) => ['check-ins', 'history', limit] as const,
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkInsApi.create,
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

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.completeOnboarding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  });
}
