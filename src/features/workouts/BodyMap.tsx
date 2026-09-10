import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MuscleGroup } from '../../api/types';
import { colors, radius, spacing, type } from '../../ui/theme';
import {
  muscleLabel,
  musclesFor,
  OFF_BODY_MUSCLES,
  regionsFor,
  type BodySide,
} from './muscles';

/** Derived from `colors.accent` — RN has no colour-mix, so the tints are literal. */
const SELECTED_FILL = 'rgba(61, 220, 151, 0.32)';
const SELECTED_BORDER = 'rgba(61, 220, 151, 0.9)';

type Props = {
  side: BodySide;
  onChangeSide: (side: BodySide) => void;
  selected: MuscleGroup[];
  onToggle: (muscle: MuscleGroup) => void;
  disabled?: boolean;
};

/**
 * The body map: tap a muscle on the figure to log that you trained it today.
 *
 * Deliberately built from plain Views rather than SVG — `react-native-svg` is
 * not in the dependency graph and the one attempt at adding a package to this
 * project (`@expo/vector-icons`) lost to a peer conflict with the pinned React.
 * The figure is laid out in percentages inside a fixed-ratio box, so it scales
 * to any handset without a measurement pass.
 *
 * The chips underneath are not decoration: a coloured blob never tells you
 * whether it is a lat or a trap, so every muscle is reachable by name too, and
 * the chips are what a screen reader gets a usable list from.
 */
export function BodyMap({ side, onChangeSide, selected, onToggle, disabled }: Props) {
  const isOn = (muscle: MuscleGroup) => selected.includes(muscle);

  return (
    <View style={{ gap: spacing(2) }}>
      <View style={styles.sideToggle}>
        {(['FRONT', 'BACK'] as BodySide[]).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: side === option }}
            onPress={() => onChangeSide(option)}
            style={[styles.sideTab, side === option && styles.sideTabActive]}
          >
            <Text
              style={[
                { ...type.label, color: colors.textMuted },
                side === option && { color: colors.text },
              ]}
            >
              {option === 'FRONT' ? 'FRONT' : 'BACK'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.figure}>
        {/* A silhouette behind the taps, so the regions read as a body and not
            as scattered buttons. */}
        <View style={[styles.silhouette, { left: '41%', top: '0.5%', width: '18%', height: '9%', borderRadius: 999 }]} />
        <View style={[styles.silhouette, { left: '30%', top: '10%', width: '40%', height: '30%', borderRadius: 26 }]} />
        <View style={[styles.silhouette, { left: '30%', top: '38%', width: '19%', height: '42%', borderRadius: 22 }]} />
        <View style={[styles.silhouette, { left: '51%', top: '38%', width: '19%', height: '42%', borderRadius: 22 }]} />

        {regionsFor(side).map((region, index) => {
          const on = isOn(region.id);
          return (
            <Pressable
              key={`${region.id}-${index}`}
              accessibilityRole="checkbox"
              accessibilityLabel={muscleLabel(region.id)}
              accessibilityState={{ checked: on, disabled: !!disabled }}
              onPress={disabled ? undefined : () => onToggle(region.id)}
              style={({ pressed }) => [
                styles.region,
                {
                  left: `${region.left}%`,
                  top: `${region.top}%`,
                  width: `${region.width}%`,
                  height: `${region.height}%`,
                  borderRadius: region.radius,
                },
                on && { backgroundColor: SELECTED_FILL, borderColor: SELECTED_BORDER },
                pressed && !disabled && { opacity: 0.7 },
                disabled && { opacity: 0.5 },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.chipWrap}>
        {musclesFor(side).map((muscle) => (
          <Chip
            key={muscle}
            label={muscleLabel(muscle)}
            selected={isOn(muscle)}
            disabled={disabled}
            onPress={() => onToggle(muscle)}
          />
        ))}
      </View>

      <View style={{ gap: spacing(1) }}>
        <Text style={type.label}>ANYTHING ELSE</Text>
        <View style={styles.chipWrap}>
          {OFF_BODY_MUSCLES.map((muscle) => (
            <Chip
              key={muscle}
              label={muscleLabel(muscle)}
              selected={isOn(muscle)}
              disabled={disabled}
              onPress={() => onToggle(muscle)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const readOnly = !onPress || disabled;
  return (
    <Pressable
      accessibilityRole={readOnly ? 'text' : 'checkbox'}
      accessibilityState={readOnly ? undefined : { checked: !!selected }}
      onPress={readOnly ? undefined : onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: SELECTED_FILL, borderColor: SELECTED_BORDER },
        pressed && !readOnly && { opacity: 0.75 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text
        style={[
          { ...type.body, fontSize: 14 },
          !selected && { color: colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sideToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: spacing(0.5),
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sideTab: {
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
  },
  sideTabActive: { backgroundColor: colors.surface },
  figure: {
    width: '100%',
    maxWidth: 250,
    aspectRatio: 0.52,
    alignSelf: 'center',
  },
  silhouette: {
    position: 'absolute',
    backgroundColor: colors.surfaceAlt,
    opacity: 0.55,
  },
  region: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  chip: {
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.75),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
});
