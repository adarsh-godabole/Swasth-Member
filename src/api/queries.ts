import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { gymsApi, plansApi, usersApi } from './endpoints';
import type { Me, UpdateMePayload } from './types';

export const queryKeys = {
  gym: ['gym', 'current'] as const,
  me: ['users', 'me'] as const,
  plans: ['plans'] as const,
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

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersApi.completeOnboarding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me }),
  });
}
