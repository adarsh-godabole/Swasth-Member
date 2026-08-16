import React from 'react';
import { Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../src/api/client';
import { useGym, useMe } from '../../src/api/queries';
import type { Me, Subscription } from '../../src/api/types';
import { CheckInCard } from '../../src/features/CheckInCard';
import { useServerWaking } from '../../src/hooks/useServerWaking';
import {
  coverageDate,
  firstName,
  formatDate,
  formatRupees,
  remainingLabel,
} from '../../src/lib/format';
import { Button, Card, ErrorNote } from '../../src/ui/components';
import { colors, spacing, type } from '../../src/ui/theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const gym = useGym();
  const waking = useServerWaking();

  const error = me.error as ApiError | null;

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
          refreshing={me.isRefetching}
          onRefresh={me.refetch}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={type.label}>
        {firstName(me.data?.fullName ?? null) ? `HI, ${firstName(me.data!.fullName)!.toUpperCase()}` : 'WELCOME'}
      </Text>
      <Text style={{ ...type.title }}>{gym.data?.name ?? 'Your gym'}</Text>

      {waking && me.isLoading ? (
        <Text style={type.caption}>Waking up the gym's server…</Text>
      ) : null}

      {error ? <ErrorNote message={error.message} /> : null}

      {me.data ? <MembershipCard me={me.data} /> : null}

      {/* Directly under the membership card — it's the daily action. */}
      {me.data?.membership?.role === 'MEMBER' ? (
        <CheckInCard subscription={me.data.subscription} />
      ) : null}

      {gym.data?.phone ? (
        <Card style={{ gap: spacing(1.5) }}>
          <Text style={type.heading}>{gym.data.name}</Text>
          <Text style={type.caption}>
            {[gym.data.addressLine1, gym.data.addressLine2, gym.data.city, gym.data.pincode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          <Button
            label="Call the gym"
            variant="secondary"
            onPress={() => Linking.openURL(`tel:${gym.data!.phone}`)}
          />
        </Card>
      ) : null}
    </ScrollView>
  );
}

function MembershipCard({ me }: { me: Me }) {
  // A trainer or admin logging in simply has no membership card.
  if (me.membership && me.membership.role !== 'MEMBER') {
    return (
      <Card style={{ gap: spacing(1) }}>
        <Text style={type.heading}>Staff account</Text>
        <Text style={type.caption}>
          You're signed in as gym staff. Membership details are for members only.
        </Text>
      </Card>
    );
  }

  const sub = me.subscription;
  if (!sub) return <NoSubscriptionCard />;

  const expired = sub.status === 'EXPIRED' || sub.status === 'CANCELLED';

  return (
    <Card style={{ gap: spacing(1.5) }}>
      <Text style={type.label}>{sub.planName ?? 'MEMBERSHIP'}</Text>

      {sub.status === 'UPCOMING' ? (
        <>
          <Text style={type.title}>Starts {formatDate(sub.startDate) ?? 'soon'}</Text>
          <Text style={type.caption}>Your plan is paid for and ready to go.</Text>
        </>
      ) : expired ? (
        <>
          <Text style={{ ...type.title, color: colors.warning }}>
            {sub.status === 'EXPIRED' ? 'Membership expired' : 'Membership cancelled'}
          </Text>
          <Text style={type.caption}>
            {sub.status === 'EXPIRED'
              ? `Ended ${formatDate(sub.endDate) ?? 'recently'}. Renew at the front desk to pick up where you left off.`
              : 'This plan was cancelled by the gym. Talk to the front desk to start again.'}
          </Text>
        </>
      ) : (
        <>
          <Text style={type.hero}>{Math.max(sub.daysRemaining, 0)}</Text>
          <Text style={type.heading}>{remainingLabel(sub)}</Text>
          <Text style={type.caption}>
            {sub.hasRenewalQueued
              ? `Covered until ${coverageDate(sub)} — your renewal is already queued.`
              : `Valid until ${coverageDate(sub) ?? '—'}`}
          </Text>
        </>
      )}

      {sub.balance > 0 ? (
        <Text style={{ ...type.caption, color: colors.warning }}>
          {formatRupees(sub.balance)} due at the desk.
        </Text>
      ) : null}
    </Card>
  );
}

/** Every brand-new app signup lands here — it deserves as much care as the happy path. */
function NoSubscriptionCard() {
  return (
    <Card style={{ gap: spacing(1.5) }}>
      <Text style={type.heading}>You don't have a plan yet</Text>
      <Text style={type.caption}>
        Memberships are bought at the front desk — cash or card, no payment in the
        app. Take a look at the price list, then drop by or give the gym a call.
      </Text>
    </Card>
  );
}
