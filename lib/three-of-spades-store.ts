import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOSSession, TOSPlayer, TOSGame, TOSPendingGame, Suit, PartnerCard } from './three-of-spades-types';
import { computeTOSScores, getTOSCumulatives, getDealerIndex } from './three-of-spades-scoring';

interface TOSStore {
  sessions: TOSSession[];
  createSession: (playerNames: string[], firstDealerIndex: number) => string;
  startGame: (sessionId: string, bidderId: string, finalBid: number, trumpSuit: Suit, partnerCards: PartnerCard[]) => void;
  finalizeGame: (sessionId: string, partnerPlayerIds: string[], biddingTeamPoints: number) => void;
  completeSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  getSession: (sessionId: string) => TOSSession | undefined;
}

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useTOSStore = create<TOSStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      createSession: (playerNames, firstDealerIndex) => {
        const id = uuid();
        const players: TOSPlayer[] = playerNames.map(name => ({ id: uuid(), name: name.trim() }));
        const session: TOSSession = {
          id,
          players,
          firstDealerIndex,
          twoDecks: players.length >= 6,
          games: [],
          status: 'active',
          createdAt: Date.now(),
        };
        set(s => ({ sessions: [session, ...s.sessions] }));
        return id;
      },

      startGame: (sessionId, bidderId, finalBid, trumpSuit, partnerCards) => {
        set(s => ({
          sessions: s.sessions.map(session => {
            if (session.id !== sessionId) return session;
            const gameIndex = session.games.length;
            const dealerIndex = getDealerIndex(session.firstDealerIndex, gameIndex, session.players.length);
            const pending: TOSPendingGame = { gameIndex, dealerIndex, bidderId, finalBid, trumpSuit, partnerCards };
            return { ...session, pendingGame: pending };
          }),
        }));
      },

      finalizeGame: (sessionId, partnerPlayerIds, biddingTeamPoints) => {
        set(s => ({
          sessions: s.sessions.map(session => {
            if (session.id !== sessionId || !session.pendingGame) return session;
            const pending = session.pendingGame;
            const prevCumulatives = getTOSCumulatives(session.games);
            const scores = computeTOSScores(
              session.players,
              pending.bidderId,
              partnerPlayerIds,
              pending.finalBid,
              biddingTeamPoints,
              prevCumulatives,
            );
            const game: TOSGame = { ...pending, partnerPlayerIds, biddingTeamPoints, scores };
            return { ...session, games: [...session.games, game], pendingGame: undefined };
          }),
        }));
      },

      completeSession: (sessionId) => {
        set(s => ({
          sessions: s.sessions.map(session =>
            session.id === sessionId
              ? { ...session, status: 'completed', completedAt: Date.now() }
              : session
          ),
        }));
      },

      deleteSession: (sessionId) => {
        set(s => ({ sessions: s.sessions.filter(session => session.id !== sessionId) }));
      },

      getSession: (sessionId) => get().sessions.find(s => s.id === sessionId),
    }),
    {
      name: 'three-of-spades-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
