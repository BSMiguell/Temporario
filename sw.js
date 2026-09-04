// sw.js - Service Worker do Aetheria Codex
// Estrategia:
//   - Network-first para navegacao (HTML) -> sempre fresco
//   - Cache-first para assets estaticos (imagens, JSON, CSS, JS)
//   - Stale-while-revalidate para o manifest/favicon
// Tudo offline-first: apos 1 visita, o site abre 100% sem internet.

const VERSION = "aetheria-v1.0.0";
const CORE_CACHE = `${VERSION}-core`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const MAX_RUNTIME = 200; // ~200 arquivos em cache (suficiente para todos os WebP/JSON)

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./sitemap.xml",
  "./assets/codex.css",
  "./assets/favicon.svg",
  "./assets/favicon-32.png",
  "./assets/favicon-192.png",
  "./assets/apple-touch-icon.png",
  "./assets/og-cover.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        // nao falha o install se algum opcional nao existir
        console.warn("[SW] precache parcial:", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // CDN nao passa pelo SW

  // 1) Navegacao: network-first com fallback de cache
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CORE_CACHE).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./offline.html")))
    );
    return;
  }

  // 2) Assets estaticos: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // so cacheia o que deu certo
          if (!res || res.status !== 200) return res;
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => {
            c.put(req, clone);
            // limita tamanho do runtime
            c.keys().then((keys) => {
              if (keys.length > MAX_RUNTIME) {
                c.delete(keys[0]); // remove o mais antigo
              }
            });
          });
          return res;
        })
        .catch(() => cached); // offline total
    })
  );
});

// mensagem: o usuario pediu pular o cache e recarregar
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
