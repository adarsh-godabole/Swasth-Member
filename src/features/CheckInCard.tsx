import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { ApiError } from '../api/client';
import { useCheckIn, useCheckInSummary, useWorkoutHistory } from '../api/queries';
import type { Subscription } from '../api/types';
import { musclesLabel } from './workouts/summary';
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
  // Only the newest one: it is today's if there is a workout for today, and one
  // row is all this card needs. The full list is fetched by /workouts.
  const workouts = useWorkoutHistory(1, active);

  if (!active) return null;

  const confirm = () =>
    Alert.alert(
      "Are you sure you're at the gym?",
      'This records today\'s visit.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: "Yes, I'm here",
          // Straight into the session screen: the clock is already running from
          // the check-in the server just recorded, so there is nothing to wait for.
          onPress: () =>
            checkIn.mutate(undefined, { onSuccess: () => router.push('/session') }),
        },
      ],
    );

  // A double tap returns the original check-in with alreadyCheckedIn: true and
  // a 200 — success, not an error.
  const checkedInAt = checkIn.data?.checkedInAt ?? summary.data?.checkedInAt ?? null;
  const checkedInToday = checkIn.isSuccess || !!summary.data?.checkedInToday;
  const error = checkIn.error as ApiError | null;

  // Matched on the check-in instant, which the server copies to startedAt. The
  // newest workout may well be last week's, and captioning that "Today" would
  // be a lie.
  const today = workouts.data?.find((row) => row.startedAt === checkedInAt) ?? null;
  const loggedToday = today?.muscleGroups.length
    ? musclesLabel(today.muscleGroups)
    : null;

  return (
    <Card style={{ gap: spacing(1.5) }}>
      {summary.isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : checkedInToday ? (
        <View style={{ gap: spacing(0.5) }}>
          <Text style={{ ...type.heading, color: colors.accent }}>
            You're checked in{checkedInAt ? ` at ${formatTime(checkedInAt)}` : ''}
          </Text>
          <Text style={type.caption}>
            {loggedToday ? `Today: ${loggedToday}` : 'Have a good session.'}
          </Text>
        </View>
      ) : (
        <Button
          label="Check in"
          onPress={confirm}
          loading={checkIn.isPending}
        />
      )}

      {error ? <ErrorNote message={error.message} /> : null}

      {checkedInToday ? (
        <Button
          label={loggedToday ? "Today's session" : 'Log your workout'}
          onPress={() => router.push('/session')}
        />
      ) : null}

      {summary.data ? (
        <View style={{ flexDirection: 'row', gap: spacing(1) }}>
          {/* Streaks survive not having come in yet today, so this stays honest
              in the morning. */}
          <Stat value={summary.data.currentStreak} label="day streak" />
          <Stat value={summary.data.visitsThisMonth} label="this month" />
          <Stat value={summary.data.totalVisits} label="all time" />
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing(1) }}>
        {summary.data?.totalVisits ? (
          <Button
            label="All visits"
            variant="ghost"
            style={{ flex: 1 }}
            onPress={() => router.push('/visits')}
          />
        ) : null}
        {workouts.data?.length ? (
          <Button
            label="Past workouts"
            variant="ghost"
            style={{ flex: 1 }}
            onPress={() => router.push('/workouts')}
          />
        ) : null}
      </View>
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
