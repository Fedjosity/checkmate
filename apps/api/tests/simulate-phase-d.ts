import { io, Socket } from 'socket.io-client';
import { db } from '../src/config/firebase.config';
import { redisService, LiveGameState } from '../src/services/redis.service';
import { matchmakingService, QueueEntry } from '../src/services/matchmaking.service';
import { rpToRank } from '@checkmate/shared-types';
import * as admin from 'firebase-admin';

const API_SOCKET_URL = 'http://localhost:4000';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function createLiveGame(params?: {
  mode?: string;
  isDemo?: boolean;
}): Promise<{ gameId: string; whiteUid: string; blackUid: string }> {
  const whiteUid = 'sim_d_white_' + Math.floor(1000 + Math.random() * 9000);
  const blackUid = 'sim_d_black_' + Math.floor(1000 + Math.random() * 9000);

  const gameDocRef = db.collection('games').doc();
  const gameId = gameDocRef.id;

  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const mode = params?.isDemo ? 'demo' : (params?.mode || 'play_online');

  await gameDocRef.set({
    whiteUid,
    blackUid,
    mode,
    timeControlId: 'blitz_3_0',
    timeControlCategory: 'blitz',
    baseTimeMs: 180000,
    incrementMs: 0,
    stakeAmountCrowns: 0,
    status: 'waiting',
    result: null,
    resultReason: null,
    fen: initialFen,
    pgn: '',
    moves: [],
    whiteTimeRemainingMs: 180000,
    blackTimeRemainingMs: 180000,
    anticheat: { status: 'exempt', flagged: false },
    payoutStatus: 'exempt',
    createdAt: admin.firestore.Timestamp.now(),
    completedAt: null,
  });

  const liveState: LiveGameState = {
    id: gameId,
    whiteUid,
    blackUid,
    fen: initialFen,
    pgn: '',
    moves: [],
    mode: mode as any,
    isBot: false,
    timeControlId: 'blitz_3_0',
    timeControlCategory: 'blitz',
    baseTimeMs: 180000,
    incrementMs: 0,
    isUnlimited: false,
    stakeAmountCrowns: 0,
    whiteTimeRemainingMs: 180000,
    blackTimeRemainingMs: 180000,
    lastMoveTimestamp: Date.now(),
    status: 'waiting',
    whiteConnected: false,
    blackConnected: false,
    drawOfferBy: null,
    createdAt: Date.now(),
  };

  await redisService.saveGameState(gameId, liveState);

  return { gameId, whiteUid, blackUid };
}

