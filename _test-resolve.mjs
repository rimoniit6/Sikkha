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

// Login
await api('POST', '/api/auth/login', { email: 'admin@localhost', password: 'admin123' });

// Direct: ask the trash endpoint to verify the model is recognized
// First, soft-delete a fresh FAQ
const freshFaq = await db.execute("SELECT id, question FROM FAQ WHERE deletedAt IS NULL LIMIT 1");
if (freshFaq.rows[0]) {
  const id = freshFaq.rows[0].id;
  console.log('Fresh FAQ ID:', id);
  
  // Soft delete it
  const delRes = await api('DELETE', `/api/admin/faqs?id=${id}`);
  console.log('DELETE status:', delRes.status);
  console.log('DELETE data:', JSON.stringify(delRes.data));
  
  // Verify in DB
  const dbCheck = await db.execute("SELECT id, deletedAt FROM FAQ WHERE id = ?", [id]);
  console.log('DB after delete:', JSON.stringify(dbCheck.rows[0]));
  
  // Now try to restore via trash
  const restoreRes = await api('POST', '/api/admin/trash', { action: 'restore', ids: [id], cascade: false });
  console.log('\nRESTORE response:', JSON.stringify(restoreRes.data));
  
  const dbCheck2 = await db.execute("SELECT id, deletedAt, deletedBy FROM FAQ WHERE id = ?", [id]);
  console.log('DB after restore:', JSON.stringify(dbCheck2.rows[0]));
}
