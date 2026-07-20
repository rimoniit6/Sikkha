// Soft Delete Framework — Full Regression Test Suite
import { createClient } from '@libsql/client';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const DB_PATH = `file:${join(process.cwd(), 'db', 'custom.db')}`;
const db = createClient({ url: DB_PATH });
let cookies = '';

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookies },
    redirect: 'manual',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}

// ═══════════════════════════════════════════
// SETUP: Login
// ═══════════════════════════════════════════
async function login() {
  const res = await api('POST', '/api/auth/login', { email: 'admin@localhost', password: 'admin123' });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookies = setCookie.split(';')[0];
  else cookies = '';
  console.log(`LOGIN: status=${res.status}, cookie=${!!cookies}`);
  return res;
}

// ═══════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════
async function dbCount(table, deleted = false) {
  const where = deleted ? 'WHERE deletedAt IS NOT NULL' : 'WHERE deletedAt IS NULL';
  const r = await db.execute(`SELECT COUNT(*) as c FROM "${table}" ${where}`);
  return Number(r.rows[0].c);
}

async function dbGet(table, id) {
  const r = await db.execute(`SELECT * FROM "${table}" WHERE id = ?`, [id]);
  return r.rows[0] || null;
}

async function dbGetFirst(table) {
  const r = await db.execute(`SELECT id FROM "${table}" WHERE deletedAt IS NULL LIMIT 1`);
  return r.rows[0]?.id || null;
}

async function dbGetDeleted(table) {
  const r = await db.execute(`SELECT id FROM "${table}" WHERE deletedAt IS NOT NULL LIMIT 1`);
  return r.rows[0]?.id || null;
}

const FAILURES = [];
function check(label, condition, detail = '') {
  if (!condition) {
    FAILURES.push({ label, detail });
    console.error(`  ✗ FAIL: ${label} ${detail}`);
  } else {
    console.log(`  ✓ PASS: ${label}`);
  }
}

function getTableName(logicalName) {
  const MAP = {
    mcq: 'MCQ', cq: 'CQ', faq: 'FAQ',
    classCategory: 'ClassCategory', subject: 'Subject', chapter: 'Chapter',
    topic: 'Topic', knowledgeQuestion: 'KnowledgeQuestion', lecture: 'Lecture',
    resource: 'Resource', suggestion: 'Suggestion', course: 'Course',
    courseLesson: 'CourseLesson', banner: 'Banner', testimonial: 'Testimonial',
    notice: 'Notice', navigation: 'Navigation', contentType: 'ContentType',
    featuredContent: 'FeaturedContent', contentBundle: 'ContentBundle',
    contentPackage: 'ContentPackage', mcqExamPackage: 'MCQExamPackage',
    cqExamPackage: 'CQExamPackage', teacherModerator: 'TeacherModerator',
    board: 'Board', examYear: 'ExamYear', boardYear: 'BoardYear',
    exam: 'Exam', userSubscription: 'UserSubscription',
    mcqExamPackagePurchase: 'MCQExamPackagePurchase',
    cqExamPackagePurchase: 'CQExamPackagePurchase',
  };
  return MAP[logicalName] || logicalName.charAt(0).toUpperCase() + logicalName.slice(1);
}

// ═══════════════════════════════════════════
// PHASE 2: Soft Delete Tests
// ═══════════════════════════════════════════
async function testSoftDelete(logical, table) {
  const id = await dbGetFirst(table);
  if (!id) { console.log(`  SKIP: ${logical} — no record found`); return; }

  const beforeCount = await dbCount(table);
  const beforeRow = await dbGet(table, id);

  const res = await api('DELETE', `/api/admin/${logical}/?id=${id}`);
  const afterRow = await dbGet(table, id);
  const afterCount = await dbCount(table);
  const deletedCount = await dbCount(table, true);

  check(`${logical}: HTTP status 200`, res.status === 200, `got ${res.status}`);
  check(`${logical}: deletedAt set`, afterRow?.deletedAt !== null, JSON.stringify(afterRow?.deletedAt));
  check(`${logical}: deletedBy set`, afterRow?.deletedBy !== null);
  check(`${logical}: removed from list`, afterCount === beforeCount - 1);
  check(`${logical}: counted as deleted`, deletedCount > 0);
  check(`${logical}: API response OK`, res.data && (res.data.message || res.data.deleted));

  return { id, row: afterRow };
}

