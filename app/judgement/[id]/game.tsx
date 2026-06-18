import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/lib/theme';
import { useJudgementStore } from '@/lib/judgement-store';
import {
  getGameSequence, getTrumpForGame, getDealerIndex, getBidOrder, getForbiddenBid,
} from '@/lib/judgement-scoring';
import { TRUMP_LABEL, TRUMP_COLOR, JudgementBid, JudgementHands } from '@/lib/judgement-types';
import { Button } from '@/components/Button';

export default function GameEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useJudgementStore((s) => s.getSession(id));
  const addGame = useJudgementStore((s) => s.addGame);

  const [phase, setPhase] = useState<'bids' | 'hands'>('bids');
  const [bids, setBids] = useState<Record<string, string>>({});
  const [hands, setHands] = useState<Record<string, string>>({});

  if (!session) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Session not found</Text>
      </View>
    );
  }

  const sequence = getGameSequence(session.startFromMax, session.maxCards);
  const gameIndex = session.games.length;

  if (gameIndex >= sequence.length) {
    router.replace(`/judgement/${id}`);
    return null;
  }

  const cardCount = sequence[gameIndex];
  const trumpSuit = getTrumpForGame(gameIndex);
  const dealerIndex = getDealerIndex(session.firstDealerIndex, gameIndex, session.players.length);
  const dealer = session.players[dealerIndex];
  const bidOrderIndices = getBidOrder(dealerIndex, session.players.length);
  const bidOrderPlayers = bidOrderIndices.map(i => session.players[i]);

  // ── Bid phase helpers ──────────────────────────────────────────────────
  const parsedBids = bidOrderPlayers.map(p => {
    const raw = bids[p.id] ?? '';
    const val = parseInt(raw, 10);
    return { player: p, raw, val, entered: raw !== '' && !isNaN(val) };
  });

  const allBidsEntered = parsedBids.every(b => b.entered);
  const bidTotal = parsedBids.filter(b => b.entered).reduce((s, b) => s + b.val, 0);

  const nonDealerParsed = parsedBids.filter(b => b.player.id !== dealer.id);
  const nonDealerAllEntered = nonDealerParsed.every(b => b.entered);
  const nonDealerTotal = nonDealerParsed.filter(b => b.entered).reduce((s, b) => s + b.val, 0);
  const rawForbidden = nonDealerAllEntered ? getForbiddenBid(nonDealerParsed.filter(b => b.entered).map(b => b.val), cardCount) : null;
  const forbiddenBid = rawForbidden !== null && rawForbidden >= 0 && rawForbidden <= cardCount ? rawForbidden : null;

  const dealerBidRaw = bids[dealer.id] ?? '';
  const dealerBidVal = parseInt(dealerBidRaw, 10);
  const dealerBidForbidden = forbiddenBid !== null && !isNaN(dealerBidVal) && dealerBidVal === forbiddenBid;
  const bidsValid = allBidsEntered && !dealerBidForbidden;

  // ── Hands phase helpers ────────────────────────────────────────────────
  const parsedHands = session.players.map(p => {
    const raw = hands[p.id] ?? '';
    const val = parseInt(raw, 10);
    const bid = parsedBids.find(b => b.player.id === p.id);
    return { player: p, raw, val, entered: raw !== '' && !isNaN(val), bidVal: bid?.val ?? 0 };
  });

  const allHandsEntered = parsedHands.every(t => t.entered);
  const handTotal = parsedHands.filter(t => t.entered).reduce((s, t) => s + t.val, 0);
  const handTotalValid = allHandsEntered && handTotal === cardCount;

  const handleLockBids = () => {
    if (!bidsValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('hands');
  };

  const handleConfirm = () => {
    if (!handTotalValid) return;
    const gameBids: JudgementBid[] = parsedBids.map(b => ({ playerId: b.player.id, bid: b.val }));
    const gameHands: JudgementHands[] = parsedHands.map(t => ({ playerId: t.player.id, hands: t.val }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGame(id, gameBids, gameHands);
    router.back();
  };

  // ── Game info banner ───────────────────────────────────────────────────
  const gameBanner = (
    <View style={styles.gameBanner}>
      <Text style={styles.gameBannerTitle}>
        Game {gameIndex + 1}  ·  {cardCount} card{cardCount !== 1 ? 's' : ''}
      </Text>
      <Text style={[styles.gameBannerTrump, { color: TRUMP_COLOR[trumpSuit] }]}>
        {TRUMP_LABEL[trumpSuit]} trump  ·  {dealer.name} deals
      </Text>
    </View>
  );

  // ── Bids phase ─────────────────────────────────────────────────────────
  if (phase === 'bids') {
    return (
      <>
        <Stack.Screen options={{ title: `Game ${gameIndex + 1} · Bids` }} />
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
              {gameBanner}

              <Text style={styles.sectionLabel}>Bids  (bid order)</Text>

              {parsedBids.map((item, i) => {
                const isDealer = item.player.id === dealer.id;
                const showForbidden = isDealer && forbiddenBid !== null;
                const isInvalid = isDealer && dealerBidForbidden;
                return (
                  <View key={item.player.id} style={styles.entryRow}>
                    <View style={styles.entryLeft}>
                      <Text style={[styles.entryName, isDealer && styles.entryNameDealer]}>
                        {item.player.name}{isDealer ? '  🎯 dealer' : ''}
                      </Text>
                      {showForbidden && (
                        <Text style={[styles.forbidden, isInvalid && styles.forbiddenActive]}>
                          {isInvalid ? '⛔ ' : '⚠️ '}Cannot bid {forbiddenBid}
                        </Text>
                      )}
                    </View>
                    <TextInput
                      style={[styles.numInput, isInvalid && styles.numInputInvalid]}
                      value={item.raw}
                      onChangeText={v => setBids(b => ({ ...b, [item.player.id]: v.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad"
                      placeholder="–"
                      placeholderTextColor={colors.textMuted}
                      maxLength={2}
                    />
                  </View>
                );
              })}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total bids</Text>
                <Text style={[
                  styles.totalValue,
                  allBidsEntered && bidTotal === cardCount && styles.totalValueBad,
                  allBidsEntered && bidTotal !== cardCount && styles.totalValueGood,
                ]}>
                  {bidTotal} / {cardCount}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Button
                label="Lock In Bids →"
                onPress={handleLockBids}
                disabled={!bidsValid}
                style={styles.actionBtn}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </>
    );
  }

  // ── Hands phase ────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ title: `Game ${gameIndex + 1} · Hands` }} />
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
            {gameBanner}

            {/* Bids recap */}
            <View style={styles.bidsRecap}>
              <Text style={styles.bidsRecapLabel}>Bids locked  </Text>
              <Text style={styles.bidsRecapValue}>
                {parsedBids.map(b => `${b.player.name} ${b.val}`).join('  ·  ')}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Hands Won</Text>

            {parsedHands.map((item) => {
              const correct = item.entered && item.val === item.bidVal;
              const wrong = item.entered && item.val !== item.bidVal;
              const gameScore = item.entered ? (correct ? item.bidVal + 10 : 0) : null;
              return (
                <View key={item.player.id} style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryName}>{item.player.name}</Text>
                    <Text style={styles.entryBid}>bid {item.bidVal}</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.numInput,
                      item.entered && correct && styles.numInputGood,
                      item.entered && wrong && styles.numInputBad,
                    ]}
                    value={item.raw}
                    onChangeText={v => setHands(h => ({ ...h, [item.player.id]: v.replace(/[^0-9]/g, '') }))}
                    keyboardType="number-pad"
                    placeholder="–"
                    placeholderTextColor={colors.textMuted}
                    maxLength={2}
                  />
                  {gameScore !== null && (
                    <View style={styles.scorePreview}>
                      <Text style={[styles.scorePreviewText, correct ? styles.scoreGreen : styles.scoreRed]}>
                        +{gameScore}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total hands</Text>
              <Text style={[
                styles.totalValue,
                allHandsEntered && !handTotalValid && styles.totalValueBad,
                handTotalValid && styles.totalValueGood,
              ]}>
                {handTotal} / {cardCount}
              </Text>
            </View>

            {allHandsEntered && !handTotalValid && (
              <Text style={styles.trickError}>
                Total must equal {cardCount} (currently {handTotal})
              </Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.backToPhase}
              onPress={() => setPhase('bids')}
              activeOpacity={0.7}
            >
              <Text style={styles.backToPhaseText}>← Edit Bids</Text>
            </TouchableOpacity>
            <Button
              label="Confirm Game"
              onPress={handleConfirm}
              disabled={!handTotalValid}
              style={styles.actionBtn}
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
  gameBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  gameBannerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  gameBannerTrump: { fontSize: 14, fontWeight: '600' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
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
  entryNameDealer: { color: colors.primaryLight },
  entryBid: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  forbidden: { fontSize: 12, color: colors.accent, marginTop: 3, fontWeight: '600' },
  forbiddenActive: { color: colors.danger },
  numInput: {
    width: 60,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  numInputInvalid: { borderColor: colors.danger },
  numInputGood: { borderColor: colors.success },
  numInputBad: { borderColor: colors.danger },
  scorePreview: { width: 44, alignItems: 'center' },
  scorePreviewText: { fontSize: 14, fontWeight: '700' },
  scoreGreen: { color: colors.success },
  scoreRed: { color: colors.danger },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  totalValueGood: { color: colors.success },
  totalValueBad: { color: colors.danger },
  trickError: { textAlign: 'center', fontSize: 13, color: colors.danger, marginTop: -4, marginBottom: 4 },
  bidsRecap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  bidsRecapLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  bidsRecapValue: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  footer: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  backToPhase: { alignItems: 'center', paddingVertical: 6 },
  backToPhaseText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  actionBtn: { width: '100%' },
});
