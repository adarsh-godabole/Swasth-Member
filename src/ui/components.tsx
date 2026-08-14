import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radius, spacing, type } from './theme';

export function Button({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'secondary' && {
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.border,
        },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        variant === 'danger' && { backgroundColor: 'transparent' },
        isDisabled && { opacity: 0.45 },
        pressed && !isDisabled && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.accentText : colors.text} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            variant === 'primary' && { color: colors.accentText },
            variant === 'danger' && { color: colors.danger },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({
  label,
  hint,
  error,
  ...inputProps
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: spacing(0.75) }}>
      <Text style={type.label}>{label.toUpperCase()}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...inputProps}
        style={[styles.input, !!error && { borderColor: colors.danger }, inputProps.style]}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!error && !!hint && <Text style={type.caption}>{hint}</Text>}
    </View>
  );
}

/** Backend error messages are written for humans — always shown as-is. */
export function ErrorNote({ message }: { message: string }) {
  return (
    <View style={styles.errorNote}>
      <Text style={{ ...type.body, color: colors.danger, fontSize: 14 }}>{message}</Text>
    </View>
  );
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing(3) },
  button: {
    minHeight: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(2.5),
  },
  buttonLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(2),
    color: colors.text,
    fontSize: 16,
  },
  errorText: { ...type.caption, color: colors.danger },
  errorNote: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    padding: spacing(1.5),
  },
});