// ═══════════════════════════════════════════
// PHASE 3: Restore Tests
// ═══════════════════════════════════════════
async function testRestore(logical, table) {
  const id = await dbGetDeleted(table);
  if (!id) { console.log(`  SKIP: ${logical} — no deleted record`); return; }

  const beforeCount = await dbCount(table, true);

  const res = await api('POST', '/api/admin/trash/', {
    action: 'restore',
    ids: [id],
    cascade: false,
  });
  const afterRow = await dbGet(table, id);
  const afterCount = await dbCount(table, true);
  const activeCount = await dbCount(table);

  check(`${logical}: restore HTTP 200`, res.status === 200, `got ${res.status}`);
  check(`${logical}: deletedAt null`, afterRow?.deletedAt === null);
  check(`${logical}: deletedBy null`, afterRow?.deletedBy === null);
  check(`${logical}: removed from trash`, afterCount === beforeCount - 1, `was ${beforeCount} now ${afterCount}`);
  check(`${logical}: back in active list`, activeCount > 0);
}

// ═══════════════════════════════════════════
// PHASE 4: Force Delete Tests
// ═══════════════════════════════════════════
async function testForceDelete(logical, table) {
  // First soft-delete
  const id = await dbGetFirst(table);
  if (!id) { console.log(`  SKIP: ${logical} force delete — no record`); return; }

  // Soft delete
  const delRes = await api('DELETE', `/api/admin/${logical}/?id=${id}`);
  check(`${logical}: force-prep soft delete`, delRes.status === 200, `got ${delRes.status}`);

  // Force delete
  const res = await api('POST', '/api/admin/trash/', {
    action: 'forceDelete',
    ids: [id],
    cascade: false,
  });
  const afterRow = await dbGet(table, id);

  check(`${logical}: force delete HTTP 200`, res.status === 200, `got ${res.status}`);
  check(`${logical}: permanently removed`, afterRow === null || afterRow === undefined, `row still exists: ${JSON.stringify(afterRow)}`);

  // Try to restore — should fail
  const restoreRes = await api('POST', '/api/admin/trash/', {
    action: 'restore',
    ids: [id],
    cascade: false,
  });
  check(`${logical}: cant restore after force delete`, restoreRes.status !== 200, `got ${restoreRes.status}`);
}

// ═══════════════════════════════════════════
// PHASE 5: Failure Handling Tests
// ═══════════════════════════════════════════
async function testFailureHandling() {
  // 5a: Invalid ID
  console.log('\n--- Failure: Invalid ID ---');
  const res1 = await api('DELETE', '/api/admin/mcq/?id=nonexistent-id');
  check('FAIL[invalid-id]: HTTP 4xx', res1.status >= 400 && res1.status < 500, `got ${res1.status}`);
  check('FAIL[invalid-id]: no 200', res1.status !== 200);

  // 5b: Unknown model
  console.log('\n--- Failure: Unknown model ---');
  const res2 = await api('DELETE', '/api/admin/unknownmodel/?id=test');
  check('FAIL[unknown-model]: HTTP 4xx', res2.status >= 400, `got ${res2.status}`);

  // 5c: Delete with dependencies (chapter with children)
  console.log('\n--- Failure: Dependency exists ---');
  const chapterRows = await db.execute("SELECT id FROM Chapter WHERE deletedAt IS NULL LIMIT 1");
  if (chapterRows.rows.length > 0) {
    const chId = chapterRows.rows[0].id;
    const res3 = await api('DELETE', `/api/admin/chapters/?id=${chId}`);
    check('FAIL[dependency]: HTTP 4xx or error message', 
      res3.status >= 400 || (res3.data && (res3.data.error || res3.data.message)),
      `status=${res3.status} data=${JSON.stringify(res3.data)}`);
  }

  // 5d: Delete already-deleted record
  console.log('\n--- Failure: Already deleted ---');
  const delMcq = await db.execute("SELECT id FROM MCQ WHERE deletedAt IS NOT NULL LIMIT 1");
  if (delMcq.rows.length > 0) {
    const delId = delMcq.rows[0].id;
    const res4 = await api('DELETE', `/api/admin/mcq/?id=${delId}`);
    check('FAIL[already-deleted]: HTTP 4xx', res4.status >= 400, `got ${res4.status}`);
  }
}

