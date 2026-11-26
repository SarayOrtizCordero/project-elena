import { clients as demoClients } from "../data";
import { addDays, mondayOf, ymd } from "../dates";
import type { BookedSlot, Booking, BookingWithClient, Folder, Message, Profile, Template, Thread } from "../types";
import type { Repo, RowEvent, Unsub } from "./types";

/** Repositorio DEMO: todo en localStorage, con "tiempo real" simulado entre pestañas y respuestas automáticas. */

export const MOCK_TRAINER_ID = "elena";
const KEY = "elena-fit-mock-v1";
const CAPACITY = 1;

type DB = {
  profiles: Profile[];
  folders: Folder[];
  templates: Template[];
  plans: { id: string; client_id: string; title: string; category: string; content_data: unknown; created_at: string }[];
  bookings: Booking[];
  messages: Message[];
};

const uid = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

function seed(): DB {
  const created = now();
  const profiles: Profile[] = [
    { id: MOCK_TRAINER_ID, full_name: "Elena", email: "elena@demo.elena", role: "trainer", is_in_person: false, avatar_url: null, created_at: created },
    ...demoClients.map<Profile>((c) => ({
      id: c.id,
      full_name: c.name,
      email: `${c.id}@demo.elena`,
      role: "client",
      is_in_person: c.mode !== "Online",
      avatar_url: null,
      created_at: created,
    })),
  ];
  const folders: Folder[] = [
    { id: "f-train", name: "Entrenamiento", color: "#FAA307", created_at: created },
    { id: "f-nutri", name: "Nutrición", color: "#4ADE80", created_at: created },
  ];
  const templates: Template[] = [
    {
      id: "t-ppl", folder_id: "f-train", title: "Empuje / Tirón / Pierna · 4 días", category: "workout", created_at: created,
      description: "Rutina dividida para ganar fuerza e hipertrofia.",
      content_data: { exercises: [
        { name: "Press banca", sets: 4, reps: "8-10", rest_seconds: 90, video_url: "https://youtu.be/dQw4w9WgXcQ" },
        { name: "Remo con barra", sets: 4, reps: "8-10", rest_seconds: 90 },
        { name: "Sentadilla", sets: 4, reps: "6-8", rest_seconds: 120 },
      ] },
    },
    {
      id: "t-def", folder_id: "f-nutri", title: "Definición · 1.800 kcal", category: "nutrition", created_at: created,
      description: "Plan de comidas para déficit moderado.",
      content_data: { meals: [
        { name: "Desayuno", time: "08:30", items: [{ name: "Avena con yogur", qty: "60 g", kcal: 320 }] },
        { name: "Comida", time: "14:00", items: [{ name: "Pollo con arroz y verduras", qty: "1 plato", kcal: 620 }] },
      ] },
    },
  ];

  // Reservas de ejemplo en la semana actual (solo días futuros o de hoy).
  const mon = mondayOf(new Date());
  const today = ymd(new Date());
  const sample: [string, number, number, string][] = [
    ["marta", 0, 9, "Pierna"], ["paula", 0, 18, ""], ["carla", 1, 10, "Técnica de sentadilla"],
    ["marta", 2, 17, ""], ["paula", 3, 9, "Espalda"], ["carla", 4, 12, ""],
  ];
  const bookings: Booking[] = sample
    .map(([cid, d, h, notes]) => {
      const date = ymd(addDays(mon, d));
      return {
        id: `b-${cid}-${date}-${h}`, client_id: cid, booking_date: date,
        start_time: `${String(h).padStart(2, "0")}:00`, end_time: `${String(h + 1).padStart(2, "0")}:00`,
        status: "confirmed" as const, notes: notes || null, created_at: created,
      };
    })
    .filter((b) => b.booking_date >= today);

  const messages: Message[] = [
    { id: "msg-1", client_id: "lucia", sender_id: MOCK_TRAINER_ID, content: "¡Hola Lucía! Esta semana subimos cargas en pierna 💪", is_read: true, created_at: new Date(Date.now() - 3 * 3600_000).toISOString() },
    { id: "msg-2", client_id: "lucia", sender_id: "lucia", content: "¡Genial! Me apetece muchísimo", is_read: true, created_at: new Date(Date.now() - 2 * 3600_000).toISOString() },
    { id: "msg-3", client_id: "sofia", sender_id: "sofia", content: "Perdona, esta semana no he podido registrar nada 😅", is_read: false, created_at: new Date(Date.now() - 3600_000).toISOString() },
  ];
  return { profiles, folders, templates, plans: [], bookings, messages };
}

