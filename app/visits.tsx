import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import { useCheckInHistory, useCheckInSummary } from '../src/api/queries';
import { formatGymDay, formatTime } from '../src/lib/format';
import { Button, Card, ErrorNote } from '../src/ui/components';
import { colors, spacing, type } from '../src/ui/theme';

export default function Visits() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const history = useCheckInHistory(30);
  const summary = useCheckInSummary();

  const error = history.error as ApiError | null;

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
      <Text style={type.title}>Your visits</Text>
      {summary.data ? (
        <Text style={type.caption}>
          {summary.data.totalVisits} total · {summary.data.visitsThisMonth} this month ·
          longest streak {summary.data.longestStreak}
        </Text>
      ) : null}

      {history.isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <ErrorNote message={error.message} /> : null}

      {history.data?.length === 0 ? (
        <Card style={{ gap: spacing(1) }}>
          <Text style={type.heading}>No visits yet</Text>
          <Text style={type.caption}>
            Check in from the membership screen next time you're at the gym and
            it'll show up here.
          </Text>
        </Card>
      ) : null}

      {history.data?.map((visit) => (
        <View
          key={visit.id}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: spacing(1.5),
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {/* The gym's day, not the device's. */}
          <Text style={type.body}>{formatGymDay(visit.date) ?? '—'}</Text>
          <Text style={type.caption}>{formatTime(visit.checkedInAt) ?? ''}</Text>
        </View>
      ))}

      {history.data && history.data.length >= 30 ? (
        <Text style={type.caption}>Showing your last 30 visits.</Text>
      ) : null}

      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}
