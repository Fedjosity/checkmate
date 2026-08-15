import { Chess } from 'chess.js';
import { LiveGameState } from './redis.service';

export interface MoveResult {
  success: boolean;
  newState?: LiveGameState;
  error?: string;
  sanMove?: string;
  gameEnding?: {
    isOver: boolean;
    winner: 'white' | 'black' | 'draw';
    reason: string;
  };
}

export interface ClockCalculation {
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  isTimedOut: boolean;
  timeoutWinner?: 'white' | 'black';
}

/**
 * Max latency compensation (grace period in ms) to subtract from measured move time
 * to prevent unfairly penalizing users with network ping.
 */
const MAX_LAG_COMPENSATION_MS = 200;

export class PvpEngine {
  /**
   * Determine timeout duration when a player disconnects
   */
  static getAbandonmentTimeoutMs(category: string): number {
    const cat = category.toLowerCase();
    if (cat === 'bullet' || cat === 'blitz') {
      return 15000; // 15 seconds for fast games
    }
    return 60000; // 60 seconds for standard/rapid/classic
  }

  /**
   * Check if active game has reached a checkmate or draw condition
   */
  static checkBoardTermination(chess: Chess): { isOver: boolean; winner?: 'white' | 'black' | 'draw'; reason?: string } {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'black' : 'white';
      return { isOver: true, winner, reason: 'checkmate' };
    }
    if (chess.isStalemate()) {
      return { isOver: true, winner: 'draw', reason: 'stalemate' };
    }
    if (chess.isThreefoldRepetition()) {
      return { isOver: true, winner: 'draw', reason: 'threefold_repetition' };
    }
    if (chess.isInsufficientMaterial()) {
      return { isOver: true, winner: 'draw', reason: 'insufficient_material' };
    }
    if (chess.isDraw()) {
      return { isOver: true, winner: 'draw', reason: 'draw_50_moves' };
    }

    return { isOver: false };
  }

  /**
   * Calculate current live clocks and check for timeouts
   */
  static calculateClock(state: LiveGameState, now: number = Date.now()): ClockCalculation {
    if (state.status !== 'active' || state.isUnlimited) {
      return {
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
        isTimedOut: false,
      };
    }

    const chess = new Chess(state.fen);
    const activeColor = chess.turn() === 'w' ? 'white' : 'black';
    const elapsed = Math.max(0, now - state.lastMoveTimestamp);

    const whiteRemaining = activeColor === 'white'
      ? Math.max(0, state.whiteTimeRemainingMs - elapsed)
      : state.whiteTimeRemainingMs;

    const blackRemaining = activeColor === 'black'
      ? Math.max(0, state.blackTimeRemainingMs - elapsed)
      : state.blackTimeRemainingMs;

    if (activeColor === 'white' && whiteRemaining <= 0) {
      return {
        whiteTimeRemainingMs: 0,
        blackTimeRemainingMs: blackRemaining,
        isTimedOut: true,
        timeoutWinner: 'black',
      };
    }

    if (activeColor === 'black' && blackRemaining <= 0) {
      return {
        whiteTimeRemainingMs: whiteRemaining,
        blackTimeRemainingMs: 0,
        isTimedOut: true,
        timeoutWinner: 'white',
      };
    }

    return {
      whiteTimeRemainingMs: whiteRemaining,
      blackTimeRemainingMs: blackRemaining,
      isTimedOut: false,
    };
  }

  /**
   * Validate move, deduct clock with lag compensation, and update board state
   */
  static applyMove(params: {
    state: LiveGameState;
    uid: string;
    move: string;
    now?: number;
    clientTimestamp?: number;
  }): MoveResult {
    const { state, uid, move } = params;
    const now = params.now || Date.now();

    if (state.status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    const isWhite = uid === state.whiteUid;
    const isBlack = uid === state.blackUid;

    if (!isWhite && !isBlack) {
      return { success: false, error: 'User is not a player in this game' };
    }

    const chess = new Chess();
    if (state.pgn && state.pgn.trim().length > 0) {
      try {
        chess.loadPgn(state.pgn);
      } catch {
        chess.load(state.fen);
      }
    } else {
      chess.load(state.fen);
    }

    const activeTurn = chess.turn(); // 'w' | 'b'

    if ((isWhite && activeTurn !== 'w') || (isBlack && activeTurn !== 'b')) {
      return { success: false, error: 'Not your turn' };
    }

    // Try applying move
    let moveObj;
    try {
      moveObj = chess.move(move, { strict: false });
    } catch (e: any) {
      return { success: false, error: e.message || 'Illegal move' };
    }

    if (!moveObj) {
      return { success: false, error: 'Illegal move' };
    }

    // Calculate time elapsed
    let elapsed = Math.max(0, now - state.lastMoveTimestamp);

    // Apply lag compensation if client provided timestamp
    if (params.clientTimestamp && params.clientTimestamp < now) {
      const pingEstimate = now - params.clientTimestamp;
      const lagCompensation = Math.min(pingEstimate, MAX_LAG_COMPENSATION_MS);
      elapsed = Math.max(0, elapsed - lagCompensation);
    }

    let whiteTime = state.whiteTimeRemainingMs;
    let blackTime = state.blackTimeRemainingMs;

    if (!state.isUnlimited) {
      if (isWhite) {
        whiteTime = Math.max(0, whiteTime - elapsed) + state.incrementMs;
      } else {
        blackTime = Math.max(0, blackTime - elapsed) + state.incrementMs;
      }
    }

    // Check if player timed out on this move
    if (!state.isUnlimited) {
      if (isWhite && whiteTime <= 0) {
        return {
          success: false,
          error: 'Time expired',
          gameEnding: {
            isOver: true,
            winner: 'black',
            reason: 'timeout',
          },
        };
      }
      if (isBlack && blackTime <= 0) {
        return {
          success: false,
          error: 'Time expired',
          gameEnding: {
            isOver: true,
            winner: 'white',
            reason: 'timeout',
          },
        };
      }
    }

    const newFen = chess.fen();
    const newPgn = chess.pgn();
    const moves = [...state.moves, moveObj.san];

    const updatedState: LiveGameState = {
      ...state,
      fen: newFen,
      pgn: newPgn,
      moves,
      whiteTimeRemainingMs: whiteTime,
      blackTimeRemainingMs: blackTime,
      lastMoveTimestamp: now,
      drawOfferBy: null, // Any move cancels existing draw offers
    };

    // Check for game ending
    const termination = PvpEngine.checkBoardTermination(chess);
    if (termination.isOver && termination.winner && termination.reason) {
      updatedState.status = 'completed';
      return {
        success: true,
        newState: updatedState,
        sanMove: moveObj.san,
        gameEnding: {
          isOver: true,
          winner: termination.winner,
          reason: termination.reason,
        },
      };
    }

    return {
      success: true,
      newState: updatedState,
      sanMove: moveObj.san,
    };
  }
}
