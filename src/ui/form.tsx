import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors, radius, spacing, type } from './theme';

export type Choice<T extends string> = { value: T; label: string };

/** Pill selector for the app's small enums. Shows the friendly label, stores the exact enum. */
export function ChoiceGroup<T extends string>({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: Choice<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <View style={{ gap: spacing(1) }}>
      <Text style={type.label}>{label.toUpperCase()}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) }}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={choice.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              // Tapping the selected pill clears it — the API takes null to reset.
              onPress={() => onChange(selected ? null : choice.value)}
              style={{
                paddingVertical: spacing(1.25),
                paddingHorizontal: spacing(2),
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? 'rgba(61,220,151,0.14)' : colors.surface,
              }}
            >
              <Text
                style={{
                  ...type.body,
                  fontSize: 15,
                  color: selected ? colors.accent : colors.text,
                  fontWeight: selected ? '700' : '400',
                }}
              >
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const GENDER_CHOICES: Choice<'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED'>[] = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'UNDISCLOSED', label: 'Prefer not to say' },
];

export const GOAL_CHOICES: Choice<
  'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'GENERAL_FITNESS' | 'ENDURANCE' | 'REHAB'
>[] = [
  { value: 'WEIGHT_LOSS', label: 'Lose weight' },
  { value: 'MUSCLE_GAIN', label: 'Build muscle' },
  { value: 'GENERAL_FITNESS', label: 'General fitness' },
  { value: 'ENDURANCE', label: 'Endurance' },
  { value: 'REHAB', label: 'Rehab / recovery' },
];

export const ACTIVITY_CHOICES: Choice<'BEGINNER' | 'OCCASIONAL' | 'REGULAR'>[] = [
  { value: 'BEGINNER', label: 'Just starting out' },
  { value: 'OCCASIONAL', label: 'Occasional' },
  { value: 'REGULAR', label: 'Regular' },
];
