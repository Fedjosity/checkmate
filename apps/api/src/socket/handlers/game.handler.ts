import { Server, Socket } from 'socket.io';
import { db } from '../../config/firebase.config';
import { Chess } from 'chess.js';
import { payoutService } from '../../services/payout.service';
import { stockfishService } from '../../services/stockfish.service';
import { logger } from '../../utils/logger';

// In-memory state for active games
interface ActiveGame {
  id: string;
  chess: Chess;
  whiteUid: string;
  blackUid: string;
  isBot: boolean;
  botDifficulty?: string;
  timeControlCategory: string;
  incrementMs: number;
  isUnlimited: boolean;
  stakeAmountCrowns: number;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  lastMoveTimestamp: number;
  status: 'waiting' | 'active' | 'completed';
  whiteConnected: boolean;
  blackConnected: boolean;
  drawOfferBy?: 'white' | 'black' | null;
  disconnectTimeout?: NodeJS.Timeout;
}

const activeGames = new Map<string, ActiveGame>();

// Global clock tick interval
let clockInterval: NodeJS.Timeout | null = null;
let ioInstance: Server | null = null;

const startGameClock = (io: Server) => {
  if (clockInterval) return;
  ioInstance = io;

  clockInterval = setInterval(() => {
    const now = Date.now();

    for (const [gameId, game] of Array.from(activeGames.entries())) {
      if (game.status !== 'active') continue;
      if (game.isUnlimited) continue; // No clock for unlimited games

      const activeColor = game.chess.turn() === 'w' ? 'white' : 'black';
      const elapsed = now - game.lastMoveTimestamp;
      
      // We don't deduct time here to avoid drift, we just check if it's over
      const remaining = activeColor === 'white' 
        ? game.whiteTimeRemainingMs - elapsed
        : game.blackTimeRemainingMs - elapsed;

      // Sync clocks every 1 second
      if (now % 1000 < 100) {
        io.to(`game_${gameId}`).emit('game:clock_sync', {
          whiteTimeRemainingMs: activeColor === 'white' ? remaining : game.whiteTimeRemainingMs,
          blackTimeRemainingMs: activeColor === 'black' ? remaining : game.blackTimeRemainingMs,
        });
      }

      // Check timeout
      if (remaining <= 0) {
        const winner = activeColor === 'white' ? 'black' : 'white';
        handleGameOver(gameId, winner, 'timeout');
      }
    }
  }, 100);
};

export const handleGameOver = async (gameId: string, result: 'white' | 'black' | 'draw', reason: string) => {
  const game = activeGames.get(gameId);
  if (!game) return;

  game.status = 'completed';
  
  if (game.disconnectTimeout) {
    clearTimeout(game.disconnectTimeout);
  }

  // Destroy bot if needed
  if (game.isBot) {
    stockfishService.destroyInstance(gameId);
  }

  activeGames.delete(gameId);
  logger.info(`Game over: ${gameId}`, { result, reason });

  // If not bot and there are stakes or it's competitive, process payout/ELO
  if (!game.isBot) {
    if (result === 'draw') {
      await payoutService.processDraw({
        gameId,
        whiteUid: game.whiteUid,
        blackUid: game.blackUid,
        timeControl: (game.timeControlCategory as 'blitz' | 'rapid' | 'bullet' | 'classic') || 'blitz',
        stakeAmountCrowns: game.stakeAmountCrowns,
      });
    } else {
      const winnerUid = result === 'white' ? game.whiteUid : game.blackUid;
      const loserUid = result === 'white' ? game.blackUid : game.whiteUid;
      await payoutService.processWin({
        gameId,
        winnerUid,
        loserUid,
        timeControl: (game.timeControlCategory as 'blitz' | 'rapid' | 'bullet' | 'classic') || 'blitz',
        stakeAmountCrowns: game.stakeAmountCrowns,
      });
    }
  } else {
    // Just update Firestore for bot game
    await db.collection('games').doc(gameId).update({
      status: 'completed',
      result,
      resultReason: reason,
      completedAt: new Date().toISOString()
    });
    
    // Emit generic game over for bot games
    if (ioInstance) {
      ioInstance.to(`game_${gameId}`).emit('game:over', {
        result,
        reason,
        payout: 0,
      });
    }
  }
};

