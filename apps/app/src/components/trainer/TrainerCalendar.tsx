"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@elena/ui";
import { repo } from "@/lib/repo";
import { HOURS, addDays, dayLong, hh, isWeekday, mondayOf, rangeLabel, weekdayShort, ymd } from "@/lib/dates";
import type { BookingWithClient } from "@/lib/types";
import { useToast } from "@/components/toast";

type View = "week" | "day";

function Avatar({ name, url, size = "size-8" }: { name: string; url?: string | null; size?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={cn(size, "shrink-0 rounded-full object-cover")} />
  ) : (
    <span className={cn(size, "grid shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-volt")}>{name[0]}</span>
  );
}

/** Calendario de Elena: semana (lun-vie) o día, en tiempo real. */
export function TrainerCalendar() {
  const toast = useToast((s) => s.show);
  const [view, setView] = useState<View>("week");
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [day, setDay] = useState(() => {
    const t = new Date();
    return ymd(isWeekday(t) ? t : mondayOf(addDays(t, 2)));
  });
  const [bookings, setBookings] = useState<BookingWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const from = ymd(weekStart);
  const to = ymd(addDays(weekStart, 4));

  const load = useCallback(async () => {
    try {
      setBookings(await repo.listBookings(from, to));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  // Tiempo real: nueva reserva o cancelación → recarga y avisa
  useEffect(() => {
    return repo.subscribeBookings(async (e) => {
      const fresh = await repo.listBookings(from, to).catch(() => null);
      if (fresh) setBookings(fresh);
      if (e.type === "INSERT" || (e.type === "UPDATE" && e.row.status === "cancelled")) {
        const who = (await repo.listClients().catch(() => [])).find((c) => c.id === e.row.client_id)?.full_name ?? "Un cliente";
        toast(`${e.row.status === "cancelled" ? "Cancelada" : "Nueva reserva"}: ${who} · ${e.row.start_time}`);
      }
    });
  }, [from, to, toast]);

  const byKey = useMemo(() => {
    const m = new Map<string, BookingWithClient[]>();
    bookings.forEach((b) => {
      const k = `${b.booking_date}|${b.start_time}`;
      m.set(k, [...(m.get(k) ?? []), b]);
    });
    return m;
  }, [bookings]);

  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const today = ymd(new Date());

  function shiftWeek(n: number) {
    const next = addDays(weekStart, 7 * n);
    setWeekStart(next);
    setDay(ymd(next));
  }
  function shiftDay(n: number) {
    let d = addDays(new Date(`${day}T12:00:00`), n);
    while (!isWeekday(d)) d = addDays(d, n);
    setWeekStart(mondayOf(d));
    setDay(ymd(d));
  }

  async function cancel(b: BookingWithClient) {
    if (!window.confirm(`¿Cancelar la sesión de ${b.client?.full_name ?? "este cliente"} (${b.start_time})?`)) return;
    try {
      await repo.cancelBooking(b.id);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "No se pudo cancelar");
    }
  }

  const weekCount = bookings.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Vista" className="flex rounded-full border border-line p-1">
          {(["week", "day"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                view === v ? "bg-volt text-ink" : "text-mute hover:text-bone",
              )}
            >
              {v === "week" ? "Semana" : "Día"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => (view === "week" ? shiftWeek(-1) : shiftDay(-1))}
            aria-label="Anterior"
            className="grid size-10 place-items-center rounded-full border border-line hover:border-volt"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => {
              setWeekStart(mondayOf(new Date()));
              setDay(ymd(isWeekday(new Date()) ? new Date() : mondayOf(addDays(new Date(), 2))));
            }}
            className="h-10 rounded-full border border-line px-4 text-sm font-semibold hover:border-volt"
          >
            Hoy
          </button>
          <button
            onClick={() => (view === "week" ? shiftWeek(1) : shiftDay(1))}
            aria-label="Siguiente"
            className="grid size-10 place-items-center rounded-full border border-line hover:border-volt"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-mute">
        <CalendarDays className="size-4 text-volt" />
        {view === "week" ? rangeLabel(weekStart, addDays(weekStart, 4)) : dayLong(day)} ·{" "}
        {view === "week" ? `${weekCount} ${weekCount === 1 ? "sesión" : "sesiones"}` : `${bookings.filter((b) => b.booking_date === day).length} sesiones`}
        <span className="ml-auto flex items-center gap-1.5 text-xs">
          <span className="size-2 animate-pulse rounded-full bg-ok" /> En vivo
        </span>
      </p>

      {loading ? (
        <div className="py-16 text-center text-mute">Cargando…</div>
      ) : view === "week" ? (
        <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <div
            className="grid min-w-[44rem] gap-px overflow-hidden rounded-3xl border border-line bg-line"
            style={{ gridTemplateColumns: "3.25rem repeat(5, minmax(0, 1fr))" }}
          >
            <div className="bg-ink-2" />
            {days.map((d) => {
              const k = ymd(d);
              return (
                <button
                  key={k}
                  onClick={() => {
                    setDay(k);
                    setView("day");
                  }}
                  className={cn("bg-ink-2 py-2 text-center hover:bg-ink-3", k === today && "text-volt")}
                >
                  <span className="block text-xs font-semibold capitalize">{weekdayShort(d)}</span>
                  <span className="font-display text-2xl leading-none">{d.getDate()}</span>
                </button>
              );
            })}
            {HOURS.map((h) => (
              <Row key={h} hour={h}>
                {days.map((d) => {
                  const list = byKey.get(`${ymd(d)}|${hh(h)}`) ?? [];
                  return (
                    <div key={ymd(d)} className="min-h-14 bg-ink p-1">
                      {list.map((b) => (
                        <div key={b.id} className="flex items-center gap-1.5 rounded-xl bg-volt p-1.5 text-ink">
                          <Avatar name={b.client?.full_name ?? "?"} url={b.client?.avatar_url} size="size-6" />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold leading-tight">{b.client?.full_name ?? "Cliente"}</span>
                            {b.notes && <span className="block truncate text-[10px] leading-tight opacity-75">{b.notes}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </Row>
            ))}
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {HOURS.map((h) => {
            const list = byKey.get(`${day}|${hh(h)}`) ?? [];
            return (
              <li key={h} className="flex gap-3">
                <span className="w-12 shrink-0 pt-3 font-display text-xl text-mute">{hh(h)}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  {list.length === 0 && <div className="flex h-12 items-center rounded-2xl border border-dashed border-line px-4 text-sm text-mute/60">Libre</div>}
                  {list.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-volt p-3 text-ink">
                      <Avatar name={b.client?.full_name ?? "?"} url={b.client?.avatar_url} size="size-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{b.client?.full_name ?? "Cliente"}</p>
                        <p className="truncate text-sm opacity-80">
                          {b.start_time}–{b.end_time}
                          {b.notes ? ` · ${b.notes}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => cancel(b)}
                        aria-label={`Cancelar sesión de ${b.client?.full_name ?? "cliente"}`}
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/10 hover:bg-ink/20"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Fila de la rejilla semanal: etiqueta de hora + celdas. */
function Row({ hour, children }: { hour: number; children: React.ReactNode }) {
  return (
    <>
      <div className="bg-ink-2 px-1 pt-2 text-center font-display text-lg text-mute">{hh(hour)}</div>
      {children}
    </>
  );
}
