const BASE = 'http://localhost:3000';

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

// Try restoring the FAQ
const res = await api('POST', '/api/admin/trash', { action: 'restore', ids: ['cmrnutl4u00bnaofiyahz7eb1'], cascade: false });
console.log('Status:', res.status);
console.log('Data:', JSON.stringify(res.data, null, 2));
