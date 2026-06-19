import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, fonts } from '@/lib/theme';

interface Props {
  value: number;
  min?: number;
  max: number;
  onChange: (val: number) => void;
  forbidden?: number | null;
}

export function Stepper({ value, min = 0, max, onChange, forbidden }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bump = () => {
    scale.value = withSequence(
      withSpring(1.18, { damping: 10, stiffness: 500 }),
      withSpring(1, { damping: 12, stiffness: 400 }),
    );
  };

  const decrement = () => {
    if (value <= min) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bump();
    onChange(value - 1);
  };

  const increment = () => {
    if (value >= max) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bump();
    onChange(value + 1);
  };

  const isForbidden = forbidden !== null && forbidden !== undefined && value === forbidden;

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, value <= min && styles.btnDisabled]}
        onPress={decrement}
        disabled={value <= min}
        hitSlop={8}
      >
        <Text style={[styles.btnText, value <= min && styles.btnTextDisabled]}>−</Text>
      </Pressable>

      <Animated.View style={[styles.valueBox, isForbidden && styles.valueBoxForbidden, animStyle]}>
        <Text style={[styles.valueText, isForbidden && styles.valueTextForbidden]}>
          {value}
        </Text>
      </Animated.View>

      <Pressable
        style={[styles.btn, value >= max && styles.btnDisabled]}
        onPress={increment}
        disabled={value >= max}
        hitSlop={8}
      >
        <Text style={[styles.btnText, value >= max && styles.btnTextDisabled]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.3 },
  btnText: {
    fontSize: 20,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    lineHeight: 24,
    textAlign: 'center',
  },
  btnTextDisabled: { color: colors.textMuted },
  valueBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueBoxForbidden: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '18',
  },
  valueText: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },
  valueTextForbidden: { color: colors.danger },
});
