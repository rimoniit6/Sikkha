// Smoke test: public (guest) API endpoints — verifies status + JSON shape
const BASE = process.env.BASE_URL || 'http://localhost:3000';

const endpoints = [
  '/api/health',
  '/api/config',
  '/api/navigation',
  '/api/classes',
  '/api/courses?action=list',
  '/api/lectures',
  '/api/mcq',
  '/api/cq',
  '/api/knowledge-questions',
  '/api/suggestions',
  '/api/board-questions',
  '/api/board-questions/filters',
  '/api/banners',
  '/api/faqs',
  '/api/testimonials',
  '/api/notices',
  '/api/content-types',
  '/api/bundles',
  '/api/packages',
  '/api/plans',
  '/api/search?q=test',
  '/api/hierarchy/metadata',
  '/api/teacher-moderators',
  '/api/stats',
  '/api/csrf-token',
  '/api/mcq-exam-packages',
  '/api/cq-exam-packages',
  '/api/premium',
];

const results = [];
for (const ep of endpoints) {
  try {
    const res = await fetch(BASE + ep, { headers: { accept: 'application/json' } });
    let body = '';
    try { body = await res.text(); } catch {}
    let json = null;
    try { json = JSON.parse(body); } catch {}
    const summary = json
      ? (Array.isArray(json) ? `array[${json.length}]` : Object.keys(json).slice(0, 6).join(','))
      : body.slice(0, 60).replace(/\n/g, ' ');
    results.push({ ep, status: res.status, summary });
  } catch (e) {
    results.push({ ep, status: 'ERR', summary: e.message });
  }
}
for (const r of results) {
  const flag = (r.status === 200) ? 'OK ' : 'FAIL';
  console.log(`${flag} ${String(r.status).padEnd(4)} ${r.ep}  :: ${r.summary}`);
}
