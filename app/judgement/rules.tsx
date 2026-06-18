import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';
import { TRUMP_LABEL, TRUMP_COLOR, TRUMP_ORDER } from '@/lib/judgement-types';

export default function JudgementRulesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Rules — Judgement' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <Section title="Overview">
            <RuleText>
              Each session consists of multiple games. Every game deals the same number of cards to each player — that count goes up to a maximum, then back down. Before each game, every player bids how many hands they'll win. Get the exact number: score points. Miss: score zero.
            </RuleText>
          </Section>

          <Section title="Setup">
            <RuleItem number={1} text="Agree on a starting card count (1 to start small, or the max to start big)." />
            <RuleItem number={2} text="Choose a first dealer. The dealer rotates clockwise every game." />
            <RuleItem number={3} text="Max cards per player = 52 ÷ number of players (the app calculates this)." />
          </Section>

          <Section title="Trump Rotation">
            <RuleText>Trump rotates automatically each game in this fixed order, repeating as needed:</RuleText>
            <View style={styles.trumpTable}>
              {TRUMP_ORDER.map((suit, i) => (
                <View key={suit} style={[styles.trumpRow, i % 2 === 1 && styles.trumpRowAlt]}>
                  <Text style={[styles.trumpLabel, { color: TRUMP_COLOR[suit] }]}>
                    {TRUMP_LABEL[suit]}
                  </Text>
                  <Text style={styles.trumpGame}>Game {i + 1}, {i + 6}, {i + 11}…</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Playing a Hand">
            <RuleItem number={1} text="The player after the dealer leads the first hand." />
            <RuleItem number={2} text="Players must follow the led suit if they have it." />
            <RuleItem number={3} text="If you don't have the led suit, you may play any card — including trump." />
            <RuleItem number={4} text="Trump beats all non-trump cards. If multiple players play trump, the highest trump wins. If no trump is played, the highest card of the led suit wins." />
            <RuleItem number={5} text="Card strength within a suit: A > K > Q > J > 10 > 9 > … > 2." />
          </Section>

          <Section title="Bidding">
            <RuleText>
              Bidding order starts from the player clockwise after the dealer. The dealer bids last.
            </RuleText>
            <View style={[styles.ruleBox, styles.ruleBoxWarn]}>
              <Text style={styles.ruleBoxTitle}>⚠️ Dealer Constraint</Text>
              <Text style={styles.ruleBoxDesc}>
                The sum of all bids cannot equal the number of cards dealt. If only one bid would cause this, the dealer is forced to bid something else. The app highlights the forbidden bid automatically.
              </Text>
            </View>
          </Section>

          <Section title="Scoring">
            <View style={[styles.ruleBox, { backgroundColor: colors.success + '14', borderLeftColor: colors.success }]}>
              <Text style={[styles.ruleBoxTitle, { color: colors.success }]}>Exact bid</Text>
              <Text style={styles.ruleBoxDesc}>Score = bid + 10. (e.g. bid 3, win 3 → 13 pts)</Text>
            </View>
            <View style={[styles.ruleBox, { backgroundColor: colors.danger + '14', borderLeftColor: colors.danger }]}>
              <Text style={[styles.ruleBoxTitle, { color: colors.danger }]}>Wrong bid</Text>
              <Text style={styles.ruleBoxDesc}>Score = 0, regardless of how many hands you actually won.</Text>
            </View>
            <RuleText>
              Scores accumulate across all games in the session. The player with the highest total wins.
            </RuleText>
          </Section>

          <Section title="Session End">
            <RuleText>
              The session ends automatically once all games in the sequence are played (e.g. 1→2→…→max→…→2→1). The final scoreboard shows the winner.
            </RuleText>
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
  ruleText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.sm },
  ruleItem: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  ruleNumber: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  ruleNumberText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  ruleItemText: { flex: 1, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  trumpTable: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  trumpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  trumpRowAlt: { backgroundColor: colors.surfaceAlt },
  trumpLabel: { fontSize: 15, fontWeight: '700' },
  trumpGame: { fontSize: 13, color: colors.textMuted },
  ruleBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: colors.accent + '14',
  },
  ruleBoxWarn: {
    backgroundColor: colors.accent + '14',
    borderLeftColor: colors.accent,
  },
  ruleBoxTitle: { fontSize: 14, fontWeight: '800', color: colors.accent, marginBottom: 4 },
  ruleBoxDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
