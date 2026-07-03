/**
 * Service Worker — 离线缓存支持
 * 网络优先策略：有网时走网络，无网时使用缓存
 */
const CACHE_NAME = 'es-offline-v1'
const PRECACHE_URLS = [
  '/',
  '/login',
  '/index.html',
]

// 安装：预缓存关键资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }).catch(() => {
      // 预缓存失败不阻塞安装
    })
  )
  self.skipWaiting()
})

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    })
  )
  self.clients.claim()
})

// 拦截请求：网络优先策略
self.addEventListener('fetch', (event) => {
  // 只拦截 GET 请求
  if (event.request.method !== 'GET') return

  // 跳过 API 请求和 WebSocket
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 缓存成功的响应
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone)
        })
        return response
      })
      .catch(() => {
        // 网络失败时返回缓存
        return caches.match(event.request).then((cached) => {
          return cached || new Response('离线模式 - 请检查网络连接', { status: 503 })
        })
      })
  )
})
