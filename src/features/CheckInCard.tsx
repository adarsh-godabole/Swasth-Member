import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { ApiError } from '../api/client';
import { useCheckIn, useCheckInSummary } from '../api/queries';
import type { Subscription } from '../api/types';
import { formatTime } from '../lib/format';
import { Button, Card, ErrorNote } from '../ui/components';
import { colors, spacing, type } from '../ui/theme';

/**
 * The daily action. No QR and no scanner — a button plus a client-side
 * confirmation, which is the only thing between a mis-tap and a false
 * attendance record.
 *
 * Rendered only when the membership is ACTIVE, so a member without one never
 * taps into a refusal.
 */
export function CheckInCard({ subscription }: { subscription: Subscription | null }) {
  const router = useRouter();
  const active = subscription?.status === 'ACTIVE';
  const summary = useCheckInSummary(active);
  const checkIn = useCheckIn();

  if (!active) return null;

  const confirm = () =>
    Alert.alert(
      "Are you sure you're at the gym?",
      'This records today\'s visit.',
      [
        { text: 'Not yet', style: 'cancel' },
        { text: "Yes, I'm here", onPress: () => checkIn.mutate() },
      ],
    );

  // A double tap returns the original check-in with alreadyCheckedIn: true and
  // a 200 — success, not an error.
  const checkedInAt = checkIn.data?.checkedInAt ?? summary.data?.checkedInAt ?? null;
  const checkedInToday = checkIn.isSuccess || !!summary.data?.checkedInToday;
  const error = checkIn.error as ApiError | null;

  return (
    <Card style={{ gap: spacing(1.5) }}>
      {summary.isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : checkedInToday ? (
        <View style={{ gap: spacing(0.5) }}>
          <Text style={{ ...type.heading, color: colors.accent }}>
            You're checked in{checkedInAt ? ` at ${formatTime(checkedInAt)}` : ''}
          </Text>
          <Text style={type.caption}>Have a good session.</Text>
        </View>
      ) : (
        <Button
          label="Check in"
          onPress={confirm}
          loading={checkIn.isPending}
        />
      )}

      {error ? <ErrorNote message={error.message} /> : null}

      {summary.data ? (
        <View style={{ flexDirection: 'row', gap: spacing(1) }}>
          {/* Streaks survive not having come in yet today, so this stays honest
              in the morning. */}
          <Stat value={summary.data.currentStreak} label="day streak" />
          <Stat value={summary.data.visitsThisMonth} label="this month" />
          <Stat value={summary.data.totalVisits} label="all time" />
        </View>
      ) : null}

      {summary.data?.totalVisits ? (
        <Button
          label="View all visits"
          variant="ghost"
          onPress={() => router.push('/visits')}
        />
      ) : null}
    </Card>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        gap: spacing(0.25),
        paddingVertical: spacing(1.25),
        alignItems: 'center',
        backgroundColor: colors.surfaceAlt,
        borderRadius: 14,
      }}
    >
      <Text style={{ ...type.heading, fontSize: 22 }}>{value}</Text>
      <Text style={{ ...type.caption, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