let cache: DB | null = null;
const bookingListeners = new Set<(e: RowEvent<Booking>) => void>();
const messageListeners = new Set<(e: RowEvent<Message>) => void>();
const changeListeners = new Set<() => void>();

function load(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (cache = JSON.parse(raw) as DB);
  } catch {}
  return (cache = seed());
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  changeListeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  // Otra pestaña modificó los datos → recarga y avisa (tiempo real simulado).
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    const prev = cache;
    cache = JSON.parse(e.newValue) as DB;
    const seenB = new Set(prev?.bookings.map((b) => `${b.id}:${b.status}`));
    cache.bookings.filter((b) => !seenB.has(`${b.id}:${b.status}`)).forEach((row) => bookingListeners.forEach((l) => l({ type: "UPDATE", row })));
    const seenM = new Set(prev?.messages.map((m) => `${m.id}:${m.is_read}`));
    cache.messages.filter((m) => !seenM.has(`${m.id}:${m.is_read}`)).forEach((row) => messageListeners.forEach((l) => l({ type: "UPDATE", row })));
    changeListeners.forEach((l) => l());
  });
}

export function subscribeMock(cb: () => void): Unsub {
  changeListeners.add(cb);
  return () => changeListeners.delete(cb);
}
export const getMockProfile = (id: string) => load().profiles.find((p) => p.id === id) ?? null;
export const resetMock = () => {
  cache = seed();
  save();
};

const sleep = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const emitMsg = (type: RowEvent<Message>["type"], row: Message) => messageListeners.forEach((l) => l({ type, row }));
const emitBooking = (type: RowEvent<Booking>["type"], row: Booking) => bookingListeners.forEach((l) => l({ type, row }));

