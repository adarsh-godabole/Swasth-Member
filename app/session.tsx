import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import {
  useCheckInHistory,
  useCheckInSummary,
  useUpsertWorkout,
  useWorkoutHistory,
} from '../src/api/queries';
import type { MuscleGroup } from '../src/api/types';
import { BodyMap } from '../src/features/workouts/BodyMap';
import type { BodySide } from '../src/features/workouts/muscles';
import { useElapsedSeconds } from '../src/hooks/useElapsed';
import { formatClock, formatGymDay, formatTime } from '../src/lib/format';
import { Button, Card, ErrorNote } from '../src/ui/components';
import { colors, spacing, type } from '../src/ui/theme';

/**
 * Today's session: a clock that has been running since the member checked in,
 * and the body map that records what they trained.
 *
 * Reached straight off a successful check-in, and again from the membership
 * card for the rest of the day. The workout hangs off the check-in on the
 * server too, so the day it lands on is the gym's, never the device's.
 */
export default function Session() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const summary = useCheckInSummary();
  // Limit 30 is the same query /visits uses, so this is usually already cached.
  const history = useCheckInHistory(30);
  const workouts = useWorkoutHistory(30);
  const saveWorkout = useUpsertWorkout();

  const checkedInToday = !!summary.data?.checkedInToday;
  // The newest check-in is today's whenever the summary says so.
  const todaysCheckIn = checkedInToday ? history.data?.[0] ?? null : null;
  const startedAt = todaysCheckIn?.checkedInAt ?? summary.data?.checkedInAt ?? null;

  // Matched on the check-in id, which is exactly what the server keys a workout
  // by — no date arithmetic on the client, so no way to disagree about the day.
  const workout =
    workouts.data?.find((row) => row.checkInId === todaysCheckIn?.id) ?? null;

  const [side, setSide] = useState<BodySide>('FRONT');
  // Local until the member leaves the screen: every tap is a round trip, and
  // waiting for one before repainting would make the map feel broken.
  const [draft, setDraft] = useState<MuscleGroup[] | null>(null);
  const muscles = draft ?? workout?.muscleGroups ?? [];

  const elapsed = useElapsedSeconds(startedAt, workout?.endedAt ?? null);
  const finished = !!workout?.endedAt;
  const ready = !!todaysCheckIn;
  const error = saveWorkout.error as ApiError | null;

  const save = (next: MuscleGroup[], finish?: boolean) => {
    setDraft(next);
    saveWorkout.mutate(
      { muscleGroups: next, ...(finish === undefined ? {} : { finished: finish }) },
      // Drop back to whatever the server actually holds; showing a selection
      // that failed to save is worse than showing the member it didn't take.
      { onError: () => setDraft(null) },
    );
  };

  const toggle = (muscle: MuscleGroup) =>
    save(
      muscles.includes(muscle)
        ? muscles.filter((m) => m !== muscle)
        : [...muscles, muscle],
    );

  const loading =
    summary.isLoading || (checkedInToday && (history.isLoading || workouts.isLoading));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing(3),
        paddingTop: insets.top + spacing(3),
        paddingBottom: insets.bottom + spacing(4),
        gap: spacing(2),
      }}
    >
      {loading ? <ActivityIndicator color={colors.accent} /> : null}

      {!loading && !checkedInToday ? (
        <NotCheckedIn onBack={() => router.back()} />
      ) : null}

      {checkedInToday ? (
        <>
          <Card style={{ gap: spacing(1), alignItems: 'center' }}>
            <Text style={type.label}>{finished ? 'SESSION LENGTH' : 'TRAINING FOR'}</Text>
            <Text style={{ ...type.hero, fontVariant: ['tabular-nums'] }}>
              {elapsed === null ? '—' : formatClock(elapsed)}
            </Text>
            <Text style={type.caption}>
              {startedAt
                ? finished
                  ? `Checked in at ${formatTime(startedAt)} · finished at ${formatTime(workout!.endedAt)}`
                  : `Checked in at ${formatTime(startedAt)}`
                : ''}
            </Text>
            {todaysCheckIn ? (
              <Text style={type.caption}>{formatGymDay(todaysCheckIn.date)}</Text>
            ) : null}
          </Card>

          <Card style={{ gap: spacing(2) }}>
            <View style={{ gap: spacing(0.5) }}>
              <Text style={type.heading}>What are you training?</Text>
              <Text style={type.caption}>
                Tap the muscles you're working today. Saved as you go, and you can
                keep adding to it until the day is over.
              </Text>
            </View>

            {ready ? null : <Text style={type.caption}>Loading today's check-in…</Text>}

            <BodyMap
              side={side}
              onChangeSide={setSide}
              selected={muscles}
              onToggle={toggle}
              disabled={!ready}
            />

            {error ? <ErrorNote message={error.message} /> : null}
            <SelectionSummary muscles={muscles} saving={saveWorkout.isPending} />
          </Card>

          {finished ? (
            <Button
              label="Resume timer"
              variant="secondary"
              onPress={() => save(muscles, false)}
            />
          ) : (
            <Button
              label="Finish session"
              disabled={!ready}
              onPress={() => save(muscles, true)}
            />
          )}

          <Button
            label="Past workouts"
            variant="secondary"
            onPress={() => router.push('/workouts')}
          />
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </>
      ) : null}
    </ScrollView>
  );
}

function SelectionSummary({
  muscles,
  saving,
}: {
  muscles: MuscleGroup[];
  saving: boolean;
}) {
  if (muscles.length === 0) {
    return (
      <Text style={type.caption}>
        Nothing logged yet — this day will show as a visit without a workout.
      </Text>
    );
  }
  return (
    <Text style={type.caption}>
      {muscles.length} {muscles.length === 1 ? 'area' : 'areas'} logged
      {saving ? ' · saving…' : ' · saved'}
    </Text>
  );
}

function NotCheckedIn({ onBack }: { onBack: () => void }) {
  return (
    <Card style={{ gap: spacing(1.5) }}>
      <Text style={type.heading}>You haven't checked in today</Text>
      <Text style={type.caption}>
        The session clock starts from your check-in, so check in on the membership
        screen first and this will pick up from there.
      </Text>
      <Button label="Back" variant="secondary" onPress={onBack} />
    </Card>
  );
}
