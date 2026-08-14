import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ApiError } from '../src/api/client';
import { useMe } from '../src/api/queries';
import { useAuth } from '../src/auth/AuthContext';
import { Button, ErrorNote, Screen } from '../src/ui/components';
import { colors, spacing, type } from '../src/ui/theme';

/**
 * The single routing decision in the app: restoring -> splash, signed out ->
 * welcome, signed in -> onboarding or home, keyed on `membership.onboarded`
 * (not `isNewUser` — a desk-registered member is not new but has never
 * onboarded).
 */
export default function Index() {
  const { status } = useAuth();
  const signedIn = status === 'signedIn';
  const me = useMe(signedIn);

  if (status === 'restoring' || (signedIn && me.isLoading)) {
    return <Splash />;
  }

  if (status === 'signedOut') return <Redirect href="/welcome" />;

  if (me.isError) {
    const error = me.error as ApiError;
    return (
      <Screen style={{ justifyContent: 'center', gap: spacing(2) }}>
        <Text style={type.title}>We couldn't load your profile</Text>
        <ErrorNote message={error?.message ?? 'Please try again.'} />
        <Button label="Try again" onPress={() => me.refetch()} />
      </Screen>
    );
  }

  return <Redirect href={me.data?.membership?.onboarded ? '/home' : '/onboarding'} />;
}

function Splash() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing(2),
      }}
    >
      <Text style={{ ...type.title, letterSpacing: 4 }}>SWASTH</Text>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