export const mockRepo: Repo = {
  mode: "demo",

  async listClients() {
    await sleep();
    return load().profiles.filter((p) => p.role === "client");
  },
  async setInPerson(clientId, value) {
    const p = load().profiles.find((x) => x.id === clientId);
    if (p) p.is_in_person = value;
    save();
  },

  async listFolders() {
    await sleep();
    return [...load().folders];
  },
  async createFolder(name, color) {
    const f: Folder = { id: uid(), name: name.trim(), color: color ?? null, created_at: now() };
    load().folders.push(f);
    save();
    return f;
  },
  async renameFolder(id, name) {
    const f = load().folders.find((x) => x.id === id);
    if (f) f.name = name.trim();
    save();
  },
  async listTemplates(folderId) {
    await sleep();
    return load().templates.filter((t) => t.folder_id === folderId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async createTemplate(input) {
    const t: Template = { ...input, id: uid(), created_at: now() };
    load().templates.push(t);
    save();
    return t;
  },
  async deleteTemplate(id) {
    const db = load();
    db.templates = db.templates.filter((t) => t.id !== id);
    save();
  },
  async assignTemplate(t, clientId) {
    load().plans.push({
      id: uid(), client_id: clientId, title: t.title, category: t.category,
      content_data: structuredClone(t.content_data), created_at: now(),
    });
    save();
  },

  async getSlotCapacity() {
    return CAPACITY;
  },
  async listBookedSlots(from, to) {
    await sleep();
    const map = new Map<string, BookedSlot>();
    for (const b of load().bookings) {
      if (b.status !== "confirmed" || b.booking_date < from || b.booking_date > to) continue;
      const k = `${b.booking_date}|${b.start_time}`;
      const cur = map.get(k);
      if (cur) cur.taken += 1;
      else map.set(k, { booking_date: b.booking_date, start_time: b.start_time, taken: 1 });
    }
    return [...map.values()];
  },
  async listMyBookings(clientId) {
    await sleep();
    const today = ymd(new Date());
    return load()
      .bookings.filter((b) => b.client_id === clientId && b.status === "confirmed" && b.booking_date >= today)
      .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));
  },
  async listBookings(from, to) {
    await sleep();
    const db = load();
    return db.bookings
      .filter((b) => b.status === "confirmed" && b.booking_date >= from && b.booking_date <= to)
      .map<BookingWithClient>((b) => {
        const p = db.profiles.find((x) => x.id === b.client_id);
        return { ...b, client: p ? { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url } : null };
      })
      .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));
  },
  async createBooking({ clientId, date, start, end, notes }) {
    const db = load();
    const dow = new Date(`${date}T12:00:00`).getDay();
    if (dow === 0 || dow === 6) throw new Error("Solo se reserva de lunes a viernes");
    if (date < ymd(new Date())) throw new Error("No se puede reservar en una fecha pasada");
    const used = db.bookings.filter((b) => b.status === "confirmed" && b.booking_date === date && b.start_time === start).length;
    if (used >= CAPACITY) throw new Error("Esa franja acaba de ocuparse. Elige otra.");
    const b: Booking = {
      id: uid(), client_id: clientId, booking_date: date, start_time: start, end_time: end,
      status: "confirmed", notes: notes?.trim() || null, created_at: now(),
    };
    db.bookings.push(b);
    save();
    emitBooking("INSERT", b);
    return b;
  },
  async cancelBooking(id) {
    const b = load().bookings.find((x) => x.id === id);
    if (!b) return;
    b.status = "cancelled";
    save();
    emitBooking("UPDATE", b);
  },
  subscribeBookings(cb) {
    bookingListeners.add(cb);
    return () => bookingListeners.delete(cb);
  },

  async listMessages(clientId) {
    await sleep();
    return load().messages.filter((m) => m.client_id === clientId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
  async listThreads() {
    await sleep();
    const db = load();
    return db.profiles
      .filter((p) => p.role === "client")
      .map<Thread>((client) => {
        const mine = db.messages.filter((m) => m.client_id === client.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
        return { client, last: mine[0] ?? null, unread: mine.filter((m) => !m.is_read && m.sender_id === client.id).length };
      })
      .sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
  },
  async sendMessage({ clientId, senderId, content }) {
    const m: Message = { id: uid(), client_id: clientId, sender_id: senderId, content: content.trim(), is_read: false, created_at: now() };
    load().messages.push(m);
    save();
    emitMsg("INSERT", m);

    // Demo: si escribe el cliente, "Elena" lo lee y responde.
    if (senderId === clientId) {
      setTimeout(() => {
        m.is_read = true;
        save();
        emitMsg("UPDATE", m);
      }, 1200);
      setTimeout(() => {
        const reply: Message = {
          id: uid(), client_id: clientId, sender_id: MOCK_TRAINER_ID, is_read: false, created_at: now(),
          content: "¡Recibido! Te respondo en cuanto termine la sesión 💛 (respuesta automática de la demo)",
        };
        load().messages.push(reply);
        save();
        emitMsg("INSERT", reply);
      }, 2600);
    }
    return m;
  },
  async markRead(clientId, readerId) {
    const changed = load().messages.filter((m) => m.client_id === clientId && !m.is_read && m.sender_id !== readerId);
    if (!changed.length) return;
    changed.forEach((m) => (m.is_read = true));
    save();
    changed.forEach((m) => emitMsg("UPDATE", m));
  },
  subscribeMessages(clientId, cb) {
    const l = (e: RowEvent<Message>) => {
      if (!clientId || e.row.client_id === clientId) cb(e);
    };
    messageListeners.add(l);
    return () => messageListeners.delete(l);
  },
};
