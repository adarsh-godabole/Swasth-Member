import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import { useWorkoutHistory, useWorkoutSummary } from '../src/api/queries';
import type { MuscleGroupTally, Workout } from '../src/api/types';
import { Chip } from '../src/features/workouts/BodyMap';
import { muscleLabel } from '../src/features/workouts/muscles';
import { formatGymDay, formatMinutes } from '../src/lib/format';
import { Button, Card, ErrorNote } from '../src/ui/components';
import { colors, radius, spacing, type } from '../src/ui/theme';

const WINDOW_DAYS = 30;

/**
 * Everything the member has trained, newest first, plus what the last month
 * adds up to.
 *
 * The rollup is the point of the screen: a list of days tells you what you did,
 * but the tally tells you what you have been quietly skipping. It is computed
 * server-side over the gym's days, so it agrees with the visit history.
 */
export default function Workouts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const history = useWorkoutHistory(30);
  const summary = useWorkoutSummary(WINDOW_DAYS);
  const entries = history.data ?? [];

  const error = history.error as ApiError | null;
  const tally = summary.data?.muscleGroups ?? [];
  const busiest = tally[0]?.days ?? 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing(3),
        paddingTop: insets.top + spacing(3),
        paddingBottom: insets.bottom + spacing(4),
        gap: spacing(2),
      }}
      refreshControl={
        <RefreshControl
          refreshing={history.isRefetching}
          onRefresh={history.refetch}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={type.title}>Past workouts</Text>
      {summary.data?.sessionsLogged ? (
        <Text style={type.caption}>
          {summary.data.sessionsLogged} sessions
          {summary.data.minutesTrained
            ? ` · ${formatMinutes(summary.data.minutesTrained)} trained`
            : ''}{' '}
          in the last {WINDOW_DAYS} days
        </Text>
      ) : null}

      {history.isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <ErrorNote message={error.message} /> : null}

      {!history.isLoading && entries.length === 0 ? (
        <Card style={{ gap: spacing(1) }}>
          <Text style={type.heading}>Nothing logged yet</Text>
          <Text style={type.caption}>
            Next time you check in, pick the muscles you're training on the body
            map and the day will show up here.
          </Text>
        </Card>
      ) : null}

      {tally.length > 0 ? (
        <Card style={{ gap: spacing(1.5) }}>
          <Text style={type.heading}>Last {WINDOW_DAYS} days</Text>
          <Text style={type.caption}>Days you trained each area.</Text>
          {tally.map((row) => (
            <TallyRow key={row.muscleGroup} row={row} busiest={busiest} />
          ))}
        </Card>
      ) : null}

      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}

      {entries.length >= 30 ? (
        <Text style={type.caption}>Showing your last 30 logged days.</Text>
      ) : null}

      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

function TallyRow({ row, busiest }: { row: MuscleGroupTally; busiest: number }) {
  const share = busiest > 0 ? row.days / busiest : 0;
  return (
    <View style={{ gap: spacing(0.5) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ ...type.body, fontSize: 15 }}>{muscleLabel(row.muscleGroup)}</Text>
        <Text style={type.caption}>
          {row.days} {row.days === 1 ? 'day' : 'days'}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.max(6, Math.round(share * 100))}%`,
            height: '100%',
            backgroundColor: colors.accent,
          }}
        />
      </View>
    </View>
  );
}

function EntryCard({ entry }: { entry: Workout }) {
  return (
    <Card style={{ gap: spacing(1.25) }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={type.heading}>{formatGymDay(entry.date) ?? entry.date}</Text>
        {/* No check-out endpoint exists, so a session the member never ended
            simply has no length — better than inventing one. */}
        <Text style={type.caption}>
          {formatMinutes(entry.durationMinutes) ?? 'Not finished'}
        </Text>
      </View>

      {entry.muscleGroups.length === 0 ? (
        <Text style={type.caption}>Checked in, nothing logged.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) }}>
          {entry.muscleGroups.map((muscle) => (
            <Chip key={muscle} label={muscleLabel(muscle)} selected />
          ))}
        </View>
      )}
    </Card>
  );
}
