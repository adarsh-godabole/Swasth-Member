import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '../src/api/client';
import { useCompleteOnboarding, useMe, useUpdateMe } from '../src/api/queries';
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
import { colors, radius, spacing, type } from '../src/ui/theme';

const STEPS = [
  { title: 'Who are you?', caption: 'So the gym knows who walks in.' },
  { title: 'Your body basics', caption: 'Used to track progress later. Rough numbers are fine.' },
  { title: 'What are you here for?', caption: 'Helps the trainers point you the right way.' },
  { title: 'Safety first', caption: 'Only the gym staff see this.' },
] as const;

/**
 * A few questions per screen, all skippable. Each step saves what changed via
 * PATCH /users/me, so a member who drops out halfway keeps their answers. The
 * last step calls POST /users/me/onboarding/complete.
 */
export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const update = useUpdateMe();
  const complete = useCompleteOnboarding();

  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<ProfileForm>(() => formFromMe(undefined));
  const [form, setForm] = useState<ProfileForm>(() => formFromMe(undefined));

  // Seed both copies once the profile arrives (desk-registered members already
  // have answers on file).
  useEffect(() => {
    if (!me.data) return;
    const initial = formFromMe(me.data);
    setSaved(initial);
    setForm(initial);
  }, [me.data]);

  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors = validate(form);
  const stepFields: (keyof ProfileForm)[][] = [
    ['fullName', 'gender', 'dateOfBirth'],
    ['heightCm', 'weightKg', 'city'],
    ['goal', 'activityLevel'],
    ['medicalNotes', 'emergencyContactName', 'emergencyContactPhone'],
  ];
  const stepHasErrors = stepFields[step].some((field) => errors[field]);

  const finish = async () => {
    await complete.mutateAsync();
    router.replace('/home');
  };

  const advance = async (skip: boolean) => {
    const last = step === STEPS.length - 1;

    if (!skip) {
      const patch = buildPatch(form, saved);
      if (Object.keys(patch).length > 0) {
        await update.mutateAsync(patch);
        setSaved(form);
      }
    }

    if (last) {
      await finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const busy = update.isPending || complete.isPending;
  const error = (update.error ?? complete.error) as ApiError | null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          padding: spacing(3),
          paddingTop: insets.top + spacing(4),
          paddingBottom: insets.bottom + spacing(3),
          gap: spacing(2.5),
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', gap: spacing(0.75) }}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: index <= step ? colors.accent : colors.border,
              }}
            />
          ))}
        </View>

        <View style={{ gap: spacing(0.75) }}>
          <Text style={type.title}>{STEPS[step].title}</Text>
          <Text style={type.caption}>{STEPS[step].caption}</Text>
        </View>

        <View style={{ flex: 1, gap: spacing(2.5) }}>
          {step === 0 ? (
            <>
              <Field
                label="Full name"
                value={form.fullName}
                onChangeText={(v) => set('fullName', v)}
                placeholder="Rohit Sharma"
                error={errors.fullName}
                autoFocus
              />
              <ChoiceGroup
                label="Gender"
                choices={GENDER_CHOICES}
                value={form.gender}
                onChange={(v) => set('gender', v)}
              />
              <Field
                label="Date of birth"
                value={form.dateOfBirth}
                onChangeText={(v) => set('dateOfBirth', v)}
                placeholder="1995-04-17"
                hint="YYYY-MM-DD"
                error={errors.dateOfBirth}
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <View style={{ flexDirection: 'row', gap: spacing(2) }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Height (cm)"
                    value={form.heightCm}
                    onChangeText={(v) => set('heightCm', v)}
                    keyboardType="decimal-pad"
                    placeholder="175"
                    error={errors.heightCm}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Weight (kg)"
                    value={form.weightKg}
                    onChangeText={(v) => set('weightKg', v)}
                    keyboardType="decimal-pad"
                    placeholder="72"
                    error={errors.weightKg}
                  />
                </View>
              </View>
              <Field
                label="City"
                value={form.city}
                onChangeText={(v) => set('city', v)}
                placeholder="Bengaluru"
                error={errors.city}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <ChoiceGroup
                label="Your main goal"
                choices={GOAL_CHOICES}
                value={form.goal}
                onChange={(v) => set('goal', v)}
              />
              <ChoiceGroup
                label="How active are you today?"
                choices={ACTIVITY_CHOICES}
                value={form.activityLevel}
                onChange={(v) => set('activityLevel', v)}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Field
                label="Medical notes"
                value={form.medicalNotes}
                onChangeText={(v) => set('medicalNotes', v)}
                placeholder="Injuries or conditions your trainer should know about"
                multiline
                style={{ minHeight: 100, paddingTop: spacing(1.5), textAlignVertical: 'top' }}
                error={errors.medicalNotes}
              />
              <Field
                label="Emergency contact"
                value={form.emergencyContactName}
                onChangeText={(v) => set('emergencyContactName', v)}
                placeholder="Name"
              />
              <Field
                label="Emergency phone"
                value={form.emergencyContactPhone}
                onChangeText={(v) => set('emergencyContactPhone', v)}
                keyboardType="phone-pad"
                placeholder="+919812345678"
              />
            </>
          ) : null}
        </View>

        {error ? <ErrorNote message={error.message} /> : null}

        <View style={{ gap: spacing(1) }}>
          <Button
            label={step === STEPS.length - 1 ? 'Finish' : 'Continue'}
            onPress={() => advance(false)}
            disabled={stepHasErrors}
            loading={busy}
          />
          <Button label="Skip for now" variant="ghost" onPress={() => advance(true)} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
