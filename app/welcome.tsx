import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGym } from '../src/api/queries';
import { Button, Screen } from '../src/ui/components';
import { useServerWaking } from '../src/hooks/useServerWaking';
import { colors, spacing, type } from '../src/ui/theme';

export default function Welcome() {
  const router = useRouter();
  const gym = useGym();
  const waking = useServerWaking();
  const insets = useSafeAreaInsets();

  const logo = gym.data?.logoUrl?.trim() ? gym.data.logoUrl : null;

  return (
    <Screen style={{ paddingTop: insets.top + spacing(6), paddingBottom: insets.bottom + spacing(3) }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing(2) }}>
        {logo ? (
          <Image
            source={{ uri: logo }}
            style={{ width: 96, height: 96, borderRadius: 24 }}
            resizeMode="contain"
          />
        ) : null}
        <Text style={{ ...type.label, letterSpacing: 3 }}>WELCOME TO</Text>
        <Text style={{ ...type.title, fontSize: 36 }}>
          {gym.data?.name ?? 'your gym'}
        </Text>
        {gym.data?.city ? (
          <Text style={type.caption}>
            {[gym.data.addressLine1, gym.data.city].filter(Boolean).join(', ')}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: spacing(1.5) }}>
        {waking && !gym.data ? (
          <Text style={{ ...type.caption, textAlign: 'center' }}>
            Waking up the gym's server… this can take up to a minute.
          </Text>
        ) : null}
        <Button label="Continue with phone" onPress={() => router.push('/login')} />
        <Text style={{ ...type.caption, textAlign: 'center', color: colors.textMuted }}>
          We'll send a one-time code to verify it's you.
        </Text>
      </View>
    </Screen>
  );
}
