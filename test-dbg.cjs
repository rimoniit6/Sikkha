// Test by importing the actual app db
// We need to use require for Next.js server-side modules
require('dotenv').config({ path: '.env' });
const { db } = require('./src/lib/db');
const { getPrismaModel, SOFT_DELETE_MODELS } = require('./src/lib/soft-delete');

async function main() {
  const testId = 'cmrnutl4u00bnaofiyahz7eb1';
  
  // Test 1: Can we access fAQ on the app's db?
  console.log('=== App DB Accessor Test ===');
  const accessors = ['fAQ', 'FAQ', 'faq', 'mCQ', 'MCQ'];
  for (const name of accessors) {
    const val = db[name];
    console.log(`db['${name}']:`, typeof val, val ? 'EXISTS' : 'UNDEFINED');
    if (val && typeof val.findUnique === 'function') {
      console.log(`  -> findUnique: FUNCTION`);
    }
  }
  
  // Test 2: Run model resolution like the trash route does
  console.log('\n=== Model Resolution Test ===');
  
  for (const modelName of SOFT_DELETE_MODELS) {
    try {
      const prismaName = getPrismaModel(modelName);
      const delegate = db[prismaName];
      if (!delegate || typeof delegate.findUnique !== 'function') {
        console.log(`${modelName} (${prismaName}): delegate not found, skipping`);
        continue;
      }
      const record = await delegate.findUnique({
        where: { id: testId },
        includeDeleted: true,
      });
      if (record && record.deletedAt) {
        console.log(`${modelName} (${prismaName}): FOUND ✓ deletedAt=${record.deletedAt}`);
        break;
      } else if (record) {
        console.log(`${modelName} (${prismaName}): exists but deletedAt is null`);
      } else {
        console.log(`${modelName} (${prismaName}): no record`);
      }
    } catch (e) {
      console.log(`${modelName}: ERROR - ${e.message}`);
      continue;
    }
  }
  
  await db.$disconnect();
}

main().catch(console.error);
