import { db } from '../src/config/firebase.config';
import { creditWallet, escrowCrowns } from '../src/services/wallet.service';
import { processWin, processDraw } from '../src/services/payout.service';
import { eloService } from '../src/services/elo.service';
import { rpToRank, calculateRPChange, Rank } from '@checkmate/shared-types';
import * as admin from 'firebase-admin';

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

async function setupTestUser(uid: string, initialCrowns: number, initialElo: number = 1200, initialRP: number = 0) {
  const userRef = db.collection('users').doc(uid);
  await userRef.set({
    uid,
    username: `User_${uid.slice(-4)}`,
    email: `${uid}@checkmatetest.com`,
    wallet: {
      availableBalance: initialCrowns,
      stakedBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
    },
    elo: {
      blitz: initialElo,
      rapid: initialElo,
      bullet: initialElo,
      classic: initialElo,
      blitzRP: initialRP,
      rapidRP: initialRP,
      bulletRP: initialRP,
      classicRP: initialRP,
      blitzStreak: 0,
      rapidStreak: 0,
      bulletStreak: 0,
      classicStreak: 0,
      gamesPlayed: 0,
      isTop500: false,
    },
    createdAt: admin.firestore.Timestamp.now(),
  }, { merge: true });
}

async function getTestUser(uid: string) {
  const doc = await db.collection('users').doc(uid).get();
  return doc.data()!;
}

async function cleanupUser(uid: string) {
  try {
    await db.collection('users').doc(uid).delete();
  } catch (e) {}
}

async function cleanupGame(gameId: string) {
  try {
    await db.collection('games').doc(gameId).delete();
  } catch (e) {}
}

