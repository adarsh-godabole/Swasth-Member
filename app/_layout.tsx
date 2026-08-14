import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import { gymsApi } from '../src/api/endpoints';
import { AuthProvider } from '../src/auth/AuthContext';
import { colors } from '../src/ui/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The server sleeps; a cold start looks like a slow request, not a failure.
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
});

export default function RootLayout() {
  const warmed = useRef(false);

  // Warm the sleeping backend as early as possible, while the member is still
  // reading the welcome screen. Failure here is irrelevant.
  useEffect(() => {
    if (warmed.current) return;
    warmed.current = true;
    gymsApi.current().catch(() => {});

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') gymsApi.current().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
