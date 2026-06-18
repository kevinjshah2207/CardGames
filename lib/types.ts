export interface Player {
  id: string;
  name: string;
}

export interface RoundEntry {
  playerId: string;
  handTotal: number;
}

export interface RoundScore {
  playerId: string;
  roundScore: number;
  cumulativeScore: number;
}

export interface Round {
  id: string;
  declarerId: string;
  entries: RoundEntry[];
  scores: RoundScore[];
}

export interface Game {
  id: string;
  players: Player[];
  rounds: Round[];
  status: 'active' | 'completed';
  createdAt: number;
  completedAt?: number;
}
