import { Server, Socket } from 'socket.io';
import { db } from '../../config/firebase.config';
import { payoutService } from '../../services/payout.service';
import { stockfishService } from '../../services/stockfish.service';
import { redisService, LiveGameState } from '../../services/redis.service';
import { PvpEngine } from '../../services/pvp.engine';
import { logger } from '../../utils/logger';

// Track active disconnect timers in memory
const disconnectTimers = new Map<string, NodeJS.Timeout>();
let clockInterval: NodeJS.Timeout | null = null;
let ioInstance: Server | null = null;

// Track active game IDs currently in memory for clock ticks
const activeGameIds = new Set<string>();

const startGameClock = (io: Server) => {
  if (clockInterval) return;
  ioInstance = io;

  clockInterval = setInterval(async () => {
    const now = Date.now();

    for (const gameId of Array.from(activeGameIds)) {
      const state = await redisService.getGameState(gameId);
      if (!state || state.status !== 'active') {
        activeGameIds.delete(gameId);
        continue;
      }

      if (state.isUnlimited) continue;

      const clock = PvpEngine.calculateClock(state, now);

      // Sync clocks every second
      if (now % 1000 < 120) {
        io.to(`game_${gameId}`).emit('game:clock_sync', {
          whiteTimeRemainingMs: clock.whiteTimeRemainingMs,
          blackTimeRemainingMs: clock.blackTimeRemainingMs,
        });
      }

      // Check timeout
      if (clock.isTimedOut && clock.timeoutWinner) {
        activeGameIds.delete(gameId);
        await handleGameOver(gameId, clock.timeoutWinner, 'timeout');
      }
    }
  }, 100);
};

export const handleGameOver = async (gameId: string, result: 'white' | 'black' | 'draw', reason: string) => {
  activeGameIds.delete(gameId);

  // Clear any abandonment disconnect timers
  if (disconnectTimers.has(gameId)) {
    clearTimeout(disconnectTimers.get(gameId)!);
    disconnectTimers.delete(gameId);
  }

  const state = await redisService.getGameState(gameId);
  if (!state) return;

  state.status = 'completed';
  await redisService.saveGameState(gameId, state);

  // Destroy bot if active
  if (state.isBot) {
    stockfishService.destroyInstance(gameId);
  }

  logger.info(`Game over: ${gameId}`, { result, reason });

  // Update Firestore once at the end
  await db.collection('games').doc(gameId).update({
    status: 'completed',
    result,
    resultReason: reason,
    fen: state.fen,
    pgn: state.pgn,
    moves: state.moves,
    whiteTimeRemainingMs: state.whiteTimeRemainingMs,
    blackTimeRemainingMs: state.blackTimeRemainingMs,
    completedAt: new Date().toISOString(),
  });

  // Process payouts & ELO ratings if it was a real PvP game
  if (!state.isBot) {
    try {
      if (result === 'draw') {
        await payoutService.processDraw({
          gameId,
          whiteUid: state.whiteUid,
          blackUid: state.blackUid,
          timeControl: (state.timeControlCategory as any) || 'blitz',
          stakeAmountCrowns: state.stakeAmountCrowns,
        });
      } else {
        const winnerUid = result === 'white' ? state.whiteUid : state.blackUid;
        const loserUid = result === 'white' ? state.blackUid : state.whiteUid;
        await payoutService.processWin({
          gameId,
          winnerUid,
          loserUid,
          timeControl: (state.timeControlCategory as any) || 'blitz',
          stakeAmountCrowns: state.stakeAmountCrowns,
        });
      }
    } catch (err: any) {
      logger.error('Failed to process PvP payout/ELO on game over', { gameId, error: err.message });
    }
  }

  // Emit game over to room
  if (ioInstance) {
    ioInstance.to(`game_${gameId}`).emit('game:over', {
      result,
      reason,
      payout: state.stakeAmountCrowns > 0 ? state.stakeAmountCrowns * 2 : 0,
    });
  }

  // Clean up Redis after a short buffer
  setTimeout(() => {
    redisService.deleteGameState(gameId).catch(() => {});
  }, 10000);
};

