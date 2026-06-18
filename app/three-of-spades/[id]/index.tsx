import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/lib/theme';
import { useTOSStore } from '@/lib/three-of-spades-store';
import { getTOSLeaderboard, getDealerIndex, getBidOrder, getPartnersNeeded } from '@/lib/three-of-spades-scoring';
import { SUIT_LABEL, SUIT_COLOR, SUIT_SYMBOL, cardLabel, TOSGame } from '@/lib/three-of-spades-types';
import { Button } from '@/components/Button';

export default function TOSSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useTOSStore((s) => s.getSession(id));
  const deleteSession = useTOSStore((s) => s.deleteSession);
  const completeSession = useTOSStore((s) => s.completeSession);
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
        text: 'Delete', style: 'destructive',
        onPress: () => { deleteSession(session.id); router.replace('/three-of-spades'); },
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Complete Session', 'Mark this session as finished?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          completeSession(session.id);
        },
      },
    ]);
  };

  const isComplete = session.status === 'completed';
  const hasPending = !!session.pendingGame;
  const gamesDone = session.games.length;
  const nextGameIndex = hasPending ? session.pendingGame!.gameIndex : gamesDone;
  const nextDealerIndex = getDealerIndex(session.firstDealerIndex, nextGameIndex, session.players.length);
  const nextDealer = session.players[nextDealerIndex];
  const bidOrderIndices = getBidOrder(nextDealerIndex, session.players.length);
  const bidOrderPlayers = bidOrderIndices.map(i => session.players[i]);
  const partnersNeeded = getPartnersNeeded(session.players.length);

  const leaderboard = getTOSLeaderboard(session.players, session.games);
  const rankEmoji = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: isComplete ? 'Session Over' : 'Scoreboard',
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.75}>
              <View style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {isComplete && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>🏆 Session Complete</Text>
            </View>
          )}

          {/* Leaderboard */}
          <View style={styles.leaderboard}>
            {leaderboard.map((entry, i) => (
              <View key={entry.playerId} style={[styles.playerRow, i === 0 && styles.playerRowFirst]}>
                <Text style={styles.rankEmoji}>{rankEmoji(entry.rank)}</Text>
                <Text style={[styles.playerName, i === 0 && styles.playerNameFirst]}>{entry.name}</Text>
                <View style={[styles.scorePill, i === 0 && styles.scorePillFirst]}>
                  <Text style={[styles.scoreText, i === 0 && styles.scoreTextFirst]}>{entry.total}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pending game info */}
          {hasPending && session.pendingGame && (
            <View style={[styles.infoCard, styles.pendingCard]}>
              <Text style={styles.infoCardTitle}>
                Game {session.pendingGame.gameIndex + 1} — In Progress
              </Text>
              <Text style={styles.infoCardMeta}>
                Bidder: <Text style={styles.infoCardHighlight}>{session.players.find(p => p.id === session.pendingGame!.bidderId)?.name}</Text>
                {'  ·  '}Bid: <Text style={styles.infoCardHighlight}>{session.pendingGame.finalBid}</Text>
              </Text>
              <Text style={[styles.infoCardMeta, { color: SUIT_COLOR[session.pendingGame.trumpSuit] }]}>
                Trump: {SUIT_LABEL[session.pendingGame.trumpSuit]}
              </Text>
              {session.pendingGame.partnerCards.length > 0 && (
                <Text style={styles.infoCardMeta}>
                  Partner card{session.pendingGame.partnerCards.length > 1 ? 's' : ''}:{' '}
                  <Text style={styles.infoCardHighlight}>
                    {session.pendingGame.partnerCards.map(c =>
                      `${cardLabel(c)}${c.copyPreference ? ` (${c.copyPreference})` : ''}`
                    ).join(', ')}
                  </Text>
                </Text>
              )}
            </View>
          )}

          {/* Next game info (no pending) */}
          {!hasPending && !isComplete && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoCardTitle}>Game {gamesDone + 1}</Text>
                <Text style={styles.infoCardSub}>{gamesDone} played</Text>
              </View>
              <View style={styles.chipRow}>
                <InfoChip label="Dealer" value={nextDealer.name} />
                <InfoChip label="Partners" value={partnersNeeded === 0 ? 'None (1v3)' : `${partnersNeeded}`} />
                <InfoChip label="Decks" value={session.twoDecks ? '2' : '1'} />
              </View>
              <View style={styles.bidOrderRow}>
                <Text style={styles.bidOrderLabel}>Bid order  </Text>
                <Text style={styles.bidOrderPlayers}>
                  {bidOrderPlayers.map((p, i) =>
                    i === 0 ? `${p.name} (opens 125)` : i === bidOrderPlayers.length - 1 ? ` → ${p.name} 🎯` : ` → ${p.name}`
                  ).join('')}
                </Text>
              </View>
            </View>
          )}

          {/* History */}
          {session.games.length > 0 && (
            <TouchableOpacity
              style={styles.historyToggle}
              onPress={() => setShowHistory(v => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.historyToggleText}>
                {showHistory ? '▲' : '▼'}  {session.games.length} Game{session.games.length !== 1 ? 's' : ''} Played
              </Text>
            </TouchableOpacity>
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
            {hasPending ? (
              <Button
                label={`Enter Results for Game ${session.pendingGame!.gameIndex + 1}`}
                onPress={() => router.push(`/three-of-spades/${id}/game`)}
                style={styles.footerBtn}
              />
            ) : (
              <>
                <Button
                  label={`Enter Game ${gamesDone + 1}`}
                  onPress={() => router.push(`/three-of-spades/${id}/game`)}
                  style={styles.footerBtn}
                />
                {gamesDone > 0 && (
                  <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.7}>
                    <Text style={styles.completeBtnText}>Complete Session</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
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
  chip: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  value: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
});

function GameHistoryCard({ game, players }: { game: TOSGame; players: { id: string; name: string }[] }) {
  const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? id;
  const bidderName = nameOf(game.bidderId);
  const partnerNames = game.partnerPlayerIds.map(nameOf);
  const won = game.biddingTeamPoints >= game.finalBid;

  return (
    <View style={historyStyles.card}>
      <View style={historyStyles.header}>
        <Text style={historyStyles.title}>Game {game.gameIndex + 1}</Text>
        <Text style={[historyStyles.trump, { color: SUIT_COLOR[game.trumpSuit] }]}>
          {SUIT_SYMBOL[game.trumpSuit]} {game.trumpSuit.charAt(0).toUpperCase() + game.trumpSuit.slice(1)}
        </Text>
        <View style={[historyStyles.resultPill, won ? historyStyles.resultWon : historyStyles.resultLost]}>
          <Text style={historyStyles.resultText}>{won ? 'Won' : 'Lost'}</Text>
        </View>
      </View>
      <Text style={historyStyles.bidLine}>
        {bidderName} bid {game.finalBid}
        {partnerNames.length > 0 ? `  ·  Partner: ${partnerNames.join(', ')}` : ''}
        {'  ·  '}Got {game.biddingTeamPoints} pts
      </Text>
      {game.scores.map((s) => {
        if (s.gameScore === 0) return null;
        return (
          <View key={s.playerId} style={historyStyles.row}>
            <Text style={historyStyles.name}>{nameOf(s.playerId)}</Text>
            <Text style={[historyStyles.score, s.gameScore > 0 ? historyStyles.scoreGreen : historyStyles.scoreRed]}>
              {s.gameScore > 0 ? '+' : ''}{s.gameScore}
            </Text>
            <Text style={historyStyles.cumulative}>{s.cumulativeScore}</Text>
          </View>
        );
      })}
    </View>
  );
}

const historyStyles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.sm, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, flex: 1 },
  trump: { fontSize: 13, fontWeight: '600' },
  resultPill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  resultWon: { backgroundColor: colors.success + '22' },
  resultLost: { backgroundColor: colors.danger + '22' },
  resultText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  bidLine: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 4 },
  name: { flex: 1, fontSize: 14, color: colors.textPrimary },
  score: { fontSize: 13, fontWeight: '700', width: 52, textAlign: 'right' },
  scoreGreen: { color: colors.success },
  scoreRed: { color: colors.danger },
  cumulative: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, width: 44, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  notFoundText: { color: colors.textSecondary },
  deleteBtn: {
    backgroundColor: colors.danger,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  completedBanner: {
    backgroundColor: colors.gold + '22', borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center', marginBottom: spacing.md,
  },
  completedText: { fontSize: 16, fontWeight: '700', color: colors.gold },
  leaderboard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    overflow: 'hidden', marginBottom: spacing.md,
  },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm,
  },
  playerRowFirst: { backgroundColor: colors.primary + '18' },
  rankEmoji: { fontSize: 20, width: 30 },
  playerName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  playerNameFirst: { color: colors.primaryLight },
  scorePill: {
    backgroundColor: colors.surfaceAlt, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, minWidth: 54, alignItems: 'center',
  },
  scorePillFirst: { backgroundColor: colors.primary },
  scoreText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  scoreTextFirst: { color: '#fff' },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  pendingCard: { borderLeftWidth: 3, borderLeftColor: colors.accent },
  infoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  infoCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  infoCardSub: { fontSize: 13, color: colors.textMuted },
  infoCardMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  infoCardHighlight: { color: colors.textPrimary, fontWeight: '600' },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  bidOrderRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: 4 },
  bidOrderLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  bidOrderPlayers: { fontSize: 12, color: colors.textSecondary, flex: 1, flexWrap: 'wrap' },
  historyToggle: {
    padding: spacing.md, alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm,
  },
  historyToggleText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  historyList: { gap: spacing.sm },
  footer: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  footerBtn: { width: '100%' },
  completeBtn: { alignItems: 'center', paddingVertical: 6 },
  completeBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
});
