import {
  TrumpSuit, TRUMP_ORDER,
  JudgementPlayer, JudgementBid, JudgementHands, JudgementScore, JudgementGame,
} from './judgement-types';

export function getGameSequence(startFromMax: boolean, maxCards: number): number[] {
  if (startFromMax) {
    return Array.from({ length: maxCards }, (_, i) => maxCards - i);
  }
  const up = Array.from({ length: maxCards }, (_, i) => i + 1);
  const down = Array.from({ length: maxCards - 1 }, (_, i) => maxCards - 1 - i);
  return [...up, ...down];
}

export function getTrumpForGame(gameIndex: number): TrumpSuit {
  return TRUMP_ORDER[gameIndex % TRUMP_ORDER.length];
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

export function getForbiddenBid(nonDealerBids: number[], cardCount: number): number {
  return cardCount - nonDealerBids.reduce((a, b) => a + b, 0);
}

export function computeJudgementScores(
  bids: JudgementBid[],
  handsWon: JudgementHands[],
  prevCumulatives: Record<string, number>,
): JudgementScore[] {
  return bids.map(b => {
    const actual = handsWon.find(t => t.playerId === b.playerId)?.hands ?? 0;
    const gameScore = actual === b.bid ? b.bid + 10 : 0;
    return {
      playerId: b.playerId,
      bid: b.bid,
      actual,
      gameScore,
      cumulativeScore: (prevCumulatives[b.playerId] ?? 0) + gameScore,
    };
  });
}

export function getJudgementCumulatives(games: JudgementGame[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const g of games) {
    for (const s of g.scores) {
      result[s.playerId] = s.cumulativeScore;
    }
  }
  return result;
}

export function getJudgementLeaderboard(
  players: JudgementPlayer[],
  games: JudgementGame[],
): Array<{ playerId: string; name: string; total: number; rank: number }> {
  const cumulatives = getJudgementCumulatives(games);
  const sorted = [...players]
    .map(p => ({ playerId: p.id, name: p.name, total: cumulatives[p.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
  let rank = 1;
  return sorted.map((e, i) => {
    if (i > 0 && sorted[i - 1].total !== e.total) rank = i + 1;
    return { ...e, rank };
  });
}
