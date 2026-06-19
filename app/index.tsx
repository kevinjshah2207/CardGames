import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, fonts } from '@/lib/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const GAMES = [
  {
    route: '/declare',
    icon: '🃏',
    name: 'Declare',
    desc: 'Lowest hand wins · Declare to win it all',
    gradientStart: '#7C6AF7',
    gradientEnd: '#5B4ED4',
  },
  {
    route: '/judgement',
    icon: '⚖️',
    name: 'Judgement',
    desc: 'Bid exactly right to score · Highest total wins',
    gradientStart: '#F7A26A',
    gradientEnd: '#D4784A',
  },
  {
    route: '/three-of-spades',
    icon: '♠️',
    name: '3 of Spades',
    desc: 'Auction · Trump · Secret partners',
    gradientStart: '#4CAF81',
    gradientEnd: '#2E8A60',
  },
] as const;

function GameCard({ route, icon, name, desc, gradientStart, gradientEnd }: typeof GAMES[number]) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={animStyle}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      onPress={() => router.push(route)}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={[gradientStart + '28', gradientStart + '08']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.cardAccent, { backgroundColor: gradientStart }]} />
        <View style={styles.cardInner}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View style={styles.cardText}>
            <Text style={styles.cardName}>{name}</Text>
            <Text style={styles.cardDesc}>{desc}</Text>
          </View>
          <Text style={[styles.cardChevron, { color: gradientStart }]}>›</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Card Games</Text>
          <Text style={styles.subtitle}>Score keeper</Text>
        </View>

        <View style={styles.gameList}>
          {GAMES.map((g) => (
            <GameCard key={g.route} {...g} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 42, fontFamily: fonts.extraBold, color: colors.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: 16, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 4 },
  gameList: { gap: spacing.md },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingLeft: spacing.lg + 3,
    gap: spacing.md,
  },
  cardIcon: { fontSize: 34 },
  cardText: { flex: 1 },
  cardName: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 3 },
  cardDesc: { fontSize: 13, fontFamily: fonts.regular, color: colors.textSecondary },
  cardChevron: { fontSize: 28, fontFamily: fonts.regular },
});
