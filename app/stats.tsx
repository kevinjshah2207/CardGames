import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { getLeaderboard } from '@/lib/scoring';

interface PlayerStat {
  name: string;
  gamesPlayed: number;
  wins: number;
  totalPoints: number;
  avgPoints: number;
  winRate: number;
}

export default function StatsScreen() {
  const games = useGameStore((s) => s.games);
  const completedGames = games.filter((g) => g.status === 'completed' && g.rounds.length > 0);

  // Aggregate stats per player name
  const statMap: Record<string, PlayerStat> = {};

  for (const game of completedGames) {
    const lb = getLeaderboard(game.players, game.rounds);
    const winner = lb[0];
    for (const entry of lb) {
      const key = entry.name;
      if (!statMap[key]) {
        statMap[key] = { name: key, gamesPlayed: 0, wins: 0, totalPoints: 0, avgPoints: 0, winRate: 0 };
      }
      statMap[key].gamesPlayed++;
      statMap[key].totalPoints += entry.total;
      if (entry.playerId === winner.playerId) statMap[key].wins++;
    }
  }

  const stats = Object.values(statMap).map((s) => ({
    ...s,
    avgPoints: s.gamesPlayed > 0 ? Math.round(s.totalPoints / s.gamesPlayed) : 0,
    winRate: s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0,
  })).sort((a, b) => b.winRate - a.winRate || a.avgPoints - b.avgPoints);

  return (
    <>
      <Stack.Screen options={{ title: 'Stats' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.summary}>
            <StatPill label="Games" value={String(completedGames.length)} />
            <StatPill label="Players tracked" value={String(stats.length)} />
          </View>

          {stats.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>Complete a game to see stats</Text>
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col, styles.colName, styles.headerText]}>Player</Text>
                <Text style={[styles.col, styles.headerText]}>GP</Text>
                <Text style={[styles.col, styles.headerText]}>Wins</Text>
                <Text style={[styles.col, styles.headerText]}>Avg</Text>
                <Text style={[styles.col, styles.headerText]}>Win%</Text>
              </View>
              {stats.map((s, i) => (
                <View key={s.name} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                  <View style={[styles.col, styles.colName]}>
                    {i === 0 && <Text style={styles.crown}>👑 </Text>}
                    <Text style={styles.playerName}>{s.name}</Text>
                  </View>
                  <Text style={[styles.col, styles.cellText]}>{s.gamesPlayed}</Text>
                  <Text style={[styles.col, styles.cellText]}>{s.wins}</Text>
                  <Text style={[styles.col, styles.cellText]}>{s.avgPoints}</Text>
                  <Text style={[styles.col, styles.cellText, styles.winRateText]}>{s.winRate}%</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md },
  summary: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  pill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  pillValue: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  pillLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  table: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  tableHeader: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerText: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: { backgroundColor: colors.surfaceAlt },
  col: { flex: 1, textAlign: 'center' },
  colName: { flex: 2, textAlign: 'left', flexDirection: 'row', alignItems: 'center' },
  crown: { fontSize: 14 },
  playerName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cellText: { fontSize: 14, color: colors.textSecondary },
  winRateText: { color: colors.primary, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
