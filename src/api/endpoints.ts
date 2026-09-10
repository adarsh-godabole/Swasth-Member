import { Platform } from 'react-native';

import { APP_VERSION } from '../config';
import { api } from './client';
import type {
  AuthSession,
  CheckIn,
  CheckInSummary,
  DevicePlatform,
  Gym,
  Me,
  OtpSendResponse,
  Plan,
  UpdateMePayload,
  UpsertWorkoutPayload,
  Workout,
  WorkoutSummary,
} from './types';

const devicePlatform: DevicePlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

export const gymsApi = {
  /** No auth — safe to fire on the welcome screen to warm the sleeping server. */
  current: () => api.get<Gym>('/gyms/current', { auth: false }),
};

export const authApi = {
  sendOtp: (phone: string) =>
    api.post<OtpSendResponse>('/auth/otp/send', { phone }, { auth: false }),

  verifyOtp: (phone: string, code: string, pushToken?: string) =>
    api.post<AuthSession>(
      '/auth/otp/verify',
      {
        phone,
        code,
        platform: devicePlatform,
        appVersion: APP_VERSION,
        ...(pushToken ? { pushToken } : {}),
      },
      { auth: false },
    ),

  logout: (refreshToken: string) =>
    api.post<void>('/auth/logout', { refreshToken }, { auth: false, gymHeader: false }),
};

export const usersApi = {
  me: () => api.get<Me>('/users/me'),
  update: (payload: UpdateMePayload) => api.patch<Me>('/users/me', payload),
  completeOnboarding: () => api.post<void>('/users/me/onboarding/complete'),
  deleteAccount: () => api.delete<void>('/users/me'),
};

export const plansApi = {
  list: () => api.get<Plan[]>('/plans'),
};

export const workoutsApi = {
  /**
   * PUT, not POST: the body map saves on every tap, so this has to be safe to
   * repeat. `muscleGroups` replaces the stored set — un-tapping is a shorter
   * array. 409 when there's no check-in today.
   */
  upsertToday: (payload: UpsertWorkoutPayload) =>
    api.put<Workout>('/workouts/me/today', payload),
  history: (limit = 30) => api.get<Workout[]>(`/workouts/me?limit=${limit}`),
  summary: (days = 30) =>
    api.get<WorkoutSummary>(`/workouts/me/summary?days=${days}`),
};

export const checkInsApi = {
  /** No body. Requires an active membership — two distinct 403s, both worded for members. */
  create: () => api.post<CheckIn>('/check-ins'),
  summary: () => api.get<CheckInSummary>('/check-ins/me/summary'),
  history: (limit = 30) => api.get<CheckIn[]>(`/check-ins/me?limit=${limit}`),
};