const triggerBotMove = async (gameId: string) => {
  const game = activeGames.get(gameId);
  if (!game || game.status !== 'active' || !game.isBot) return;

  try {
    const fen = game.chess.fen();
    const bestMove = await stockfishService.getBestMove(gameId, fen);
    
    if (!activeGames.has(gameId)) return; // Game might have ended during think time

    const moveObj = game.chess.move(bestMove, { strict: false });
    if (!moveObj) {
      logger.error(`Bot attempted invalid move: ${bestMove}`);
      return;
    }

    const now = Date.now();
    const elapsed = now - game.lastMoveTimestamp;
    // Only deduct time for timed games
    if (!game.isUnlimited) {
      // Deduct elapsed time from bot's clock
      if (game.chess.turn() === 'w') {
        // Bot just moved as white... but bot is typically black
        game.whiteTimeRemainingMs -= elapsed;
      } else {
        game.blackTimeRemainingMs -= elapsed;
      }
      // The bot made the move so the color that moved gets increment
      const movedColor = game.chess.turn() === 'w' ? 'black' : 'white'; // turn flipped after move
      if (movedColor === 'white') {
        game.whiteTimeRemainingMs += game.incrementMs;
      } else {
        game.blackTimeRemainingMs += game.incrementMs;
      }
    }
    game.lastMoveTimestamp = now;

    const newFen = game.chess.fen();
    const newPgn = game.chess.pgn();

    await db.collection('games').doc(gameId).update({
      fen: newFen,
      pgn: newPgn,
      blackTimeRemainingMs: game.blackTimeRemainingMs,
    });

    if (ioInstance) {
      ioInstance.to(`game_${gameId}`).emit('game:move', {
        move: bestMove,
        fen: newFen,
        pgn: newPgn,
        whiteTimeRemainingMs: game.whiteTimeRemainingMs,
        blackTimeRemainingMs: game.blackTimeRemainingMs,
      });
    }

    checkGameEnding(gameId);

  } catch (error) {
    logger.error('Bot move failed', { error });
  }
};

const checkGameEnding = (gameId: string) => {
  const game = activeGames.get(gameId);
  if (!game) return;

  if (game.chess.isCheckmate()) {
    const winner = game.chess.turn() === 'w' ? 'black' : 'white';
    handleGameOver(gameId, winner, 'checkmate');
  } else if (game.chess.isDraw()) {
    handleGameOver(gameId, 'draw', 'stalemate_or_repetition');
  } else if (game.chess.isStalemate()) {
    handleGameOver(gameId, 'draw', 'stalemate');
  } else if (game.chess.isThreefoldRepetition()) {
    handleGameOver(gameId, 'draw', 'repetition');
  } else if (game.chess.isInsufficientMaterial()) {
    handleGameOver(gameId, 'draw', 'insufficient_material');
  }
};

