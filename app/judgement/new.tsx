import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/lib/theme';
import { useJudgementStore } from '@/lib/judgement-store';
import { Button } from '@/components/Button';

export default function NewJudgementSession() {
  const router = useRouter();
  const createSession = useJudgementStore((s) => s.createSession);

  const [players, setPlayers] = useState<string[]>(['', '']);
  const [firstDealerIndex, setFirstDealerIndex] = useState(0);
  const [startFromMax, setStartFromMax] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const filledPlayers = players.filter((n) => n.trim().length > 0);
  const maxCards = filledPlayers.length >= 2 ? Math.floor(52 / filledPlayers.length) : null;
  const showSettings = filledPlayers.length >= 2;

  const addPlayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayers((p) => [...p, '']);
    setTimeout(() => inputRefs.current[players.length]?.focus(), 100);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayers((p) => p.filter((_, i) => i !== index));
    if (firstDealerIndex >= players.length - 1) setFirstDealerIndex(0);
  };

  const updatePlayer = (index: number, name: string) => {
    setPlayers((p) => p.map((n, i) => (i === index ? name : n)));
  };

  const startSession = () => {
    if (filledPlayers.length < 2) return;
    const id = createSession(filledPlayers, firstDealerIndex, startFromMax);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/judgement/${id}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Session' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={88}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.heading}>Who's playing?</Text>

            {players.map((name, i) => (
              <View key={i} style={styles.playerRow}>
                <View style={styles.playerIndex}>
                  <Text style={styles.playerIndexText}>{i + 1}</Text>
                </View>
                <TextInput
                  ref={(r) => { inputRefs.current[i] = r; }}
                  style={styles.input}
                  value={name}
                  onChangeText={(t) => updatePlayer(i, t)}
                  placeholder={`Player ${i + 1}`}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType={i === players.length - 1 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (i === players.length - 1) addPlayer();
                    else inputRefs.current[i + 1]?.focus();
                  }}
                  autoFocus={i === 0}
                  maxLength={20}
                />
                {players.length > 2 && (
                  <TouchableOpacity onPress={() => removePlayer(i)} style={styles.removeBtn} activeOpacity={0.7}>
                    <Text style={styles.removeIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addPlayer} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>＋  Add Player</Text>
            </TouchableOpacity>

            {showSettings && (
              <View style={styles.settings}>
                <Text style={styles.settingsHeading}>Settings</Text>

                <Text style={styles.settingsLabel}>First Dealer</Text>
                <View style={styles.chipRow}>
                  {filledPlayers.map((name, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.chip, firstDealerIndex === i && styles.chipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFirstDealerIndex(i);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, firstDealerIndex === i && styles.chipTextActive]}>
                        {name.trim()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.settingsLabel}>Starting Card Count</Text>
                {maxCards && (
                  <Text style={styles.maxCardsHint}>
                    Max per player = 52 ÷ {filledPlayers.length} = {maxCards} cards
                  </Text>
                )}
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, styles.chipWide, !startFromMax && styles.chipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStartFromMax(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, !startFromMax && styles.chipTextActive]}>
                      From 1 card
                    </Text>
                    <Text style={[styles.chipSubText, !startFromMax && styles.chipTextActive]}>
                      1 → {maxCards} → 1
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chip, styles.chipWide, startFromMax && styles.chipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStartFromMax(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, startFromMax && styles.chipTextActive]}>
                      From max
                    </Text>
                    <Text style={[styles.chipSubText, startFromMax && styles.chipTextActive]}>
                      {maxCards} → 1
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={`Start Session  (${filledPlayers.length} players)`}
              onPress={startSession}
              disabled={filledPlayers.length < 2}
              style={styles.startBtn}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingTop: spacing.lg, paddingBottom: 20 },
  heading: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  playerIndex: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  playerIndexText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  removeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.danger + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  removeIcon: { fontSize: 13, color: colors.danger, fontWeight: '700' },
  addBtn: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  settings: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  settingsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  settingsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  maxCardsHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm, marginTop: -4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipWide: { flex: 1 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipSubText: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  chipTextActive: { color: '#fff' },
  footer: { padding: spacing.md, paddingBottom: spacing.lg },
  startBtn: { width: '100%' },
});
