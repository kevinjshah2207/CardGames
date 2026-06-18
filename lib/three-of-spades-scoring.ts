import { TOSPlayer, TOSGame, TOSScore } from './three-of-spades-types';

export const TOTAL_POINTS = 250;
export const MIN_BID = 125;

// 4→1, 5→2, 6→2, 7→3, 8→3, 9→4 ...
export function getBiddingTeamSize(numPlayers: number): number {
  return Math.ceil(numPlayers / 2) - 1;
}

export function getPartnersNeeded(numPlayers: number): number {
  return getBiddingTeamSize(numPlayers) - 1;
}

export function getDealerIndex(
  firstDealerIndex: number,
  gameIndex: number,
  numPlayers: number,
): number {
  return (firstDealerIndex + gameIndex) % numPlayers;
}

export function getBidOrder(dealerIndex: number, numPlayers: number): number[] {
  return Array.from({ length: numPlayers }, (_, i) => (dealerIndex + 1 + i) % numPlayers);
}

export function getTOSCumulatives(games: TOSGame[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const g of games) {
    for (const s of g.scores) {
      result[s.playerId] = s.cumulativeScore;
    }
  }
  return result;
}

export function computeTOSScores(
  players: TOSPlayer[],
  bidderId: string,
  partnerPlayerIds: string[],
  finalBid: number,
  biddingTeamPoints: number,
  prevCumulatives: Record<string, number>,
): TOSScore[] {
  const won = biddingTeamPoints >= finalBid;
  return players.map(p => {
    let gameScore = 0;
    if (p.id === bidderId) {
      gameScore = won ? 2 * finalBid : -(2 * finalBid);
    } else if (partnerPlayerIds.includes(p.id)) {
      gameScore = won ? finalBid : -finalBid;
    }
    return {
      playerId: p.id,
      gameScore,
      cumulativeScore: (prevCumulatives[p.id] ?? 0) + gameScore,
    };
  });
}

export function getTOSLeaderboard(
  players: TOSPlayer[],
  games: TOSGame[],
): Array<{ playerId: string; name: string; total: number; rank: number }> {
  const cumulatives = getTOSCumulatives(games);
  const sorted = [...players]
    .map(p => ({ playerId: p.id, name: p.name, total: cumulatives[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
  let rank = 1;
  return sorted.map((e, i) => {
    if (i > 0 && sorted[i - 1].total !== e.total) rank = i + 1;
    return { ...e, rank };
  });
}
