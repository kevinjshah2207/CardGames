import type { RoundEntry, RoundScore, Round } from './types';

export interface ScoringInput {
  entries: RoundEntry[];
  declarerId: string;
  previousCumulatives: Record<string, number>;
}

export interface ScoringResult {
  scores: Omit<RoundScore, 'cumulativeScore'>[];
  declarerWon: boolean;
}

export function computeRoundScores(input: ScoringInput): RoundScore[] {
  const { entries, declarerId, previousCumulatives } = input;

  const declarerEntry = entries.find((e) => e.playerId === declarerId);
  if (!declarerEntry) throw new Error('Declarer not found in entries');

  const declarerTotal = declarerEntry.handTotal;
  const otherEntries = entries.filter((e) => e.playerId !== declarerId);
  const otherTotals = otherEntries.map((e) => e.handTotal);

  // Declarer with 0 can never lose; otherwise loses if any other player's total <= declarer's
  const declarerWon =
    declarerTotal === 0 || otherTotals.every((t) => t > declarerTotal);

  const maxTotal = Math.max(...entries.map((e) => e.handTotal));

  // For non-declarers: the lowest total among non-declarers only
  const minOtherTotal = Math.min(...otherTotals);

  const roundScores: RoundScore[] = entries.map((entry) => {
    let roundScore: number;

    if (entry.playerId === declarerId) {
      roundScore = declarerWon ? 0 : 2 * maxTotal;
    } else if (declarerWon) {
      // When declarer wins, everyone else just pays their hand total
      roundScore = entry.handTotal;
    } else {
      // Declarer lost: non-declarers tied for lowest get 0
      roundScore = entry.handTotal === minOtherTotal ? 0 : entry.handTotal;
    }

    return {
      playerId: entry.playerId,
      roundScore,
      cumulativeScore: (previousCumulatives[entry.playerId] ?? 0) + roundScore,
    };
  });

  return roundScores;
}

export function getLeaderboard(
  players: { id: string; name: string }[],
  rounds: Round[]
): { playerId: string; name: string; total: number; rank: number }[] {
  const totals: Record<string, number> = {};
  players.forEach((p) => (totals[p.id] = 0));

  for (const round of rounds) {
    for (const score of round.scores) {
      totals[score.playerId] = score.cumulativeScore;
    }
  }

  const sorted = players
    .map((p) => ({ playerId: p.id, name: p.name, total: totals[p.id] ?? 0 }))
    .sort((a, b) => a.total - b.total);

  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}

export function getCumulatives(rounds: Round[], playerIds: string[]): Record<string, number> {
  if (rounds.length === 0) return Object.fromEntries(playerIds.map((id) => [id, 0]));
  const last = rounds[rounds.length - 1];
  return Object.fromEntries(last.scores.map((s) => [s.playerId, s.cumulativeScore]));
}
