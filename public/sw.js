/* Kyntra — the single, coordinated service worker.
 *
 * Responsibilities (one worker, no conflicts):
 *  1. App-shell: cache immutable static assets; show /offline.html for failed navigations.
 *  2. Web Push (FCM): show notifications from data-only FCM messages.
 *  3. Notification click: focus/open the right Kyntra screen.
 *
 * FCM's getToken() is given THIS registration, so Firebase never registers its own worker.
 * Private data is never cached here: Firestore traffic is cross-origin and bypassed,
 * and HTML documents are not cached (only the static offline page).
 */
const VERSION = "kyntra-v3";
const STATIC_CACHE = `${VERSION}-static`;
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/brand/mark-forest.svg",
  "/manifest.webmanifest",
];
const isLocalDev = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase / Google APIs: never intercepted
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  if (!isLocalDev && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
  }
});

function safePath(p) {
  return typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/today";
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  // FCM wraps custom fields in `data`; tolerate a flat payload too.
  const d = payload.data || payload;
  if (!d || !d.title) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // If Kyntra is open and visible, the in-app reminder UI already handles it.
      if (clients.some((c) => c.visibilityState === "visible")) return;
      return self.registration.showNotification(d.title, {
        body: d.body || "",
        tag: d.tag || undefined,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-96.png",
        // Sound is the OS default notification sound (web apps cannot set a custom one);
        // silent:false asks for it explicitly and vibrate adds a haptic cue on Android.
        silent: false,
        vibrate: [200, 100, 200],
        data: { url: safePath(d.url) },
      });
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(safePath(event.notification.data && event.notification.data.url), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) return client.navigate(target);
          return;
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
