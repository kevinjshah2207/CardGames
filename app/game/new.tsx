import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { Button } from '@/components/Button';

export default function NewGameScreen() {
  const router = useRouter();
  const createGame = useGameStore((s) => s.createGame);
  const [players, setPlayers] = useState<string[]>(['', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const addPlayer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayers((p) => [...p, '']);
    setTimeout(() => inputRefs.current[players.length]?.focus(), 100);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayers((p) => p.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, name: string) => {
    setPlayers((p) => p.map((n, i) => (i === index ? name : n)));
  };

  const filledPlayers = players.filter((n) => n.trim().length > 0);

  const startGame = () => {
    if (filledPlayers.length < 2) {
      Alert.alert('Need players', 'Add at least 2 player names to start.');
      return;
    }
    const id = createGame(filledPlayers);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/game/${id}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'New Game' }} />
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
            {players.length > 5 && (
              <View style={styles.deckHint}>
                <Text style={styles.deckHintText}>🃏 6+ players — remember to use 2 decks!</Text>
              </View>
            )}

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
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={`Start Game  (${filledPlayers.length} players)`}
              onPress={startGame}
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
  container: { padding: spacing.md, paddingTop: spacing.lg },
  heading: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  deckHint: {
    backgroundColor: colors.accent + '22',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deckHintText: { fontSize: 14, color: colors.accent, fontWeight: '600' },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  playerIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger + '22',
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: { padding: spacing.md, paddingBottom: spacing.lg },
  startBtn: { width: '100%' },
});
