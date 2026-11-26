import { NextResponse } from "next/server";
import { bearer, serverConfigured, supabaseAdmin, supabaseAsUser } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/push-server";

// Sin `runtime = "edge"`: @opennextjs/cloudflare ejecuta las rutas en el Worker (nodejs_compat).
// La cifra y firma push usan solo Web Crypto, así que funciona igual en Node, Workers y Vercel.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  if (!serverConfigured()) return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  const token = bearer(req);
  if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: { client_id?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const content = (body.content ?? "").trim();
  if (!content || content.length > 4000) return NextResponse.json({ error: "Mensaje vacío o demasiado largo" }, { status: 400 });

  // Todo lo que sigue corre COMO el usuario: RLS decide qué puede leer/escribir.
  const sb = supabaseAsUser(token);
  const { data: auth, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !auth.user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

  const { data: me } = await sb.from("profiles").select("id, full_name, role").eq("id", auth.user.id).single();
  if (!me) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 403 });

  const clientId = me.role === "client" ? me.id : body.client_id;
  if (!clientId || !UUID.test(clientId)) return NextResponse.json({ error: "client_id inválido" }, { status: 400 });

  const { data: message, error } = await sb
    .from("messages")
    .insert({ client_id: clientId, sender_id: me.id, content })
    .select()
    .single();
  if (error || !message) return NextResponse.json({ error: error?.message ?? "No se pudo guardar" }, { status: 403 });

  // Push (best effort: un fallo aquí nunca debe perder el mensaje ya guardado).
  let push = { sent: 0, removed: 0 };
  try {
    const admin = supabaseAdmin();
    if (admin) {
      let recipients: string[];
      if (me.role === "client") {
        const { data: trainers } = await admin.from("profiles").select("id").eq("role", "trainer");
        recipients = (trainers ?? []).map((t) => t.id as string);
      } else {
        recipients = [clientId];
      }
      push = await notifyUsers(recipients, {
        title: me.full_name || "ElenitaFit",
        body: content.length > 120 ? `${content.slice(0, 117)}…` : content,
        type: "chat",
        url: me.role === "client" ? `/coach/chat?client=${clientId}` : "/chat",
        tag: `chat-${clientId}`,
      });
    }
  } catch (e) {
    console.error("push chat failed", e);
  }

  return NextResponse.json({ message, push });
}
