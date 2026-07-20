import { createClient } from '@libsql/client';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const db = createClient({ url: 'file:./db/custom.db' });

let cookieStr = '';

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookieStr },
    redirect: 'manual',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }
  }
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookieStr = setCookie.split(';')[0];
  return { status: res.status, data, ok: res.ok };
}

const PASS = [], FAIL = [];
function check(label, cond, detail = '') {
  if (cond) { PASS.push(label); console.log(`  ✓ ${label}`); }
  else { FAIL.push({ label, detail }); console.error(`  ✗ ${label}: ${detail}`); }
}

async function dbCount(table, condition = 'deletedAt IS NULL') {
  const r = await db.execute(`SELECT COUNT(*) as c FROM "${table}" WHERE ${condition}`);
  return Number(r.rows[0].c);
}

async function dbGet(table, id) {
  const r = await db.execute(`SELECT * FROM "${table}" WHERE id = ?`, [id]);
  return r.rows[0] || null;
}

// ═══════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════
console.log('═'.repeat(60));
console.log('LOGIN');
console.log('─'.repeat(60));
const login = await api('POST', '/api/auth/login', { email: 'admin@localhost', password: 'admin123' });
check('Login success', login.ok, `status=${login.status}`);
console.log('  Cookie:', cookieStr.slice(0, 40) + '...');

// ───────────────────────────────────────────
// PHASE 2: Soft Delete
// ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('PHASE 2: SOFT DELETE');
console.log('─'.repeat(60));

// Find MCQ without dependencies
const mcqWithoutDeps = await db.execute(`
  SELECT m.id, m.question FROM MCQ m
  LEFT JOIN MCQExamSetQuestion q ON q.mcqId = m.id
  WHERE q.id IS NULL AND m.deletedAt IS NULL
  LIMIT 1
`);
const testMcqId = mcqWithoutDeps.rows[0]?.id;
if (testMcqId) {
  const before = await dbCount('MCQ');
  const res = await api('DELETE', `/api/admin/mcq?id=${testMcqId}`);
  const afterRow = await dbGet('MCQ', testMcqId);
  const after = await dbCount('MCQ');
  
  check('MCQ soft delete: HTTP 200', res.ok, `got ${res.status}`);
  check('MCQ soft delete: deletedAt set', afterRow?.deletedAt !== null, JSON.stringify(afterRow?.deletedAt));
  check('MCQ soft delete: deletedBy set', afterRow?.deletedBy !== null);
  check('MCQ soft delete: removed from active list', after === before - 1, `was ${before}, now ${after}`);
  check('MCQ soft delete: API success', res.data?.success !== false, JSON.stringify(res.data));
  
  const delCount = await dbCount('MCQ', 'deletedAt IS NOT NULL');
  check('MCQ soft delete: in trash', delCount > 0);
  console.log('  Test MCQ:', testMcqId, '-', mcqWithoutDeps.rows[0].question?.slice(0, 40));
} else {
  console.log('  SKIP: No dependency-free MCQ found');
}

// Find CQ without dependencies
const cqWithoutDeps = await db.execute(`
  SELECT c.id FROM CQ c
  LEFT JOIN CQExamSetQuestion q ON q.cqId = c.id
  WHERE q.id IS NULL AND c.deletedAt IS NULL
  LIMIT 1
`);
const testCqId = cqWithoutDeps.rows[0]?.id;
if (testCqId) {
  const before = await dbCount('CQ');
  const res = await api('DELETE', `/api/admin/cq?id=${testCqId}`);
  const afterRow = await dbGet('CQ', testCqId);
  check('CQ soft delete: HTTP 200', res.ok, `got ${res.status}`);
  check('CQ soft delete: deletedAt set', afterRow?.deletedAt !== null);
  check('CQ soft delete: deletedBy set', afterRow?.deletedBy !== null);
} else {
  console.log('  SKIP: No dependency-free CQ found');
}

// Test FAQ delete (already confirmed working)
const faqRow = await db.execute("SELECT id FROM FAQ WHERE deletedAt IS NULL LIMIT 1");
const testFaqId = faqRow.rows[0]?.id;
if (testFaqId) {
  // First restore any pre-deleted FAQ if our test ID was the one we already deleted
  const existingFaq = await dbGet('FAQ', testFaqId);
  if (existingFaq?.deletedAt) {
    // Find another non-deleted FAQ
    const otherFaq = await db.execute("SELECT id FROM FAQ WHERE deletedAt IS NULL LIMIT 1");
    if (otherFaq.rows[0]) {
      const res2 = await api('DELETE', `/api/admin/faqs?id=${otherFaq.rows[0].id}`);
      const row2 = await dbGet('FAQ', otherFaq.rows[0].id);
      check('FAQ soft delete: HTTP 200', res2.ok);
      check('FAQ soft delete: deletedAt set', row2?.deletedAt !== null);
    }
  } else {
    const res = await api('DELETE', `/api/admin/faqs?id=${testFaqId}`);
    const row = await dbGet('FAQ', testFaqId);
    check('FAQ soft delete: HTTP 200', res.ok);
    check('FAQ soft delete: deletedAt set', row?.deletedAt !== null);
  }
}

