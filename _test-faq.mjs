import { createClient } from '@libsql/client';
const BASE = 'http://localhost:3000';
const db = createClient({ url: 'file:./db/custom.db' });

let cookieStr = '';
async function api(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json', Cookie: cookieStr }, redirect: 'manual' };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookieStr = setCookie.split(';')[0];
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text), ok: res.ok }; }
  catch { return { status: res.status, data: text, ok: res.ok }; }
}

async function dbGet(table, id) {
  const r = await db.execute(`SELECT * FROM "${table}" WHERE id = ?`, [id]);
  return r.rows[0] || null;
}

// Login
await api('POST', '/api/auth/login', { email: 'admin@localhost', password: 'admin123' });

// Check FAQ state
const faqId = 'cmrnutl4300bkaofiflqxwfcq'; // this was deleted in a recent test
const before = await dbGet('FAQ', faqId);
console.log('BEFORE restore:', JSON.stringify({ deletedAt: before?.deletedAt, deletedBy: before?.deletedBy }));

// Try restore via trash API
const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: [faqId], cascade: false });
console.log('RESTORE response:', JSON.stringify(res.data, null, 2).slice(0, 500));

const after = await dbGet('FAQ', faqId);
console.log('AFTER restore:', JSON.stringify({ deletedAt: after?.deletedAt, deletedBy: after?.deletedBy }));
