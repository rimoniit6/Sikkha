import { createClient } from '@libsql/client';
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

// Login
const login = await api('POST', '/api/auth/login', { email: 'admin@localhost', password: 'admin123' });
if (!login.ok) { console.error('Login failed!'); process.exit(1); }
console.log('LOGIN OK');

// ═══════════════════════════════════════════
// PHASE 3: Restore
// ═══════════════════════════════════════════
console.log('\n--- PHASE 3: RESTORE ---');

// Find deleted MCQ
const delMcq = await db.execute("SELECT id FROM MCQ WHERE deletedAt IS NOT NULL LIMIT 1");
if (delMcq.rows[0]) {
  const id = delMcq.rows[0].id;
  const beforeTrash = await dbCount('MCQ', 'deletedAt IS NOT NULL');
  const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  const row = await dbGet('MCQ', id);
  const afterTrash = await dbCount('MCQ', 'deletedAt IS NOT NULL');
  check('MCQ restore: HTTP 200', res.ok, `got ${res.status}`);
  check('MCQ restore: deletedAt null', row?.deletedAt === null);
  check('MCQ restore: deletedBy null', row?.deletedBy === null);
  check('MCQ restore: removed from trash', afterTrash < beforeTrash, `was ${beforeTrash}, now ${afterTrash}`);
  console.log('  Restored MCQ:', id);
}

// Restore CQ
const delCq = await db.execute("SELECT id FROM CQ WHERE deletedAt IS NOT NULL LIMIT 1");
if (delCq.rows[0]) {
  const id = delCq.rows[0].id;
  const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  const row = await dbGet('CQ', id);
  check('CQ restore: HTTP 200', res.ok, `got ${res.status}`);
  check('CQ restore: deletedAt null', row?.deletedAt === null);
}

// Restore FAQ
const delFaq = await db.execute("SELECT id FROM FAQ WHERE deletedAt IS NOT NULL LIMIT 1");
if (delFaq.rows[0]) {
  const id = delFaq.rows[0].id;
  const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  const row = await dbGet('FAQ', id);
  check('FAQ restore: HTTP 200', res.ok, `got ${res.status}`);
  check('FAQ restore: deletedAt null', row?.deletedAt === null);
}

// Restore Banner
const delBanner = await db.execute("SELECT id FROM Banner WHERE deletedAt IS NOT NULL LIMIT 1");
if (delBanner.rows[0]) {
  const id = delBanner.rows[0].id;
  const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  const row = await dbGet('Banner', id);
  check('Banner restore: HTTP 200', res.ok, `got ${res.status}`);
  check('Banner restore: deletedAt null', row?.deletedAt === null);
}

// Restore Notice
const delNotice = await db.execute("SELECT id FROM Notice WHERE deletedAt IS NOT NULL LIMIT 1");
if (delNotice.rows[0]) {
  const id = delNotice.rows[0].id;
  const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  const row = await dbGet('Notice', id);
  check('Notice restore: HTTP 200', res.ok, `got ${res.status}`);
  check('Notice restore: deletedAt null', row?.deletedAt === null);
}

// Restore Testimonial
const delTest = await db.execute("SELECT id FROM Testimonial WHERE deletedAt IS NOT NULL LIMIT 1");
if (delTest.rows[0]) {
  const id = delTest.rows[0].id;
  const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  const row = await dbGet('Testimonial', id);
  check('Testimonial restore: HTTP 200', res.ok, `got ${res.status}`);
  check('Testimonial restore: deletedAt null', row?.deletedAt === null);
}

// ═══════════════════════════════════════════
// PHASE 4: Force Delete
// ═══════════════════════════════════════════
console.log('\n--- PHASE 4: FORCE DELETE ---');

// Force delete a Testimonial
const fTest = await db.execute("SELECT id FROM Testimonial WHERE deletedAt IS NULL LIMIT 1");
if (fTest.rows[0]) {
  const id = fTest.rows[0].id;
  // Soft delete
  const delRes = await api('DELETE', '/api/admin/testimonials', { id });
  check('FD prep: testimonial soft delete', delRes.ok, `got ${delRes.status}`);
  
  // Force delete
  const fdRes = await api('POST', '/api/admin/trash', { action: 'forceDelete', ids: [id], cascade: false });
  const afterRow = await dbGet('Testimonial', id);
  check('FD testimonial: HTTP 200', fdRes.ok, `got ${fdRes.status}`);
  check('FD testimonial: permanently removed', afterRow === null || afterRow === undefined, JSON.stringify(afterRow));
  
  // Cannot restore
  const restoreRes = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  check('FD testimonial: cannot restore', !restoreRes.ok || restoreRes.data?.restoredCount === 0,
    JSON.stringify(restoreRes.data));
}

