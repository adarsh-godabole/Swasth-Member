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

export const checkInsApi = {
  /** No body. Requires an active membership — two distinct 403s, both worded for members. */
  create: () => api.post<CheckIn>('/check-ins'),
  summary: () => api.get<CheckInSummary>('/check-ins/me/summary'),
  history: (limit = 30) => api.get<CheckIn[]>(`/check-ins/me?limit=${limit}`),
};
