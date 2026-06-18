import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';

export default function RulesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Rules — Declare' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Section title="Overview">
            <RuleText>
              Declare is a card game where players try to keep their hand total as low as possible. When you think you have the lowest total, you declare — but if anyone matches or beats you, you pay a big penalty.
            </RuleText>
          </Section>

          <Section title="Card Values">
            <CardValueTable />
          </Section>

          <Section title="Gameplay">
            <RuleItem number={1} text="Deal cards to all players." />
            <RuleItem number={2} text="On your turn, pick the last discarded card (face-up) OR draw blindly from the middle pile." />
            <RuleItem number={3} text="Discard one card face-up." />
            <RuleItem number={4} text="At any point, if you believe you have the lowest total, you can Declare instead of taking a normal turn." />
          </Section>

          <Section title="Declaring">
            <RuleText>
              When you declare, all players reveal their hands and total up their cards.
            </RuleText>
            <View style={styles.scoringBox}>
              <Text style={styles.scoringTitle}>Declarer WINS</Text>
              <Text style={styles.scoringDesc}>
                Your total is strictly the lowest (or your total is 0, which always wins).
              </Text>
              <View style={styles.scoringResults}>
                <ScoreRow label="Declarer" value="0 pts" highlight="green" />
                <ScoreRow label="Everyone else" value="their hand total" />
              </View>
            </View>
            <View style={[styles.scoringBox, styles.scoringBoxLose]}>
              <Text style={[styles.scoringTitle, styles.scoringTitleLose]}>Declarer LOSES</Text>
              <Text style={styles.scoringDesc}>
                Any other player has a total equal to or lower than yours (exception: if you declared with 0, you cannot lose).
              </Text>
              <View style={styles.scoringResults}>
                <ScoreRow label="Declarer" value="2 × highest total" highlight="red" />
                <ScoreRow label="Lowest non-declarer(s)" value="0 pts" highlight="green" />
                <ScoreRow label="Everyone else" value="their hand total" />
              </View>
            </View>
          </Section>

          <Section title="Winning the Game">
            <RuleText>
              Points accumulate across rounds. The player with the lowest total wins. End the game whenever your group decides.
            </RuleText>
          </Section>

          <Section title="Setup">
            <RuleItem number={1} text="Deal 5 cards to each player at the start of the game." />
            <RuleItem number={2} text="If you hold multiple cards of the same number, you may discard the entire set and draw 1 replacement card — instantly reducing your hand total." />
            <RuleItem number={3} text="6 or more players? Use 2 decks shuffled together." />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function RuleText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.ruleText}>{children}</Text>;
}

function RuleItem({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.ruleItem}>
      <View style={styles.ruleNumber}>
        <Text style={styles.ruleNumberText}>{number}</Text>
      </View>
      <Text style={styles.ruleItemText}>{text}</Text>
    </View>
  );
}

function CardValueTable() {
  const rows = [
    { card: 'Jack (J)', value: '0', note: 'Best card to have' },
    { card: 'Ace (A)', value: '1', note: '' },
    { card: '2 – 10', value: 'Face value', note: '' },
    { card: 'Queen (Q)', value: '10', note: '' },
    { card: 'King (K)', value: '10', note: '' },
  ];
  return (
    <View style={styles.table}>
      {rows.map((r, i) => (
        <View key={r.card} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
          <Text style={styles.tableCard}>{r.card}</Text>
          <Text style={styles.tableValue}>{r.value}</Text>
          {r.note ? <Text style={styles.tableNote}>{r.note}</Text> : <Text style={styles.tableNote} />}
        </View>
      ))}
    </View>
  );
}

function ScoreRow({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[
        styles.scoreValue,
        highlight === 'green' && styles.scoreGreen,
        highlight === 'red' && styles.scoreRed,
      ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: 40 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  ruleText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  ruleItem: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  ruleNumber: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  ruleNumberText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  ruleItemText: { flex: 1, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  table: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', padding: spacing.md, alignItems: 'center' },
  tableRowAlt: { backgroundColor: colors.surfaceAlt },
  tableCard: { flex: 1.2, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  tableValue: { flex: 0.8, fontSize: 14, fontWeight: '700', color: colors.primary },
  tableNote: { flex: 1.5, fontSize: 12, color: colors.textMuted },
  scoringBox: {
    backgroundColor: colors.success + '14',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  scoringBoxLose: {
    backgroundColor: colors.danger + '14',
    borderLeftColor: colors.danger,
  },
  scoringTitle: { fontSize: 14, fontWeight: '800', color: colors.success, marginBottom: 4 },
  scoringTitleLose: { color: colors.danger },
  scoringDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.sm },
  scoringResults: { gap: 4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: 14, color: colors.textSecondary },
  scoreValue: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  scoreGreen: { color: colors.success },
  scoreRed: { color: colors.danger },
});
