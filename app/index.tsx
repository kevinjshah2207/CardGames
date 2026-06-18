import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Card Games</Text>
          <Text style={styles.subtitle}>Score keeper</Text>
        </View>

        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => router.push('/declare')}
          activeOpacity={0.8}
        >
          <Text style={styles.gameIcon}>🃏</Text>
          <View style={styles.gameInfo}>
            <Text style={styles.gameName}>Declare</Text>
            <Text style={styles.gameDesc}>Lowest hand wins · Declare to win it all</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => router.push('/judgement')}
          activeOpacity={0.8}
        >
          <Text style={styles.gameIcon}>⚖️</Text>
          <View style={styles.gameInfo}>
            <Text style={styles.gameName}>Judgement</Text>
            <Text style={styles.gameDesc}>Bid exactly right to score · Highest total wins</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => router.push('/three-of-spades')}
          activeOpacity={0.8}
        >
          <Text style={styles.gameIcon}>♠️</Text>
          <View style={styles.gameInfo}>
            <Text style={styles.gameName}>3 of Spades</Text>
            <Text style={styles.gameDesc}>Auction · Trump · Secret partners</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 42, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  gameIcon: { fontSize: 36 },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  gameDesc: { fontSize: 13, color: colors.textSecondary },
  chevron: { fontSize: 26, color: colors.textMuted, fontWeight: '300' },
});
