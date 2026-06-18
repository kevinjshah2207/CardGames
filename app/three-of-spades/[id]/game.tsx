import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/lib/theme';
import { useTOSStore } from '@/lib/three-of-spades-store';
import { getPartnersNeeded, MIN_BID, TOTAL_POINTS } from '@/lib/three-of-spades-scoring';
import {
  SUITS, RANKS, SUIT_LABEL, SUIT_SYMBOL, SUIT_COLOR,
  Suit, Rank, PartnerCard, cardLabel,
} from '@/lib/three-of-spades-types';
import { Button } from '@/components/Button';

type Phase = 'auction' | 'setup' | 'results';

export default function TOSGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useTOSStore((s) => s.getSession(id));
  const startGame = useTOSStore((s) => s.startGame);
  const finalizeGame = useTOSStore((s) => s.finalizeGame);

  const hasPending = !!session?.pendingGame;
  const [phase, setPhase] = useState<Phase>(hasPending ? 'results' : 'auction');

  // Auction state
  const [bidderId, setBidderId] = useState<string>('');
  const [bidRaw, setBidRaw] = useState('');

  // Setup state
  const [trumpSuit, setTrumpSuit] = useState<Suit | null>(null);
  const [partnerCards, setPartnerCards] = useState<PartnerCard[]>([]);

  // Results state
  const [partnerPlayerIds, setPartnerPlayerIds] = useState<string[]>([]);
  const [pointsRaw, setPointsRaw] = useState('');

  if (!session) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Session not found</Text>
      </View>
    );
  }

  const partnersNeeded = getPartnersNeeded(session.players.length);

  // ── Auction phase ─────────────────────────────────────────────────────
  const bidVal = parseInt(bidRaw, 10);
  const bidValid = bidderId !== '' && !isNaN(bidVal) && bidVal >= MIN_BID;

  const handleLockAuction = () => {
    if (!bidValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const initialCards: PartnerCard[] = Array.from({ length: partnersNeeded }, () => ({
      rank: 'A' as Rank,
      suit: 'spades' as Suit,
    }));
    setPartnerCards(initialCards);
    setPhase('setup');
  };

  // ── Setup phase ───────────────────────────────────────────────────────
  const updatePartnerCard = (index: number, field: Partial<PartnerCard>) => {
    setPartnerCards(cards => cards.map((c, i) => i === index ? { ...c, ...field } : c));
  };

  const setupValid = trumpSuit !== null && (partnersNeeded === 0 || partnerCards.length === partnersNeeded);

  const handleSaveSetup = () => {
    if (!setupValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    startGame(id, bidderId, bidVal, trumpSuit!, partnerCards);
    router.back();
  };

  // ── Results phase ─────────────────────────────────────────────────────
  const pending = session.pendingGame;
  const pendingBidder = pending ? session.players.find(p => p.id === pending.bidderId) : null;

  const togglePartner = (playerId: string) => {
    if (playerId === pending?.bidderId) return;
    setPartnerPlayerIds(ids => {
      if (ids.includes(playerId)) return ids.filter(id => id !== playerId);
      if (ids.length >= partnersNeeded) return ids;
      return [...ids, playerId];
    });
  };

  const pointsVal = parseInt(pointsRaw, 10);
  const pointsValid = !isNaN(pointsVal) && pointsVal >= 0 && pointsVal <= TOTAL_POINTS;
  const resultsValid = (partnersNeeded === 0 || partnerPlayerIds.length === partnersNeeded) && pointsValid;

  const handleConfirmResults = () => {
    if (!resultsValid || !pending) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    finalizeGame(id, partnerPlayerIds, pointsVal);
    router.back();
  };

  // ── Auction phase render ──────────────────────────────────────────────
  if (phase === 'auction') {
    const gameIndex = session.games.length;
    return (
      <>
        <Stack.Screen options={{ title: `Game ${gameIndex + 1} · Auction` }} />
        <SafeAreaView style={styles.safe} edges={['bottom']}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <Text style={styles.sectionLabel}>Who won the auction?</Text>
              <View style={styles.chipGrid}>
                {session.players.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playerChip, bidderId === p.id && styles.playerChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setBidderId(p.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.playerChipText, bidderId === p.id && styles.playerChipTextActive]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Winning bid</Text>
              <View style={styles.bidInputRow}>
                <TextInput
                  style={styles.bidInput}
                  value={bidRaw}
                  onChangeText={v => setBidRaw(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="125"
                  placeholderTextColor={colors.textMuted}
                  maxLength={3}
                />
                <Text style={styles.bidHint}>min {MIN_BID} · max {TOTAL_POINTS}</Text>
              </View>
            </ScrollView>
            <View style={styles.footer}>
              <Button label="Next: Trump & Partners →" onPress={handleLockAuction} disabled={!bidValid} style={styles.footerBtn} />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </>
    );
  }

  // ── Setup phase render ────────────────────────────────────────────────
  if (phase === 'setup') {
    const bidder = session.players.find(p => p.id === bidderId);
    const gameIndex = session.games.length;
    return (
      <>
        <Stack.Screen options={{ title: `Game ${gameIndex + 1} · Setup` }} />
        <SafeAreaView style={styles.safe} edges={['bottom']}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <View style={styles.recapBanner}>
                <Text style={styles.recapText}>
                  {bidder?.name} won the auction with a bid of{' '}
                  <Text style={styles.recapHighlight}>{bidVal}</Text>
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Trump Suit</Text>
              <View style={styles.suitRow}>
                {SUITS.map((suit) => (
                  <TouchableOpacity
                    key={suit}
                    style={[styles.suitChip, trumpSuit === suit && styles.suitChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTrumpSuit(suit);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.suitSymbol, { color: SUIT_COLOR[suit] }]}>{SUIT_SYMBOL[suit]}</Text>
                    <Text style={[styles.suitName, trumpSuit === suit && styles.suitNameActive]}>
                      {suit.charAt(0).toUpperCase() + suit.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {partnersNeeded > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                    Partner Card{partnersNeeded > 1 ? 's' : ''} ({partnersNeeded})
                  </Text>
                  {partnerCards.map((card, idx) => (
                    <View key={idx} style={styles.cardPickerBlock}>
                      {partnersNeeded > 1 && (
                        <Text style={styles.cardPickerLabel}>Partner {idx + 1}</Text>
                      )}
                      <Text style={styles.cardPickerSublabel}>Suit</Text>
                      <View style={styles.suitRow}>
                        {SUITS.map((suit) => (
                          <TouchableOpacity
                            key={suit}
                            style={[styles.suitChipSm, card.suit === suit && styles.suitChipSmActive]}
                            onPress={() => updatePartnerCard(idx, { suit })}
                            activeOpacity={0.75}
                          >
                            <Text style={[styles.suitSymbolSm, { color: SUIT_COLOR[suit] }]}>{SUIT_SYMBOL[suit]}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={[styles.cardPickerSublabel, { marginTop: spacing.sm }]}>Rank</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rankScroll}>
                        <View style={styles.rankRow}>
                          {RANKS.map((rank) => (
                            <TouchableOpacity
                              key={rank}
                              style={[styles.rankChip, card.rank === rank && styles.rankChipActive]}
                              onPress={() => updatePartnerCard(idx, { rank })}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.rankText, card.rank === rank && styles.rankTextActive]}>{rank}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                      <View style={styles.cardPreviewRow}>
                        <Text style={styles.cardPreview}>
                          Called card: <Text style={[styles.cardPreviewValue, { color: SUIT_COLOR[card.suit] }]}>{cardLabel(card)}</Text>
                        </Text>
                        {session.twoDecks && (
                          <View style={styles.copyRow}>
                            {(['first', 'second'] as const).map((pref) => (
                              <TouchableOpacity
                                key={pref}
                                style={[styles.copyChip, card.copyPreference === pref && styles.copyChipActive]}
                                onPress={() => updatePartnerCard(idx, { copyPreference: pref })}
                                activeOpacity={0.75}
                              >
                                <Text style={[styles.copyChipText, card.copyPreference === pref && styles.copyChipTextActive]}>
                                  {pref === 'first' ? '1st copy' : '2nd copy'}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity style={styles.backLink} onPress={() => setPhase('auction')} activeOpacity={0.7}>
                <Text style={styles.backLinkText}>← Back to Auction</Text>
              </TouchableOpacity>
              <Button label="Save & Play →" onPress={handleSaveSetup} disabled={!setupValid} style={styles.footerBtn} />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </>
    );
  }

  // ── Results phase render ──────────────────────────────────────────────
  if (!pending || !pendingBidder) {
    router.replace(`/three-of-spades/${id}`);
    return null;
  }

  const nonBidderPlayers = session.players.filter(p => p.id !== pending.bidderId);

  return (
    <>
      <Stack.Screen options={{ title: `Game ${pending.gameIndex + 1} · Results` }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <View style={styles.recapBanner}>
              <Text style={styles.recapText}>
                {pendingBidder.name} bid <Text style={styles.recapHighlight}>{pending.finalBid}</Text>
                {'  ·  '}
                <Text style={{ color: SUIT_COLOR[pending.trumpSuit] }}>{SUIT_LABEL[pending.trumpSuit]}</Text> trump
              </Text>
              {pending.partnerCards.length > 0 && (
                <Text style={styles.recapSub}>
                  Partner card{pending.partnerCards.length > 1 ? 's' : ''}:{' '}
                  {pending.partnerCards.map(c =>
                    `${cardLabel(c)}${c.copyPreference ? ` (${c.copyPreference})` : ''}`
                  ).join(', ')}
                </Text>
              )}
            </View>

            {partnersNeeded > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  Who was the partner? ({partnerPlayerIds.length}/{partnersNeeded})
                </Text>
                <View style={styles.chipGrid}>
                  {nonBidderPlayers.map((p) => {
                    const selected = partnerPlayerIds.includes(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.playerChip, selected && styles.playerChipActive]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          togglePartner(p.id);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.playerChipText, selected && styles.playerChipTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
              Points won by bidding team
            </Text>
            <Text style={styles.bidHint}>0 – {TOTAL_POINTS}  ·  need ≥ {pending.finalBid} to win</Text>
            <View style={styles.bidInputRow}>
              <TextInput
                style={[
                  styles.bidInput,
                  pointsValid && pointsVal >= pending.finalBid && styles.inputGood,
                  pointsValid && pointsVal < pending.finalBid && styles.inputBad,
                ]}
                value={pointsRaw}
                onChangeText={v => setPointsRaw(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                maxLength={3}
                autoFocus
              />
              {pointsValid && (
                <Text style={[styles.resultPreview, pointsVal >= pending.finalBid ? styles.resultWon : styles.resultLost]}>
                  {pointsVal >= pending.finalBid ? '✓ Bidding team wins!' : '✗ Defense wins'}
                </Text>
              )}
            </View>

            {pointsValid && (
              <View style={styles.scorePreviewCard}>
                {session.players.map(p => {
                  const isBidder = p.id === pending.bidderId;
                  const isPartner = partnerPlayerIds.includes(p.id);
                  const isDefense = !isBidder && !isPartner;
                  const won = pointsVal >= pending.finalBid;
                  let delta = 0;
                  if (isBidder) delta = won ? 2 * pending.finalBid : -(2 * pending.finalBid);
                  else if (isPartner) delta = won ? pending.finalBid : -pending.finalBid;
                  return (
                    <View key={p.id} style={styles.scorePreviewRow}>
                      <Text style={styles.scorePreviewName}>
                        {p.name}
                        {isBidder ? '  🎯' : isPartner ? '  🤝' : ''}
                      </Text>
                      <Text style={[
                        styles.scorePreviewDelta,
                        delta > 0 ? styles.scoreGreen : delta < 0 ? styles.scoreRed : styles.scoreMuted,
                      ]}>
                        {delta > 0 ? '+' : ''}{delta}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="Confirm Results"
              onPress={handleConfirmResults}
              disabled={!resultsValid}
              style={styles.footerBtn}
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
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  notFoundText: { color: colors.textSecondary },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  playerChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
  },
  playerChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  playerChipText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  playerChipTextActive: { color: '#fff' },
  bidInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bidInput: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputGood: { borderColor: colors.success },
  inputBad: { borderColor: colors.danger },
  bidHint: { fontSize: 13, color: colors.textMuted, flex: 1 },
  recapBanner: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  recapText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  recapHighlight: { color: colors.textPrimary, fontWeight: '700' },
  recapSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  suitRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  suitChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
  },
  suitChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  suitSymbol: { fontSize: 20, fontWeight: '700' },
  suitName: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  suitNameActive: { color: colors.textSecondary },
  cardPickerBlock: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.md,
  },
  cardPickerLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  cardPickerSublabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs },
  suitChipSm: {
    width: 48, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border,
  },
  suitChipSmActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  suitSymbolSm: { fontSize: 18, fontWeight: '700' },
  rankScroll: { marginBottom: spacing.sm },
  rankRow: { flexDirection: 'row', gap: spacing.xs },
  rankChip: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border,
  },
  rankChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rankText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  rankTextActive: { color: '#fff' },
  cardPreviewRow: { marginTop: spacing.sm },
  cardPreview: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.sm },
  cardPreviewValue: { fontWeight: '800', fontSize: 16 },
  copyRow: { flexDirection: 'row', gap: spacing.sm },
  copyChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.border,
  },
  copyChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  copyChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  copyChipTextActive: { color: '#fff' },
  resultPreview: { fontSize: 15, fontWeight: '700', flex: 1 },
  resultWon: { color: colors.success },
  resultLost: { color: colors.danger },
  scorePreviewCard: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.md,
  },
  scorePreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  scorePreviewName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  scorePreviewDelta: { fontSize: 16, fontWeight: '700' },
  scoreGreen: { color: colors.success },
  scoreRed: { color: colors.danger },
  scoreMuted: { color: colors.textMuted },
  footer: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  footerBtn: { width: '100%' },
  backLink: { alignItems: 'center', paddingVertical: 6 },
  backLinkText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
