import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, fonts } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { getLeaderboard } from '@/lib/scoring';
import { Button } from '@/components/Button';
import { Round } from '@/lib/types';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const game = useGameStore((s) => s.getGame(id));
  const completeGame = useGameStore((s) => s.completeGame);
  const deleteGame = useGameStore((s) => s.deleteGame);
  const [showRounds, setShowRounds] = useState(false);

  if (!game) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Game not found</Text>
      </View>
    );
  }

  const leaderboard = getLeaderboard(game.players, game.rounds);

  const handleEndGame = () => {
    Alert.alert('End Game', 'Mark this game as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Game',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          completeGame(game.id);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Game', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGame(game.id);
          router.replace('/');
        },
      },
    ]);
  };

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
          title: game.status === 'completed' ? 'Game Over' : 'Scoreboard',
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
          {game.status === 'completed' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>🏆  Game Complete</Text>
            </View>
          )}

          <View style={styles.leaderboard}>
            {leaderboard.map((entry, i) => {
              const isLeader = i === 0;
              return (
                <View key={entry.playerId} style={styles.playerRowWrap}>
                  {isLeader && (
                    <LinearGradient
                      colors={[colors.primary + '30', colors.primary + '08']}
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

          {game.rounds.length > 0 && (
            <Pressable
              style={styles.roundsToggle}
              onPress={() => setShowRounds((v) => !v)}
            >
              <Text style={styles.roundsToggleText}>
                {showRounds ? '▲' : '▼'}  {game.rounds.length} Round{game.rounds.length !== 1 ? 's' : ''} Played
              </Text>
            </Pressable>
          )}

          {showRounds && (
            <View style={styles.roundsList}>
              {game.rounds.map((round, idx) => (
                <RoundSummaryCard
                  key={round.id}
                  round={round}
                  roundNumber={idx + 1}
                  players={game.players}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {game.status === 'active' && (
          <View style={styles.footer}>
            <Button
              label="+ New Round"
              onPress={() => router.push(`/game/${id}/round`)}
              style={styles.actionBtn}
            />
            <Button
              label="End Game"
              onPress={handleEndGame}
              variant="ghost"
              style={styles.actionBtn}
            />
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

function RoundSummaryCard({
  round, roundNumber, players,
}: {
  round: Round;
  roundNumber: number;
  players: { id: string; name: string }[];
}) {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? id;
  const declarerScore = round.scores.find((s) => s.playerId === round.declarerId);
  const declarerWon = declarerScore?.roundScore === 0;

  return (
    <View style={styles.roundCard}>
      <View style={styles.roundCardHeader}>
        <Text style={styles.roundCardTitle}>Round {roundNumber}</Text>
        <Text style={styles.roundCardDeclarer}>
          {declarerWon ? '✅' : '❌'} {nameOf(round.declarerId)} declared
        </Text>
      </View>
      {round.scores.map((s) => (
        <View key={s.playerId} style={styles.roundScoreRow}>
          <Text style={styles.roundScoreName}>{nameOf(s.playerId)}</Text>
          <View style={styles.roundScoreRight}>
            <Text style={[
              styles.roundScoreDelta,
              s.roundScore === 0 && styles.scoreGreen,
              s.roundScore > 20 && styles.scoreRed,
            ]}>
              +{s.roundScore}
            </Text>
            <Text style={styles.roundScoreTotal}>{s.cumulativeScore}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  deleteBtn: {
    backgroundColor: colors.danger,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  notFoundText: { fontFamily: fonts.regular, color: colors.textSecondary },
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
  playerRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rankEmoji: { fontSize: 20, width: 32 },
  playerName: { flex: 1, fontSize: 16, fontFamily: fonts.semiBold, color: colors.textPrimary },
  playerNameLeader: { fontFamily: fonts.bold, color: colors.primaryLight },
  scorePill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 54,
    alignItems: 'center',
  },
  scorePillLeader: { backgroundColor: colors.primary },
  scoreText: { fontSize: 15, fontFamily: fonts.bold, color: colors.textSecondary },
  scoreTextLeader: { color: '#fff' },
  roundsToggle: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundsToggleText: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textSecondary },
  roundsList: { gap: spacing.sm },
  roundCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roundCardTitle: { fontSize: 13, fontFamily: fonts.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  roundCardDeclarer: { fontSize: 13, fontFamily: fonts.regular, color: colors.textMuted },
  roundScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  roundScoreName: { fontSize: 14, fontFamily: fonts.regular, color: colors.textPrimary },
  roundScoreRight: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  roundScoreDelta: { fontSize: 14, fontFamily: fonts.semiBold, color: colors.textSecondary, width: 48, textAlign: 'right' },
  scoreGreen: { color: colors.success },
  scoreRed: { color: colors.danger },
  roundScoreTotal: { fontSize: 14, fontFamily: fonts.bold, color: colors.textPrimary, width: 48, textAlign: 'right' },
  footer: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  actionBtn: { width: '100%' },
});
