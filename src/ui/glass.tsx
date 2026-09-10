import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type GlassSurfaceProps = {
  /**
   * Android blurs a specific target rather than "whatever is behind me", so it
   * needs a ref to the BlurTargetView wrapping the content. Absent on iOS,
   * where the native blur samples the backdrop directly.
   */
  blurTarget?: React.RefObject<View | null>;
};

/**
 * The liquid-glass surface: a real backdrop blur, tinted toward the app's navy
 * and finished with a hairline sheen along the top edge.
 *
 * The layers are not decoration for their own sake. The blur alone renders
 * near-black against this palette, so the tint restores contrast for labels,
 * and the sheen supplies the bright edge that makes a surface read as glass
 * rather than as flat translucency.
 */
export function GlassSurface({ blurTarget }: GlassSurfaceProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        blurTarget={blurTarget}
        // expo-blur defaults blurMethod to 'none' on Android, which draws a
        // flat translucent view and no blur at all. 'dimezisBlurViewSdk31Plus'
        // gives a real blur on Android 12+ and degrades to none below it,
        // rather than paying the RenderScript performance cost on old devices.
        blurMethod="dimezisBlurViewSdk31Plus"
        // Android's perceived intensity runs lower than iOS at the same value.
        intensity={Platform.OS === 'android' ? 85 : 55}
        tint="systemUltraThinMaterialDark"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <View style={styles.sheen} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Carries the label contrast on its own wherever the blur falls back to
  // nothing (Android 11 and below), so the bar never becomes unreadable.
  tint: { backgroundColor: 'rgba(21, 30, 49, 0.62)' },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(245, 247, 251, 0.16)',
  },
});
