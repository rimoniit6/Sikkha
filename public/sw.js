const CACHE_VERSION = 'sikkha-v2'
const STATIC_CACHE = 'sikkha-static-v2'
const DYNAMIC_CACHE = 'sikkha-dynamic-v2'
const OFFLINE_CACHE = 'sikkha-offline-v1'

const STATIC_ASSETS = ['/', '/offline']
const CACHEABLE_ROUTES = ['/login', '/register', '/premium', '/privacy', '/terms']

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE && k !== OFFLINE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// Fetch: smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip non-GET requests and chrome-extension URLs
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets (images, fonts, JS, CSS): cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|js|css)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOffline(request))
    return
  }

  // Other requests: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request))
})

// Cache-first strategy for static assets
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

// Network-first strategy for API calls
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(
      JSON.stringify({ error: 'আপনি অফলাইনে আছেন', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Network-first with offline fallback for navigation
async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    // Return offline page
    const offlineResponse = await caches.match('/')
    if (offlineResponse) return offlineResponse

    return new Response(
      `<!DOCTYPE html>
      <html lang="bn">
      <head><meta charset="utf-8"><title>অফলাইন</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b;text-align:center;padding:1rem}
      .icon{font-size:4rem;margin-bottom:1rem}
      h1{font-size:1.5rem;margin:0.5rem 0}
      p{color:#64748b;margin:0.5rem 0 1.5rem}
      button{padding:0.75rem 1.5rem;border-radius:0.75rem;background:#059669;color:white;border:none;font-size:1rem;cursor:pointer}
      button:active{opacity:0.9}</style></head>
      <body><div class="icon">📡</div><h1>ইন্টারনেট সংযোগ নেই</h1>
      <p>আপনি অফলাইনে আছেন। সংযোগ পুনরুদ্ধার করে আবার চেষ্টা করুন।</p>
      <button onclick="location.reload()">আবার চেষ্টা করুন</button></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

// Stale-while-revalidate for other resources
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)

  return cached || fetchPromise
}