async function runPhaseCTests() {
  console.log('\n===============================================================');
  console.log('♟️  PHASE C AUTOMATED TEST SUITE');
  console.log('   Wager Escrow, 100% Pot Payouts, Draw Refunds & ELO/Rank Engine');
  console.log('===============================================================\n');

  const userA = 'sim_user_ca_' + Math.floor(1000 + Math.random() * 9000);
  const userB = 'sim_user_cb_' + Math.floor(1000 + Math.random() * 9000);

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Stake Escrow Deduction on Match Entry
    // -------------------------------------------------------------
    console.log('▶️  [Scenario 1/5] Testing Crown Wager Escrow Locking...');
    await setupTestUser(userA, 2500, 1200, 0);
    await setupTestUser(userB, 2500, 1200, 0);

    const stakeAmount = 500;
    const escrowTxA = `escrow_${userA}_${Date.now()}`;
    const escrowTxB = `escrow_${userB}_${Date.now()}`;

    const resA = await escrowCrowns(userA, stakeAmount, escrowTxA);
    const resB = await escrowCrowns(userB, stakeAmount, escrowTxB);

    assert(resA.available === 2000, `User A available balance debited from 2500 to ${resA.available}`);
    assert(resA.staked === 500, `User A staked balance locked to ${resA.staked}`);
    assert(resB.available === 2000, `User B available balance debited from 2500 to ${resB.available}`);
    assert(resB.staked === 500, `User B staked balance locked to ${resB.staked}`);

    // -------------------------------------------------------------
    // SCENARIO 2: PvP Victory & 100% Combined Pot Awarding (0% Match Fee)
    // -------------------------------------------------------------
    console.log('\n▶️  [Scenario 2/5] Testing 100% Pot Winner Payout (0% Match Fee)...');
    const gameDocRef = db.collection('games').doc();
    const gameId = gameDocRef.id;

    await gameDocRef.set({
      whiteUid: userA,
      blackUid: userB,
      stakeAmountCrowns: stakeAmount,
      status: 'active',
      payoutStatus: 'pending',
    });

    // Winner gets both stakes: 500 * 2 = 1,000 Crowns
    await processWin({
      gameId,
      winnerUid: userA,
      loserUid: userB,
      timeControl: 'blitz',
      stakeAmountCrowns: stakeAmount,
    });

    const userAAfterWin = await getTestUser(userA);
    const userBAfterWin = await getTestUser(userB);
    const gameDocAfterWin = await db.collection('games').doc(gameId).get();
    const gameData = gameDocAfterWin.data()!;

    // User A: 2000 (remaining available) + 1000 (full 2x pot) = 3000
    assert(
      userAAfterWin.wallet?.availableBalance === 3000,
      `Winner awarded 100% of 2x pot: 1000 Crowns (Balance: ${userAAfterWin.wallet?.availableBalance})`
    );
    // User B: 2000 available (lost their 500 stake)
    assert(
      userBAfterWin.wallet?.availableBalance === 2000,
      `Loser receives 0 from wager pot (Balance: ${userBAfterWin.wallet?.availableBalance})`
    );
    assert(
      gameData.status === 'completed' && gameData.payoutStatus === 'completed',
      `Game status updated to completed & payoutStatus to completed`
    );

    // -------------------------------------------------------------
    // SCENARIO 3: Draw Handling & 100% Stake Refund
    // -------------------------------------------------------------
    console.log('\n▶️  [Scenario 3/5] Testing Draw 100% Stake Refund to Both Players...');
    const drawGameRef = db.collection('games').doc();
    const drawGameId = drawGameRef.id;

    const drawStake = 400;
    await escrowCrowns(userA, drawStake, `escrow_draw_${userA}_${Date.now()}`);
    await escrowCrowns(userB, drawStake, `escrow_draw_${userB}_${Date.now()}`);

    const userABeforeDraw = await getTestUser(userA);
    const userBBeforeDraw = await getTestUser(userB);
    assert(userABeforeDraw.wallet?.availableBalance === 2600, `User A available balance before draw: 2600`);
    assert(userBBeforeDraw.wallet?.availableBalance === 1600, `User B available balance before draw: 1600`);

    await drawGameRef.set({
      whiteUid: userA,
      blackUid: userB,
      stakeAmountCrowns: drawStake,
      status: 'active',
      payoutStatus: 'pending',
    });

    await processDraw({
      gameId: drawGameId,
      whiteUid: userA,
      blackUid: userB,
      timeControl: 'blitz',
      stakeAmountCrowns: drawStake,
    });

    const userAAfterDraw = await getTestUser(userA);
    const userBAfterDraw = await getTestUser(userB);

    assert(
      userAAfterDraw.wallet?.availableBalance === 3000,
      `User A refunded 100% of stake: 400 Crowns (Balance: ${userAAfterDraw.wallet?.availableBalance})`
    );
    assert(
      userBAfterDraw.wallet?.availableBalance === 2000,
      `User B refunded 100% of stake: 400 Crowns (Balance: ${userBAfterDraw.wallet?.availableBalance})`
    );

    // -------------------------------------------------------------
    // SCENARIO 4: ELO Calculations & Rating Adjustments
    // -------------------------------------------------------------
    console.log('\n▶️  [Scenario 4/5] Testing ELO Rating Adjustments (Glicko-2 / K=32)...');
    const eloUser1 = 'sim_elo_1_' + Math.floor(1000 + Math.random() * 9000);
    const eloUser2 = 'sim_elo_2_' + Math.floor(1000 + Math.random() * 9000);

    // Test equal rating match (1200 vs 1200)
    await setupTestUser(eloUser1, 1000, 1200, 100);
    await setupTestUser(eloUser2, 1000, 1200, 100);

    const winResult = await eloService.updateAfterGame({
      winnerUid: eloUser1,
      loserUid: eloUser2,
      timeControl: 'blitz',
      isDraw: false,
    });

    assert(winResult.winner.newElo === 1216, `Equal rating win adds +16 ELO to winner (New: ${winResult.winner.newElo})`);
    assert(winResult.loser.newElo === 1184, `Equal rating loss subtracts -16 ELO from loser (New: ${winResult.loser.newElo})`);

    // Test upset win (1184 defeats 1216)
    const upsetResult = await eloService.updateAfterGame({
      winnerUid: eloUser2, // 1184
      loserUid: eloUser1,  // 1216
      timeControl: 'blitz',
      isDraw: false,
    });

    assert(upsetResult.winner.newElo > 1184 + 16, `Upset win provides larger ELO gain: +${upsetResult.winner.newElo - 1184} ELO (New: ${upsetResult.winner.newElo})`);
    assert(upsetResult.loser.newElo < 1216 - 16, `Upset loss incurs larger ELO penalty: -${1216 - upsetResult.loser.newElo} ELO (New: ${upsetResult.loser.newElo})`);

    // Test Draw with equal ratings
    await setupTestUser(eloUser1, 1000, 1200, 100);
    await setupTestUser(eloUser2, 1000, 1200, 100);
    const drawResult = await eloService.updateAfterGame({
      winnerUid: eloUser1,
      loserUid: eloUser2,
      timeControl: 'blitz',
      isDraw: true,
    });

    assert(drawResult.winner.newElo === 1200 && drawResult.loser.newElo === 1200, `Equal rating draw produces 0 net change (1200 / 1200)`);

    // -------------------------------------------------------------
    // SCENARIO 5: RP & Rank Progression Engine
    // -------------------------------------------------------------
    console.log('\n▶️  [Scenario 5/5] Testing RP Streaks & Rank Tier Progression...');
    
    // Streak calculations
    const streak1RP = calculateRPChange(true, 1);
    const streak2RP = calculateRPChange(true, 2);
    const streak3RP = calculateRPChange(true, 3);
    const streak5RP = calculateRPChange(true, 5);

    assert(streak1RP === 25, `1st win gives base +25 RP`);
    assert(streak2RP === 25, `2nd win gives base +25 RP`);
    assert(streak3RP === 30, `3-win streak awards streak bonus: +${streak3RP} RP`);
    assert(streak5RP === 30, `5-win streak retains streak bonus: +${streak5RP} RP`);

    // Loss deduction
    const lossRP = calculateRPChange(false, 0);
    assert(lossRP === -20, `Standard loss deducts -20 RP`);

    // Rank tier mapping (300 RP per tier, 3 divisions of 100 RP each)
    assert(rpToRank(0, false).tier === 'Bronze', `0 RP maps to Bronze Rank`);
    assert(rpToRank(299, false).tier === 'Bronze', `299 RP maps to Bronze Rank`);
    assert(rpToRank(300, false).tier === 'Silver', `300 RP promotes to Silver Rank`);
    assert(rpToRank(600, false).tier === 'Gold', `600 RP promotes to Gold Rank`);
    assert(rpToRank(900, false).tier === 'Platinum', `900 RP promotes to Platinum Rank`);
    assert(rpToRank(1200, false).tier === 'Diamond', `1,200 RP promotes to Diamond Rank`);
    assert(rpToRank(1500, false).tier === 'Master', `1,500 RP promotes to Master Rank`);
    assert(rpToRank(1800, false).tier === 'Grandmaster', `1,800 RP promotes to Grandmaster Rank`);
    assert(rpToRank(2100, false).tier === 'Eternal', `2,100 RP promotes to Eternal Rank`);
    assert(rpToRank(2500, true).tier === 'Crown', `Top 500 promotes to Crown Rank`);

    // Cleanup
    await cleanupUser(userA);
    await cleanupUser(userB);
    await cleanupUser(eloUser1);
    await cleanupUser(eloUser2);
    await cleanupGame(gameId);
    await cleanupGame(drawGameId);

  } catch (err: any) {
    console.error('Test execution error:', err);
    failedTests++;
  }

  console.log('\n===============================================================');
  console.log(`🎯 Phase C Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhaseCTests();