const triggerBotMove = async (gameId: string) => {
  const state = await redisService.getGameState(gameId);
  if (!state || state.status !== 'active' || !state.isBot) return;

  try {
    const bestMove = await stockfishService.getBestMove(gameId, state.fen);
    const currentState = await redisService.getGameState(gameId);
    if (!currentState || currentState.status !== 'active') return;

    const moveResult = PvpEngine.applyMove({
      state: currentState,
      uid: 'bot',
      move: bestMove,
    });

    if (!moveResult.success || !moveResult.newState) {
      logger.error(`Bot attempted invalid move: ${bestMove}`, { error: moveResult.error });
      return;
    }

    await redisService.saveGameState(gameId, moveResult.newState);

    if (ioInstance) {
      ioInstance.to(`game_${gameId}`).emit('game:move', {
        move: bestMove,
        fen: moveResult.newState.fen,
        pgn: moveResult.newState.pgn,
        whiteTimeRemainingMs: moveResult.newState.whiteTimeRemainingMs,
        blackTimeRemainingMs: moveResult.newState.blackTimeRemainingMs,
      });
    }

    if (moveResult.gameEnding?.isOver && moveResult.gameEnding.winner && moveResult.gameEnding.reason) {
      await handleGameOver(gameId, moveResult.gameEnding.winner, moveResult.gameEnding.reason);
    }
  } catch (error) {
    logger.error('Bot move failed', { error });
  }
};

