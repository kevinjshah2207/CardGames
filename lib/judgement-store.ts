import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JudgementSession, JudgementPlayer, JudgementBid, JudgementHands, JudgementGame } from './judgement-types';
import {
  getGameSequence, getTrumpForGame, getDealerIndex,
  computeJudgementScores, getJudgementCumulatives,
} from './judgement-scoring';

interface JudgementStore {
  sessions: JudgementSession[];
  createSession: (playerNames: string[], firstDealerIndex: number, startFromMax: boolean) => string;
  addGame: (sessionId: string, bids: JudgementBid[], handsWon: JudgementHands[]) => void;
  deleteSession: (sessionId: string) => void;
  getSession: (sessionId: string) => JudgementSession | undefined;
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useJudgementStore = create<JudgementStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      createSession: (playerNames, firstDealerIndex, startFromMax) => {
        const id = uuid();
        const players: JudgementPlayer[] = playerNames.map(name => ({
          id: uuid(),
          name: name.trim(),
        }));
        const maxCards = Math.floor(52 / players.length);
        const session: JudgementSession = {
          id,
          players,
          startFromMax,
          maxCards,
          firstDealerIndex,
          games: [],
          status: 'active',
          createdAt: Date.now(),
        };
        set(s => ({ sessions: [session, ...s.sessions] }));
        return id;
      },

      addGame: (sessionId, bids, handsWon) => {
        set(s => ({
          sessions: s.sessions.map(session => {
            if (session.id !== sessionId) return session;
            const gameIndex = session.games.length;
            const sequence = getGameSequence(session.startFromMax, session.maxCards);
            const cardCount = sequence[gameIndex];
            const trumpSuit = getTrumpForGame(gameIndex);
            const dealerIndex = getDealerIndex(session.firstDealerIndex, gameIndex, session.players.length);
            const prevCumulatives = getJudgementCumulatives(session.games);
            const scores = computeJudgementScores(bids, handsWon, prevCumulatives);
            const game: JudgementGame = { gameIndex, cardCount, trumpSuit, dealerIndex, bids, handsWon, scores };
            const newGames = [...session.games, game];
            const done = newGames.length >= sequence.length;
            return {
              ...session,
              games: newGames,
              status: done ? 'completed' : 'active',
              ...(done ? { completedAt: Date.now() } : {}),
            };
          }),
        }));
      },

      deleteSession: (sessionId) => {
        set(s => ({ sessions: s.sessions.filter(session => session.id !== sessionId) }));
      },

      getSession: (sessionId) => get().sessions.find(s => s.id === sessionId),
    }),
    {
      name: 'judgement-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