// ═══════════════════════════════════════════
// PHASE 6: Delete Guard Test
// ═══════════════════════════════════════════
async function testDeleteGuard() {
  // Find a chapter with MCQs
  const chRows = await db.execute(`
    SELECT DISTINCT c.id, c.name FROM Chapter c 
    JOIN MCQ m ON m.chapterId = c.id 
    WHERE c.deletedAt IS NULL AND m.deletedAt IS NULL 
    LIMIT 1
  `);
  if (chRows.rows.length > 0) {
    const chId = chRows.rows[0].id;
    const chBefore = await dbGet('Chapter', chId);
    
    const res = await api('DELETE', `/api/admin/chapters/?id=${chId}`);
    const chAfter = await dbGet('Chapter', chId);
    
    check('GUARD: delete blocked (4xx)', res.status >= 400, `got ${res.status}`);
    check('GUARD: no change in DB', JSON.stringify(chBefore) === JSON.stringify(chAfter), 
      `before.deletedAt=${chBefore?.deletedAt} after.deletedAt=${chAfter?.deletedAt}`);
    check('GUARD: error message returned', !!(res.data && (res.data.error || res.data.message)),
      JSON.stringify(res.data));
  } else {
    console.log('  SKIP: Delete guard — no chapter with MCQs');
  }
}

// ═══════════════════════════════════════════
// PHASE 7: Audit Log Test
// ═══════════════════════════════════════════
async function testAuditLog() {
  const auditRows = await db.execute("SELECT * FROM AuditLog ORDER BY createdAt DESC LIMIT 5");
  check('AUDIT: logs exist', auditRows.rows.length > 0, `found ${auditRows.rows.length}`);
  if (auditRows.rows.length > 0) {
    const log = auditRows.rows[0];
    check('AUDIT: has entity/entityId', !!(log.entity || log.entityType) && !!(log.entityId));
    check('AUDIT: has userId', !!(log.adminId || log.userId));
    check('AUDIT: has action', !!log.action);
    check('AUDIT: has timestamp/createdAt', !!(log.createdAt || log.timestamp));
  }
}

// ═══════════════════════════════════════════
// MAIN RUNNER
// ═══════════════════════════════════════════
async function main() {
  console.log('='.repeat(60));
  console.log('SOFT DELETE FRAMEWORK — REGRESSION TEST SUITE');
  console.log('='.repeat(60));

  // Login
  console.log('\n── SETUP: Login ──');
  await login();

  // Phase 2-4: Run on core entities
  const ENTITIES = [
    ['mcq', 'MCQ'],
    ['cq', 'CQ'],
    ['faq', 'FAQ'],
    ['banner', 'Banner'],
    ['notice', 'Notice'],
    ['testimonial', 'Testimonial'],
    ['board', 'Board'],
    ['exam', 'Exam'],
    ['examYear', 'ExamYear'],
    ['boardYear', 'BoardYear'],
    ['navigation', 'Navigation'],
    ['contentType', 'ContentType'],
    ['featuredContent', 'FeaturedContent'],
    ['contentBundle', 'ContentBundle'],
  ];

  // Phase 2: Soft Delete
  console.log('\n── PHASE 2: Soft Delete Verification ──');
  for (const [logical, table] of ENTITIES) {
    console.log(`\n  Testing: ${logical}`);
    await testSoftDelete(logical, table);
  }

  // Phase 5: Failure handling
  console.log('\n── PHASE 5: Failure Handling ──');
  await testFailureHandling();

  // Phase 6: Delete guard
  console.log('\n── PHASE 6: Delete Guard ──');
  await testDeleteGuard();

  // Phase 7: Audit log
  console.log('\n── PHASE 7: Audit Log ──');
  await testAuditLog();

  // Phase 3: Restore
  console.log('\n── PHASE 3: Restore Verification ──');
  for (const [logical, table] of ENTITIES) {
    console.log(`\n  Testing: ${logical}`);
    await testRestore(logical, table);
  }

  // Phase 4: Force Delete
  console.log('\n── PHASE 4: Force Delete Verification ──');
  for (const [logical, table] of ENTITIES) {
    console.log(`\n  Testing: ${logical}`);
    await testForceDelete(logical, table);
  }

  // ═══════════════════════════════════════════
  // FINAL REPORT
  // ═══════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log('FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`Tests failed: ${FAILURES.length}`);
  if (FAILURES.length > 0) {
    for (const f of FAILURES) {
      console.error(`  ✗ ${f.label}: ${f.detail}`);
    }
  }
  console.log('='.repeat(60));
  process.exit(FAILURES.length > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
