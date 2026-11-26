"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, Share, SquarePlus, X } from "lucide-react";
import { VAPID_PUBLIC_KEY, isSupabaseConfigured } from "@/lib/env";
import { supabaseBrowser } from "@/lib/supabase/client";
import { b64uToBytes } from "@/lib/webpush-edge";
import { useToast } from "@/components/toast";

type Status =
  | "loading"
  | "unsupported" // navegador sin Push (p. ej. iOS < 16.4 o Safari en pestaña)
  | "ios-install" // iPhone/iPad sin instalar la PWA: Apple solo permite push en la app instalada
  | "ask" // se puede pedir permiso
  | "denied"
  | "subscribed";

const DISMISS_KEY = "elena-fit-notif-dismissed";

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS 13+ se identifica como Mac con pantalla táctil
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
}

/** Guarda la suscripción en push_subscriptions (RPC: gestiona el endpoint único entre usuarios). */
async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  const device = isIos() ? "ios" : /android/i.test(navigator.userAgent) ? "android" : "desktop";
  const { error } = await supabaseBrowser().rpc("upsert_push_subscription", {
    p_endpoint: sub.endpoint,
    p_subscription: json,
    p_device_type: device,
  });
  if (error) throw new Error(error.message);
}

export function NotificationManager({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast((s) => s.show);

  const detect = useCallback(async () => {
    if (isIos() && !isStandalone()) return setStatus("ios-install");
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
      return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("denied");
    if (Notification.permission === "granted") {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        // Re-sincroniza por si el usuario cambió o la fila caducó (idempotente).
        if (isSupabaseConfigured) void saveSubscription(sub).catch(() => {});
        return setStatus("subscribed");
      }
    }
    setStatus("ask");
  }, []);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setHidden(false);
    }
    void detect();
  }, [detect]);

  async function enable() {
    setBusy(true);
    try {
      const reg = await getRegistration();
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission(); // debe lanzarse desde un gesto del usuario (iOS)
      if (perm !== "granted") return setStatus(perm === "denied" ? "denied" : "ask");

      if (isSupabaseConfigured && VAPID_PUBLIC_KEY) {
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: b64uToBytes(VAPID_PUBLIC_KEY),
          }));
        await saveSubscription(sub);
        toast("Avisos activados ✓");
      } else {
        // Demo sin backend/VAPID: aviso local para ver cómo se verá.
        await reg.showNotification("ElenitaFit", {
          body: "Así recibirás los avisos de Elena (demo local).",
          icon: "/icons/192",
          badge: "/icons/192",
          data: { type: "chat", url: "/chat" },
        });
      }
      setStatus("subscribed");
    } catch (e) {
      toast(e instanceof Error ? `No se pudo activar: ${e.message}` : "No se pudo activar los avisos");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  if (status === "loading" || status === "subscribed" || status === "unsupported") return null;
  if (hidden) return null;

  if (status === "ios-install") {
    return (
      <section aria-label="Activar avisos en iPhone" className={`rounded-3xl border border-volt/40 bg-ink-2 p-5 ${className ?? ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-volt text-ink">
              <BellRing className="size-5" />
            </span>
            <div>
              <h2 className="font-display-tight text-2xl font-bold">Recibe avisos en tu iPhone</h2>
              <p className="text-sm text-mute">Apple solo los permite si instalas la app. Son 3 pasos:</p>
            </div>
          </div>
          <button onClick={dismiss} aria-label="Ocultar" className="grid size-9 shrink-0 place-items-center rounded-full text-mute hover:bg-ink-3">
            <X className="size-4" />
          </button>
        </div>
        <ol className="mt-4 space-y-3 text-sm">
          {[
            { icon: Share, text: <>Abre esta página en <b>Safari</b> y pulsa <b>Compartir</b> (el cuadrado con la flecha ↑ de abajo).</> },
            { icon: SquarePlus, text: <>Desliza y elige <b>«Añadir a pantalla de inicio»</b>, luego <b>Añadir</b>.</> },
            { icon: Bell, text: <>Abre <b>ElenitaFit</b> desde el icono nuevo y pulsa <b>«Activar avisos»</b>.</> },
          ].map((s, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl bg-ink-3 p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-volt font-display text-lg text-ink">{i + 1}</span>
              <s.icon className="size-5 shrink-0 text-volt" aria-hidden />
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (status === "denied") {
    return (
      <section className={`flex items-start gap-3 rounded-3xl border border-line bg-ink-2 p-4 text-sm ${className ?? ""}`}>
        <Bell className="mt-0.5 size-5 shrink-0 text-mute" />
        <p className="flex-1 text-mute">
          Los avisos están bloqueados. Actívalos en los <b className="text-bone">ajustes del navegador o del sistema</b> para esta app.
        </p>
        <button onClick={dismiss} aria-label="Ocultar" className="text-mute hover:text-bone">
          <X className="size-4" />
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Activar avisos" className={`flex items-center gap-3 rounded-3xl border border-volt/40 bg-ink-2 p-4 ${className ?? ""}`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-volt text-ink">
        <BellRing className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Activa los avisos</p>
        <p className="text-sm text-mute">Mensajes y reservas al instante, aunque la app esté cerrada.</p>
      </div>
      <button
        onClick={enable}
        disabled={busy}
        className="h-11 shrink-0 rounded-full bg-volt px-5 font-display text-base uppercase tracking-wide text-ink transition active:scale-95 disabled:opacity-60"
      >
        {busy ? "…" : "Activar"}
      </button>
      <button onClick={dismiss} aria-label="Ocultar" className="grid size-9 shrink-0 place-items-center rounded-full text-mute hover:bg-ink-3">
        <X className="size-4" />
      </button>
    </section>
  );
}
