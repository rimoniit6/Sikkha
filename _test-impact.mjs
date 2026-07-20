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

await api('POST', '/api/auth/login', { email: 'admin@localhost', password: 'admin123' });

// Try the impact endpoint with model known  
const faqId = 'cmrnutl4u00bnaofiyahz7eb1';
const res = await api('POST', '/api/admin/trash/impact', { ids: [faqId], model: 'faq' });
console.log('Impact with model=faq:', JSON.stringify(res.data, null, 2).slice(0, 300));

// Try without model (auto-detect)
const res2 = await api('POST', '/api/admin/trash/impact', { ids: [faqId] });
console.log('\nImpact without model:', JSON.stringify(res2.data, null, 2).slice(0, 300));