// Test Banner
const bannerRow = await db.execute("SELECT id FROM Banner WHERE deletedAt IS NULL LIMIT 1");
if (bannerRow.rows[0]) {
  const res = await api('DELETE', `/api/admin/banners?id=${bannerRow.rows[0].id}`);
  const row = await dbGet('Banner', bannerRow.rows[0].id);
  check('Banner soft delete: HTTP 200', res.ok, `got ${res.status}`);
  check('Banner soft delete: deletedAt set', row?.deletedAt !== null);
}

// Test Notice
const noticeRow = await db.execute("SELECT id FROM Notice WHERE deletedAt IS NULL LIMIT 1");
if (noticeRow.rows[0]) {
  const res = await api('DELETE', `/api/admin/notices?id=${noticeRow.rows[0].id}`);
  const row = await dbGet('Notice', noticeRow.rows[0].id);
  check('Notice soft delete: HTTP 200', res.ok, `got ${res.status}`);
  check('Notice soft delete: deletedAt set', row?.deletedAt !== null);
}

// Test Testimonial
const testRow = await db.execute("SELECT id FROM Testimonial WHERE deletedAt IS NULL LIMIT 1");
if (testRow.rows[0]) {
  const res = await api('DELETE', `/api/admin/testimonials?id=${testRow.rows[0].id}`);
  const row = await dbGet('Testimonial', testRow.rows[0].id);
  check('Testimonial soft delete: HTTP 200', res.ok, `got ${res.status}`);
  check('Testimonial soft delete: deletedAt set', row?.deletedAt !== null);
}

// ───────────────────────────────────────────
// PHASE 5: Failure Handling
// ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('PHASE 5: FAILURE HANDLING');
console.log('─'.repeat(60));

// Invalid ID
const invRes = await api('DELETE', '/api/admin/mcq?id=invalid-id-12345');
check('F1: Invalid ID returns 4xx', invRes.status >= 400 && invRes.status < 500, `got ${invRes.status}`);
check('F1: No 200', invRes.status !== 200);

// Unknown model
const unkRes = await api('DELETE', '/api/admin/unknownmodel?id=test');
check('F2: Unknown model returns 4xx', unkRes.status >= 400, `got ${unkRes.status}`);

// Already-deleted record
const delMcq = await db.execute("SELECT id FROM MCQ WHERE deletedAt IS NOT NULL LIMIT 1");
if (delMcq.rows[0]) {
  const res = await api('DELETE', `/api/admin/mcq?id=${delMcq.rows[0].id}`);
  check('F3: Already-deleted returns 4xx', res.status >= 400, `got ${res.status}`);
  check('F3: Error message present', !!(res.data?.error || res.data?.message), JSON.stringify(res.data));
}

// Delete guard — chapter with children
const chWithChildren = await db.execute(`
  SELECT c.id FROM Chapter c 
  JOIN MCQ m ON m.chapterId = c.id 
  WHERE c.deletedAt IS NULL AND m.deletedAt IS NULL
  LIMIT 1
`);
if (chWithChildren.rows[0]) {
  const chBefore = await dbGet('Chapter', chWithChildren.rows[0].id);
  const res = await api('DELETE', `/api/admin/chapters?id=${chWithChildren.rows[0].id}`);
  const chAfter = await dbGet('Chapter', chWithChildren.rows[0].id);
  check('F4: Guard blocks delete (4xx)', res.status >= 400, `got ${res.status}`);
  check('F4: DB unchanged', JSON.stringify(chBefore) === JSON.stringify(chAfter), 
    `before.del=${chBefore?.deletedAt} after.del=${chAfter?.deletedAt}`);
  check('F4: Error has meaningful message', !!(res.data?.error || res.data?.message), JSON.stringify(res.data));
}

// ───────────────────────────────────────────
// PHASE 3: Restore
// ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('PHASE 3: RESTORE');
console.log('─'.repeat(60));

// Restore the MCQ we deleted
if (testMcqId) {
  const beforeTrash = await dbCount('MCQ', 'deletedAt IS NOT NULL');
  const res = await api('POST', '/api/admin/trash', {
    action: 'restore', ids: [testMcqId], cascade: false
  });
  const afterRow = await dbGet('MCQ', testMcqId);
  const afterTrash = await dbCount('MCQ', 'deletedAt IS NOT NULL');
  
  check('MCQ restore: HTTP 200', res.ok, `got ${res.status}`);
  check('MCQ restore: deletedAt null', afterRow?.deletedAt === null);
  check('MCQ restore: deletedBy null', afterRow?.deletedBy === null);
  check('MCQ restore: removed from trash', afterTrash < beforeTrash, `was ${beforeTrash}, now ${afterTrash}`);
  check('MCQ restore: API has results', res.data?.results?.length > 0, JSON.stringify(res.data));
}

