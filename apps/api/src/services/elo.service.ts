import { db } from '../config/firebase.config';
import { rpToRank, calculateRPChange, Rank } from '@checkmate/shared-types';

export const updateAfterGame = async (params: {
  winnerUid: string;
  loserUid: string;
  timeControl: 'blitz' | 'rapid' | 'bullet' | 'classic';
  isDraw: boolean;
}): Promise<{
  winner: { newElo: number; newRP: number; newRank: Rank; rpChange: number };
  loser: { newElo: number; newRP: number; newRank: Rank; rpChange: number };
}> => {
  const { winnerUid, loserUid, timeControl, isDraw } = params;

  const winnerRef = db.collection('users').doc(winnerUid);
  const loserRef = db.collection('users').doc(loserUid);

  return await db.runTransaction(async (t) => {
    const winnerDoc = await t.get(winnerRef);
    const loserDoc = await t.get(loserRef);

    if (!winnerDoc.exists || !loserDoc.exists) {
      throw new Error('User not found');
    }

    const winnerData = winnerDoc.data()!;
    const loserData = loserDoc.data()!;

    const tcElo = timeControl;
    const tcRP = `${timeControl}RP`;
    const tcStreak = `${timeControl}Streak`;

    const winnerElo = winnerData.elo?.[tcElo] ?? 1200;
    const loserElo = loserData.elo?.[tcElo] ?? 1200;

    const winnerRP = winnerData.elo?.[tcRP] ?? 0;
    const loserRP = loserData.elo?.[tcRP] ?? 0;

    let winnerStreak = winnerData.elo?.[tcStreak] ?? 0;
    let loserStreak = loserData.elo?.[tcStreak] ?? 0;

    // ELO (Glicko-2 simplified K=32)
    const K = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

    let newWinnerElo: number;
    let newLoserElo: number;
    let winnerRPChange = 0;
    let loserRPChange = 0;

    if (isDraw) {
      newWinnerElo = winnerElo + K * (0.5 - expectedWinner);
      newLoserElo = loserElo + K * (0.5 - expectedLoser);
    } else {
      newWinnerElo = winnerElo + K * (1 - expectedWinner);
      newLoserElo = loserElo + K * (0 - expectedLoser);

      // Streaks
      winnerStreak = winnerStreak > 0 ? winnerStreak + 1 : 1;
      loserStreak = loserStreak < 0 ? loserStreak - 1 : -1;

      // RP
      winnerRPChange = calculateRPChange(true, winnerStreak);
      loserRPChange = calculateRPChange(false, 0);
    }

    newWinnerElo = Math.round(newWinnerElo);
    newLoserElo = Math.round(newLoserElo);

    const newWinnerRP = Math.max(0, winnerRP + winnerRPChange);
    const newLoserRP = Math.max(0, loserRP + loserRPChange);

    const winnerTop500 = winnerData.elo?.isTop500 ?? false;
    const loserTop500 = loserData.elo?.isTop500 ?? false;

    const winnerRank = rpToRank(newWinnerRP, winnerTop500);
    const loserRank = rpToRank(newLoserRP, loserTop500);

    t.update(winnerRef, {
      [`elo.${tcElo}`]: newWinnerElo,
      [`elo.${tcRP}`]: newWinnerRP,
      [`elo.${tcStreak}`]: winnerStreak,
      'elo.gamesPlayed': (winnerData.elo?.gamesPlayed ?? 0) + 1,
    });

    t.update(loserRef, {
      [`elo.${tcElo}`]: newLoserElo,
      [`elo.${tcRP}`]: newLoserRP,
      [`elo.${tcStreak}`]: loserStreak,
      'elo.gamesPlayed': (loserData.elo?.gamesPlayed ?? 0) + 1,
    });

    return {
      winner: {
        newElo: newWinnerElo,
        newRP: newWinnerRP,
        newRank: winnerRank,
        rpChange: winnerRPChange,
      },
      loser: {
        newElo: newLoserElo,
        newRP: newLoserRP,
        newRank: loserRank,
        rpChange: loserRPChange,
      },
    };
  });
};

export const getTop500 = async (): Promise<string[]> => {
  const snap = await db.collection('users').where('elo.isTop500', '==', true).get();
  return snap.docs.map(doc => doc.id);
};

export const eloService = {
  updateAfterGame,
  getTop500,
};
