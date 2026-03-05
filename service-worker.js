const CACHE_NAME = 'chess-ttt-v3';

const urlsToCache = ['/chess-tictactoe/', '/chess-tictactoe/index.html', '/chess-tictactoe/style.css', '/chess-tictactoe/game.js', '/chess-tictactoe/manifest.json', '/chess-tictactoe/icons/icon-192.png', '/chess-tictactoe/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
