export type Suit = 'spades' | 'diamonds' | 'clubs' | 'hearts';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export const SUITS: Suit[] = ['spades', 'diamonds', 'clubs', 'hearts'];
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

export const SUIT_LABEL: Record<Suit, string> = {
  spades: '♠ Spades',
  diamonds: '♦ Diamonds',
  clubs: '♣ Clubs',
  hearts: '♥ Hearts',
};

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  diamonds: '♦',
  clubs: '♣',
  hearts: '♥',
};

export const SUIT_COLOR: Record<Suit, string> = {
  spades: '#F0EFF8',
  diamonds: '#E05A5A',
  clubs: '#F0EFF8',
  hearts: '#E05A5A',
};

export interface PartnerCard {
  rank: Rank;
  suit: Suit;
  copyPreference?: 'first' | 'second';
}

export function cardLabel(card: PartnerCard): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

export interface TOSPlayer {
  id: string;
  name: string;
}

export interface TOSScore {
  playerId: string;
  gameScore: number;
  cumulativeScore: number;
}

export interface TOSPendingGame {
  gameIndex: number;
  dealerIndex: number;
  bidderId: string;
  finalBid: number;
  trumpSuit: Suit;
  partnerCards: PartnerCard[];
}

export interface TOSGame extends TOSPendingGame {
  partnerPlayerIds: string[];
  biddingTeamPoints: number;
  scores: TOSScore[];
}

export interface TOSSession {
  id: string;
  players: TOSPlayer[];
  firstDealerIndex: number;
  twoDecks: boolean;
  games: TOSGame[];
  pendingGame?: TOSPendingGame;
  status: 'active' | 'completed';
  createdAt: number;
  completedAt?: number;
}