function connectPlayer(gameId: string, uid: string, colorName: string): Promise<{ socket: Socket; started: Promise<any> }> {
  const socket = io(API_SOCKET_URL, {
    transports: ['websocket'],
    forceNew: true,
  });

  socket.on('error', (err) => {
    console.error(`  ❌ [${colorName} Socket Error]:`, err);
  });

  const startPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for game:start on ${colorName}`)), 10000);
    socket.once('game:start', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });

  return new Promise((resolve, reject) => {
    const connTimeout = setTimeout(() => reject(new Error(`Timeout connecting ${colorName} socket`)), 10000);
    socket.on('connect', () => {
      clearTimeout(connTimeout);
      socket.emit('game:join', { gameId, uid });
      resolve({ socket, started: startPromise });
    });
  });
}

async function startSession(params?: {
  mode?: string;
  isDemo?: boolean;
}): Promise<{
  gameId: string;
  whiteUid: string;
  blackUid: string;
  whiteSocket: Socket;
  blackSocket: Socket;
}> {
  const { gameId, whiteUid, blackUid } = await createLiveGame(params);

  const whiteConn = await connectPlayer(gameId, whiteUid, 'White');
  await delay(100);
  const blackConn = await connectPlayer(gameId, blackUid, 'Black');

  await Promise.all([whiteConn.started, blackConn.started]);

  return {
    gameId,
    whiteUid,
    blackUid,
    whiteSocket: whiteConn.socket,
    blackSocket: blackConn.socket,
  };
}

async function cleanupGame(gameId: string) {
  try {
    await db.collection('games').doc(gameId).delete();
    await redisService.deleteGameState(gameId);
  } catch (e) {}
}

async function runPhaseDTests() {
  console.log('\n===============================================================');
  console.log('♟️  PHASE D AUTOMATED TEST SUITE');
  console.log('   Matchmaking Pools, Disconnect Resiliency & Live Spectating');
  console.log('===============================================================\n');

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Matchmaking Pool Queue & Pairing
    // -------------------------------------------------------------
    console.log('▶️  [Scenario 1/4] Testing Matchmaking Queue Pool & Pairing...');
    const rankBronze = rpToRank(150, false);
    
    const entryA: QueueEntry = {
      uid: 'queue_user_1',
      socketId: 'sock_1',
      mode: 'play_online',
      timeControlId: 'blitz_3_0',
      stakeAmountCrowns: 0,
      elo: 1250,
      rank: rankBronze,
      joinedAt: new Date(Date.now() - 10000),
      status: 'waiting',
    };

    const entryB: QueueEntry = {
      uid: 'queue_user_2',
      socketId: 'sock_2',
      mode: 'play_online',
      timeControlId: 'blitz_3_0',
      stakeAmountCrowns: 0,
      elo: 1280,
      rank: rankBronze,
      joinedAt: new Date(),
      status: 'waiting',
    };

    matchmakingService.addToQueue(entryA);
    assert(
      matchmakingService.getQueueDepth('play_online', 'blitz_3_0', 0) === 1,
      'Queue depth correctly reflects 1 waiting player'
    );

    matchmakingService.addToQueue(entryB);
    assert(
      matchmakingService.getQueueDepth('play_online', 'blitz_3_0', 0) === 2,
      'Queue depth updates to 2 waiting players'
    );

    const matchFound = matchmakingService.scanForMatch(entryA);
    assert(matchFound !== null, 'Matchmaker successfully found an opponent within rating range');
    assert(matchFound?.uid === 'queue_user_2', 'Matched with correct opponent (queue_user_2)');

    // Cleanup queue
    matchmakingService.removeFromQueue('queue_user_1');
    matchmakingService.removeFromQueue('queue_user_2');
    assert(
      matchmakingService.getQueueDepth('play_online', 'blitz_3_0', 0) === 0,
      'Queue depth returns to 0 after removing players'
    );

    // -------------------------------------------------------------
    // SCENARIO 2: Matchmaking Separation (Disparity & Mode Isolation)
    // -------------------------------------------------------------
    console.log('\n▶️  [Scenario 2/4] Testing Matchmaking Rating & Mode Isolation...');
    const entryLowElo: QueueEntry = {
      uid: 'queue_novice',
      socketId: 'sock_novice',
      mode: 'play_online',
      timeControlId: 'blitz_3_0',
      stakeAmountCrowns: 0,
      elo: 800,
      rank: rankBronze,
      joinedAt: new Date(),
      status: 'waiting',
    };

    const entryHighElo: QueueEntry = {
      uid: 'queue_master',
      socketId: 'sock_master',
      mode: 'play_online',
      timeControlId: 'blitz_3_0',
      stakeAmountCrowns: 0,
      elo: 2200,
      rank: rpToRank(1500, false),
      joinedAt: new Date(),
      status: 'waiting',
    };

    matchmakingService.addToQueue(entryLowElo);
    matchmakingService.addToQueue(entryHighElo);

    const disparityMatch = matchmakingService.scanForMatch(entryLowElo);
    assert(disparityMatch === null, 'Matchmaker prevented pairing with huge ELO disparity (800 vs 2200)');

    matchmakingService.removeFromQueue('queue_novice');
    matchmakingService.removeFromQueue('queue_master');

    // -------------------------------------------------------------
    // SCENARIO 3: Disconnection & Reconnection Grace Period
    // -------------------------------------------------------------
    console.log('\n▶️  [Scenario 3/4] Testing Disconnection Detection & Reconnection Grace Period...');
    const session = await startSession();
    assert(true, 'Both White and Black connected and game started');

    // Setup listener on White socket for Black disconnect event
    const disconnectPromise = new Promise((resolve) => {
      session.whiteSocket.once('game:opponent_disconnected', () => {
        resolve(true);
      });
    });

    // Setup listener on White socket for Black reconnect event
    const reconnectPromise = new Promise((resolve) => {
      session.whiteSocket.once('game:opponent_reconnected', () => {
        resolve(true);
      });
    });

    // Simulate Black disconnecting unexpectedly
    session.blackSocket.disconnect();
    await disconnectPromise;
    assert(true, 'White socket received "game:opponent_disconnected" event');

    const stateAfterDisconnect = await redisService.getGameState(session.gameId);
    assert(stateAfterDisconnect?.blackConnected === false, 'Redis reflects blackConnected: false');

    // Simulate Black reconnecting within the grace window
    await delay(300);
    const blackReconnected = await connectPlayer(session.gameId, session.blackUid, 'Black Reconnected');
    await blackReconnected.started;
    await reconnectPromise;

    assert(true, 'White socket received "game:opponent_reconnected" event');
    await delay(100);

    // Verify game continues smoothly by making moves
    const movePromise = new Promise((resolve) => {
      blackReconnected.socket.once('game:move', (data) => resolve(data));
    });

    session.whiteSocket.emit('game:move', { gameId: session.gameId, uid: session.whiteUid, move: 'e4' });
    const moveData: any = await movePromise;
    assert(moveData.move === 'e4', 'Move e4 processed and synced to reconnected player');

    session.whiteSocket.disconnect();
    blackReconnected.socket.disconnect();
    await cleanupGame(session.gameId);

    // -------------------------------------------------------------
    // SCENARIO 4: Live Spectator Mode
    // -------------------------------------------------------------
    console.log('\n▶️  [Scenario 4/4] Testing Live Spectator Mode (Demo / Watch)...');
    const demoSession = await startSession({ isDemo: true });

    // Connect 3rd party Spectator socket
    const spectatorSocket = io(API_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      forceNew: true,
    });

    const spectatorStartPromise = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timeout waiting for spectator game:start')), 4000);
      spectatorSocket.once('game:start', (data) => {
        clearTimeout(t);
        resolve(data);
      });
    });

    await new Promise((resolve) => {
      spectatorSocket.on('connect', () => {
        spectatorSocket.emit('game:join', { gameId: demoSession.gameId, uid: 'spectator_user_99' });
        resolve(true);
      });
    });

    await spectatorStartPromise;
    assert(true, 'Spectator successfully joined live demo match and received initial board');

    // White makes move -> assert spectator receives live broadcast
    const spectatorMovePromise = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timeout waiting for spectator game:move')), 4000);
      spectatorSocket.once('game:move', (data) => {
        clearTimeout(t);
        resolve(data);
      });
    });

    demoSession.whiteSocket.emit('game:move', { gameId: demoSession.gameId, uid: demoSession.whiteUid, move: 'd4' });
    const specMoveData: any = await spectatorMovePromise;
    assert(specMoveData.move === 'd4', 'Spectator received live move broadcast "d4"');

    demoSession.whiteSocket.disconnect();
    demoSession.blackSocket.disconnect();
    spectatorSocket.disconnect();
    await cleanupGame(demoSession.gameId);

  } catch (err: any) {
    console.error('Test execution error:', err);
    failedTests++;
  }

  console.log('\n===============================================================');
  console.log(`🎯 Phase D Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhaseDTests();
