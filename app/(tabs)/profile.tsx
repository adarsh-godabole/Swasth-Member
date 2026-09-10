import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../../src/api/client';
import { usersApi } from '../../src/api/endpoints';
import { useMe } from '../../src/api/queries';
import { useAuth } from '../../src/auth/AuthContext';
import { activityLabel, formatDate, genderLabel, goalLabel } from '../../src/lib/format';
import { Button, Card, ErrorNote } from '../../src/ui/components';
import { TAB_BAR_HEIGHT, colors, spacing, type } from '../../src/ui/theme';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const me = useMe();
  const { signOut } = useAuth();

  const deleteAccount = useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: () => signOut(),
    onError: (error: ApiError) =>
      Alert.alert("Couldn't delete your account", error.message),
  });

  const confirmDelete = () =>
    Alert.alert(
      'Delete your account?',
      'This removes your profile and membership details from the app. It cannot be undone — talk to the front desk if you only want to pause your membership.',
      [
        { text: 'Keep my account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccount.mutate(),
        },
      ],
    );

  const error = me.error as ApiError | null;
  const membership = me.data?.membership;

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
          refreshing={me.isRefetching}
          onRefresh={me.refetch}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={type.title}>{me.data?.fullName ?? 'Your profile'}</Text>
      <Text style={type.caption}>{me.data?.phone ?? ''}</Text>

      {me.isLoading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <ErrorNote message={error.message} /> : null}

      {/* The front desk asks for this, so it gets its own card. */}
      {membership?.memberCode ? (
        <Card style={{ gap: spacing(0.5) }}>
          <Text style={type.label}>MEMBER CODE</Text>
          <Text style={{ ...type.title, letterSpacing: 2 }}>{membership.memberCode}</Text>
          <Text style={type.caption}>Show this at the front desk.</Text>
        </Card>
      ) : null}

      {me.data ? (
        <Card style={{ gap: spacing(1.5) }}>
          <Text style={type.heading}>About you</Text>
          <Row label="Name" value={me.data.fullName} />
          <Row label="Email" value={me.data.email} />
          <Row label="Gender" value={genderLabel(me.data.gender)} />
          <Row label="Date of birth" value={formatDate(me.data.dateOfBirth)} />
          <Row label="Height" value={me.data.heightCm ? `${me.data.heightCm} cm` : null} />
          <Row label="Weight" value={me.data.weightKg ? `${me.data.weightKg} kg` : null} />
          <Row label="City" value={me.data.city} />
        </Card>
      ) : null}

      {membership ? (
        <Card style={{ gap: spacing(1.5) }}>
          <Text style={type.heading}>Training</Text>
          <Row label="Goal" value={goalLabel(membership.goal)} />
          <Row label="Activity level" value={activityLabel(membership.activityLevel)} />
          <Row label="Medical notes" value={membership.medicalNotes} />
          <Row label="Emergency contact" value={membership.emergencyContactName} />
          <Row label="Emergency phone" value={membership.emergencyContactPhone} />
          <Row label="Member since" value={formatDate(membership.joinedAt)} />
        </Card>
      ) : null}

      <Button label="Edit profile" onPress={() => router.push('/edit-profile')} />
      <Button label="Log out" variant="secondary" onPress={() => signOut()} />
      <Button
        label="Delete my account"
        variant="danger"
        loading={deleteAccount.isPending}
        onPress={confirmDelete}
      />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={{ gap: spacing(0.25) }}>
      <Text style={type.label}>{label.toUpperCase()}</Text>
      {/* Never render a null or an "undefined" at a member. */}
      <Text style={value ? type.body : { ...type.body, color: colors.textMuted }}>
        {value || 'Not added yet'}
      </Text>
    </View>
  );
}
