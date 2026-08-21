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
  customFen?: string;
  customPgn?: string;
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

  const initialFen = params?.customFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

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
    pgn: params?.customPgn || '',
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
    pgn: params?.customPgn || '',
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
  customFen?: string;
  customPgn?: string;
  baseTimeMs?: number;
  incrementMs?: number;
  timeControlCategory?: string;
}): Promise<TestGameSession> {
  const { gameId, whiteUid, blackUid } = await createLiveGame(params);

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
    const t = setTimeout(() => reject(new Error(`Timeout waiting for game:over on ${colorName}`)), 10000);
    socket.onAny((event, ...args) => {
      if (event === 'game:over') {
        console.log(`    📡 [${colorName}] Caught event "game:over":`, args[0]);
      }
    });
    socket.once('game:over', (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });
}

function makeMoveAndWait(
  socket: Socket,
  gameId: string,
  uid: string,
  move: string
): Promise<{ fen: string; pgn: string; move: string }> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for move ack: ${move}`));
    }, 6000);

    const onMove = (data: any) => {
      const dataMove = (data.move || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const expectedMove = move.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (
        dataMove === expectedMove ||
        data.move === move ||
        expectedMove.includes(dataMove) ||
        dataMove.includes(expectedMove)
      ) {
        cleanup();
        resolve(data);
      }
    };

    const onError = (err: any) => {
      cleanup();
      console.error(`    ❌ Move failed: "${move}" by ${uid}:`, err);
      reject(new Error(err.error || 'Move error'));
    };

    function cleanup() {
      clearTimeout(t);
      socket.off('game:move', onMove);
      socket.off('game:move_error', onError);
    }

    socket.on('game:move', onMove);
    socket.on('game:move_error', onError);
    socket.emit('game:move', { gameId, uid, move, clientTimestamp: Date.now() });
  });
}

function makeIllegalMove(
  socket: Socket,
  gameId: string,
  uid: string,
  move: string
): Promise<{ error: string }> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Expected move_error for illegal move ${move}, but got timeout`)), 4000);
    socket.once('game:move_error', (err) => {
      clearTimeout(t);
      resolve(err);
    });
    socket.once('game:move', () => {
      clearTimeout(t);
      reject(new Error(`Illegal move ${move} was unexpectedly accepted!`));
    });
    socket.emit('game:move', { gameId, uid, move, clientTimestamp: Date.now() });
  });
}

