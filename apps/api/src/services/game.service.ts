import { db } from '../config/firebase.config';
import * as admin from 'firebase-admin';
import { QueueEntry } from './matchmaking.service';

export const getTimeSeconds = (timeControl: string): number => {
  switch (timeControl) {
    case 'bullet': return 60;
    case 'blitz': return 300;
    case 'rapid': return 600;
    case 'classic': return 1800;
    default: return 300;
  }
};

export const createGame = async (playerA: QueueEntry, playerB: QueueEntry): Promise<string> => {
  const isAWhite = Math.random() < 0.5;
  const whiteUid = isAWhite ? playerA.uid : playerB.uid;
  const blackUid = isAWhite ? playerB.uid : playerA.uid;
  const timeSeconds = getTimeSeconds(playerA.timeControl);

  const gameDocRef = db.collection('games').doc();

  await gameDocRef.set({
    whiteUid,
    blackUid,
    mode: playerA.mode,
    timeControl: playerA.timeControl,
    timeSeconds,
    increment: 0,
    stakeAmountCrowns: playerA.stakeAmountCrowns,
    status: 'waiting',
    result: null,
    resultReason: null,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
    moves: [],
    whiteTimeRemainingMs: timeSeconds * 1000,
    blackTimeRemainingMs: timeSeconds * 1000,
    anticheat: {
      status: 'pending',
      engineCorrelation: null,
      flagged: false,
    },
    payoutStatus: 'pending',
    createdAt: admin.firestore.Timestamp.now(),
    completedAt: null,
  });

  return gameDocRef.id;
};

export const gameService = {
  createGame,
  getTimeSeconds,
};
