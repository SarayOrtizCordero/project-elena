import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Valores de servidor (Cloudflare: process.env se rellena desde bindings/secrets con nodejs_compat). */
function env(name: string) {
  return process.env[name] ?? "";
}

export function serverConfigured() {
  return Boolean(env("NEXT_PUBLIC_SUPABASE_URL") && env("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
}

/** Cliente que actúa COMO el usuario (RLS aplica) usando el JWT del header Authorization. */
export function supabaseAsUser(token: string): SupabaseClient {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente con service role (salta RLS). Solo para leer suscripciones push de otros usuarios. */
export function supabaseAdmin(): SupabaseClient | null {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) return null;
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") ?? "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() || null : null;
}
