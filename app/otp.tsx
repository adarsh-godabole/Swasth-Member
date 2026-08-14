import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import { authApi } from '../src/api/endpoints';
import { useAuth } from '../src/auth/AuthContext';
import { IS_DEV_BUILD } from '../src/config';
import { useServerWaking } from '../src/hooks/useServerWaking';
import { Button, ErrorNote, Screen } from '../src/ui/components';
import { colors, radius, spacing, type } from '../src/ui/theme';

const CODE_LENGTH = 6;
/** The backend rejects a resend inside 60s AND keeps the original code valid. */
const RESEND_COOLDOWN_SECONDS = 60;

export default function Otp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{
    phone: string;
    maskedPhone?: string;
    devCode?: string;
  }>();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputs = useRef<(TextInput | null)[]>([]);
  const waking = useServerWaking();

  const code = digits.join('');
  const complete = code.length === CODE_LENGTH;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verify = useMutation({
    mutationFn: (value: string) => authApi.verifyOtp(params.phone, value),
    onSuccess: async (session) => {
      await signIn(session);
      router.replace('/');
    },
    onError: () => {
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    },
  });

  const resend = useMutation({
    mutationFn: () => authApi.sendOtp(params.phone),
    onSuccess: () => setCooldown(RESEND_COOLDOWN_SECONDS),
  });

  // Auto-submit as soon as the last box is filled.
  useEffect(() => {
    if (complete && !verify.isPending) verify.mutate(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const setDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    // Handle an SMS autofill / paste dropping the whole code into one box.
    setDigits((prev) => {
      const next = [...prev];
      cleaned.split('').forEach((char, offset) => {
        if (index + offset < CODE_LENGTH) next[index + offset] = char;
      });
      return next;
    });
    const nextIndex = Math.min(index + cleaned.length, CODE_LENGTH - 1);
    inputs.current[nextIndex]?.focus();
  };

  const onKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      setDigits((prev) => prev.map((d, i) => (i === index - 1 ? '' : d)));
    }
  };

  const error = (verify.error ?? resend.error) as ApiError | null;
  const displayPhone = params.maskedPhone || params.phone;

  const boxes = useMemo(
    () =>
      digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          value={digit}
          onChangeText={(value) => setDigit(index, value)}
          onKeyPress={(e) => onKeyPress(index, e)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={CODE_LENGTH}
          autoFocus={index === 0}
          selectTextOnFocus
          style={{
            flex: 1,
            height: 62,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: digit ? colors.accent : colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: 24,
            fontWeight: '700',
            textAlign: 'center',
          }}
        />
      )),
    [digits],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen style={{ paddingTop: insets.top + spacing(4) }}>
        <View style={{ flex: 1, gap: spacing(3) }}>
          <View style={{ gap: spacing(1) }}>
            <Text style={type.title}>Enter the code</Text>
            <Text style={type.caption}>Sent to {displayPhone}. It expires in 5 minutes.</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing(1) }}>{boxes}</View>

          {error ? <ErrorNote message={error.message} /> : null}
          {waking && verify.isPending ? (
            <Text style={type.caption}>Waking up the gym's server…</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={cooldown > 0 || resend.isPending}
            onPress={() => resend.mutate()}
            style={{ alignSelf: 'flex-start' }}
          >
            <Text
              style={{
                ...type.body,
                fontSize: 15,
                color: cooldown > 0 ? colors.textMuted : colors.accent,
                fontWeight: '600',
              }}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </Text>
          </Pressable>

          {IS_DEV_BUILD && params.devCode ? (
            <Text style={{ ...type.caption, color: colors.warning }}>
              Dev code: {params.devCode}
            </Text>
          ) : null}
        </View>

        <Button
          label="Verify"
          disabled={!complete}
          loading={verify.isPending}
          onPress={() => verify.mutate(code)}
          style={{ marginBottom: insets.bottom + spacing(2) }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
