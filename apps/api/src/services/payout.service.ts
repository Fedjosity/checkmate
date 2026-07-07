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

export const payoutService = {
  processWin,
};
