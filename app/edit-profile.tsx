import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import { useMe, useUpdateMe } from '../src/api/queries';
import {
  buildPatch,
  formFromMe,
  validate,
  type ProfileForm,
} from '../src/lib/profileForm';
import { Button, ErrorNote, Field } from '../src/ui/components';
import {
  ACTIVITY_CHOICES,
  ChoiceGroup,
  GENDER_CHOICES,
  GOAL_CHOICES,
} from '../src/ui/form';
import { colors, spacing, type } from '../src/ui/theme';

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const update = useUpdateMe();

  const original = useMemo(() => formFromMe(me.data), [me.data]);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const current = form ?? original;

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm({ ...current, [key]: value });

  const errors = validate(current);
  const hasErrors = Object.keys(errors).length > 0;

  const save = () => {
    if (hasErrors) return;
    const patch = buildPatch(current, original);
    if (Object.keys(patch).length === 0) {
      router.back();
      return;
    }
    update.mutate(patch, { onSuccess: () => router.back() });
  };

  const error = update.error as ApiError | null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing(3),
          paddingTop: insets.top + spacing(3),
          paddingBottom: insets.bottom + spacing(4),
          gap: spacing(2.5),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={type.title}>Edit profile</Text>

        <Field
          label="Full name"
          value={current.fullName}
          onChangeText={(v) => set('fullName', v)}
          placeholder="Rohit Sharma"
          error={errors.fullName}
        />
        <Field
          label="Email"
          value={current.email}
          onChangeText={(v) => set('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
          error={errors.email}
        />
        <ChoiceGroup
          label="Gender"
          choices={GENDER_CHOICES}
          value={current.gender}
          onChange={(v) => set('gender', v)}
        />
        <Field
          label="Date of birth"
          value={current.dateOfBirth}
          onChangeText={(v) => set('dateOfBirth', v)}
          placeholder="1995-04-17"
          hint="YYYY-MM-DD"
          error={errors.dateOfBirth}
        />
        <View style={{ flexDirection: 'row', gap: spacing(2) }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Height (cm)"
              value={current.heightCm}
              onChangeText={(v) => set('heightCm', v)}
              keyboardType="decimal-pad"
              placeholder="175"
              error={errors.heightCm}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Weight (kg)"
              value={current.weightKg}
              onChangeText={(v) => set('weightKg', v)}
              keyboardType="decimal-pad"
              placeholder="72"
              error={errors.weightKg}
            />
          </View>
        </View>
        <Field
          label="City"
          value={current.city}
          onChangeText={(v) => set('city', v)}
          placeholder="Bengaluru"
          error={errors.city}
        />

        <ChoiceGroup
          label="Goal"
          choices={GOAL_CHOICES}
          value={current.goal}
          onChange={(v) => set('goal', v)}
        />
        <ChoiceGroup
          label="How active are you?"
          choices={ACTIVITY_CHOICES}
          value={current.activityLevel}
          onChange={(v) => set('activityLevel', v)}
        />
        <Field
          label="Medical notes"
          value={current.medicalNotes}
          onChangeText={(v) => set('medicalNotes', v)}
          placeholder="Injuries or conditions your trainer should know about"
          multiline
          style={{ minHeight: 100, paddingTop: spacing(1.5), textAlignVertical: 'top' }}
          error={errors.medicalNotes}
        />
        <Field
          label="Emergency contact"
          value={current.emergencyContactName}
          onChangeText={(v) => set('emergencyContactName', v)}
          placeholder="Name"
        />
        <Field
          label="Emergency phone"
          value={current.emergencyContactPhone}
          onChangeText={(v) => set('emergencyContactPhone', v)}
          keyboardType="phone-pad"
          placeholder="+919812345678"
        />

        {error ? <ErrorNote message={error.message} /> : null}

        <Button
          label="Save changes"
          onPress={save}
          disabled={hasErrors}
          loading={update.isPending}
        />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