// Restore the FAQ
if (testFaqId) {
  const delFaq = await db.execute("SELECT id FROM FAQ WHERE deletedAt IS NOT NULL LIMIT 1");
  if (delFaq.rows[0]) {
    const res = await api('POST', '/api/admin/trash', {
      action: 'restore', ids: [delFaq.rows[0].id], cascade: false
    });
    const row = await dbGet('FAQ', delFaq.rows[0].id);
    check('FAQ restore: HTTP 200', res.ok, `got ${res.status}`);
    check('FAQ restore: deletedAt null', row?.deletedAt === null);
    check('FAQ restore: deletedBy null', row?.deletedBy === null);
  }
}

// ───────────────────────────────────────────
// PHASE 4: Force Delete
// ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('PHASE 4: FORCE DELETE');
console.log('─'.repeat(60));

// Force delete a banner
const fdBanner = await db.execute("SELECT id FROM Banner WHERE deletedAt IS NULL LIMIT 1");
if (fdBanner.rows[0]) {
  // Soft delete first
  const delRes = await api('DELETE', `/api/admin/banners?id=${fdBanner.rows[0].id}`);
  check('FD prep: soft delete OK', delRes.ok, `got ${delRes.status}`);
  
  // Force delete
  const fdRes = await api('POST', '/api/admin/trash', {
    action: 'forceDelete', ids: [fdBanner.rows[0].id], cascade: false
  });
  const afterRow = await dbGet('Banner', fdBanner.rows[0].id);
  
  check('FD: HTTP 200', fdRes.ok, `got ${fdRes.status}`);
  check('FD: permanently removed', afterRow === null || afterRow === undefined, `row: ${JSON.stringify(afterRow)}`);
  
  // Try to restore — should fail
  const restoreRes = await api('POST', '/api/admin/trash', {
    action: 'restore', ids: [fdBanner.rows[0].id], cascade: false
  });
  check('FD: cant restore (4xx or fail)', !restoreRes.ok || restoreRes.data?.restoredCount === 0, 
    `strict: ${JSON.stringify(restoreRes.data)}`);
}

// ───────────────────────────────────────────
// PHASE 6: Delete Guard
// ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('PHASE 6: DELETE GUARD (detailed)');
console.log('─'.repeat(60));

// Subject with chapters
const subWithCh = await db.execute(`
  SELECT s.id FROM Subject s 
  JOIN Chapter c ON c.subjectId = s.id 
  WHERE s.deletedAt IS NULL AND c.deletedAt IS NULL
  LIMIT 1
`);
if (subWithCh.rows[0]) {
  const before = await dbGet('Subject', subWithCh.rows[0].id);
  const res = await api('DELETE', `/api/admin/subjects?id=${subWithCh.rows[0].id}`);
  const after = await dbGet('Subject', subWithCh.rows[0].id);
  check('GUARD: Subject with chapters blocked', res.status >= 400, `got ${res.status}`);
  check('GUARD: Subject unchanged', JSON.stringify(before) === JSON.stringify(after),
    `before.del=${before?.deletedAt} after.del=${after?.deletedAt}`);
}

// Class with subjects
const clsWithSub = await db.execute(`
  SELECT c.id FROM ClassCategory c
  JOIN Subject s ON s.classId = c.id
  WHERE c.deletedAt IS NULL AND s.deletedAt IS NULL
  LIMIT 1
`);
if (clsWithSub.rows[0]) {
  const res = await api('DELETE', `/api/admin/classes?id=${clsWithSub.rows[0].id}`);
  check('GUARD: Class with subjects blocked', res.status >= 400, `got ${res.status}`);
}

// ───────────────────────────────────────────
// PHASE 7: Audit Log
// ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('PHASE 7: AUDIT LOG');
console.log('─'.repeat(60));

const auditRows = await db.execute("SELECT * FROM AuditLog ORDER BY createdAt DESC LIMIT 10");
const deletedAudits = auditRows.rows.filter(r => 
  r.action && r.action.toString().toLowerCase().includes('delete'));
check('AUDIT: delete audit logs exist', deletedAudits.length > 0, `found ${deletedAudits.length}`);
if (deletedAudits.length > 0) {
  const log = deletedAudits[0];
  check('AUDIT: has entity', !!(log.entity || log.entityType), JSON.stringify(log));
  check('AUDIT: has entityId', !!log.entityId);
  check('AUDIT: has userId/adminId', !!(log.adminId || log.userId));
  check('AUDIT: has timestamp', !!(log.createdAt || log.timestamp));
}

// ───────────────────────────────────────────
// FINAL REPORT
// ───────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('FINAL REPORT');
console.log('═'.repeat(60));
console.log(`Total checks: ${PASS.length + FAIL.length}`);
console.log(`Passed: ${PASS.length}`);
console.log(`Failed: ${FAIL.length}`);
if (FAIL.length > 0) {
  console.log('\nFAILURES:');
  for (const f of FAIL) {
    console.error(`  ✗ ${f.label}: ${f.detail}`);
  }
}
console.log('═'.repeat(60));
process.exit(FAIL.length > 0 ? 1 : 0);