// Force delete a Notice
const fNotice = await db.execute("SELECT id FROM Notice WHERE deletedAt IS NULL LIMIT 1");
if (fNotice.rows[0]) {
  const id = fNotice.rows[0].id;
  const delRes = await api('DELETE', '/api/admin/notices', { id });
  check('FD prep: notice soft delete', delRes.ok, `got ${delRes.status}`);
  
  const fdRes = await api('POST', '/api/admin/trash', { action: 'forceDelete', ids: [id], cascade: false });
  const afterRow = await dbGet('Notice', id);
  check('FD notice: HTTP 200', fdRes.ok, `got ${fdRes.status}`);
  check('FD notice: permanently removed', afterRow === null || afterRow === undefined, JSON.stringify(afterRow));
}

// ═══════════════════════════════════════════
// PHASE 5 (remaining): Failure handling
// ═══════════════════════════════════════════
console.log('\n--- PHASE 5: FAILURE (remaining) ---');

// Already-deleted
const alreadyDel = await db.execute("SELECT id FROM MCQ WHERE deletedAt IS NOT NULL LIMIT 1");
if (alreadyDel.rows[0]) {
  const res = await api('DELETE', `/api/admin/mcq?id=${alreadyDel.rows[0].id}`);
  check('F: Already-deleted returns 4xx', res.status >= 400, `got ${res.status}`);
  check('F: Error message present', !!(res.data?.error || res.data?.message), JSON.stringify(res.data));
}

// Guard: chapter with MCQs
const chWithMcq = await db.execute(`
  SELECT c.id FROM Chapter c JOIN MCQ m ON m.chapterId = c.id
  WHERE c.deletedAt IS NULL AND m.deletedAt IS NULL LIMIT 1
`);
if (chWithMcq.rows[0]) {
  const id = chWithMcq.rows[0].id;
  const before = await dbGet('Chapter', id);
  const res = await api('DELETE', `/api/admin/chapters?id=${id}`);
  const after = await dbGet('Chapter', id);
  check('F: Guard blocks chapter delete (4xx)', res.status >= 400, `got ${res.status}`);
  check('F: Chapter DB unchanged', 
    JSON.stringify(before) === JSON.stringify(after),
    `before.del=${before?.deletedAt} after.del=${after?.deletedAt}`);
  check('F: Error has details', !!(res.data?.error || res.data?.message), JSON.stringify(res.data));
}

// Guard: subject with chapters
const subWithCh = await db.execute(`
  SELECT s.id FROM Subject s JOIN Chapter c ON c.subjectId = s.id
  WHERE s.deletedAt IS NULL AND c.deletedAt IS NULL LIMIT 1
`);
if (subWithCh.rows[0]) {
  const res = await api('DELETE', `/api/admin/subjects?id=${subWithCh.rows[0].id}`);
  check('F: Guard blocks subject delete (4xx)', res.status >= 400, `got ${res.status}`);
}

// ═══════════════════════════════════════════
// PHASE 7: Audit Log
// ═══════════════════════════════════════════
console.log('\n--- PHASE 7: AUDIT LOG ---');
const auditRows = await db.execute(
  "SELECT * FROM AuditLog ORDER BY createdAt DESC LIMIT 15"
);
check('AUDIT: logs exist', auditRows.rows.length > 0, `found ${auditRows.rows.length}`);

const deleteAudits = auditRows.rows.filter(r => 
  r.action && String(r.action).toLowerCase().includes('delete'));
check('AUDIT: delete logs present', deleteAudits.length > 0, `found ${deleteAudits.length}`);

if (deleteAudits.length > 0) {
  const log = deleteAudits[0];
  check('AUDIT: entity/entityType present', !!(log.entity || log.entityType));
  check('AUDIT: entityId present', !!log.entityId);
  check('AUDIT: userId/adminId present', !!(log.adminId || log.userId));
  check('AUDIT: createdAt/timestamp present', !!(log.createdAt || log.timestamp));
  console.log('  Sample audit:', JSON.stringify({ 
    action: log.action, entityType: log.entityType || log.entity,
    entityId: log.entityId, adminId: log.adminId 
  }));
}

// ═══════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════
console.log('\n════════════════════════════════════════════');
console.log('RESULTS');
console.log('════════════════════════════════════════════');
console.log(`Passed: ${PASS.length}, Failed: ${FAIL.length}`);
if (FAIL.length > 0) {
  for (const f of FAIL) console.error(`  ✗ ${f.label}: ${f.detail}`);
}
process.exit(FAIL.length > 0 ? 1 : 0);
