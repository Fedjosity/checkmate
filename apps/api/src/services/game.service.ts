import { db } from '../config/firebase.config';
import * as admin from 'firebase-admin';
import { QueueEntry } from './matchmaking.service';
import { stockfishService } from './stockfish.service';

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

export const createBotGame = async (params: {
  uid: string;
  timeControl: string;
  difficulty: string;
  playerColor?: 'white' | 'black' | 'random';
}): Promise<string> => {
  const { uid, timeControl, difficulty } = params;
  const timeSeconds = getTimeSeconds(timeControl);

  // Determine player color
  let playerIsWhite: boolean;
  if (params.playerColor === 'white') {
    playerIsWhite = true;
  } else if (params.playerColor === 'black') {
    playerIsWhite = false;
  } else {
    playerIsWhite = Math.random() < 0.5;
  }

  const gameDocRef = db.collection('games').doc();

  await gameDocRef.set({
    whiteUid: playerIsWhite ? uid : 'bot',
    blackUid: playerIsWhite ? 'bot' : uid,
    mode: 'bot',
    difficulty,
    timeControl,
    timeSeconds,
    increment: 0,
    stakeAmountCrowns: 0,
    status: 'active', // Bot games start immediately
    result: null,
    resultReason: null,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
    moves: [],
    whiteTimeRemainingMs: timeSeconds * 1000,
    blackTimeRemainingMs: timeSeconds * 1000,
    anticheat: { status: 'exempt', flagged: false },
    payoutStatus: 'exempt',
    isBot: true,
    botDifficulty: difficulty,
    createdAt: admin.firestore.Timestamp.now(),
    completedAt: null,
  });

  // Create Stockfish instance for this game
  await stockfishService.createInstance(gameDocRef.id, difficulty);

  return gameDocRef.id;
};

export const getGame = async (gameId: string) => {
  const doc = await db.collection('games').doc(gameId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const getGameHistory = async (uid: string, page: number = 1, limit: number = 20) => {
  const gamesRef = db.collection('games');

  // Query games where user is white or black and game is completed
  // Firestore limitation: can't OR query, so we do two queries
  const [whiteSnap, blackSnap] = await Promise.all([
    gamesRef
      .where('whiteUid', '==', uid)
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'desc')
      .limit(limit * 2) // fetch extra to merge
      .get(),
    gamesRef
      .where('blackUid', '==', uid)
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'desc')
      .limit(limit * 2)
      .get(),
  ]);

  // Merge and sort
  const allGames = [
    ...whiteSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    ...blackSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  ];

  // Deduplicate (in case user played themselves? unlikely but safe)
  const seen = new Set<string>();
  const unique = allGames.filter((g: any) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });

  // Sort by createdAt desc
  unique.sort((a: any, b: any) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });

  // Paginate
  const offset = (page - 1) * limit;
  const paginated = unique.slice(offset, offset + limit);

  return { games: paginated, total: unique.length, page };
};

export const gameService = {
  createGame,
  createBotGame,
  getGame,
  getGameHistory,
  getTimeSeconds,
};

