import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, fonts } from '@/lib/theme';
import { useJudgementStore } from '@/lib/judgement-store';
import {
  getGameSequence, getTrumpForGame, getDealerIndex, getBidOrder, getForbiddenBid,
} from '@/lib/judgement-scoring';
import { TRUMP_LABEL, TRUMP_COLOR, JudgementBid, JudgementHands } from '@/lib/judgement-types';
import { Button } from '@/components/Button';
import { Stepper } from '@/components/Stepper';

export default function GameEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useJudgementStore((s) => s.getSession(id));
  const addGame = useJudgementStore((s) => s.addGame);

  const [phase, setPhase] = useState<'bids' | 'hands'>('bids');
  const [bids, setBids] = useState<Record<string, number>>({});
  const [hands, setHands] = useState<Record<string, number>>({});

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
  const nonDealerBids = bidOrderPlayers
    .filter(p => p.id !== dealer.id)
    .map(p => bids[p.id] ?? 0);
  const nonDealerAllSet = bidOrderPlayers
    .filter(p => p.id !== dealer.id)
    .every(p => bids[p.id] !== undefined);
  const rawForbidden = nonDealerAllSet ? getForbiddenBid(nonDealerBids, cardCount) : null;
  const forbiddenBid = rawForbidden !== null && rawForbidden >= 0 && rawForbidden <= cardCount ? rawForbidden : null;

  const allBidsSet = bidOrderPlayers.every(p => bids[p.id] !== undefined);
  const dealerBidForbidden = forbiddenBid !== null && bids[dealer.id] === forbiddenBid;
  const bidsValid = allBidsSet && !dealerBidForbidden;

  // ── Hands phase helpers ────────────────────────────────────────────────
  const allHandsSet = session.players.every(p => hands[p.id] !== undefined);
  const handTotal = session.players.reduce((s, p) => s + (hands[p.id] ?? 0), 0);
  const handTotalValid = allHandsSet && handTotal === cardCount;

  const setBid = (playerId: string, val: number) =>
    setBids(b => ({ ...b, [playerId]: val }));

  const setHand = (playerId: string, val: number) =>
    setHands(h => ({ ...h, [playerId]: val }));

  const handleLockBids = () => {
    if (!bidsValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhase('hands');
  };

  const handleConfirm = () => {
    if (!handTotalValid) return;
    const gameBids: JudgementBid[] = bidOrderPlayers.map(p => ({ playerId: p.id, bid: bids[p.id] ?? 0 }));
    const gameHands: JudgementHands[] = session.players.map(p => ({ playerId: p.id, hands: hands[p.id] ?? 0 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGame(id, gameBids, gameHands);
    router.back();
  };

  const trumpColor = TRUMP_COLOR[trumpSuit];

  const gameBanner = (
    <View style={styles.gameBanner}>
      <LinearGradient
        colors={[trumpColor + '20', trumpColor + '06']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.bannerAccent, { backgroundColor: trumpColor }]} />
      <View style={styles.bannerContent}>
        <Text style={styles.gameBannerTitle}>
          Game {gameIndex + 1} · {cardCount} card{cardCount !== 1 ? 's' : ''}
        </Text>
        <Text style={[styles.gameBannerTrump, { color: trumpColor }]}>
          {TRUMP_LABEL[trumpSuit]} trump · {dealer.name} deals
        </Text>
      </View>
    </View>
  );

  // ── Bids phase ─────────────────────────────────────────────────────────
  if (phase === 'bids') {
    const bidTotal = bidOrderPlayers.reduce((s, p) => s + (bids[p.id] ?? 0), 0);
    return (
      <>
        <Stack.Screen options={{ title: `Game ${gameIndex + 1} · Bids` }} />
        <SafeAreaView style={styles.safe} edges={['bottom']}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {gameBanner}

            <Text style={styles.sectionLabel}>Bids — in bid order</Text>

            {bidOrderPlayers.map((player) => {
              const isDealer = player.id === dealer.id;
              const currentBid = bids[player.id] ?? 0;
              const isInvalid = isDealer && forbiddenBid !== null && currentBid === forbiddenBid;
              return (
                <View key={player.id} style={[styles.entryRow, isInvalid && styles.entryRowInvalid]}>
                  <View style={styles.entryLeft}>
                    <Text style={[styles.entryName, isDealer && styles.entryNameDealer]}>
                      {player.name}{isDealer ? '  🎯' : ''}
                    </Text>
                    {isDealer && forbiddenBid !== null && (
                      <Text style={[styles.forbidden, isInvalid && styles.forbiddenActive]}>
                        {isInvalid ? '⛔' : '⚠️'} Cannot bid {forbiddenBid}
                      </Text>
                    )}
                  </View>
                  <Stepper
                    value={currentBid}
                    min={0}
                    max={cardCount}
                    onChange={(val) => setBid(player.id, val)}
                    forbidden={isDealer ? forbiddenBid : null}
                  />
                </View>
              );
            })}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total bids</Text>
              <Text style={[
                styles.totalValue,
                allBidsSet && bidTotal === cardCount && styles.totalValueBad,
                allBidsSet && bidTotal !== cardCount && styles.totalValueGood,
              ]}>
                {bidTotal} / {cardCount}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button label="Lock In Bids →" onPress={handleLockBids} disabled={!bidsValid} style={styles.actionBtn} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // ── Hands phase ────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen options={{ title: `Game ${gameIndex + 1} · Hands Won` }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {gameBanner}

          <View style={styles.bidsRecap}>
            <Text style={styles.bidsRecapLabel}>Bids locked  </Text>
            <Text style={styles.bidsRecapValue}>
              {bidOrderPlayers.map(p => `${p.name} ${bids[p.id] ?? 0}`).join('  ·  ')}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Hands Won</Text>

          {session.players.map((player) => {
            const bidVal = bids[player.id] ?? 0;
            const handsVal = hands[player.id] ?? 0;
            const hasEntry = hands[player.id] !== undefined;
            const correct = hasEntry && handsVal === bidVal;
            const wrong = hasEntry && handsVal !== bidVal;
            let gameScore: number | null = null;
            if (hasEntry) gameScore = correct ? bidVal + 10 : 0;

            const scoreStyle = correct ? styles.scoreGreen : styles.scoreRed;

            return (
              <View key={player.id} style={styles.entryRow}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryName}>{player.name}</Text>
                  <Text style={styles.entryBid}>bid {bidVal}</Text>
                </View>
                <Stepper
                  value={handsVal}
                  min={0}
                  max={cardCount}
                  onChange={(val) => setHand(player.id, val)}
                />
                {gameScore !== null && (
                  <View style={styles.scorePreview}>
                    <Text style={[styles.scorePreviewText, scoreStyle]}>
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
              allHandsSet && !handTotalValid && styles.totalValueBad,
              handTotalValid && styles.totalValueGood,
            ]}>
              {handTotal} / {cardCount}
            </Text>
          </View>

          {allHandsSet && !handTotalValid && (
            <Text style={styles.trickError}>
              Total must equal {cardCount} (currently {handTotal})
            </Text>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.backToPhase} onPress={() => setPhase('bids')}>
            <Text style={styles.backToPhaseText}>← Edit Bids</Text>
          </Pressable>
          <Button label="Confirm Game" onPress={handleConfirm} disabled={!handTotalValid} style={styles.actionBtn} />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 20 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  notFoundText: { fontFamily: fonts.regular, color: colors.textSecondary },
  gameBanner: {
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  bannerContent: { padding: spacing.md, paddingLeft: spacing.md + 3 },
  gameBannerTitle: { fontSize: 17, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 2 },
  gameBannerTrump: { fontSize: 14, fontFamily: fonts.semiBold },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.extraBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  entryRowInvalid: { borderColor: colors.danger },
  entryLeft: { flex: 1 },
  entryName: { fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary },
  entryNameDealer: { color: colors.primaryLight },
  entryBid: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted, marginTop: 2 },
  forbidden: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.accent, marginTop: 3 },
  forbiddenActive: { color: colors.danger },
  scorePreview: { width: 44, alignItems: 'center' },
  scorePreviewText: { fontSize: 14, fontFamily: fonts.bold },
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
  totalLabel: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textMuted },
  totalValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.textSecondary },
  totalValueGood: { color: colors.success },
  totalValueBad: { color: colors.danger },
  trickError: { textAlign: 'center', fontSize: 13, fontFamily: fonts.regular, color: colors.danger, marginTop: -4, marginBottom: 4 },
  bidsRecap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bidsRecapLabel: { fontSize: 11, fontFamily: fonts.extraBold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  bidsRecapValue: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, flex: 1 },
  footer: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  backToPhase: { alignItems: 'center', paddingVertical: 6 },
  backToPhaseText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.primary },
  actionBtn: { width: '100%' },
});
