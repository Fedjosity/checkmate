import { db } from '../src/config/firebase.config';

async function backfillKycStatus() {
  console.log('🔍 Scanning for users without a kycStatus...');
  let updatedCount = 0;

  try {
    const usersSnapshot = await db.collection('users').get();
    
    const batch = db.batch();
    let batchCount = 0;

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      
      // If the user does not have a kycStatus, default them to 'unverified'
      if (data.kycStatus === undefined || data.kycStatus === null) {
        batch.update(doc.ref, { kycStatus: 'unverified' });
        updatedCount++;
        batchCount++;

        // Firestore batches can only hold 500 operations
        if (batchCount === 500) {
          await batch.commit();
          console.log(`✅ Committed a batch of 500 users...`);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`🎉 Backfill complete! Updated ${updatedCount} old users with kycStatus: 'unverified'.`);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
  } finally {
    process.exit(0);
  }
}

backfillKycStatus();