export const registerGameHandlers = (io: Server, socket: Socket) => {
  startGameClock(io);

  socket.on('game:join', async (data: { gameId: string; uid: string }) => {
    const { gameId, uid } = data;

    let state = await redisService.getGameState(gameId);

    // Fallback: If not in Redis, reconstruct from Firestore
    if (!state) {
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

      // Check again if another concurrent join created state while awaiting Firestore
      const existing = await redisService.getGameState(gameId);
      if (existing) {
        state = existing;
      } else {
        state = {
          id: gameId,
          whiteUid: gData.whiteUid,
          blackUid: gData.blackUid,
          fen: gData.fen,
          pgn: gData.pgn || '',
          moves: gData.moves || [],
          mode: gData.mode || 'pvp',
          isBot: gData.isBot ?? false,
          botDifficulty: gData.botDifficulty,
          timeControlId: gData.timeControlId || 'standard',
          timeControlCategory: gData.timeControlCategory || 'blitz',
          baseTimeMs: gData.baseTimeMs || 0,
          incrementMs: gData.incrementMs || 0,
          isUnlimited: gData.isUnlimited ?? false,
          stakeAmountCrowns: gData.stakeAmountCrowns || 0,
          whiteTimeRemainingMs: gData.whiteTimeRemainingMs || 0,
          blackTimeRemainingMs: gData.blackTimeRemainingMs || 0,
          lastMoveTimestamp: Date.now(),
          status: gData.status as 'waiting' | 'active',
          whiteConnected: false,
          blackConnected: false,
          drawOfferBy: null,
          createdAt: Date.now(),
        };
        await redisService.saveGameState(gameId, state);
      }
    }

    const isParticipant = uid === state.whiteUid || uid === state.blackUid;
    const isDemo = state.mode === 'demo' || (state as any).isDemo;

    if (!isParticipant && !isDemo) {
      socket.emit('error', { message: 'Not a participant' });
      return;
    }

    socket.join(`game_${gameId}`);
    (socket as any).gameId = gameId;
    (socket as any).uid = uid;

    if (!isParticipant && isDemo) {
      // Spectator joined demo game
      socket.emit('game:start', { fen: state.fen });
      return;
    }

    // Reload latest state in case of concurrent updates before setting connection flag
    const freshState = (await redisService.getGameState(gameId)) || state;
    if (state.whiteConnected) freshState.whiteConnected = true;
    if (state.blackConnected) freshState.blackConnected = true;
    if (uid === freshState.whiteUid) freshState.whiteConnected = true;
    if (uid === freshState.blackUid) freshState.blackConnected = true;
    state = freshState;

    // Immediately persist connection flags to Redis so concurrent joins see each other
    await redisService.saveGameState(gameId, state);

    // If opponent was disconnected and had a timer, cancel abandonment forfeit
    if (disconnectTimers.has(gameId)) {
      clearTimeout(disconnectTimers.get(gameId)!);
      disconnectTimers.delete(gameId);
      io.to(`game_${gameId}`).emit('game:opponent_reconnected');
    }

    // Start game if waiting and both ready or bot
    if (state.status === 'waiting') {
      if (state.isBot || (state.whiteConnected && state.blackConnected)) {
        state.status = 'active';
        state.lastMoveTimestamp = Date.now();
        await redisService.saveGameState(gameId, state);
        activeGameIds.add(gameId);

        await db.collection('games').doc(gameId).update({ status: 'active' });
        io.to(`game_${gameId}`).emit('game:start', { fen: state.fen });

        if (state.isBot && state.whiteUid === 'bot') {
          triggerBotMove(gameId);
        }
      } else {
        // One player connected so far; show waiting for opponent
        socket.emit('game:waiting');
      }
    } else if (state.status === 'active') {
      activeGameIds.add(gameId);
      await redisService.saveGameState(gameId, state);

      // Send immediate state sync on reconnect
      socket.emit('game:start', { fen: state.fen });
      socket.emit('game:clock_sync', {
        whiteTimeRemainingMs: state.whiteTimeRemainingMs,
        blackTimeRemainingMs: state.blackTimeRemainingMs,
      });

      if (state.isBot) {
        if (!stockfishService.hasInstance(gameId)) {
          await stockfishService.createInstance(gameId, state.botDifficulty || 'casual');
        }
      }
    }
  });

  socket.on('game:move', async (data: { gameId: string; uid: string; move: string; clientTimestamp?: number }) => {
    const { gameId, uid, move, clientTimestamp } = data;
    const state = await redisService.getGameState(gameId);
    if (!state || state.status !== 'active') return;

    const moveResult = PvpEngine.applyMove({
      state,
      uid,
      move,
      clientTimestamp,
    });

    if (!moveResult.success || !moveResult.newState) {
      socket.emit('game:move_error', { error: moveResult.error || 'Invalid move' });
      return;
    }

    await redisService.saveGameState(gameId, moveResult.newState);

    io.to(`game_${gameId}`).emit('game:move', {
      move: moveResult.sanMove || move,
      fen: moveResult.newState.fen,
      pgn: moveResult.newState.pgn,
      whiteTimeRemainingMs: moveResult.newState.whiteTimeRemainingMs,
      blackTimeRemainingMs: moveResult.newState.blackTimeRemainingMs,
    });

    if (moveResult.gameEnding?.isOver && moveResult.gameEnding.winner && moveResult.gameEnding.reason) {
      await handleGameOver(gameId, moveResult.gameEnding.winner, moveResult.gameEnding.reason);
      return;
    }

    if (moveResult.newState.isBot) {
      triggerBotMove(gameId);
    }
  });

  socket.on('game:resign', async (data: { gameId: string; uid: string }) => {
    const { gameId, uid } = data;
    const state = await redisService.getGameState(gameId);
    if (!state || state.status !== 'active') return;

    const winner = uid === state.whiteUid ? 'black' : 'white';
    await handleGameOver(gameId, winner, 'resignation');
  });

  socket.on('game:draw_offer', async (data: { gameId: string; uid: string }) => {
    const { gameId, uid } = data;
    const state = await redisService.getGameState(gameId);
    if (!state || state.status !== 'active' || state.isBot) return;

    state.drawOfferBy = uid === state.whiteUid ? 'white' : 'black';
    await redisService.saveGameState(gameId, state);

    socket.to(`game_${gameId}`).emit('game:draw_offered');
  });

  socket.on('game:draw_respond', async (data: { gameId: string; uid: string; accept: boolean }) => {
    const { gameId, uid, accept } = data;
    const state = await redisService.getGameState(gameId);
    if (!state || state.status !== 'active') return;

    const responder = uid === state.whiteUid ? 'white' : 'black';
    if (state.drawOfferBy && state.drawOfferBy !== responder) {
      if (accept) {
        await handleGameOver(gameId, 'draw', 'agreed');
      } else {
        state.drawOfferBy = null;
        await redisService.saveGameState(gameId, state);
        socket.to(`game_${gameId}`).emit('game:draw_declined');
      }
    }
  });

  socket.on('disconnect', async () => {
    const gameId = (socket as any).gameId;
    const uid = (socket as any).uid;
    if (!gameId || !uid) return;

    const state = await redisService.getGameState(gameId);
    if (!state || state.status !== 'active') return;

    if (uid === state.whiteUid) state.whiteConnected = false;
    if (uid === state.blackUid) state.blackConnected = false;
    await redisService.saveGameState(gameId, state);

    socket.to(`game_${gameId}`).emit('game:opponent_disconnected');

    // Start Chess.com-style abandonment timer based on time control category
    const timeoutMs = PvpEngine.getAbandonmentTimeoutMs(state.timeControlCategory);

    if (disconnectTimers.has(gameId)) {
      clearTimeout(disconnectTimers.get(gameId)!);
    }

    const timer = setTimeout(async () => {
      const currentState = await redisService.getGameState(gameId);
      if (currentState && currentState.status === 'active') {
        const winner = uid === currentState.whiteUid ? 'black' : 'white';
        await handleGameOver(gameId, winner, 'abandoned');
      }
    }, timeoutMs);

    disconnectTimers.set(gameId, timer);
  });
};