export const registerGameHandlers = (io: Server, socket: Socket) => {
  startGameClock(io);

  socket.on('game:join', async (data: { gameId: string; uid: string }) => {
    const { gameId, uid } = data;

    let game = activeGames.get(gameId);

    // If not in memory, load from Firestore
    if (!game) {
      const doc = await db.collection('games').doc(gameId).get();
      if (!doc.exists) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }
      const gData = doc.data()!;
      if (gData.status === 'completed') {
        socket.emit('game:over', { reason: 'Already completed' });
        return;
      }

      game = {
        id: gameId,
        chess: new Chess(gData.fen),
        whiteUid: gData.whiteUid,
        blackUid: gData.blackUid,
        isBot: gData.isBot ?? false,
        botDifficulty: gData.botDifficulty,
        timeControlCategory: gData.timeControlCategory ?? gData.timeControl ?? 'blitz',
        incrementMs: gData.incrementMs ?? 0,
        isUnlimited: gData.isUnlimited ?? false,
        stakeAmountCrowns: gData.stakeAmountCrowns ?? 0,
        whiteTimeRemainingMs: gData.whiteTimeRemainingMs,
        blackTimeRemainingMs: gData.blackTimeRemainingMs,
        lastMoveTimestamp: Date.now(),
        status: gData.status as 'waiting' | 'active',
        whiteConnected: false,
        blackConnected: false,
      };
      activeGames.set(gameId, game);
    }

    if (uid !== game.whiteUid && uid !== game.blackUid) {
      socket.emit('error', { message: 'Not a participant' });
      return;
    }

    socket.join(`game_${gameId}`);
    
    // Store gameId and uid on socket for disconnect handling
    (socket as any).gameId = gameId;
    (socket as any).uid = uid;

    if (uid === game.whiteUid) game.whiteConnected = true;
    if (uid === game.blackUid) game.blackConnected = true;

    // Clear disconnect timeout if reconnecting
    if (game.disconnectTimeout) {
      clearTimeout(game.disconnectTimeout);
      game.disconnectTimeout = undefined;
    }

    // Start game if both connected or if it's a bot game
    if (game.status === 'waiting' && (game.isBot || (game.whiteConnected && game.blackConnected))) {
      game.status = 'active';
      game.lastMoveTimestamp = Date.now();
      await db.collection('games').doc(gameId).update({ status: 'active' });
      io.to(`game_${gameId}`).emit('game:start', { fen: game.chess.fen() });

      if (game.isBot && game.blackUid === 'bot' && game.chess.turn() === 'b') {
        triggerBotMove(gameId);
      } else if (game.isBot && game.whiteUid === 'bot' && game.chess.turn() === 'w') {
        triggerBotMove(gameId);
      }
    }
  });

  socket.on('game:move', async (data: { gameId: string; uid: string; move: string }) => {
    const { gameId, uid, move } = data;
    const game = activeGames.get(gameId);
    
    if (!game || game.status !== 'active') return;
    
    const isWhite = uid === game.whiteUid;
    const isBlack = uid === game.blackUid;
    
    if ((isWhite && game.chess.turn() !== 'w') || (isBlack && game.chess.turn() !== 'b')) {
      return; // Not their turn
    }

    try {
      const moveObj = game.chess.move(move, { strict: false });
      if (!moveObj) return; // Invalid move

      const now = Date.now();
      const elapsed = now - game.lastMoveTimestamp;
      
      if (!game.isUnlimited) {
        if (isWhite) {
          game.whiteTimeRemainingMs -= elapsed;
          game.whiteTimeRemainingMs += game.incrementMs; // Add increment
        } else {
          game.blackTimeRemainingMs -= elapsed;
          game.blackTimeRemainingMs += game.incrementMs; // Add increment
        }
      }
      
      game.lastMoveTimestamp = now;

      const fen = game.chess.fen();
      const pgn = game.chess.pgn();

      await db.collection('games').doc(gameId).update({
        fen, pgn,
        whiteTimeRemainingMs: game.whiteTimeRemainingMs,
        blackTimeRemainingMs: game.blackTimeRemainingMs,
      });

      io.to(`game_${gameId}`).emit('game:move', {
        move: moveObj.lan || moveObj.san, // send back a standardized string
        fen, pgn,
        whiteTimeRemainingMs: game.whiteTimeRemainingMs,
        blackTimeRemainingMs: game.blackTimeRemainingMs,
      });

      checkGameEnding(gameId);

      // Trigger bot if game is still active
      if (game.isBot && activeGames.has(gameId)) {
        triggerBotMove(gameId);
      }
    } catch (e) {
      // chess.js throws on invalid moves in some versions
    }
  });

  socket.on('game:resign', (data: { gameId: string; uid: string }) => {
    const { gameId, uid } = data;
    const game = activeGames.get(gameId);
    if (!game) return;

    if (uid === game.whiteUid) handleGameOver(gameId, 'black', 'resignation');
    else if (uid === game.blackUid) handleGameOver(gameId, 'white', 'resignation');
  });

  socket.on('game:draw_offer', (data: { gameId: string; uid: string }) => {
    const { gameId, uid } = data;
    const game = activeGames.get(gameId);
    if (!game || game.status !== 'active' || game.isBot) return;

    game.drawOfferBy = uid === game.whiteUid ? 'white' : 'black';
    socket.to(`game_${gameId}`).emit('game:draw_offered');
  });

  socket.on('game:draw_respond', (data: { gameId: string; uid: string; accept: boolean }) => {
    const { gameId, uid, accept } = data;
    const game = activeGames.get(gameId);
    if (!game || game.status !== 'active') return;

    const responder = uid === game.whiteUid ? 'white' : 'black';
    if (game.drawOfferBy && game.drawOfferBy !== responder) {
      if (accept) {
        handleGameOver(gameId, 'draw', 'agreed');
      } else {
        game.drawOfferBy = null;
        socket.to(`game_${gameId}`).emit('game:draw_declined');
      }
    }
  });

  socket.on('disconnect', () => {
    const gameId = (socket as any).gameId;
    const uid = (socket as any).uid;
    if (!gameId || !uid) return;

    const game = activeGames.get(gameId);
    if (!game || game.status !== 'active') return;

    if (uid === game.whiteUid) game.whiteConnected = false;
    if (uid === game.blackUid) game.blackConnected = false;

    socket.to(`game_${gameId}`).emit('game:opponent_disconnected');

    // Start 60s forfeit timer for paid, 30s for free
    const timeoutMs = game.stakeAmountCrowns > 0 ? 60000 : 30000;
    
    game.disconnectTimeout = setTimeout(() => {
      if (activeGames.has(gameId)) {
        const winner = uid === game.whiteUid ? 'black' : 'white';
        handleGameOver(gameId, winner, 'abandoned');
      }
    }, timeoutMs);
  });
};
