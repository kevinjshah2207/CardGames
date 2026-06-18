import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';
import { useJudgementStore } from '@/lib/judgement-store';
import { getJudgementLeaderboard, getGameSequence } from '@/lib/judgement-scoring';
import { TRUMP_LABEL } from '@/lib/judgement-types';

export default function JudgementHub() {
  const router = useRouter();
  const sessions = useJudgementStore((s) => s.sessions);

  const activeSessions = sessions.filter((s) => s.status === 'active');
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  return (
    <>
      <Stack.Screen options={{ title: 'Judgement' }} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/judgement/new')}
            activeOpacity={0.8}
          >
            <Text style={styles.newBtnIcon}>＋</Text>
            <Text style={styles.newBtnLabel}>New Session</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rulesLink}
            onPress={() => router.push('/judgement/rules')}
            activeOpacity={0.7}
          >
            <Text style={styles.rulesLinkIcon}>📖</Text>
            <Text style={styles.rulesLinkText}>Rules</Text>
          </TouchableOpacity>

          {activeSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Sessions</Text>
              {activeSessions.map((session) => {
                const sequence = getGameSequence(session.startFromMax, session.maxCards);
                const gamesDone = session.games.length;
                const total = sequence.length;
                const currentCardCount = sequence[gamesDone];
                const leader = getJudgementLeaderboard(session.players, session.games)[0];
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionCard}
                    onPress={() => router.push(`/judgement/${session.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionCardLeft}>
                      <Text style={styles.sessionCardTitle}>
                        {session.players.map((p) => p.name).join(', ')}
                      </Text>
                      <Text style={styles.sessionCardMeta}>
                        Game {gamesDone + 1} of {total}
                        {currentCardCount ? `  ·  ${currentCardCount} cards` : ''}
                        {leader && gamesDone > 0 ? `  ·  ${leader.name} leading` : ''}
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

          {completedSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed</Text>
              {completedSessions.slice(0, 3).map((session) => {
                const winner = getJudgementLeaderboard(session.players, session.games)[0];
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionCard}
                    onPress={() => router.push(`/judgement/${session.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.sessionCardLeft}>
                      <Text style={styles.sessionCardTitle}>
                        {session.players.map((p) => p.name).join(', ')}
                      </Text>
                      <Text style={styles.sessionCardMeta}>
                        {session.games.length} games
                        {winner ? `  ·  🏆 ${winner.name}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.sessionCardDate}>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {sessions.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚖️</Text>
              <Text style={styles.emptyText}>No sessions yet</Text>
              <Text style={styles.emptySubtext}>Tap New Session to get started</Text>
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
  newBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.sm,
  },
  newBtnIcon: { fontSize: 22, color: colors.textPrimary, fontWeight: '300' },
  newBtnLabel: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  rulesLink: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  rulesLinkIcon: { fontSize: 18 },
  rulesLinkText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionCardLeft: { flex: 1, marginRight: spacing.sm },
  sessionCardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  sessionCardMeta: { fontSize: 13, color: colors.textSecondary },
  sessionCardDate: { fontSize: 12, color: colors.textMuted },
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
