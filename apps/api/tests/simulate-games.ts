import { io, Socket } from 'socket.io-client';
import { db } from '../src/config/firebase.config';
import { redisService, LiveGameState } from '../src/services/redis.service';
import * as admin from 'firebase-admin';

const API_SOCKET_URL = 'http://localhost:4000';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface TestGameSession {
  gameId: string;
  whiteUid: string;
  blackUid: string;
  whiteSocket: Socket;
  blackSocket: Socket;
}

async function createLiveGame(params?: {
  baseTimeMs?: number;
  incrementMs?: number;
  timeControlCategory?: string;
}): Promise<{ gameId: string; whiteUid: string; blackUid: string }> {
  const whiteUid = 'sim_white_' + Math.floor(1000 + Math.random() * 9000);
  const blackUid = 'sim_black_' + Math.floor(1000 + Math.random() * 9000);

  const baseTimeMs = params?.baseTimeMs ?? 180000;
  const incrementMs = params?.incrementMs ?? 0;
  const timeControlCategory = params?.timeControlCategory ?? 'blitz';

  const gameDocRef = db.collection('games').doc();
  const gameId = gameDocRef.id;

  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  await gameDocRef.set({
    whiteUid,
    blackUid,
    mode: 'play_online',
    timeControlId: 'test_control',
    timeControlCategory,
    baseTimeMs,
    incrementMs,
    stakeAmountCrowns: 0,
    status: 'waiting',
    result: null,
    resultReason: null,
    fen: initialFen,
    pgn: '',
    moves: [],
    whiteTimeRemainingMs: baseTimeMs,
    blackTimeRemainingMs: baseTimeMs,
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
    mode: 'play_online',
    isBot: false,
    timeControlId: 'test_control',
    timeControlCategory,
    baseTimeMs,
    incrementMs,
    isUnlimited: false,
    stakeAmountCrowns: 0,
    whiteTimeRemainingMs: baseTimeMs,
    blackTimeRemainingMs: baseTimeMs,
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

  socket.onAny((event, ...args) => {
    console.log(`  📡 [${colorName} Socket] Event: "${event}"`, JSON.stringify(args));
  });

  socket.on('error', (err) => {
    console.error(`  ❌ [${colorName} Socket Error]:`, err);
  });

  const startPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for game:start on ${colorName}`)), 6000);
    socket.once('game:start', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });

  return new Promise((resolve, reject) => {
    const connTimeout = setTimeout(() => reject(new Error(`Timeout connecting ${colorName} socket`)), 5000);
    socket.on('connect', () => {
      clearTimeout(connTimeout);
      socket.emit('game:join', { gameId, uid });
      resolve({ socket, started: startPromise });
    });
  });
}

async function startSession(params?: {
  baseTimeMs?: number;
  incrementMs?: number;
  timeControlCategory?: string;
}): Promise<TestGameSession> {
  const { gameId, whiteUid, blackUid } = await createLiveGame(params);

  // Connect both players and wait for both to enter and receive game:start
  const [whiteConn, blackConn] = await Promise.all([
    connectPlayer(gameId, whiteUid, 'White'),
    connectPlayer(gameId, blackUid, 'Black'),
  ]);

  await Promise.all([whiteConn.started, blackConn.started]);

  return {
    gameId,
    whiteUid,
    blackUid,
    whiteSocket: whiteConn.socket,
    blackSocket: blackConn.socket,
  };
}

function waitForGameOver(socket: Socket, colorName: string): Promise<{ result: string; reason: string }> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for game:over on ${colorName}`)), 20000);
    socket.once('game:over', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
}

function makeMove(socket: Socket, gameId: string, uid: string, move: string) {
  socket.emit('game:move', { gameId, uid, move });
}

