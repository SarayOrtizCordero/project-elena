/* Service worker mínimo: assets estáticos en caché y navegación con fallback offline. */
const CACHE = "elena-fit-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || /\.(png|svg|woff2?|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
    );
  }
});

/* ───────── Web Push ─────────
   El servidor envía JSON: { title, body, type: "chat" | "booking", url, tag }.
   Funciona en Android (Chrome/Edge) y en iPhone con iOS/iPadOS 16.4+ SOLO si la PWA está
   instalada en la pantalla de inicio. En iOS toda notificación push debe mostrarse (userVisibleOnly). */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const type = data.type === "booking" ? "booking" : "chat";
  const title = data.title || "ElenitaFit";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/192",
      badge: "/icons/192",
      tag: data.tag || type, // misma etiqueta = sustituye la anterior (sin spam)
      renotify: true,
      data: { type, url: data.url || (type === "booking" ? "/calendario" : "/chat") },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { type, url } = event.notification.data || {};
  const target = new URL(url || (type === "booking" ? "/calendario" : "/chat"), self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) return open.focus().then((w) => (w && "navigate" in w ? w.navigate(target) : w));
      return self.clients.openWindow(target);
    }),
  );
});
