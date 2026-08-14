import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCompleteOnboarding } from '../src/api/queries';
import { Button, Screen } from '../src/ui/components';
import { spacing, type } from '../src/ui/theme';

/**
 * Placeholder. The real multi-step onboarding (name, gender, DOB, height,
 * weight, goal, activity level, medical notes, emergency contact — a few
 * questions per screen, skippable) is the next thing to build. It sends
 * PATCH /users/me per step and finishes with POST /users/me/onboarding/complete.
 */
export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const complete = useCompleteOnboarding();

  return (
    <Screen style={{ paddingTop: insets.top + spacing(6) }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing(1.5) }}>
        <Text style={type.title}>Let's set up your profile</Text>
        <Text style={type.caption}>
          A few quick questions so the gym knows how to train you. Onboarding
          questions are not built yet.
        </Text>
      </View>
      <Button
        label="Skip for now"
        variant="secondary"
        loading={complete.isPending}
        onPress={() => complete.mutateAsync().then(() => router.replace('/home'))}
        style={{ marginBottom: insets.bottom + spacing(2) }}
      />
    </Screen>
  );
}
