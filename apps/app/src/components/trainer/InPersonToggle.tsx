"use client";

import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { cn } from "@elena/ui";
import { repo } from "@/lib/repo";
import { useToast } from "@/components/toast";
import type { Profile } from "@/lib/types";

/** Interruptor de la ficha del cliente: habilita/deshabilita sus reservas presenciales (is_in_person). */
export function InPersonToggle({ clientId }: { clientId: string }) {
  const [value, setValue] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast((s) => s.show);

  useEffect(() => {
    let alive = true;
    repo
      .listClients()
      .then((l: Profile[]) => alive && setValue(l.find((c) => c.id === clientId)?.is_in_person ?? false))
      .catch(() => alive && setValue(false));
    return () => {
      alive = false;
    };
  }, [clientId]);

  async function toggle() {
    if (value === null || busy) return;
    const next = !value;
    setBusy(true);
    setValue(next); // optimista
    try {
      await repo.setInPerson(clientId, next);
      toast(next ? "Reservas presenciales activadas" : "Reservas presenciales desactivadas");
    } catch (e) {
      setValue(!next);
      toast(e instanceof Error ? e.message : "No se pudo cambiar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-line bg-ink-2 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink-3 text-volt">
        <CalendarCheck className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Entrenamiento presencial</p>
        <p className="text-sm text-mute">Permite que reserve sesiones de lunes a viernes.</p>
      </div>
      <button
        role="switch"
        aria-checked={!!value}
        aria-label="Acceso a entrenamiento presencial"
        disabled={value === null || busy}
        onClick={toggle}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50",
          value ? "bg-volt" : "bg-ink-3 ring-1 ring-line",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-6 rounded-full transition-all",
            value ? "left-7 bg-ink" : "left-1 bg-mute",
          )}
        />
      </button>
    </div>
  );
}
