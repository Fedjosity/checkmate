import crypto from 'crypto';

// The secret from your .env
const SECRET = '7sUkZaqu_z-O-FHfBs4f5n6F4Q1CIq5Cr23-inseWYQ';
const URL = 'http://localhost:4000/webhooks/didit';

// Read arguments
const UID = process.argv[2];
const statusToTest = process.argv[3] || 'Approved';

if (!UID) {
  console.error('\n❌ Please provide a Firebase UID as an argument');
  console.error('Usage: pnpm ts-node test-kyc.ts <uid> [status]');
  console.error('Statuses: Approved, Declined, Resubmitted, Pending\n');
  process.exit(1);
}

const payload = {
  webhook_type: "status.updated",
  status: statusToTest,
  vendor_data: UID,
  changes: {
    features: {
      current: {
        id_document: statusToTest,
        face_match: statusToTest
      }
    }
  }
};

const payloadString = JSON.stringify(payload);

// Didit signs the exact JSON string body using HMAC SHA-256
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(payloadString)
  .digest('hex');

console.log(`\n🚀 Sending "${statusToTest}" webhook for user ${UID}...`);
console.log(`🔒 Generated Signature: ${signature}`);

fetch(URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-signature-v2': signature
  },
  body: payloadString
})
.then(async (res) => {
  console.log(`\n✅ Response Status: ${res.status}`);
  console.log(`📄 Response Body: ${await res.text()}\n`);
})
.catch(err => {
  console.error('\n❌ Error:', err);
});
