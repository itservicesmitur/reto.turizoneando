/**
 * Script to clean up test users created by k6 in the preprod environment.
 * Deletes documents from:
 *   - /players/{uid}
 *   - /players/{uid}/attempts/*
 *   - /players/{uid}/seasons/*
 *   - /prizeCodes (where playerId == uid)
 * And deletes the account from Firebase Auth.
 *
 * Runs in dry-run mode by default. Run with --execute to perform actual deletion.
 * Usage:
 *   node scripts/cleanTestUsers.cjs
 *   node scripts/cleanTestUsers.cjs --execute
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PROJECT_ID = 'turizoneando-dev';
const CSV_FILE = path.join(__dirname, '..', 'users.csv');
const IS_DRY_RUN = !process.argv.includes('--execute');

// Fetch access token from gcloud
let token;
try {
  token = execSync('gcloud auth print-access-token').toString().trim();
} catch (e) {
  console.error('❌ Error getting access token. Make sure you are logged in to gcloud (gcloud auth login).');
  process.exit(1);
}

// Helper to make HTTPS requests
function request(options, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${token}`,
      'x-goog-user-project': PROJECT_ID,
      ...(options.headers || {})
    };
    const req = https.request({ ...options, headers }, (res) => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data ? JSON.parse(data) : { success: true });
          } else {
            resolve({ error: true, statusCode: res.statusCode, body: data });
          }
        } catch (e) {
          resolve({ error: true, statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Fetch documents in a collection/subcollection via REST
async function listDocuments(parentPath) {
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${parentPath}?pageSize=500`,
    method: 'GET'
  });
  if (res.error) {
    if (res.statusCode === 404) return [];
    throw new Error(`Failed to list ${parentPath}: ${res.body}`);
  }
  return (res.documents || []).map(doc => doc.name);
}

// Fetch prize codes for a player
async function queryPrizeCodes(playerId) {
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'prizeCodes' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'playerId' },
          op: 'EQUAL',
          value: { stringValue: playerId }
        }
      }
    }
  };
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`,
    method: 'POST'
  }, payload);

  if (res.error) {
    throw new Error(`Failed to query prizeCodes for ${playerId}: ${res.body}`);
  }

  // runQuery returns an array of result objects containing a 'document' field
  return res
    .filter(item => item.document && item.document.name)
    .map(item => item.document.name);
}

// Commit batch deletes to Firestore
async function commitDeletes(documentNames) {
  if (documentNames.length === 0) return;
  const payload = {
    writes: documentNames.map(name => ({ delete: name }))
  };
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`,
    method: 'POST'
  }, payload);
  if (res.error) {
    throw new Error(`Failed to commit batch delete: ${res.body}`);
  }
}

// Delete user account from Firebase Auth
async function deleteAuthUser(uid) {
  const payload = {
    localId: uid,
    targetProjectId: PROJECT_ID
  };
  const res = await request({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/accounts:delete`,
    method: 'POST'
  }, payload);
  if (res.error) {
    throw new Error(`Failed to delete Auth user ${uid}: ${res.body}`);
  }
}

// Main execution flow
async function main() {
  console.log(`\n🔍 Mode: ${IS_DRY_RUN ? 'DRY-RUN (No changes will be made)' : 'EXECUTE (Deleting data!)'}`);
  console.log(`📦 Project: ${PROJECT_ID}\n`);

  // 1. Export users
  console.log('🔄 Exporting user list from Firebase Auth...');
  try {
    execSync(`npx -y firebase-tools@latest auth:export "${CSV_FILE}" --project ${PROJECT_ID}`, { stdio: 'ignore' });
    console.log('✅ Exported successfully.\n');
  } catch (e) {
    console.error('❌ Failed to export users via firebase-tools.');
    process.exit(1);
  }

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV file not found at ${CSV_FILE}`);
    process.exit(1);
  }

  // 2. Parse CSV and filter test users
  const lines = fs.readFileSync(CSV_FILE, 'utf8').split('\n');
  const testUsers = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(',');
    const uid = parts[0];
    const email = parts[1];
    // Filter for emails matching test + digits (e.g. test0001)
    if (uid && email && /^test\d+@/i.test(email)) {
      testUsers.push({ uid, email });
    }
  }

  console.log(`👤 Found ${testUsers.length} matching test users.\n`);

  if (testUsers.length === 0) {
    console.log('✨ No test users found to delete.');
    cleanupTempCsv();
    return;
  }

  if (IS_DRY_RUN) {
    console.log('📝 Preview of users to delete:');
    testUsers.slice(0, 10).forEach(u => console.log(`  - ${u.email} (${u.uid})`));
    if (testUsers.length > 10) {
      console.log(`  ... and ${testUsers.length - 10} more.`);
    }
    console.log('\n💡 To perform the deletion, run this command with --execute:');
    console.log('   node scripts/cleanTestUsers.cjs --execute\n');
    cleanupTempCsv();
    return;
  }

  // 3. Execution Mode - Deleting users and records
  console.log(`🔥 Starting cleanup of ${testUsers.length} test users...`);

  const BATCH_SIZE = 10;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < testUsers.length; i += BATCH_SIZE) {
    const batch = testUsers.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (user) => {
      try {
        const deleteQueue = [];

        // Add player doc path
        const playerDocPath = `projects/${PROJECT_ID}/databases/(default)/documents/players/${user.uid}`;
        deleteQueue.push(playerDocPath);

        // Fetch subcollection docs: attempts
        const attemptsDocs = await listDocuments(`players/${user.uid}/attempts`);
        deleteQueue.push(...attemptsDocs);

        // Fetch subcollection docs: seasons
        const seasonsDocs = await listDocuments(`players/${user.uid}/seasons`);
        deleteQueue.push(...seasonsDocs);

        // Fetch prizeCodes
        const prizeCodesDocs = await queryPrizeCodes(user.uid);
        deleteQueue.push(...prizeCodesDocs);

        // Commit all deletions in Firestore for this user
        if (deleteQueue.length > 0) {
          await commitDeletes(deleteQueue);
        }

        // Delete Auth account
        await deleteAuthUser(user.uid);

        successCount++;
        process.stdout.write('.');
      } catch (err) {
        errorCount++;
        process.stdout.write('✗');
        console.error(`\n❌ Error cleaning up user ${user.email} (${user.uid}):`, err.message);
      }
    }));

    // Wait a brief moment between batches to be nice to rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n\n🎉 Cleanup finished!`);
  console.log(`✅ Successfully deleted: ${successCount} users`);
  if (errorCount > 0) {
    console.log(`⚠️  Failed to delete: ${errorCount} users`);
  }
  console.log();

  cleanupTempCsv();
}

function cleanupTempCsv() {
  if (fs.existsSync(CSV_FILE)) {
    fs.unlinkSync(CSV_FILE);
  }
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err.message);
  cleanupTempCsv();
  process.exit(1);
});
