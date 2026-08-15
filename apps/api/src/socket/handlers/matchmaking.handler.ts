import { Server, Socket } from 'socket.io';
import { matchmakingService } from '../../services/matchmaking.service';
import { gameService } from '../../services/game.service';
import { releaseEscrow } from '../../services/wallet.service';
import { db } from '../../config/firebase.config';
import { rpToRank, resolveTimeControl } from '@checkmate/shared-types';

let scanInterval: NodeJS.Timer;

export function startMatchmakingLoop(io: Server) {
  scanInterval = setInterval(async () => {
    const entries = matchmakingService.getAllEntries();

    for (const entry of entries) {
      if (entry.status !== 'waiting') continue;

      const waitSeconds = (Date.now() - entry.joinedAt.getTime()) / 1000;
      const timeoutSeconds = entry.mode === 'play_online' ? 60 : 90;
      
      if (waitSeconds > timeoutSeconds) {
        entry.status = 'timeout';
        matchmakingService.removeFromQueue(entry.uid);
        if (entry.stakeAmountCrowns > 0) {
          await releaseEscrow(entry.uid, entry.stakeAmountCrowns);
        }
        
        const message = entry.stakeAmountCrowns > 0
          ? 'No opponent found. Your Crowns have been returned.'
          : 'No opponent found. Please try again.';
          
        io.to(entry.socketId).emit('matchmaking:timeout', { message });
        continue;
      }

      const opponent = matchmakingService.scanForMatch(entry);
      if (!opponent) continue;

      entry.status = 'matched';
      opponent.status = 'matched';

      const gameId = await gameService.createGame(entry, opponent);

      const matchData = {
        gameId,
        opponentName: null as string | null,
        opponentElo: null as number | null,
        timeControlId: entry.timeControlId,
        stakeAmountCrowns: entry.stakeAmountCrowns,
        mode: entry.mode,
      };

      const game = await gameService.getGame(gameId);
      const isEntryWhite = (game as any)?.whiteUid === entry.uid;

      // Resolve player A data
      let aName = 'Player';
      let aElo = entry.elo || 1200;
      let aRank = entry.rank || rpToRank(0, false);
      if (!entry.uid.startsWith('guest_')) {
        const userDoc = await db.collection('users').doc(entry.uid).get();
        const data = userDoc.data();
        if (data) {
          const tc = resolveTimeControl(entry.timeControlId);
          const cat = tc ? tc.category : 'blitz';
          aName = data.displayName || 'Player';
          aElo = data.elo?.[cat] ?? 1200;
          aRank = rpToRank(data.elo?.[`${cat}RP`] ?? 0, data.elo?.isTop500);
        }
      } else {
        aName = 'Guest ' + entry.uid.slice(-4);
      }

      // Resolve player B data
      let bName = 'Player';
      let bElo = opponent.elo || 1200;
      let bRank = opponent.rank || rpToRank(0, false);
      if (!opponent.uid.startsWith('guest_')) {
        const userDoc = await db.collection('users').doc(opponent.uid).get();
        const data = userDoc.data();
        if (data) {
          const tc = resolveTimeControl(opponent.timeControlId);
          const cat = tc ? tc.category : 'blitz';
          bName = data.displayName || 'Player';
          bElo = data.elo?.[cat] ?? 1200;
          bRank = rpToRank(data.elo?.[`${cat}RP`] ?? 0, data.elo?.isTop500);
        }
      } else {
        bName = 'Guest ' + opponent.uid.slice(-4);
      }

      io.to(entry.socketId).emit('matchmaking:match_found', {
        ...matchData,
        opponentName: bName,
        opponentElo: bElo,
        opponentRank: bRank,
        youAre: isEntryWhite ? 'white' : 'black', 
      });

      io.to(opponent.socketId).emit('matchmaking:match_found', {
        ...matchData,
        opponentName: aName,
        opponentElo: aElo,
        opponentRank: aRank,
        youAre: isEntryWhite ? 'black' : 'white',
      });

      matchmakingService.removeFromQueue(entry.uid);
      matchmakingService.removeFromQueue(opponent.uid);

      io.emit('matchmaking:queue_update', {
        mode: entry.mode,
        timeControlId: entry.timeControlId,
        stakeAmountCrowns: entry.stakeAmountCrowns,
        depth: matchmakingService.getQueueDepth(entry.mode, entry.timeControlId, entry.stakeAmountCrowns),
      });
    }
  }, 2000);
}

export function registerMatchmakingHandlers(socket: Socket) {
  socket.on('matchmaking:join', (data) => {
    // If the client passes uid in data, use it. Otherwise rely on socket handshake query or auth.
    const uid = data?.uid || socket.handshake.query.uid || socket.handshake.auth?.uid;
    if (uid) {
      const entry = matchmakingService.getEntry(uid);
      if (entry) {
        entry.socketId = socket.id;
        socket.emit('matchmaking:joined', { success: true });
      }
    }
  });

  socket.on('matchmaking:leave', async (data) => {
    const uid = data?.uid || socket.handshake.query.uid || socket.handshake.auth?.uid;
    if (uid) {
      const entry = matchmakingService.removeFromQueue(uid);
      if (entry && entry.stakeAmountCrowns > 0) {
        await releaseEscrow(uid, entry.stakeAmountCrowns);
      }
      socket.emit('matchmaking:left');
    }
  });

  socket.on('disconnect', async () => {
    const entries = matchmakingService.getAllEntries();
    const entry = entries.find(e => e.socketId === socket.id);
    if (entry) {
      matchmakingService.removeFromQueue(entry.uid);
      if (entry.stakeAmountCrowns > 0) {
        await releaseEscrow(entry.uid, entry.stakeAmountCrowns);
      }
    }
  });
}
