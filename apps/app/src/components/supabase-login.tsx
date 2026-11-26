"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useApp } from "@/lib/store";

/** Acceso real con email + contraseña (Supabase Auth). Solo se muestra si hay variables de Supabase. */
export function SupabaseLogin() {
  const router = useRouter();
  const login = useApp((s) => s.login);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = supabaseBrowser();
    try {
      if (mode === "up") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        if (!data.session) return setMsg("Revisa tu correo para confirmar la cuenta y vuelve a entrar.");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data: u } = await sb.auth.getUser();
      const { data: p } = await sb.from("profiles").select("role").eq("id", u.user?.id ?? "").single();
      const coach = p?.role === "trainer";
      login(coach ? "coach" : "client");
      router.push(coach ? "/coach" : "/hoy");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo entrar");
    } finally {
      setBusy(false);
    }
  }

  const field = "h-14 w-full rounded-2xl border border-line bg-ink-2 px-4 focus:border-volt focus:outline-none";
  return (
    <form onSubmit={submit} className="mt-8 space-y-3">
      {mode === "up" && <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" aria-label="Nombre" className={field} />}
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" aria-label="Email" className={field} />
      <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (mín. 8)" autoComplete={mode === "in" ? "current-password" : "new-password"} aria-label="Contraseña" className={field} />
      {msg && <p role="alert" className="text-sm text-bad">{msg}</p>}
      <button disabled={busy} className="h-14 w-full rounded-full bg-volt font-display text-lg uppercase tracking-wide text-ink transition active:scale-[0.97] disabled:opacity-60">
        {busy ? "…" : mode === "in" ? "Entrar" : "Crear cuenta"}
      </button>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-mute underline underline-offset-2">
        {mode === "in" ? "¿Primera vez? Crea tu cuenta" : "Ya tengo cuenta"}
      </button>
    </form>
  );
}
