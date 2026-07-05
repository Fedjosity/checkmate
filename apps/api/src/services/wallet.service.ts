import { db } from '../config/firebase.config';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Credit Crowns to a user's wallet atomically.
 * Also writes a transaction record in the same Firestore transaction.
 */
export async function creditWallet(
  uid: string,
  crowns: number,
  txRef: string,
  txType: string = 'crown_purchase',
  description: string = `${crowns} Crowns credited`
): Promise<number> {
  const userRef = db.collection('users').doc(uid);
  const txDocRef = db.collection('transactions').doc(txRef);

  const newBalance = await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) throw new AppError('User not found', 404);

    const userData = userDoc.data()!;
    const currentBalance = userData.wallet?.availableBalance ?? 0;
    const updatedBalance = currentBalance + crowns;

    t.update(userRef, { 'wallet.availableBalance': updatedBalance });

    t.set(txDocRef, {
      uid,
      type: txType,
      crownsAmount: crowns,
      usdAmount: Math.round((crowns / 100) * 100), // cents
      status: 'complete',
      provider: 'internal',
      providerRef: null,
      description,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }, { merge: true });

    return updatedBalance;
  });

  logger.info('Wallet credited', { uid, crowns, txRef, newBalance });
  return newBalance;
}

/**
 * Debit Crowns from a user's wallet atomically.
 * Throws if insufficient balance.
 */
export async function debitWallet(
  uid: string,
  crowns: number,
  txRef: string,
  txType: string = 'withdrawal'
): Promise<number> {
  const userRef = db.collection('users').doc(uid);
  const txDocRef = db.collection('transactions').doc(txRef);

  const newBalance = await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    if (!userDoc.exists) throw new AppError('User not found', 404);

    const userData = userDoc.data()!;
    const currentBalance = userData.wallet?.availableBalance ?? 0;

    if (currentBalance < crowns) {
      throw new AppError('Insufficient Crown balance', 400);
    }

    const updatedBalance = currentBalance - crowns;
    t.update(userRef, { 'wallet.availableBalance': updatedBalance });

    t.set(txDocRef, {
      uid,
      type: txType,
      crownsAmount: -crowns,
      usdAmount: Math.round((crowns / 100) * 100),
      status: 'pending',
      provider: 'flutterwave',
      providerRef: null,
      description: `${crowns} Crowns withdrawal`,
      createdAt: new Date().toISOString(),
      completedAt: null,
    });

    return updatedBalance;
  });

  logger.info('Wallet debited', { uid, crowns, txRef, newBalance });
  return newBalance;
}

/**
 * Credit Crowns from a completed deposit.
 * Looks up the pending transaction to find the Crown amount.
 */
export async function creditCrownsFromDeposit(
  uid: string,
  txRef: string
): Promise<number> {
  const txDoc = await db.collection('transactions').doc(txRef).get();
  if (!txDoc.exists) throw new AppError('Transaction not found', 404);

  const txData = txDoc.data()!;
  if (txData.status === 'complete') {
    // Idempotency — already credited
    logger.warn('Deposit already credited, skipping', { txRef });
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.data()?.wallet?.availableBalance ?? 0;
  }

  const crowns = txData.crownsAmount;
  const newBalance = await creditWallet(uid, crowns, txRef, 'crown_purchase', `${crowns} Crowns purchase`);

  // Mark the original pending tx as complete
  await db.collection('transactions').doc(txRef).update({
    status: 'complete',
    completedAt: new Date().toISOString(),
  });

  return newBalance;
}

/**
 * Get paginated transactions for a user.
 */
export async function getTransactions(
  uid: string,
  page: number = 1,
  limit: number = 20
): Promise<{ transactions: any[]; total: number }> {
  const txCollection = db.collection('transactions');

  // Get total count
  const countSnap = await txCollection.where('uid', '==', uid).count().get();
  const total = countSnap.data().count;

  // Get paginated results
  const offset = (page - 1) * limit;
  const snap = await txCollection
    .where('uid', '==', uid)
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(limit)
    .get();

  const transactions = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { transactions, total };
}
