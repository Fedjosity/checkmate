import { db } from '../config/firebase.config';
import { eloService } from './elo.service';
import { creditWallet } from './wallet.service';
import { getIO } from '../socket';

export const processWin = async (params: {
  gameId: string;
  winnerUid: string;
  loserUid: string;
  timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic';
  stakeAmountCrowns: number;
}) => {
  const { gameId, winnerUid, loserUid, timeControl, stakeAmountCrowns } = params;

  // Calculate payout: 8% fee = 0.92 multiplier
  // So total pool is 2 * stake, minus 8% fee
  const winnerPayout = Math.floor(stakeAmountCrowns * 2 * 0.92);

  // Credit payout
  if (winnerPayout > 0) {
    await creditWallet(
      winnerUid,
      winnerPayout,
      `payout_${gameId}`,
      'game_payout',
      `Won game ${gameId}`
    );
  }

  // Update ELO & Rank
  const eloChanges = await eloService.updateAfterGame({
    winnerUid,
    loserUid,
    timeControl,
    isDraw: false,
  });

  // Update Game doc status
  await db.collection('games').doc(gameId).update({
    status: 'completed',
    result: 'win',
    winnerUid,
    payoutStatus: 'completed',
    completedAt: new Date().toISOString()
  });

  // Emit game_over to both players
  try {
    const io = getIO();
    if (io) {
      io.to(`game_${gameId}`).emit('game_over', {
        winner: winnerUid,
        payout: winnerPayout,
        eloChanges: {
          winner: eloChanges.winner,
          loser: eloChanges.loser,
        },
      });
    }
  } catch (e) {
    console.error('Socket.io not initialized, skipping emit');
  }
};

export const processDraw = async (params: {
  gameId: string;
  whiteUid: string;
  blackUid: string;
  timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic';
  stakeAmountCrowns: number;
}) => {
  const { gameId, whiteUid, blackUid, timeControl, stakeAmountCrowns } = params;

  // Return stakes if any
  if (stakeAmountCrowns > 0) {
    const { releaseEscrow } = await import('./wallet.service');
    await releaseEscrow(whiteUid, stakeAmountCrowns, `draw_refund_${gameId}_w`);
    await releaseEscrow(blackUid, stakeAmountCrowns, `draw_refund_${gameId}_b`);
  }

  // Update ELO & Rank (we pass white as winner, black as loser, but set isDraw: true)
  const eloChanges = await eloService.updateAfterGame({
    winnerUid: whiteUid,
    loserUid: blackUid,
    timeControl,
    isDraw: true,
  });

  // Update Game doc status
  await db.collection('games').doc(gameId).update({
    status: 'completed',
    result: 'draw',
    resultReason: 'agreed',
    payoutStatus: 'completed',
    completedAt: new Date().toISOString()
  });

  // Emit game_over to both players
  try {
    const io = getIO();
    if (io) {
      io.to(`game_${gameId}`).emit('game_over', {
        result: 'draw',
        payout: 0,
        eloChanges: {
          white: eloChanges.winner,
          black: eloChanges.loser,
        },
      });
    }
  } catch (e) {
    console.error('Socket.io not initialized, skipping emit');
  }
};

export const payoutService = {
  processWin,
  processDraw,
};
