import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';
import { useGameStore } from '@/lib/store';
import { getLeaderboard } from '@/lib/scoring';

export default function DeclareHub() {
  const router = useRouter();
  const games = useGameStore((s) => s.games);

  const activeGames = games.filter((g) => g.status === 'active');
  const completedGames = games.filter((g) => g.status === 'completed');

  return (
    <>
      <Stack.Screen options={{ title: 'Declare' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.newGameBtn}
            onPress={() => router.push('/game/new')}
            activeOpacity={0.8}
          >
            <Text style={styles.newGameIcon}>＋</Text>
            <Text style={styles.newGameLabel}>New Game</Text>
          </TouchableOpacity>

          <View style={styles.quickLinks}>
            <Pressable style={styles.quickLink} onPress={() => router.push('/history')}>
              <Text style={styles.quickLinkIcon}>📜</Text>
              <Text style={styles.quickLinkText}>History</Text>
            </Pressable>
            <Pressable style={styles.quickLink} onPress={() => router.push('/stats')}>
              <Text style={styles.quickLinkIcon}>📊</Text>
              <Text style={styles.quickLinkText}>Stats</Text>
            </Pressable>
            <Pressable style={styles.quickLink} onPress={() => router.push('/rules')}>
              <Text style={styles.quickLinkIcon}>📖</Text>
              <Text style={styles.quickLinkText}>Rules</Text>
            </Pressable>
          </View>

          {activeGames.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Games</Text>
              {activeGames.map((game) => {
                const leader = getLeaderboard(game.players, game.rounds)[0];
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={styles.gameCard}
                    onPress={() => router.push(`/game/${game.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gameCardLeft}>
                      <Text style={styles.gameCardTitle}>
                        {game.players.map((p) => p.name).join(', ')}
                      </Text>
                      <Text style={styles.gameCardMeta}>
                        {game.rounds.length} round{game.rounds.length !== 1 ? 's' : ''}
                        {leader && game.rounds.length > 0 ? `  ·  ${leader.name} leading` : ''}
                      </Text>
                    </View>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>Active</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {completedGames.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Completed</Text>
              {completedGames.slice(0, 3).map((game) => {
                const winner = getLeaderboard(game.players, game.rounds)[0];
                return (
                  <TouchableOpacity
                    key={game.id}
                    style={styles.gameCard}
                    onPress={() => router.push(`/game/${game.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gameCardLeft}>
                      <Text style={styles.gameCardTitle}>
                        {game.players.map((p) => p.name).join(', ')}
                      </Text>
                      <Text style={styles.gameCardMeta}>
                        {game.rounds.length} rounds
                        {winner ? `  ·  🏆 ${winner.name}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.gameCardDate}>
                      {new Date(game.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {games.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🃏</Text>
              <Text style={styles.emptyText}>No games yet</Text>
              <Text style={styles.emptySubtext}>Tap New Game to get started</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 40 },
  newGameBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.md,
  },
  newGameIcon: { fontSize: 22, color: colors.textPrimary, fontWeight: '300' },
  newGameLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  quickLinks: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickLink: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  quickLinkIcon: { fontSize: 22 },
  quickLinkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameCardLeft: { flex: 1, marginRight: spacing.sm },
  gameCardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  gameCardMeta: { fontSize: 13, color: colors.textSecondary },
  gameCardDate: { fontSize: 12, color: colors.textMuted },
  activePill: {
    backgroundColor: colors.success + '22',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: { fontSize: 12, fontWeight: '700', color: colors.success },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
});
