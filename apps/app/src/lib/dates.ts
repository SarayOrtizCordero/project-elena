/** Utilidades de fecha en hora LOCAL (las reservas son fechas de calendario, sin zona horaria). */
export const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 08:00 … 19:00 (última franja 19-20)
export const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;
export const slotEnd = (start: string) => hh(Number(start.slice(0, 2)) + 1);

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
export const mondayOf = (d: Date) => {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
};
export const isWeekday = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;
export const weekdayShort = (d: Date) => d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
export const dayLong = (s: string) => {
  const t = parseYmd(s).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const rangeLabel = (a: Date, b: Date) =>
  `${a.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
export const hhmm = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
