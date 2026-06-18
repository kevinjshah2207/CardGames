import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game, Player, Round } from './types';
import { computeRoundScores, getCumulatives } from './scoring';

interface GameStore {
  games: Game[];
  createGame: (playerNames: string[]) => string;
  addRound: (gameId: string, declarerId: string, entries: { playerId: string; handTotal: number }[]) => void;
  completeGame: (gameId: string) => void;
  deleteGame: (gameId: string) => void;
  getGame: (gameId: string) => Game | undefined;
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      games: [],

      createGame: (playerNames) => {
        const id = uuid();
        const players: Player[] = playerNames.map((name) => ({ id: uuid(), name: name.trim() }));
        const game: Game = { id, players, rounds: [], status: 'active', createdAt: Date.now() };
        set((s) => ({ games: [game, ...s.games] }));
        return id;
      },

      addRound: (gameId, declarerId, entries) => {
        set((s) => ({
          games: s.games.map((g) => {
            if (g.id !== gameId) return g;
            const prevCumulatives = getCumulatives(g.rounds, g.players.map((p) => p.id));
            const scores = computeRoundScores({ entries, declarerId, previousCumulatives: prevCumulatives });
            const round: Round = { id: uuid(), declarerId, entries, scores };
            return { ...g, rounds: [...g.rounds, round] };
          }),
        }));
      },

      completeGame: (gameId) => {
        set((s) => ({
          games: s.games.map((g) =>
            g.id === gameId ? { ...g, status: 'completed', completedAt: Date.now() } : g
          ),
        }));
      },

      deleteGame: (gameId) => {
        set((s) => ({ games: s.games.filter((g) => g.id !== gameId) }));
      },

      getGame: (gameId) => get().games.find((g) => g.id === gameId),
    }),
    {
      name: 'declare-games',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
