// Fa funzionare l'app anche senza connessione: tiene una copia dei file (KaTeX e font compresi)
// e la aggiorna in background quando c'è rete. I tuoi dati stanno in IndexedDB e non passano da qui.
const CACHE = 'studio-v5';
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './katex/katex.min.js', './katex/katex.min.css',
  './fonts/atkinson-hyperlegible-latin-400-italic.woff2',
  './fonts/atkinson-hyperlegible-latin-400-normal.woff2',
  './fonts/atkinson-hyperlegible-latin-700-italic.woff2',
  './fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  './fonts/bricolage-grotesque-latin-600-normal.woff2',
  './fonts/bricolage-grotesque-latin-800-normal.woff2',
  './katex/fonts/KaTeX_AMS-Regular.woff2',
  './katex/fonts/KaTeX_Caligraphic-Bold.woff2',
  './katex/fonts/KaTeX_Caligraphic-Regular.woff2',
  './katex/fonts/KaTeX_Fraktur-Bold.woff2',
  './katex/fonts/KaTeX_Fraktur-Regular.woff2',
  './katex/fonts/KaTeX_Main-Bold.woff2',
  './katex/fonts/KaTeX_Main-BoldItalic.woff2',
  './katex/fonts/KaTeX_Main-Italic.woff2',
  './katex/fonts/KaTeX_Main-Regular.woff2',
  './katex/fonts/KaTeX_Math-BoldItalic.woff2',
  './katex/fonts/KaTeX_Math-Italic.woff2',
  './katex/fonts/KaTeX_SansSerif-Bold.woff2',
  './katex/fonts/KaTeX_SansSerif-Italic.woff2',
  './katex/fonts/KaTeX_SansSerif-Regular.woff2',
  './katex/fonts/KaTeX_Script-Regular.woff2',
  './katex/fonts/KaTeX_Size1-Regular.woff2',
  './katex/fonts/KaTeX_Size2-Regular.woff2',
  './katex/fonts/KaTeX_Size3-Regular.woff2',
  './katex/fonts/KaTeX_Size4-Regular.woff2',
  './katex/fonts/KaTeX_Typewriter-Regular.woff2',
];

self.addEventListener('install', e => {
  // 'reload' salta la cache del browser: senza, una versione nuova potrebbe salvare i file vecchi
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      // cancella solo le copie vecchie di questa app: Daily e le altre app sullo stesso sito hanno le loro
      .then(keys => Promise.all(keys.filter(k => k.startsWith('studio-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      // 'no-cache' chiede sempre al server se il file è cambiato (se non lo è, risponde in un attimo)
      const net = fetch(e.request.url, { cache: 'no-cache' }).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
