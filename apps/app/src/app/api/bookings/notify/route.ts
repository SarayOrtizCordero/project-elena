import { NextResponse } from "next/server";
import { bearer, serverConfigured, supabaseAdmin, supabaseAsUser } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/push-server";

/** Avisa a Elena (push) cuando un cliente crea o cancela una reserva presencial. */
export async function POST(req: Request) {
  if (!serverConfigured()) return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: { booking_id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.booking_id || (body.action !== "created" && body.action !== "cancelled"))
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });

  const sb = supabaseAsUser(token);
  const { data: auth } = await sb.auth.getUser(token);
  if (!auth.user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

  // La reserva debe ser del usuario (RLS) y coincidir con la acción: nadie puede disparar avisos falsos.
  const { data: b } = await sb
    .from("bookings")
    .select("id, client_id, booking_date, start_time, status, created_at")
    .eq("id", body.booking_id)
    .eq("client_id", auth.user.id)
    .maybeSingle();
  if (!b) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  const expected = body.action === "created" ? "confirmed" : "cancelled";
  if (b.status !== expected) return NextResponse.json({ error: "Estado no coincide" }, { status: 409 });
  if (body.action === "created" && Date.now() - new Date(b.created_at).getTime() > 5 * 60_000)
    return NextResponse.json({ error: "Reserva demasiado antigua para avisar" }, { status: 409 });

  const { data: me } = await sb.from("profiles").select("full_name").eq("id", auth.user.id).single();
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, push: { sent: 0, removed: 0 } });
  const { data: trainers } = await admin.from("profiles").select("id").eq("role", "trainer");

  const when = new Date(`${b.booking_date}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const push = await notifyUsers((trainers ?? []).map((t) => t.id as string), {
    title: body.action === "created" ? "Nueva reserva" : "Reserva cancelada",
    body: `${me?.full_name ?? "Un cliente"} · ${when} · ${String(b.start_time).slice(0, 5)}`,
    type: "booking",
    url: "/coach/calendario",
    tag: `booking-${b.id}`,
  });
  return NextResponse.json({ ok: true, push });
}
