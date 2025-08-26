self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => clients.claim());

// Tiny cache for shell files (expand later)
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json"];
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open("squadai-v1").then(cache =>
      cache.match(event.request).then(resp =>
        resp ||
        fetch(event.request).then(net => {
          if (event.request.method === "GET") cache.put(event.request, net.clone());
          return net;
        })
      )
    )
  );
});
