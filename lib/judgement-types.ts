export type TrumpSuit = 'spades' | 'diamonds' | 'clubs' | 'hearts' | 'none';

export const TRUMP_ORDER: TrumpSuit[] = ['spades', 'diamonds', 'clubs', 'hearts', 'none'];

export const TRUMP_LABEL: Record<TrumpSuit, string> = {
  spades: '♠ Spades',
  diamonds: '♦ Diamonds',
  clubs: '♣ Clubs',
  hearts: '♥ Hearts',
  none: 'No Trump',
};

export const TRUMP_COLOR: Record<TrumpSuit, string> = {
  spades: '#F0EFF8',
  diamonds: '#E05A5A',
  clubs: '#F0EFF8',
  hearts: '#E05A5A',
  none: '#8A89A0',
};

export interface JudgementPlayer {
  id: string;
  name: string;
}

export interface JudgementBid {
  playerId: string;
  bid: number;
}

export interface JudgementHands {
  playerId: string;
  hands: number;
}

export interface JudgementScore {
  playerId: string;
  bid: number;
  actual: number;
  gameScore: number;
  cumulativeScore: number;
}

export interface JudgementGame {
  gameIndex: number;
  cardCount: number;
  trumpSuit: TrumpSuit;
  dealerIndex: number;
  bids: JudgementBid[];
  handsWon: JudgementHands[];
  scores: JudgementScore[];
}

export interface JudgementSession {
  id: string;
  players: JudgementPlayer[];
  startFromMax: boolean;
  maxCards: number;
  firstDealerIndex: number;
  games: JudgementGame[];
  status: 'active' | 'completed';
  createdAt: number;
  completedAt?: number;
}
