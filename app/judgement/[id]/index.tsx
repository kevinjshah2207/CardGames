import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, fonts } from '@/lib/theme';
import { useJudgementStore } from '@/lib/judgement-store';
import {
  getGameSequence, getTrumpForGame, getDealerIndex, getBidOrder,
  getJudgementLeaderboard,
} from '@/lib/judgement-scoring';
import { TRUMP_LABEL, TRUMP_COLOR, JudgementGame } from '@/lib/judgement-types';
import { Button } from '@/components/Button';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useJudgementStore((s) => s.getSession(id));
  const deleteSession = useJudgementStore((s) => s.deleteSession);
  const [showHistory, setShowHistory] = useState(false);

  if (!session) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Session not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Session', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSession(session.id);
          router.replace('/judgement');
        },
      },
    ]);
  };

  const sequence = getGameSequence(session.startFromMax, session.maxCards);
  const gamesDone = session.games.length;
  const totalGames = sequence.length;
  const isComplete = session.status === 'completed';

  const nextGameIndex = gamesDone;
  const nextCardCount = !isComplete ? sequence[nextGameIndex] : null;
  const nextTrump = !isComplete ? getTrumpForGame(nextGameIndex) : null;
  const nextDealerIndex = !isComplete ? getDealerIndex(session.firstDealerIndex, nextGameIndex, session.players.length) : null;
  const nextDealer = nextDealerIndex !== null ? session.players[nextDealerIndex] : null;
  const nextBidOrder = nextDealerIndex !== null
    ? getBidOrder(nextDealerIndex, session.players.length).map(i => session.players[i])
    : [];

  const leaderboard = getJudgementLeaderboard(session.players, session.games);

  const rankLabel = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isComplete ? 'Session Over' : 'Scoreboard',
          headerRight: () => (
            <Pressable onPress={handleDelete} hitSlop={8}>
              <View style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </View>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {isComplete && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>🏆  Session Complete</Text>
            </View>
          )}

          <View style={styles.leaderboard}>
            {leaderboard.map((entry, i) => {
              const isLeader = i === 0;
              return (
                <View key={entry.playerId} style={styles.playerRowWrap}>
                  {isLeader && (
                    <LinearGradient
                      colors={[colors.accent + '30', colors.accent + '08']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <View style={[styles.playerRow, !isLeader && styles.playerRowBorder]}>
                    <Text style={styles.rankEmoji}>{rankLabel(entry.rank)}</Text>
                    <Text style={[styles.playerName, isLeader && styles.playerNameLeader]}>
                      {entry.name}
                    </Text>
                    <View style={[styles.scorePill, isLeader && styles.scorePillLeader]}>
                      <Text style={[styles.scoreText, isLeader && styles.scoreTextLeader]}>
                        {entry.total}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {!isComplete && nextCardCount !== null && nextTrump !== null && nextDealer !== null && (
            <View style={styles.nextGame}>
              <LinearGradient
                colors={[TRUMP_COLOR[nextTrump] + '18', TRUMP_COLOR[nextTrump] + '06']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.nextGameAccent, { backgroundColor: TRUMP_COLOR[nextTrump] }]} />
              <View style={styles.nextGameContent}>
                <View style={styles.nextGameHeader}>
                  <Text style={styles.nextGameTitle}>Game {gamesDone + 1} of {totalGames}</Text>
                  <Text style={styles.nextGameProgress}>{gamesDone}/{totalGames} done</Text>
                </View>
                <View style={styles.infoRow}>
                  <InfoChip label="Cards" value={String(nextCardCount)} />
                  <InfoChip label="Trump" value={TRUMP_LABEL[nextTrump]} valueColor={TRUMP_COLOR[nextTrump]} />
                  <InfoChip label="Dealer" value={nextDealer.name} />
                </View>
                <View style={styles.bidOrderRow}>
                  <Text style={styles.bidOrderLabel}>Bid order  </Text>
                  <Text style={styles.bidOrderPlayers}>
                    {nextBidOrder.map((p, i) =>
                      i === nextBidOrder.length - 1 ? `${p.name} 🎯` : `${p.name} → `
                    ).join('')}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {session.games.length > 0 && (
            <Pressable style={styles.historyToggle} onPress={() => setShowHistory(v => !v)}>
              <Text style={styles.historyToggleText}>
                {showHistory ? '▲' : '▼'}  {session.games.length} Game{session.games.length !== 1 ? 's' : ''} Played
              </Text>
            </Pressable>
          )}

          {showHistory && (
            <View style={styles.historyList}>
              {session.games.map((game) => (
                <GameHistoryCard key={game.gameIndex} game={game} players={session.players} />
              ))}
            </View>
          )}
        </ScrollView>

        {!isComplete && (
          <View style={styles.footer}>
            <Button
              label={`Enter Game ${gamesDone + 1}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/judgement/${id}/game`);
              }}
              style={styles.enterBtn}
            />
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

function InfoChip({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.label}>{label}</Text>
      <Text style={[chipStyles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 10, fontFamily: fonts.extraBold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  value: { fontSize: 13, fontFamily: fonts.bold, color: colors.textPrimary, textAlign: 'center' },
});

function GameHistoryCard({ game, players }: { game: JudgementGame; players: { id: string; name: string }[] }) {
  const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? id;
  return (
    <View style={historyStyles.card}>
      <View style={historyStyles.header}>
        <Text style={historyStyles.title}>Game {game.gameIndex + 1}  ·  {game.cardCount} cards</Text>
        <Text style={[historyStyles.trump, { color: TRUMP_COLOR[game.trumpSuit] }]}>
          {TRUMP_LABEL[game.trumpSuit]}
        </Text>
      </View>
      {game.scores.map((s) => {
        const hit = s.gameScore > 0;
        return (
          <View key={s.playerId} style={historyStyles.row}>
            <Text style={historyStyles.name}>{nameOf(s.playerId)}</Text>
            <Text style={historyStyles.bid}>bid {s.bid}</Text>
            <Text style={historyStyles.actual}>got {s.actual}</Text>
            <Text style={[historyStyles.score, hit ? historyStyles.scoreGreen : historyStyles.scoreRed]}>
              +{s.gameScore}
            </Text>
            <Text style={historyStyles.cumulative}>{s.cumulativeScore}</Text>
          </View>
        );
      })}
    </View>
  );
}

const historyStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 13, fontFamily: fonts.bold, color: colors.textSecondary },
  trump: { fontSize: 13, fontFamily: fonts.semiBold },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 4 },
  name: { flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary },
  bid: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted, width: 38, textAlign: 'right' },
  actual: { fontSize: 12, fontFamily: fonts.regular, color: colors.textMuted, width: 38, textAlign: 'right' },
  score: { fontSize: 13, fontFamily: fonts.bold, width: 36, textAlign: 'right' },
  scoreGreen: { color: colors.success },
  scoreRed: { color: colors.danger },
  cumulative: { fontSize: 13, fontFamily: fonts.bold, color: colors.textPrimary, width: 36, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  notFoundText: { fontFamily: fonts.regular, color: colors.textSecondary },
  deleteBtn: {
    backgroundColor: colors.danger,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  completedBanner: {
    backgroundColor: colors.gold + '22',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completedText: { fontSize: 16, fontFamily: fonts.bold, color: colors.gold },
  leaderboard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerRowWrap: { overflow: 'hidden' },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
  },
  playerRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rankEmoji: { fontSize: 20, width: 32 },
  playerName: { flex: 1, fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary },
  playerNameLeader: { fontFamily: fonts.bold, color: colors.accent },
  scorePill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 54,
    alignItems: 'center',
  },
  scorePillLeader: { backgroundColor: colors.accent },
  scoreText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textSecondary },
  scoreTextLeader: { color: '#fff' },
  nextGame: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextGameAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  nextGameContent: { padding: spacing.md, paddingLeft: spacing.md + 3 },
  nextGameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  nextGameTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.textPrimary },
  nextGameProgress: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted },
  infoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  bidOrderRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 4 },
  bidOrderLabel: { fontSize: 11, fontFamily: fonts.extraBold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  bidOrderPlayers: { fontSize: 12, fontFamily: fonts.regular, color: colors.textSecondary, flex: 1, flexWrap: 'wrap' },
  historyToggle: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyToggleText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textSecondary },
  historyList: { gap: spacing.sm },
  footer: { padding: spacing.md, paddingBottom: spacing.lg },
  enterBtn: { width: '100%' },
});
