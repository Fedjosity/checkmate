import { PvpEngine } from '../src/services/pvp.engine';
import { LiveGameState } from '../src/services/redis.service';

const createMockGameState = (overrides?: Partial<LiveGameState>): LiveGameState => ({
  id: 'test-game-123',
  whiteUid: 'player-white',
  blackUid: 'player-black',
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn: '',
  moves: [],
  mode: 'pvp',
  isBot: false,
  timeControlId: 'blitz-3-0',
  timeControlCategory: 'blitz',
  baseTimeMs: 180000, // 3 mins
  incrementMs: 0,
  isUnlimited: false,
  stakeAmountCrowns: 100,
  whiteTimeRemainingMs: 180000,
  blackTimeRemainingMs: 180000,
  lastMoveTimestamp: 1000000,
  status: 'active',
  whiteConnected: true,
  blackConnected: true,
  drawOfferBy: null,
  createdAt: 1000000,
  ...overrides,
});

async function runTests() {
  console.log('🧪 Starting PvP Live Game Engine Automated Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // --- TEST 1: Legal Move Application ---
  {
    const state = createMockGameState();
    const result = PvpEngine.applyMove({
      state,
      uid: 'player-white',
      move: 'e4',
      now: 1001000, // 1 sec elapsed
    });

    assert(result.success === true, 'White can play legal opening move (e4)');
    assert(Boolean(result.newState?.fen.includes('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq')), 'FEN updated with e4');
    assert(result.newState?.whiteTimeRemainingMs === 179000, 'White clock correctly deducted by 1000ms');
    assert(result.newState?.blackTimeRemainingMs === 180000, 'Black clock unchanged on White move');
  }

  // --- TEST 2: Illegal Move Rejection ---
  {
    const state = createMockGameState();
    const result = PvpEngine.applyMove({
      state,
      uid: 'player-white',
      move: 'e5', // Illegal pawn jump for white
      now: 1001000,
    });

    assert(result.success === false, 'Server strictly rejects illegal move (e5 for White)');
    assert(!!result.error, 'Error message returned on illegal move');
  }

  // --- TEST 3: Wrong Turn Rejection ---
  {
    const state = createMockGameState();
    const result = PvpEngine.applyMove({
      state,
      uid: 'player-black', // Black trying to move first
      move: 'e5',
      now: 1001000,
    });

    assert(result.success === false, 'Server rejects move when not player turn');
    assert(result.error === 'Not your turn', 'Correct error message for wrong turn');
  }

  // --- TEST 4: Checkmate Detection (Scholar\'s Mate) ---
  {
    let state = createMockGameState();
    
    // 1. e4 e5
    state = PvpEngine.applyMove({ state, uid: 'player-white', move: 'e4', now: 1000100 }).newState!;
    state = PvpEngine.applyMove({ state, uid: 'player-black', move: 'e5', now: 1000200 }).newState!;
    
    // 2. Bc4 Nc6
    state = PvpEngine.applyMove({ state, uid: 'player-white', move: 'Bc4', now: 1000300 }).newState!;
    state = PvpEngine.applyMove({ state, uid: 'player-black', move: 'Nc6', now: 1000400 }).newState!;

    // 3. Qh5 Nf6
    state = PvpEngine.applyMove({ state, uid: 'player-white', move: 'Qh5', now: 1000500 }).newState!;
    state = PvpEngine.applyMove({ state, uid: 'player-black', move: 'Nf6', now: 1000600 }).newState!;

    // 4. Qxf7# (Checkmate)
    const mateResult = PvpEngine.applyMove({ state, uid: 'player-white', move: 'Qxf7#', now: 1000700 });

    assert(mateResult.success === true, 'Checkmate move accepted');
    assert(mateResult.gameEnding?.isOver === true, 'Engine detects game is over');
    assert(mateResult.gameEnding?.winner === 'white', 'White awarded victory');
    assert(mateResult.gameEnding?.reason === 'checkmate', 'Reason recorded as checkmate');
    assert(mateResult.newState?.status === 'completed', 'Game status transitioned to completed');
  }

  // --- TEST 5: Clock Timeout Detection ---
  {
    const state = createMockGameState({
      whiteTimeRemainingMs: 5000, // 5s left
      lastMoveTimestamp: 1000000,
    });

    // 6 seconds elapsed -> timeout
    const clock = PvpEngine.calculateClock(state, 1006000);
    assert(clock.isTimedOut === true, 'Clock accurately detects timeout');
    assert(clock.timeoutWinner === 'black', 'Black wins on White timeout');
    assert(clock.whiteTimeRemainingMs === 0, 'White time clamped to 0');
  }

  // --- TEST 6: Abandonment Timeout Categories ---
  {
    const blitzTimeout = PvpEngine.getAbandonmentTimeoutMs('blitz');
    const rapidTimeout = PvpEngine.getAbandonmentTimeoutMs('rapid');
    assert(blitzTimeout === 15000, 'Blitz uses 15s abandonment timer');
    assert(rapidTimeout === 60000, 'Rapid uses 60s abandonment timer');
  }

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