// -------------------------------------------------------------
// RUN ALL CORE WINNING & ENDING SCENARIOS
// -------------------------------------------------------------
async function runAllSimulations() {
  console.log('\n===============================================================');
  console.log('♟️  LIVE GAMEPLAY END-TO-END AUTOMATED TEST SUITE');
  console.log('   Testing Core Winning & Ending Scenarios over WebSockets');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function record(condition: boolean, title: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Checkmate (Scholar's Mate)
  // -------------------------------------------------------------
  console.log('▶️  [Scenario 1/5] Testing Checkmate (Scholar\'s Mate)...');
  {
    const session = await startSession();
    const whiteGameOver = waitForGameOver(session.whiteSocket, 'White');
    const blackGameOver = waitForGameOver(session.blackSocket, 'Black');

    // 1. e4 e5
    makeMove(session.whiteSocket, session.gameId, session.whiteUid, 'e4');
    await delay(200);
    makeMove(session.blackSocket, session.gameId, session.blackUid, 'e5');
    await delay(200);

    // 2. Bc4 Nc6
    makeMove(session.whiteSocket, session.gameId, session.whiteUid, 'Bc4');
    await delay(200);
    makeMove(session.blackSocket, session.gameId, session.blackUid, 'Nc6');
    await delay(200);

    // 3. Qh5 Nf6
    makeMove(session.whiteSocket, session.gameId, session.whiteUid, 'Qh5');
    await delay(200);
    makeMove(session.blackSocket, session.gameId, session.blackUid, 'Nf6');
    await delay(200);

    // 4. Qxf7# (Checkmate)
    makeMove(session.whiteSocket, session.gameId, session.whiteUid, 'Qxf7#');

    const [whiteResult, blackResult] = await Promise.all([whiteGameOver, blackGameOver]);

    record(whiteResult.result === 'white', 'White socket notified of victory');
    record(blackResult.result === 'white', 'Black socket notified of White victory');
    record(whiteResult.reason === 'checkmate', 'Reason correctly identified as "checkmate"');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 2: Player Resignation
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 2/5] Testing Resignation...');
  {
    const session = await startSession();
    const whiteGameOver = waitForGameOver(session.whiteSocket, 'White');
    const blackGameOver = waitForGameOver(session.blackSocket, 'Black');

    // White opens with d4
    makeMove(session.whiteSocket, session.gameId, session.whiteUid, 'd4');
    await delay(300);

    // Black resigns
    session.blackSocket.emit('game:resign', { gameId: session.gameId, uid: session.blackUid });

    const [whiteResult, blackResult] = await Promise.all([whiteGameOver, blackGameOver]);

    record(whiteResult.result === 'white', 'White awarded victory on Black resignation');
    record(whiteResult.reason === 'resignation', 'Reason correctly recorded as "resignation"');
    record(blackResult.result === 'white', 'Black notified of resignation defeat');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 3: Mutual Draw Agreement
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 3/5] Testing Mutual Draw Agreement...');
  {
    const session = await startSession();
    const whiteGameOver = waitForGameOver(session.whiteSocket, 'White');
    const blackGameOver = waitForGameOver(session.blackSocket, 'Black');

    makeMove(session.whiteSocket, session.gameId, session.whiteUid, 'Nf3');
    await delay(200);
    makeMove(session.blackSocket, session.gameId, session.blackUid, 'd5');
    await delay(200);

    // Setup listener for draw offer on Black's side
    const drawOfferReceived = new Promise<void>((resolve) => {
      session.blackSocket.once('game:draw_offered', () => resolve());
    });

    // White offers draw
    session.whiteSocket.emit('game:draw_offer', { gameId: session.gameId, uid: session.whiteUid });
    await drawOfferReceived;
    record(true, 'Opponent received draw offer notification');

    // Black accepts draw
    session.blackSocket.emit('game:draw_respond', {
      gameId: session.gameId,
      uid: session.blackUid,
      accept: true,
    });

    const [whiteResult, blackResult] = await Promise.all([whiteGameOver, blackGameOver]);

    record(whiteResult.result === 'draw', 'White received draw result');
    record(blackResult.result === 'draw', 'Black received draw result');
    record(whiteResult.reason === 'agreed', 'Reason correctly identified as "agreed"');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 4: Clock Timeout (Flag Fall)
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 4/5] Testing Clock Timeout (Short 2s clock)...');
  {
    // Start game with 2-second base time
    const session = await startSession({ baseTimeMs: 2000, incrementMs: 0 });
    const whiteGameOver = waitForGameOver(session.whiteSocket, 'White');
    const blackGameOver = waitForGameOver(session.blackSocket, 'Black');

    // White makes an immediate move
    makeMove(session.whiteSocket, session.gameId, session.whiteUid, 'e4');

    // Black stays silent and lets their 2s clock run out
    console.log('   Waiting for Black\'s 2-second clock to expire on server...');
    const [whiteResult, blackResult] = await Promise.all([whiteGameOver, blackGameOver]);

    record(whiteResult.result === 'white', 'White awarded victory on Black timeout');
    record(whiteResult.reason === 'timeout', 'Reason correctly identified as "timeout"');
    record(blackResult.result === 'white', 'Black notified of timeout defeat');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 5: Disconnection & Abandonment
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 5/5] Testing Abandonment & Disconnection...');
  {
    // For quick test, we create a game and simulate disconnect
    const session = await startSession({ timeControlCategory: 'blitz' });
    const whiteGameOver = waitForGameOver(session.whiteSocket, 'White');

    const opponentDisconnected = new Promise<void>((resolve) => {
      session.whiteSocket.once('game:opponent_disconnected', () => resolve());
    });

    // Black disconnects unexpectedly
    session.blackSocket.disconnect();
    await opponentDisconnected;
    record(true, 'White socket received "opponent_disconnected" event');

    console.log('   Waiting for 15s Blitz abandonment timer to expire...');
    const whiteResult = await whiteGameOver;

    record(whiteResult.result === 'white', 'White awarded victory after abandonment timer');
    record(whiteResult.reason === 'abandoned', 'Reason correctly identified as "abandoned"');

    session.whiteSocket.disconnect();
  }

  console.log('\n===============================================================');
  console.log(`🎯 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

async function createAndWatchDemoGame() {
  const whiteUid = 'demo_white';
  const blackUid = 'demo_black';
  const gameDocRef = db.collection('games').doc();
  const gameId = gameDocRef.id;
  const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  await gameDocRef.set({
    whiteUid,
    blackUid,
    mode: 'demo',
    isDemo: true,
    isBot: false,
    timeControlId: 'standard',
    timeControlCategory: 'rapid',
    baseTimeMs: 600000,
    incrementMs: 0,
    stakeAmountCrowns: 0,
    status: 'waiting',
    result: null,
    resultReason: null,
    fen: initialFen,
    pgn: '',
    moves: [],
    whiteTimeRemainingMs: 600000,
    blackTimeRemainingMs: 600000,
    anticheat: { status: 'exempt', flagged: false },
    payoutStatus: 'exempt',
    createdAt: admin.firestore.Timestamp.now(),
    completedAt: null,
  });

  const url = `http://localhost:3000/game/${gameId}`;

  console.log(`\n===============================================================`);
  console.log(`🎬 LIVE MATCH SHOWCASE READY!`);
  console.log(`👉 Open this URL in your browser now:`);
  console.log(`   \x1b[36m\x1b[4m${url}\x1b[0m`);
  console.log(`===============================================================`);
  console.log(`⏳ Opening match on your screen... countdown starting:\n`);
  for (let i = 10; i > 0; i--) {
    process.stdout.write(`\r   Starting live demo in ${i}s... `);
    await delay(1000);
  }
  console.log(`\n\n  Connecting automated players...`);

  const [whiteConn, blackConn] = await Promise.all([
    connectPlayer(gameId, whiteUid, 'White'),
    connectPlayer(gameId, blackUid, 'Black'),
  ]);

  console.log('  Waiting for game start...');
  await Promise.all([whiteConn.started, blackConn.started]);
  console.log('  ✨ Game active! Playing Scholar\'s Mate sequence on your screen...\n');

  const moves = [
    { socket: whiteConn.socket, uid: whiteUid, move: 'e4', desc: '1. White plays e4 (Pawn to e4)' },
    { socket: blackConn.socket, uid: blackUid, move: 'e5', desc: '1... Black plays e5 (Pawn to e5)' },
    { socket: whiteConn.socket, uid: whiteUid, move: 'Bc4', desc: '2. White plays Bc4 (Bishop develops to c4)' },
    { socket: blackConn.socket, uid: blackUid, move: 'Nc6', desc: '2... Black plays Nc6 (Knight develops to c6)' },
    { socket: whiteConn.socket, uid: whiteUid, move: 'Qh5', desc: '3. White plays Qh5 (Queen attacks f7 square!)' },
    { socket: blackConn.socket, uid: blackUid, move: 'Nf6', desc: '3... Black plays Nf6 (Knight tries to defend)' },
    { socket: whiteConn.socket, uid: whiteUid, move: 'Qxf7#', desc: '4. White plays Qxf7# - CHECKMATE! 👑' },
  ];

  for (const m of moves) {
    await delay(2500); // 2.5 second delay so you can comfortably watch each piece animate
    console.log(`  ♟️  ${m.desc}`);
    makeMove(m.socket, gameId, m.uid, m.move);
  }

  console.log('\n  🎉 Game complete! Look at your browser for the Checkmate & Victory modal.');
  await delay(10000);

  whiteConn.socket.disconnect();
  blackConn.socket.disconnect();
  process.exit(0);
}

async function playLiveOnScreen(gameId: string) {
  console.log(`\n===============================================================`);
  console.log(`🎬 WATCH MODE: Connecting to game: ${gameId}`);
  console.log(`===============================================================\n`);

  const doc = await db.collection('games').doc(gameId).get();
  if (!doc.exists) {
    console.error(`❌ Game ${gameId} not found in database.`);
    process.exit(1);
  }

  const gData = doc.data()!;
  const whiteUid = gData.whiteUid;
  const blackUid = gData.blackUid;

  const [whiteConn, blackConn] = await Promise.all([
    connectPlayer(gameId, whiteUid, 'White'),
    connectPlayer(gameId, blackUid, 'Black'),
  ]);

  await Promise.all([whiteConn.started, blackConn.started]);

  const moves = [
    { socket: whiteConn.socket, uid: whiteUid, move: 'e4', desc: '1. White plays e4' },
    { socket: blackConn.socket, uid: blackUid, move: 'e5', desc: '1... Black plays e5' },
    { socket: whiteConn.socket, uid: whiteUid, move: 'Bc4', desc: '2. White plays Bc4' },
    { socket: blackConn.socket, uid: blackUid, move: 'Nc6', desc: '2... Black plays Nc6' },
    { socket: whiteConn.socket, uid: whiteUid, move: 'Qh5', desc: '3. White plays Qh5' },
    { socket: blackConn.socket, uid: blackUid, move: 'Nf6', desc: '3... Black plays Nf6' },
    { socket: whiteConn.socket, uid: whiteUid, move: 'Qxf7#', desc: '4. White plays Qxf7# - CHECKMATE! 👑' },
  ];

  for (const m of moves) {
    await delay(2000);
    console.log(`  ♟️  ${m.desc}`);
    makeMove(m.socket, gameId, m.uid, m.move);
  }

  await delay(4000);
  whiteConn.socket.disconnect();
  blackConn.socket.disconnect();
  process.exit(0);
}

// -------------------------------------------------------------
// MAIN ENTRY POINT
// -------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const isDemo = args.includes('--demo') || args.includes('-d');
  const watchIndex = args.indexOf('--watch');

  if (isDemo) {
    await createAndWatchDemoGame();
  } else if (watchIndex !== -1 && args[watchIndex + 1]) {
    const targetGameId = args[watchIndex + 1];
    await playLiveOnScreen(targetGameId);
  } else {
    await runAllSimulations();
  }
}

main().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});
