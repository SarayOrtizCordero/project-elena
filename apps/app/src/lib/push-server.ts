import { sendWebPush, type PushSubscriptionJSON, type VapidKeys } from "./webpush-edge";
import { supabaseAdmin } from "./supabase/server";

export type PushPayload = {
  title: string;
  body: string;
  /** "chat" | "booking": el service worker decide el icono/pestaña a abrir. */
  type: "chat" | "booking";
  /** Ruta que abre notificationclick. */
  url: string;
  tag?: string;
};

export function vapidFromEnv(): VapidKeys | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT || "mailto:admin@example.com" };
}

/** Envía el push a todos los dispositivos de los usuarios y borra las suscripciones caducadas (404/410). */
export async function notifyUsers(userIds: string[], payload: PushPayload): Promise<{ sent: number; removed: number }> {
  const vapid = vapidFromEnv();
  const admin = supabaseAdmin();
  if (!vapid || !admin || userIds.length === 0) return { sent: 0, removed: 0 };

  const { data: rows } = await admin
    .from("push_subscriptions")
    .select("id, subscription")
    .in("user_id", userIds);
  if (!rows?.length) return { sent: 0, removed: 0 };

  const results = await Promise.all(
    rows.map(async (r) => ({
      id: r.id as string,
      res: await sendWebPush(r.subscription as PushSubscriptionJSON, payload, vapid, { urgency: "high", topic: payload.tag }),
    })),
  );
  const dead = results.filter((r) => r.res.gone).map((r) => r.id);
  if (dead.length) await admin.from("push_subscriptions").delete().in("id", dead);
  return { sent: results.filter((r) => r.res.ok).length, removed: dead.length };
}
