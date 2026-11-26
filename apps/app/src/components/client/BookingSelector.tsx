"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Lock, X } from "lucide-react";
import { cn } from "@elena/ui";
import { repo } from "@/lib/repo";
import { HOURS, addDays, dayLong, hh, isWeekday, mondayOf, parseYmd, rangeLabel, slotEnd, weekdayShort, ymd } from "@/lib/dates";
import { useIdentity } from "@/lib/identity";
import type { BookedSlot, Booking } from "@/lib/types";
import { useToast } from "@/components/toast";

const MAX_WEEKS_AHEAD = 7;

/** Reservas presenciales (lun-vie). Solo se muestra a clientes con is_in_person = true. */
export function BookingSelector() {
  const { identity } = useIdentity();
  const toast = useToast((s) => s.show);

  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [day, setDay] = useState(() => {
    const t = new Date();
    return ymd(isWeekday(t) ? t : mondayOf(addDays(t, 2)));
  });
  const [slots, setSlots] = useState<BookedSlot[]>([]);
  const [mine, setMine] = useState<Booking[]>([]);
  const [capacity, setCapacity] = useState(1);
  const [picked, setPicked] = useState<string | null>(null); // HH:MM
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const clientId = identity?.id;
  const allowed = identity?.role === "client" && identity.isInPerson;

  const refresh = useCallback(async () => {
    if (!clientId) return;
    const from = ymd(weekStart);
    const to = ymd(addDays(weekStart, 6));
    const [s, m] = await Promise.all([repo.listBookedSlots(from, to), repo.listMyBookings(clientId)]);
    setSlots(s);
    setMine(m);
    setNow(new Date());
  }, [clientId, weekStart]);

  useEffect(() => {
    if (!allowed) return;
    void refresh().catch(() => {});
    repo.getSlotCapacity().then(setCapacity).catch(() => {});
    // Las reservas de OTROS clientes no llegan por Realtime (RLS): refresco al volver a la app y cada 30 s.
    const t = setInterval(() => void refresh().catch(() => {}), 30_000);
    const onVis = () => document.visibilityState === "visible" && void refresh().catch(() => {});
    document.addEventListener("visibilitychange", onVis);
    const off = repo.subscribeBookings(() => void refresh().catch(() => {}));
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      off();
    };
  }, [allowed, refresh]);

  const takenAt = useMemo(() => {
    const m = new Map<string, number>();
    slots.forEach((s) => m.set(`${s.booking_date}|${s.start_time}`, s.taken));
    return m;
  }, [slots]);
  const mineAt = useMemo(() => new Map(mine.map((b) => [`${b.booking_date}|${b.start_time}`, b])), [mine]);

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-line bg-ink-2 p-6 text-center">
        <Lock className="mx-auto mb-3 size-8 text-mute" />
        <p className="font-semibold">Las reservas son para entrenamiento presencial</p>
        <p className="mt-1 text-sm text-mute">Si entrenas en persona con Elena, pídele que te dé acceso.</p>
      </div>
    );
  }

  const today = ymd(now);
  const thisMonday = mondayOf(now);
  const weeksFromNow = Math.round((weekStart.getTime() - thisMonday.getTime()) / (7 * 86400_000));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function shiftWeek(n: number) {
    const next = addDays(weekStart, 7 * n);
    setWeekStart(next);
    setDay(ymd(next) <= today && today <= ymd(addDays(next, 4)) ? today : ymd(next));
    setPicked(null);
  }

  function state(hour: number) {
    const start = hh(hour);
    const key = `${day}|${start}`;
    const past = day < today || (day === today && hour <= now.getHours());
    if (mineAt.has(key)) return "mine" as const;
    if (past) return "past" as const;
    if ((takenAt.get(key) ?? 0) >= capacity) return "taken" as const;
    return "free" as const;
  }

  async function book() {
    if (!picked || !clientId) return;
    setBusy(true);
    try {
      await repo.createBooking({ clientId, date: day, start: picked, end: slotEnd(picked), notes });
      toast(`Reservado: ${dayLong(day)} · ${picked}`);
      setPicked(null);
      setNotes("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo reservar");
    } finally {
      setBusy(false);
      await refresh().catch(() => {});
    }
  }

  async function cancel(b: Booking) {
    if (!window.confirm(`¿Cancelar tu sesión del ${dayLong(b.booking_date)} a las ${b.start_time}?`)) return;
    try {
      await repo.cancelBooking(b.id);
      toast("Reserva cancelada");
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo cancelar");
    } finally {
      await refresh().catch(() => {});
    }
  }

  return (
    <div className="space-y-5">
      {/* Semana */}
      <section className="rounded-3xl border border-line bg-ink-2 p-4" aria-label="Elegir día">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => shiftWeek(-1)}
            disabled={weeksFromNow <= 0}
            aria-label="Semana anterior"
            className="grid size-10 place-items-center rounded-full border border-line disabled:opacity-30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="font-semibold">{rangeLabel(weekStart, addDays(weekStart, 4))}</p>
          <button
            onClick={() => shiftWeek(1)}
            disabled={weeksFromNow >= MAX_WEEKS_AHEAD}
            aria-label="Semana siguiente"
            className="grid size-10 place-items-center rounded-full border border-line disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const k = ymd(d);
            const weekend = !isWeekday(d);
            const past = k < today;
            const disabled = weekend || past;
            const active = k === day;
            return (
              <button
                key={k}
                disabled={disabled}
                onClick={() => {
                  setDay(k);
                  setPicked(null);
                }}
                aria-pressed={active}
                aria-label={`${dayLong(k)}${weekend ? " (no disponible)" : ""}`}
                className={cn(
                  "flex h-16 flex-col items-center justify-center rounded-2xl border text-xs transition-colors",
                  active ? "border-volt bg-volt text-ink" : "border-line",
                  disabled && "cursor-not-allowed opacity-30",
                  weekend && "bg-[repeating-linear-gradient(135deg,transparent_0_5px,rgb(255_255_255/0.06)_5px_10px)]",
                )}
              >
                <span className="font-semibold capitalize">{weekdayShort(d)}</span>
                <span className="font-display text-2xl leading-none">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-mute">Sábados y domingos no hay sesiones.</p>
      </section>

      {/* Franjas */}
      <section className="rounded-3xl border border-line bg-ink-2 p-4" aria-label="Elegir hora">
        <h2 className="font-display-tight text-3xl font-bold">{dayLong(day)}</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {HOURS.map((h) => {
            const st = state(h);
            const start = hh(h);
            const sel = picked === start;
            return (
              <button
                key={h}
                disabled={st !== "free"}
                onClick={() => setPicked(sel ? null : start)}
                aria-pressed={sel}
                className={cn(
                  "flex h-16 flex-col items-center justify-center rounded-2xl border text-sm transition",
                  st === "free" && !sel && "border-line hover:border-volt",
                  sel && "border-volt bg-volt text-ink",
                  st === "taken" && "cursor-not-allowed border-line bg-ink-3 text-mute line-through",
                  st === "past" && "cursor-not-allowed border-transparent text-mute/40",
                  st === "mine" && "border-ok/60 bg-ok/10 text-ok",
                )}
              >
                <span className="font-display text-xl leading-none">{start}</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider no-underline">
                  {st === "free" ? "Libre" : st === "taken" ? "Ocupada" : st === "mine" ? "Tu sesión" : "Pasada"}
                </span>
              </button>
            );
          })}
        </div>

        {picked && (
          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <p className="text-sm">
              Sesión de 1 h · <b>{picked}–{slotEnd(picked)}</b>
            </p>
            <label className="block">
              <span className="sr-only">Notas para Elena</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                placeholder="Nota para Elena (opcional): lesión, qué quieres trabajar…"
                className="h-12 w-full rounded-2xl border border-line bg-ink px-4 focus:border-volt focus:outline-none"
              />
            </label>
            <button
              onClick={book}
              disabled={busy}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-volt font-display text-lg uppercase tracking-wide text-ink transition active:scale-[0.97] disabled:opacity-60"
            >
              <CalendarCheck className="size-5" /> {busy ? "Reservando…" : "Confirmar reserva"}
            </button>
          </div>
        )}
      </section>

      {/* Mis reservas */}
      <section className="rounded-3xl border border-line bg-ink-2 p-4" aria-label="Mis reservas">
        <h2 className="font-display-tight text-3xl font-bold">Mis próximas sesiones</h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-mute">No tienes sesiones reservadas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mine.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-ink-3 p-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-volt text-center font-display text-xl leading-none text-ink">
                  {parseYmd(b.booking_date).getDate()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{dayLong(b.booking_date)}</p>
                  <p className="text-sm text-mute">
                    {b.start_time}–{b.end_time}
                    {b.notes ? ` · ${b.notes}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => cancel(b)}
                  aria-label="Cancelar reserva"
                  className="grid size-10 place-items-center rounded-full border border-line text-mute hover:border-bad hover:text-bad"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