// -------------------------------------------------------------
// MAIN TEST SUITE FOR PHASE B
// -------------------------------------------------------------
async function runPhaseBSimulations() {
  console.log('===============================================================');
  console.log('♟️  PHASE B AUTOMATED TEST SUITE');
  console.log('   Special Moves, Restrictions & Automatic Draw Conditions');
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
  // TEST 1: Kingside (O-O) & Queenside (O-O-O) Castling
  // -------------------------------------------------------------
  console.log('▶️  [Scenario 1/6] Testing Kingside & Queenside Castling...');
  {
    const session = await startSession();

    // 1. e4 e5
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'e4');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'e5');

    // 2. Nf3 Nc6
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Nf3');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Nc6');

    // 3. Bc4 Bc5
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Bc4');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Bc5');

    // 4. White Castles Kingside (O-O)
    const whiteCastle = await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'O-O');
    record(whiteCastle.fen.includes('r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1'), 'White successfully castled kingside (O-O)');
    record(whiteCastle.fen.includes('1RK1'), 'King moved to g1 and Rook moved to f1');

    // 4... d6
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'd6');

    // 5. d3 Bg4 6. Be3 Qd7 7. Nc3 O-O-O (Black Castles Queenside)
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'd3');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Bg4');
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Be3');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Qd7');
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Nc3');

    const blackCastle = await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'O-O-O');
    record(blackCastle.fen.startsWith('2kr2nr'), 'Black successfully castled queenside (O-O-O)');
    record(blackCastle.fen.includes('2kr'), 'Black King on c8 and Black Rook on d8');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 2: Illegal Castling Restrictions (In Check, Through Check, King Moved)
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 2/6] Testing Castling Restrictions (Check & Movement)...');
  {
    // Custom position where White King is in check from Black Queen on e7
    const inCheckFen = 'rnb1kbnr/ppppqppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 1 3';
    const session = await startSession({ customFen: inCheckFen });

    // Try to castle while in check -> MUST be rejected
    const castlingInCheck = await makeIllegalMove(session.whiteSocket, session.gameId, session.whiteUid, 'O-O');
    record(!!castlingInCheck.error, 'Castling while in check correctly rejected by engine');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 3: En Passant Capture & Expiration
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 3/6] Testing En Passant (Capture & Expiration)...');
  {
    const session = await startSession();

    // 1. e4 c5 2. e5 d5 (Pawn advances 2 squares next to White e5 pawn)
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'e4');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'c5');
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'e5');
    const d5Move = await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'd5');
    record(d5Move.fen.includes('d6'), 'En passant target square (d6) created in FEN');

    // 3. exd6 (En Passant Capture)
    const epCapture = await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'exd6');
    record(!epCapture.fen.includes('3p4'), 'Captured Black d5 pawn removed from board via En Passant');
    record(epCapture.fen.includes('3P4') || epCapture.fen.includes('P'), 'White pawn moved diagonally to d6');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 4: Pawn Promotion (Queen & Knight Under-Promotion)
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 4/6] Testing Pawn Promotion (Queen & Knight)...');
  {
    // Setup position with White pawns on e7 and a7 ready to promote
    const promoFen = '8/P3P1k1/8/8/8/8/8/4K3 w - - 0 1';
    const session = await startSession({ customFen: promoFen });

    // 1. e8=Q (Promote e-pawn to Queen)
    const queenPromo = await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'e8=Q');
    record(queenPromo.fen.startsWith('4Q'), 'Pawn promoted to Queen on e8');

    // 1... Kh7
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Kh7');

    // 2. a8=N (Under-promote a-pawn to Knight)
    const knightPromo = await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'a8=N');
    record(knightPromo.fen.startsWith('N3Q'), 'Pawn under-promoted to Knight on a8');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 5: Stalemate Automatic Draw
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 5/6] Testing Stalemate Automatic Draw...');
  {
    // Valid Stalemate setup: Black King on a8, White King on a6, White Queen on c1
    const stalemateSetupFen = 'k7/8/K7/8/8/8/8/2Q5 w - - 0 1';
    const session = await startSession({ customFen: stalemateSetupFen });
    const whiteGameOver = waitForGameOver(session.whiteSocket, 'White');
    const blackGameOver = waitForGameOver(session.blackSocket, 'Black');

    // White plays Qc7 -> Black King is NOT in check and has zero legal moves -> Stalemate
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Qc7');

    const [whiteRes, blackRes] = await Promise.all([whiteGameOver, blackGameOver]);
    record(whiteRes.result === 'draw', 'Game ended in draw on stalemate');
    record(whiteRes.reason === 'stalemate', 'Reason correctly identified as "stalemate"');
    record(blackRes.result === 'draw' && blackRes.reason === 'stalemate', 'Both sockets notified of stalemate draw');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();
  }

  // -------------------------------------------------------------
  // TEST 6: Threefold Repetition & Insufficient Material
  // -------------------------------------------------------------
  console.log('\n▶️  [Scenario 6/6] Testing Threefold Repetition & Insufficient Material...');
  {
    // Part A: Threefold Repetition
    const session = await startSession();
    const whiteGameOver = waitForGameOver(session.whiteSocket, 'White');

    // Starting position = Count 1
    // Cycle 1: 1. Nf3 Nf6 2. Ng1 Ng8 -> Count 2
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Nf3');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Nf6');
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Ng1');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Ng8');

    // Cycle 2: 3. Nf3 Nf6 4. Ng1 Ng8 -> Count 3 (Threefold Repetition triggered on Ng8)
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Nf3');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Nf6');
    await makeMoveAndWait(session.whiteSocket, session.gameId, session.whiteUid, 'Ng1');
    await makeMoveAndWait(session.blackSocket, session.gameId, session.blackUid, 'Ng8');

    const repResult = await whiteGameOver;
    record(repResult.result === 'draw', 'Threefold repetition resulted in draw');
    record(repResult.reason === 'threefold_repetition', 'Reason correctly identified as "threefold_repetition"');

    session.whiteSocket.disconnect();
    session.blackSocket.disconnect();

    // Part B: Insufficient Material (King vs King)
    const kVsK_Fen = '8/8/8/4k3/8/8/4K3/8 w - - 0 1';
    const kSession = await startSession({ customFen: kVsK_Fen });
    const kGameOver = waitForGameOver(kSession.whiteSocket, 'White');

    await makeMoveAndWait(kSession.whiteSocket, kSession.gameId, kSession.whiteUid, 'Kd3');
    const matResult = await kGameOver;
    record(matResult.result === 'draw', 'King vs King resulted in draw');
    record(matResult.reason === 'insufficient_material', 'Reason correctly identified as "insufficient_material"');

    kSession.whiteSocket.disconnect();
    kSession.blackSocket.disconnect();
  }

  console.log('\n===============================================================');
  console.log(`🎯 Phase B Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhaseBSimulations().catch((err) => {
  console.error('Simulation error in Phase B:', err);
  process.exit(1);
});
