import { BlurTargetView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '../../src/ui/glass';
import { colors } from '../../src/ui/theme';

export default function TabsLayout() {
  // Edge-to-edge is mandatory from SDK 55 on, so the tab bar is laid out behind
  // the Android gesture bar. Without reserving the inset the labels sit under
  // it and read as a cut-off footer.
  const insets = useSafeAreaInsets();

  // On Android the blur samples this target rather than the live backdrop, so
  // the screens have to be wrapped in it for anything to show through the bar.
  const blurTarget = useRef<View>(null);

  return (
    <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
          tabBarBackground: () => <GlassSurface blurTarget={blurTarget} />,
          tabBarStyle: {
            // Transparent and absolute so content passes under the glass
            // instead of stopping at an opaque edge - without this the blur
            // has nothing to sample and the effect is invisible.
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 62 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom,
          },
          tabBarIconStyle: { display: 'none' },
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Membership' }} />
        <Tabs.Screen name="plans" options={{ title: 'Plans' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </BlurTargetView>
  );
}
