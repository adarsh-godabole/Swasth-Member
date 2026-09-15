import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ApiError } from '../src/api/client';
import { useCheckInByCode, useMe } from '../src/api/queries';
import { useAuth } from '../src/auth/AuthContext';
import {
  rememberCheckInCode,
  takePendingCheckInCode,
} from '../src/features/checkInHandoff';
import { formatTime } from '../src/lib/format';
import { Button, Card, ErrorNote, Field, Screen } from '../src/ui/components';
import { colors, spacing, type } from '../src/ui/theme';

/**
 * Where the door QR lands. The poster deep-links to `swasth://check-in?code=…`,
 * the phone's own camera opens it, and the visit is recorded without anyone
 * touching a button — the scan *is* the confirmation.
 *
 * Reachable without a code too, as the typed fallback: the code is printed
 * under the QR precisely because not every camera will follow a custom scheme.
 *
 * Every route in ends here — the deep link, the in-app scanner at /scan, and
 * the typed code — so a visit is recorded in exactly one place.
 */
export default function CheckInScreen() {
  const router = useRouter();
  const { status } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();

  const signedIn = status === 'signedIn';
  const me = useMe(signedIn);
  const checkIn = useCheckInByCode();

  const scanned = typeof params.code === 'string' ? params.code : null;
  const [typed, setTyped] = useState('');
  // One automatic attempt per arrival. Without this the mutation refires on
  // every render caused by its own state changing.
  const attempted = useRef(false);

  useEffect(() => {
    if (!signedIn || attempted.current) return;
    // A code parked before the sign-in detour takes precedence: it is the scan
    // that started all this, and the URL no longer carries it.
    const code = takePendingCheckInCode() ?? scanned;
    if (!code) return;
    attempted.current = true;
    checkIn.mutate(code);
  }, [signedIn, scanned, checkIn]);

  if (status === 'restoring') return <Waiting label="One moment…" />;

  // Park the code and send them to sign in. They come back here via index.
  if (status === 'signedOut') {
    if (scanned) rememberCheckInCode(scanned);
    return <Redirect href="/welcome" />;
  }

  // A member who has never onboarded has no membership to check in against.
  if (me.data && !me.data.membership?.onboarded) {
    if (scanned) rememberCheckInCode(scanned);
    return <Redirect href="/onboarding" />;
  }

  const error = checkIn.error as ApiError | null;

  if (checkIn.isPending) return <Waiting label="Checking you in…" />;

  if (checkIn.isSuccess) {
    const { alreadyCheckedIn, checkedInAt } = checkIn.data;
    return (
      <Screen style={{ justifyContent: 'center', gap: spacing(2) }}>
        <View style={{ gap: spacing(1) }}>
          <Text style={{ ...type.title, color: colors.accent }}>
            {alreadyCheckedIn ? "You're already in" : "You're checked in"}
          </Text>
          <Text style={type.caption}>
            {alreadyCheckedIn
              ? `We recorded today's visit at ${formatTime(checkedInAt)} — scanning again changes nothing.`
              : `Recorded at ${formatTime(checkedInAt)}. Have a good session.`}
          </Text>
        </View>
        <Button label="Log your workout" onPress={() => router.replace('/session')} />
        <Button label="Home" variant="ghost" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  return (
    <Screen style={{ justifyContent: 'center', gap: spacing(2) }}>
      <View style={{ gap: spacing(1) }}>
        <Text style={type.title}>
          {error ? "That didn't work" : 'Enter the gym code'}
        </Text>
        <Text style={type.caption}>
          {error
            ? 'You can type the code printed under the QR instead.'
            : "It's the 8 characters printed under the QR code at the gym."}
        </Text>
      </View>

      {error ? <ErrorNote message={error.message} /> : null}

      <Card style={{ gap: spacing(1.5) }}>
        <Field
          label="Gym code"
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          placeholder="K7M29QX4"
          onSubmitEditing={() => typed.trim() && checkIn.mutate(typed)}
        />
        <Button
          label="Check in"
          disabled={typed.trim().length === 0}
          onPress={() => checkIn.mutate(typed)}
        />
      </Card>

      <Button label="Scan the QR instead" variant="ghost" onPress={() => router.replace('/scan')} />
      <Button label="Back" variant="ghost" onPress={() => router.replace('/home')} />
    </Screen>
  );
}

function Waiting({ label }: { label: string }) {
  return (
    <Screen style={{ justifyContent: 'center', alignItems: 'center', gap: spacing(2) }}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={type.caption}>{label}</Text>
    </Screen>
  );
}
