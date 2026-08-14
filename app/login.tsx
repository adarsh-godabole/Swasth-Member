import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import { authApi } from '../src/api/endpoints';
import { Button, ErrorNote, Field, Screen } from '../src/ui/components';
import { useServerWaking } from '../src/hooks/useServerWaking';
import { spacing, type } from '../src/ui/theme';

const TEN_DIGITS = /^[6-9]\d{9}$/;

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const waking = useServerWaking();

  const sendOtp = useMutation({
    mutationFn: () => authApi.sendOtp(phone),
    onSuccess: (res) =>
      router.push({
        pathname: '/otp',
        params: {
          phone,
          maskedPhone: res.phone,
          expiresAt: res.expiresAt,
          devCode: res.devCode ?? '',
        },
      }),
  });

  const valid = TEN_DIGITS.test(phone);
  const error = sendOtp.error as ApiError | null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen style={{ paddingTop: insets.top + spacing(4) }}>
        <View style={{ flex: 1, gap: spacing(3) }}>
          <View style={{ gap: spacing(1) }}>
            <Text style={type.title}>What's your number?</Text>
            <Text style={type.caption}>
              Use the mobile number the gym has on file.
            </Text>
          </View>

          <Field
            label="Mobile number"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            placeholder="9876543210"
            maxLength={10}
            autoFocus
            hint="10-digit Indian mobile number"
          />

          {error ? <ErrorNote message={error.message} /> : null}
          {waking && sendOtp.isPending ? (
            <Text style={type.caption}>
              Waking up the gym's server… this can take up to a minute.
            </Text>
          ) : null}
        </View>

        <Button
          label="Send code"
          disabled={!valid}
          loading={sendOtp.isPending}
          onPress={() => sendOtp.mutate()}
          style={{ marginBottom: insets.bottom + spacing(2) }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
