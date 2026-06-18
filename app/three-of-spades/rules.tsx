import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';
import { SUIT_LABEL, SUIT_COLOR, SUITS } from '@/lib/three-of-spades-types';

export default function TOSRulesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Rules — 3 of Spades' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          <Section title="Overview">
            <RuleText>
              A trick-taking team game. One player wins an auction and becomes the bidder — they declare how many points they will collect with their team. The bidder picks the trump suit and secretly names partner cards. At the end, either the bidding team meets their bid or the defense holds them off.
            </RuleText>
          </Section>

          <Section title="Card Values">
            <View style={styles.table}>
              {[
                { card: '3 of Spades', value: '30', note: 'The special card' },
                { card: '10, J, Q, K, A', value: '10 each', note: '' },
                { card: 'All 5s', value: '5 each', note: '' },
                { card: 'Everything else', value: '0', note: '' },
              ].map((r, i) => (
                <View key={r.card} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={styles.tableCard}>{r.card}</Text>
                  <Text style={styles.tableValue}>{r.value}</Text>
                  {r.note ? <Text style={styles.tableNote}>{r.note}</Text> : <Text style={styles.tableNote} />}
                </View>
              ))}
              <View style={[styles.tableRow, styles.tableTotal]}>
                <Text style={[styles.tableCard, { color: colors.textPrimary }]}>Total</Text>
                <Text style={[styles.tableValue, { color: colors.gold }]}>250 pts</Text>
                <Text style={styles.tableNote} />
              </View>
            </View>
          </Section>

          <Section title="Setup">
            <RuleItem number={1} text="Deal all 52 cards equally. Remove the lowest 2s if the count doesn't divide evenly (e.g. 5 players → remove two 2s, deal 10 each)." />
            <RuleItem number={2} text="6 or more players use 2 decks (104 cards). Remove lowest 2s as needed to divide equally." />
            <RuleItem number={3} text="Choose a first dealer. Dealer rotates clockwise each game." />
          </Section>

          <Section title="Auction">
            <RuleText>
              Bidding starts with the player clockwise after the dealer and goes round-robin. The first player automatically opens at 125 (the minimum). Others can raise or pass.
            </RuleText>
            <View style={[styles.ruleBox, { backgroundColor: colors.accent + '14', borderLeftColor: colors.accent }]}>
              <Text style={[styles.ruleBoxTitle, { color: colors.accent }]}>⚠️ Auction Rules</Text>
              <Text style={styles.ruleBoxDesc}>
                • Minimum bid: 125{'\n'}
                • Any raise must be strictly higher than the current bid{'\n'}
                • You can pass at any time — but you cannot re-enter{'\n'}
                • Bidding continues until everyone but one player has passed{'\n'}
                • The last remaining player is the bidder
              </Text>
            </View>
          </Section>

          <Section title="Trump & Partners">
            <RuleItem number={1} text="After winning the auction, the bidder declares the trump suit (any of the 4 suits)." />
            <RuleItem number={2} text="The bidder then secretly names one or more partner cards (e.g. 'Ace of Hearts'). Whoever holds that card is the bidder's partner — revealed only when they play it." />
            <RuleItem number={3} text="With 2 decks, the bidder also specifies whether the first or second copy of the called card is the partner. The first copy played in a trick beats the second." />

            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Team sizes by players</Text>
            <View style={styles.table}>
              {[
                { players: '4', team: '1 v 3', note: 'Bidder alone, no partners' },
                { players: '5', team: '2 v 3', note: '1 partner' },
                { players: '6', team: '2 v 4', note: '1 partner' },
                { players: '7', team: '3 v 4', note: '2 partners' },
                { players: '8', team: '3 v 5', note: '2 partners' },
                { players: '9', team: '4 v 5', note: '3 partners' },
              ].map((r, i) => (
                <View key={r.players} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={styles.tableCard}>{r.players} players</Text>
                  <Text style={[styles.tableValue, { color: colors.primaryLight }]}>{r.team}</Text>
                  <Text style={styles.tableNote}>{r.note}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Playing a Hand">
            <RuleItem number={1} text="The player after the dealer leads the first hand." />
            <RuleItem number={2} text="Players must follow the led suit if they have it." />
            <RuleItem number={3} text="If you don't have the led suit, you may play any card — including trump." />
            <RuleItem number={4} text="Trump beats all non-trump cards. If multiple players play trump, the highest trump wins." />
            <RuleItem number={5} text="If two identical cards are played in the same hand (2 decks), the first one played wins." />
            <RuleItem number={6} text="Card strength: A > K > Q > J > 10 > 9 > … > 2." />
          </Section>

          <Section title="Scoring">
            <View style={[styles.ruleBox, { backgroundColor: colors.success + '14', borderLeftColor: colors.success }]}>
              <Text style={[styles.ruleBoxTitle, { color: colors.success }]}>Bidding team wins (points ≥ bid)</Text>
              <Text style={styles.ruleBoxDesc}>
                Bidder: +2 × bid{'\n'}
                Each partner: +bid
              </Text>
            </View>
            <View style={[styles.ruleBox, { backgroundColor: colors.danger + '14', borderLeftColor: colors.danger }]}>
              <Text style={[styles.ruleBoxTitle, { color: colors.danger }]}>Defense wins (bidding team points {"<"} bid)</Text>
              <Text style={styles.ruleBoxDesc}>
                Bidder: −2 × bid{'\n'}
                Each partner: −bid{'\n'}
                Defense: no change (0 pts)
              </Text>
            </View>
            <RuleText>
              Scores accumulate across all games. Highest cumulative total wins.
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
    fontSize: 11, fontWeight: '800', color: colors.primary,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
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
  table: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  tableRow: { flexDirection: 'row', padding: spacing.md, alignItems: 'center' },
  tableRowAlt: { backgroundColor: colors.surfaceAlt },
  tableTotal: { borderTopWidth: 1, borderTopColor: colors.border },
  tableCard: { flex: 1.5, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  tableValue: { flex: 0.8, fontSize: 14, fontWeight: '700', color: colors.primary },
  tableNote: { flex: 1.2, fontSize: 12, color: colors.textMuted },
  ruleBox: {
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderLeftWidth: 3,
  },
  ruleBoxTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  ruleBoxDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
