/**
 * SIMULATE LEADERBOARD & USER PROFILE FLOW TEST SUITE
 * 
 * Validates:
 * 1. Time Control-segmented Leaderboards (Blitz, Rapid, Bullet, Classic).
 * 2. Country / Regional Leaderboard Filtering.
 * 3. User Public Profile (Rank Tier, Peak ELO, Win/Loss Stats, Bio).
 * 4. Profile Customization (Bio, Country, Preset/Dicebear Avatar updates).
 * 5. Game Archive & Match History Pagination (Outcomes, Net Crowns, Opponents).
 * 6. Head-to-Head (H2H) Lifetime Matchup Comparison.
 */

import { db } from '../src/config/firebase.config';
import { userController } from '../src/controllers/user.controller';
import { leaderboardController } from '../src/controllers/leaderboard.controller';

const MOCK_UID_1 = `sim_prof_user_1_${Date.now()}`;
const MOCK_UID_2 = `sim_prof_user_2_${Date.now()}`;

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failedCount++;
  }
}

// Mock Express req/res
function createMockReqRes(params: any = {}, body: any = {}, query: any = {}, user: any = null) {
  let responseData: any = null;
  let statusCode = 200;

  const req: any = {
    params,
    body,
    query,
    user,
  };

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    _getData: () => responseData,
    _getStatus: () => statusCode,
  };

  return { req, res };
}

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('♟️  LEADERBOARD & USER PROFILE AUTOMATED TEST SUITE');
  console.log('   Category Leaderboards, Profiles, Avatar Presets & Game History');
  console.log('===============================================================\n');

  try {
    // ─── Setup Mock Data ──────────────────────────────────────
    console.log('▶️  [Setup] Initializing Mock Players & Game History...');
    await db.collection('users').doc(MOCK_UID_1).set({
      displayName: 'Grandmaster Alice',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${MOCK_UID_1}`,
      country: 'US',
      bio: 'Chess enthusiast climbing the Crown ranks.',
      elo: {
        blitz: 1850,
        rapid: 1920,
        bullet: 1780,
        classic: 1600,
        gamesPlayed: 45,
        blitzRP: 1850,
        rapidRP: 1920,
        bulletRP: 1780,
        classicRP: 1600,
        blitzStreak: 4,
        rapidStreak: 2,
        bulletStreak: 0,
        classicStreak: 1,
        isTop500: true,
      },
      peakElo: {
        blitz: 1880,
        rapid: 1950,
        bullet: 1800,
        classic: 1650,
      },
      stats: {
        wins: 32,
        losses: 10,
        draws: 3,
        winStreak: 4,
        bestWinStreak: 8,
        totalCrownsWon: 6400,
      },
      createdAt: new Date().toISOString(),
    });

    await db.collection('users').doc(MOCK_UID_2).set({
      displayName: 'Master Bob',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${MOCK_UID_2}`,
      country: 'GB',
      bio: 'Tactical player from London.',
      elo: {
        blitz: 1620,
        rapid: 1580,
        bullet: 1690,
        classic: 1500,
        gamesPlayed: 30,
        blitzRP: 1620,
        rapidRP: 1580,
        bulletRP: 1690,
        classicRP: 1500,
        blitzStreak: 1,
        rapidStreak: 0,
        bulletStreak: 2,
        classicStreak: 0,
        isTop500: false,
      },
      createdAt: new Date().toISOString(),
    });

    // Create a mock completed game between Alice and Bob
    const gameId = `game_sim_prof_${Date.now()}`;
    await db.collection('games').doc(gameId).set({
      whiteUid: MOCK_UID_1,
      blackUid: MOCK_UID_2,
      status: 'completed',
      result: 'white',
      resultReason: 'checkmate',
      timeControlCategory: 'blitz',
      timeControlId: 'blitz_3_0',
      stakeAmountCrowns: 500,
      moves: [{ san: 'e4' }, { san: 'e5' }, { san: 'Qh5' }, { san: 'Nc6' }, { san: 'Bc4' }, { san: 'Nf6' }, { san: 'Qxf7#' }],
      completedAt: new Date().toISOString(),
    });
    console.log('  Setup complete.\n');

    // ─── Scenario 1: Leaderboard by Category ─────────────────
    console.log('▶️  [Scenario 1/6] Testing Time Control-Segmented Leaderboards...');
    {
      const { req, res } = createMockReqRes({}, {}, { timeControl: 'blitz', limit: '20' });
      await leaderboardController.getLeaderboard(req, res);
      const data = res._getData();

      assert(res._getStatus() === 200, 'Leaderboard returned HTTP 200');
      assert(data.success === true, 'Response status is successful');
      assert(Array.isArray(data.data.players), 'Leaderboard contains players array');
      assert(data.data.timeControl === 'blitz', 'Response timeControl matches query');

      const alice = data.data.players.find((p: any) => p.uid === MOCK_UID_1);
      assert(!!alice, 'Alice found in Blitz leaderboard');
      assert(alice?.elo?.blitz === 1850, 'Alice has correct Blitz rating (1850)');
    }

    // ─── Scenario 2: Country Filtered Leaderboard ─────────────
    console.log('\n▶️  [Scenario 2/6] Testing Country-Filtered Leaderboard...');
    {
      const { req, res } = createMockReqRes({}, {}, { timeControl: 'blitz', country: 'US' });
      await leaderboardController.getLeaderboard(req, res);
      const data = res._getData();

      assert(data.success === true, 'Country leaderboard returned success');
      const allUS = data.data.players.every((p: any) => p.country === 'US');
      assert(allUS, 'All returned players belong to country "US"');
      const bob = data.data.players.find((p: any) => p.uid === MOCK_UID_2);
      assert(!bob, 'Player from GB (Bob) is filtered out of US leaderboard');
    }

    // ─── Scenario 3: User Public Profile Retrieval ────────────
    console.log('\n▶️  [Scenario 3/6] Testing Public User Profile...');
    {
      const { req, res } = createMockReqRes({ uid: MOCK_UID_1 });
      await userController.getPublicProfile(req, res);
      const data = res._getData();

      assert(res._getStatus() === 200, 'Public profile returned HTTP 200');
      assert(data.data.user.displayName === 'Grandmaster Alice', 'Profile returns correct displayName');
      assert(data.data.user.bio === 'Chess enthusiast climbing the Crown ranks.', 'Profile returns custom bio');
      assert(data.data.user.peakElo.blitz === 1880, 'Profile returns peak Blitz ELO (1880)');
      assert(data.data.user.stats.wins === 32, 'Profile returns lifetime win stats');
    }

    // ─── Scenario 4: Profile Customization & Avatar Preset ─────
    console.log('\n▶️  [Scenario 4/6] Testing Profile & Avatar Preset Updates...');
    {
      const newAvatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=crown_queen_1';
      const { req, res } = createMockReqRes(
        {},
        {
          displayName: 'GM Alice The Invincible',
          bio: 'Grandmaster streamer and tactical chess champion.',
          avatarUrl: newAvatarUrl,
          country: 'CA',
        },
        {},
        { uid: MOCK_UID_1 }
      );

      await userController.updateProfile(req, res);
      const data = res._getData();

      assert(res._getStatus() === 200, 'Profile update returned HTTP 200');
      assert(data.data.user.displayName === 'GM Alice The Invincible', 'Display name updated successfully');
      assert(data.data.user.avatarUrl === newAvatarUrl, 'Avatar preset URL updated successfully');
      assert(data.data.user.country === 'CA', 'Country updated to Canada');
    }

    // ─── Scenario 5: Paginated Match History Archive ──────────
    console.log('\n▶️  [Scenario 5/6] Testing Paginated Game Archive & Outcomes...');
    {
      const { req, res } = createMockReqRes({ uid: MOCK_UID_1 }, {}, { limit: '10' });
      await userController.getUserGameHistory(req, res);
      const data = res._getData();

      assert(res._getStatus() === 200, 'Game history returned HTTP 200');
      assert(data.data.games.length >= 1, 'Game archive returns at least 1 match');

      const match = data.data.games.find((g: any) => g.id === gameId);
      assert(!!match, 'Found recent test match in archive');
      assert(match?.userColor === 'white', 'Alice correctly identified as White');
      assert(match?.result === 'win', 'Alice result correctly identified as "win"');
      assert(match?.netCrownsWon === 500, 'Net crowns won equals +500 Crowns');
      assert(match?.opponent?.displayName === 'Master Bob', 'Opponent correctly resolved as Master Bob');
      assert(match?.resultReason === 'checkmate', 'Ending reason resolved as "checkmate"');
    }

    // ─── Scenario 6: Head-to-Head (H2H) Lifetime Comparison ───
    console.log('\n▶️  [Scenario 6/6] Testing Head-to-Head (H2H) Stats Engine...');
    {
      const { req, res } = createMockReqRes({ uid: MOCK_UID_2 }, {}, { callerUid: MOCK_UID_1 }, { uid: MOCK_UID_1 });
      await userController.getHeadToHead(req, res);
      const data = res._getData();

      assert(res._getStatus() === 200, 'Head-to-head returned HTTP 200');
      assert(data.data.stats.totalGames >= 1, 'Head-to-head tracks direct games');
      assert(data.data.stats.userWins === 1, 'Alice recorded 1 win against Bob');
      assert(data.data.stats.opponentWins === 0, 'Bob recorded 0 wins against Alice');
      assert(data.data.stats.userScore === 1, 'Alice score equals 1.0');
    }

    // Clean up mock documents
    await db.collection('users').doc(MOCK_UID_1).delete();
    await db.collection('users').doc(MOCK_UID_2).delete();
    await db.collection('games').doc(gameId).delete();

    console.log('\n===============================================================');
    console.log(`🎯 Test Summary: ${passedCount} Passed, ${failedCount} Failed`);
    console.log('===============================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTestSuite();
