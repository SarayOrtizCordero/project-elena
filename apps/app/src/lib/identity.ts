"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isSupabaseConfigured } from "./env";
import { MOCK_TRAINER_ID, getMockProfile, subscribeMock } from "./repo/mock";
import { supabaseBrowser } from "./supabase/client";
import { useApp } from "./store";
import type { Identity, Profile } from "./types";

const toIdentity = (p: Profile): Identity => ({
  id: p.id,
  role: p.role,
  fullName: p.full_name,
  isInPerson: p.is_in_person,
  avatarUrl: p.avatar_url,
});

/** Demo: la identidad sale del rol elegido en el login; is_in_person es reactivo (lo cambia Elena). */
function useDemoIdentity(): { identity: Identity | null; loading: boolean } {
  const role = useApp((s) => s.role);
  const id = role === "coach" ? MOCK_TRAINER_ID : role === "client" ? "lucia" : null;
  const profile = useSyncExternalStore(
    subscribeMock,
    () => (id ? JSON.stringify(getMockProfile(id)) : "null"),
    () => "null",
  );
  const p = JSON.parse(profile) as Profile | null;
  return { identity: p ? toIdentity(p) : null, loading: false };
}

/** Supabase: sesión de Auth + fila de profiles (se refresca al volver a la app por si Elena cambió permisos). */
function useSupabaseIdentity(): { identity: Identity | null; loading: boolean } {
  const [state, setState] = useState<{ identity: Identity | null; loading: boolean }>({ identity: null, loading: true });

  const refresh = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) return setState({ identity: null, loading: false });
    const { data: p } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setState({ identity: p ? toIdentity(p as Profile) : null, loading: false });
  }, []);

  useEffect(() => {
    const sb = supabaseBrowser();
    void refresh();
    const { data: sub } = sb.auth.onAuthStateChange(() => void refresh());
    const onVis = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      sub.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  return state;
}

// La rama se decide en build (variables NEXT_PUBLIC): el orden de hooks nunca cambia en runtime.
export const useIdentity = isSupabaseConfigured ? useSupabaseIdentity : useDemoIdentity;

export async function signOutEverywhere() {
  if (isSupabaseConfigured) await supabaseBrowser().auth.signOut();
}
