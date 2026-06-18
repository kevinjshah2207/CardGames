import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { computeRoundScores, getCumulatives } from '@/lib/scoring';
import { Button } from '@/components/Button';

export default function RoundScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const game = useGameStore((s) => s.getGame(id));
  const addRound = useGameStore((s) => s.addRound);

  const [declarerId, setDeclarerId] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<string, string>>({});

  if (!game) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Game not found</Text>
      </View>
    );
  }

  const setTotal = (playerId: string, val: string) => {
    setTotals((t) => ({ ...t, [playerId]: val.replace(/[^0-9]/g, '') }));
  };

  // Live preview — only compute when all entries are filled and declarer is set
  const allFilled = game.players.every(
    (p) => totals[p.id] !== undefined && totals[p.id] !== ''
  );

  const preview = useMemo(() => {
    if (!declarerId || !allFilled) return null;
    try {
      const entries = game.players.map((p) => ({
        playerId: p.id,
        handTotal: parseInt(totals[p.id], 10),
      }));
      const prevCumulatives = getCumulatives(game.rounds, game.players.map((p) => p.id));
      const scores = computeRoundScores({ entries, declarerId, previousCumulatives: prevCumulatives });
      return scores;
    } catch {
      return null;
    }
  }, [declarerId, totals, allFilled, game]);

  const previewMap = useMemo(() => {
    if (!preview) return {};
    return Object.fromEntries(preview.map((s) => [s.playerId, s]));
  }, [preview]);

  const declarerPreview = declarerId ? previewMap[declarerId] : null;
  const declarerWon = declarerPreview
    ? declarerPreview.roundScore === 0
    : null;

  const canConfirm = !!declarerId && allFilled;

  const handleConfirm = () => {
    if (!declarerId || !allFilled) return;
    const entries = game.players.map((p) => ({
      playerId: p.id,
      handTotal: parseInt(totals[p.id], 10),
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addRound(game.id, declarerId, entries);
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Enter Round' }} />
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
            {/* Declarer selection */}
            <Text style={styles.sectionLabel}>Who declared?</Text>
            <View style={styles.declarerRow}>
              {game.players.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.declarerChip,
                    declarerId === p.id && styles.declarerChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDeclarerId(p.id);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.declarerChipText,
                      declarerId === p.id && styles.declarerChipTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hand totals */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Hand totals</Text>
            <Text style={styles.hint}>J=0  ·  A=1  ·  2–10=face  ·  Q/K=10</Text>

            {game.players.map((p) => {
              const ps = previewMap[p.id];
              const isDeclarer = p.id === declarerId;
              return (
                <View key={p.id} style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <Text style={[styles.entryName, isDeclarer && styles.entryNameDeclarer]}>
                      {p.name}{isDeclarer ? ' 🎯' : ''}
                    </Text>
                    {ps && (
                      <View style={styles.previewPill}>
                        <Text style={[
                          styles.previewDelta,
                          ps.roundScore === 0 ? styles.green : undefined,
                          isDeclarer && !declarerWon ? styles.red : undefined,
                        ]}>
                          +{ps.roundScore} → {ps.cumulativeScore}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.totalInput,
                      isDeclarer && styles.totalInputDeclarer,
                    ]}
                    value={totals[p.id] ?? ''}
                    onChangeText={(v) => setTotal(p.id, v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    maxLength={3}
                  />
                </View>
              );
            })}

            {/* Live result summary */}
            {preview && declarerWon !== null && (
              <View style={[styles.resultBanner, declarerWon ? styles.resultWin : styles.resultLose]}>
                <Text style={[styles.resultText, declarerWon ? styles.resultWinText : styles.resultLoseText]}>
                  {declarerWon
                    ? `✅ ${game.players.find((p) => p.id === declarerId)?.name} wins the declare!`
                    : `❌ ${game.players.find((p) => p.id === declarerId)?.name} loses the declare — penalty: ${declarerPreview?.roundScore} pts`}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="Confirm Round"
              onPress={handleConfirm}
              disabled={!canConfirm}
              style={styles.confirmBtn}
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
  container: { padding: spacing.md, paddingBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm, marginTop: -4 },
  declarerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  declarerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  declarerChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  declarerChipText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  declarerChipTextActive: { color: '#fff' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  entryLeft: { flex: 1 },
  entryName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  entryNameDeclarer: { color: colors.primaryLight },
  previewPill: { marginTop: 2 },
  previewDelta: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  green: { color: colors.success },
  red: { color: colors.danger },
  totalInput: {
    width: 72,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  totalInputDeclarer: { borderColor: colors.primary },
  resultBanner: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  resultWin: { backgroundColor: colors.success + '20' },
  resultLose: { backgroundColor: colors.danger + '20' },
  resultText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  resultWinText: { color: colors.success },
  resultLoseText: { color: colors.danger },
  footer: { padding: spacing.md, paddingBottom: spacing.lg },
  confirmBtn: { width: '100%' },
});
