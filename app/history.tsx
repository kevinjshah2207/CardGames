import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { getLeaderboard } from '@/lib/scoring';
import { Game } from '@/lib/types';

export default function HistoryScreen() {
  const router = useRouter();
  const games = useGameStore((s) => s.games);

  return (
    <>
      <Stack.Screen options={{ title: 'History' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {games.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={styles.emptyText}>No games recorded yet</Text>
          </View>
        ) : (
          <FlatList
            data={games}
            keyExtractor={(g) => g.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <GameHistoryItem game={item} onPress={() => router.push(`/game/${item.id}`)} />}
          />
        )}
      </SafeAreaView>
    </>
  );
}

function GameHistoryItem({ game, onPress }: { game: Game; onPress: () => void }) {
  const lb = getLeaderboard(game.players, game.rounds);
  const winner = lb[0];
  const date = new Date(game.createdAt);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardPlayers}>{game.players.map((p) => p.name).join(', ')}</Text>
          <View style={[styles.badge, game.status === 'active' ? styles.badgeActive : styles.badgeDone]}>
            <Text style={[styles.badgeText, game.status === 'active' ? styles.badgeActiveText : styles.badgeDoneText]}>
              {game.status === 'active' ? 'Active' : 'Done'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>
          {date.toLocaleDateString()} · {game.rounds.length} rounds
          {winner && game.rounds.length > 0 ? `  ·  🏆 ${winner.name} (${winner.total}pts)` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardLeft: { flex: 1 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardPlayers: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginRight: spacing.sm },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeActive: { backgroundColor: colors.success + '22' },
  badgeDone: { backgroundColor: colors.border },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeActiveText: { color: colors.success },
  badgeDoneText: { color: colors.textMuted },
  cardMeta: { fontSize: 13, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});
