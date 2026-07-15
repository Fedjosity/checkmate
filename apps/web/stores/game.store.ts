import { create } from 'zustand';
import { getSocket } from '@/lib/socket/client';
import { Chess } from 'chess.js';
import { playMoveSound, playCaptureSound, playCheckSound, playGameStartSound, playGameEndSound } from '@/lib/sounds';

interface GameState {
  gameId: string | null;
  fen: string;
  pgn: string;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  status: 'connecting' | 'waiting' | 'active' | 'completed' | 'error';
  result: 'white' | 'black' | 'draw' | null;
  resultReason: string | null;
  payout: number;
  eloChanges: any;
  error: string | null;
  lastMove: { from: string; to: string } | null;
  
  // Actions
  joinGame: (gameId: string, uid: string) => void;
  leaveGame: () => void;
  makeMove: (move: string, uid: string) => void;
  resign: (uid: string) => void;
  offerDraw: (uid: string) => void;
  respondDraw: (uid: string, accept: boolean) => void;
  
  // Internal Handlers
  _setFen: (fen: string, pgn?: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  gameId: null,
  fen: 'start',
  pgn: '',
  whiteTimeRemainingMs: 0,
  blackTimeRemainingMs: 0,
  status: 'connecting',
  result: null,
  resultReason: null,
  payout: 0,
  eloChanges: null,
  error: null,
  lastMove: null,

  joinGame: (gameId: string, uid: string) => {
    const socket = getSocket();
    set({ gameId, status: 'connecting', error: null, result: null, resultReason: null });

    socket.emit('game:join', { gameId, uid });

    socket.on('game:start', (data) => {
      playGameStartSound();
      set({ status: 'active', fen: data.fen });
    });

    socket.on('game:move', (data) => {
      let lastMove = null;
      try {
        const chess = new Chess();
        chess.loadPgn(data.pgn);
        const history = chess.history({ verbose: true });
        if (history.length > 0) {
          const last = history[history.length - 1];
          lastMove = { from: last.from, to: last.to };
          
          if (chess.isCheck() || chess.isCheckmate()) {
            playCheckSound();
          } else if (last.captured) {
            playCaptureSound();
          } else {
            playMoveSound();
          }
        }
      } catch (e) {}

      set({ 
        fen: data.fen, 
        pgn: data.pgn,
        whiteTimeRemainingMs: data.whiteTimeRemainingMs,
        blackTimeRemainingMs: data.blackTimeRemainingMs,
        lastMove,
      });
    });

    socket.on('game:clock_sync', (data) => {
      set({
        whiteTimeRemainingMs: data.whiteTimeRemainingMs,
        blackTimeRemainingMs: data.blackTimeRemainingMs,
      });
    });

    socket.on('game:over', (data) => {
      playGameEndSound();
      set({ 
        status: 'completed', 
        result: data.result || data.winner, // backend might send winner or result
        resultReason: data.reason || 'agreed',
        payout: data.payout || 0,
        eloChanges: data.eloChanges || null,
      });
    });

    socket.on('error', (data) => {
      set({ status: 'error', error: data.message });
    });
  },

  leaveGame: () => {
    const socket = getSocket();
    socket.off('game:start');
    socket.off('game:move');
    socket.off('game:clock_sync');
    socket.off('game:over');
    socket.off('error');
    set({ status: 'connecting', gameId: null });
  },

  makeMove: (move: string, uid: string) => {
    const { gameId } = get();
    if (!gameId) return;

    // Optimistic update
    const { fen } = get();
    const chess = new Chess(fen);
    try {
      const moveObj = chess.move(move);
      if (moveObj) {
        if (chess.isCheck() || chess.isCheckmate()) {
          playCheckSound();
        } else if (moveObj.captured) {
          playCaptureSound();
        } else {
          playMoveSound();
        }
        
        set({ 
          fen: chess.fen(), 
          pgn: chess.pgn(),
          lastMove: { from: moveObj.from, to: moveObj.to }
        });
        const socket = getSocket();
        socket.emit('game:move', { gameId, uid, move });
      }
    } catch (e) {
      // Invalid move locally, ignore
    }
  },

  resign: (uid: string) => {
    const { gameId } = get();
    if (!gameId) return;
    const socket = getSocket();
    socket.emit('game:resign', { gameId, uid });
  },

  offerDraw: (uid: string) => {
    const { gameId } = get();
    if (!gameId) return;
    const socket = getSocket();
    socket.emit('game:draw_offer', { gameId, uid });
  },

  respondDraw: (uid: string, accept: boolean) => {
    const { gameId } = get();
    if (!gameId) return;
    const socket = getSocket();
    socket.emit('game:draw_respond', { gameId, uid, accept });
  },

  _setFen: (fen: string, pgn?: string) => set({ fen, pgn: pgn || '' }),
}));
