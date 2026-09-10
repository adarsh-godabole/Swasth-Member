import React from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../src/api/client';
import { useGym, usePlans } from '../../src/api/queries';
import type { Plan } from '../../src/api/types';
import { useServerWaking } from '../../src/hooks/useServerWaking';
import { formatRupees } from '../../src/lib/format';
import { Button, Card, ErrorNote } from '../../src/ui/components';
import { TAB_BAR_HEIGHT, colors, spacing, type } from '../../src/ui/theme';

export default function Plans() {
  const insets = useSafeAreaInsets();
  const plans = usePlans();
  const gym = useGym();
  const waking = useServerWaking();

  const error = plans.error as ApiError | null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: spacing(3),
        paddingTop: insets.top + spacing(3),
        paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing(4),
        gap: spacing(2),
      }}
      refreshControl={
        <RefreshControl
          refreshing={plans.isRefetching}
          onRefresh={plans.refetch}
          tintColor={colors.accent}
        />
      }
    >
      <View style={{ gap: spacing(1) }}>
        <Text style={type.title}>Plans & pricing</Text>
        {/* This is a price list, not a checkout — members pay at the desk. */}
        <Text style={type.caption}>
          Memberships are bought at the front desk. Pick what suits you, then drop
          by or call — there's no payment in the app.
        </Text>
      </View>

      {plans.isLoading ? (
        <View style={{ paddingVertical: spacing(6), gap: spacing(1.5), alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
          {waking ? (
            <Text style={type.caption}>Waking up the gym's server… this can take a minute.</Text>
          ) : null}
        </View>
      ) : null}

      {error ? (
        <>
          <ErrorNote message={error.message} />
          <Button label="Try again" variant="secondary" onPress={() => plans.refetch()} />
        </>
      ) : null}

      {plans.data?.length === 0 ? (
        <Card>
          <Text style={type.heading}>No plans listed yet</Text>
          <Text style={{ ...type.caption, marginTop: spacing(1) }}>
            Call the gym and they'll walk you through the current pricing.
          </Text>
        </Card>
      ) : null}

      {plans.data?.map((plan) => <PlanCard key={plan.id} plan={plan} />)}

      {gym.data?.phone ? (
        <Button
          label={`Call ${gym.data.name.split(',')[0]}`}
          onPress={() => Linking.openURL(`tel:${gym.data!.phone}`)}
        />
      ) : null}
    </ScrollView>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Card style={{ gap: spacing(0.75) }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: spacing(1),
        }}
      >
        <Text style={type.heading}>{plan.name}</Text>
        <Text style={{ ...type.heading, color: colors.accent }}>
          {formatRupees(plan.price)}
        </Text>
      </View>
      {/* durationLabel is pre-formatted by the backend. */}
      <Text style={type.label}>{plan.durationLabel.toUpperCase()}</Text>
      {plan.description ? (
        <Text style={{ ...type.caption, marginTop: spacing(0.5) }}>{plan.description}</Text>
      ) : null}
    </Card>
  );
}
