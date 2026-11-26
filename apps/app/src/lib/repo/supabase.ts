import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabaseBrowser } from "../supabase/client";
import type { BookedSlot, Booking, BookingWithClient, Folder, Message, Profile, Template, Thread } from "../types";
import type { Repo, RowEvent } from "./types";

const t5 = (t: string) => t.slice(0, 5);
const normBooking = <T extends { start_time: string; end_time: string }>(b: T): T => ({
  ...b,
  start_time: t5(b.start_time),
  end_time: t5(b.end_time),
});
const fail = (e: { message: string } | null) => {
  if (e) throw new Error(e.message);
};

async function authedFetch(path: string, body: unknown) {
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sesión caducada");
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
  return json;
}

function channel<T extends { id: string }>(
  name: string,
  table: string,
  cb: (e: RowEvent<T>) => void,
  filter?: string,
) {
  const sb = supabaseBrowser();
  const ch = sb
    .channel(name)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
      (p: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const row = (p.eventType === "DELETE" ? p.old : p.new) as unknown as T;
        cb({ type: p.eventType as RowEvent<T>["type"], row });
      },
    )
    .subscribe();
  return () => {
    void sb.removeChannel(ch);
  };
}

let seq = 0;

export const supabaseRepo: Repo = {
  mode: "supabase",

  async listClients() {
    const { data, error } = await supabaseBrowser().from("profiles").select("*").eq("role", "client").order("full_name");
    fail(error);
    return (data ?? []) as Profile[];
  },
  async setInPerson(clientId, value) {
    const { error } = await supabaseBrowser().from("profiles").update({ is_in_person: value }).eq("id", clientId);
    fail(error);
  },

  async listFolders() {
    const { data, error } = await supabaseBrowser().from("template_folders").select("*").order("created_at");
    fail(error);
    return (data ?? []) as Folder[];
  },
  async createFolder(name, color) {
    const { data, error } = await supabaseBrowser()
      .from("template_folders")
      .insert({ name: name.trim(), color: color ?? null })
      .select()
      .single();
    fail(error);
    return data as Folder;
  },
  async renameFolder(id, name) {
    const { error } = await supabaseBrowser().from("template_folders").update({ name: name.trim() }).eq("id", id);
    fail(error);
  },
  async listTemplates(folderId) {
    const { data, error } = await supabaseBrowser()
      .from("templates")
      .select("*")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: false });
    fail(error);
    return (data ?? []) as Template[];
  },
  async createTemplate(input) {
    const { data, error } = await supabaseBrowser().from("templates").insert(input).select().single();
    fail(error);
    return data as Template;
  },
  async deleteTemplate(id) {
    const { error } = await supabaseBrowser().from("templates").delete().eq("id", id);
    fail(error);
  },
  async assignTemplate(t, clientId) {
    const { error } = await supabaseBrowser().from("assigned_plans").insert({
      client_id: clientId,
      category: t.category,
      title: t.title,
      description: t.description,
      content_data: structuredClone(t.content_data),
      is_active: true,
    });
    fail(error);
  },

  async getSlotCapacity() {
    const { data } = await supabaseBrowser().from("app_settings").select("value").eq("key", "slot_capacity").maybeSingle();
    const n = Number(data?.value);
    return Number.isFinite(n) && n > 0 ? n : 1;
  },
  async listBookedSlots(from, to) {
    const { data, error } = await supabaseBrowser().rpc("get_booked_slots", { p_from: from, p_to: to });
    fail(error);
    return ((data ?? []) as BookedSlot[]).map((s) => ({ ...s, start_time: t5(s.start_time), taken: Number(s.taken) }));
  },
  async listMyBookings(clientId) {
    const today = new Date().toLocaleDateString("sv-SE");
    const { data, error } = await supabaseBrowser()
      .from("bookings")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "confirmed")
      .gte("booking_date", today)
      .order("booking_date")
      .order("start_time");
    fail(error);
    return (data ?? []).map(normBooking) as Booking[];
  },
  async listBookings(from, to) {
    const { data, error } = await supabaseBrowser()
      .from("bookings")
      .select("*, client:profiles!bookings_client_id_fkey(id, full_name, avatar_url)")
      .eq("status", "confirmed")
      .gte("booking_date", from)
      .lte("booking_date", to)
      .order("booking_date")
      .order("start_time");
    fail(error);
    return (data ?? []).map(normBooking) as unknown as BookingWithClient[];
  },
  async createBooking({ clientId, date, start, end, notes }) {
    const { data, error } = await supabaseBrowser()
      .from("bookings")
      .insert({ client_id: clientId, booking_date: date, start_time: start, end_time: end, notes: notes?.trim() || null })
      .select()
      .single();
    if (error) throw new Error(error.code === "23505" ? "Esa franja acaba de ocuparse. Elige otra." : error.message);
    // Aviso push a Elena: best effort (la reserva ya está guardada).
    authedFetch("/api/bookings/notify", { booking_id: data.id, action: "created" }).catch(() => {});
    return normBooking(data) as Booking;
  },
  async cancelBooking(id) {
    const { error } = await supabaseBrowser().from("bookings").update({ status: "cancelled" }).eq("id", id);
    fail(error);
    authedFetch("/api/bookings/notify", { booking_id: id, action: "cancelled" }).catch(() => {});
  },
  subscribeBookings(cb) {
    return channel<Booking>(`bookings-${++seq}`, "bookings", (e) => cb({ type: e.type, row: normBooking(e.row) }));
  },

  async listMessages(clientId) {
    const { data, error } = await supabaseBrowser()
      .from("messages")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at")
      .limit(500);
    fail(error);
    return (data ?? []) as Message[];
  },
  async listThreads() {
    const sb = supabaseBrowser();
    const [clients, msgs] = await Promise.all([
      this.listClients(),
      sb.from("messages").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    fail(msgs.error);
    const all = (msgs.data ?? []) as Message[];
    return clients
      .map<Thread>((client) => {
        const mine = all.filter((m) => m.client_id === client.id);
        return {
          client,
          last: mine[0] ?? null,
          unread: mine.filter((m) => !m.is_read && m.sender_id === client.id).length,
        };
      })
      .sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
  },
  async sendMessage({ clientId, content }) {
    // Pasa por la API: guarda el mensaje (con RLS) y dispara el push.
    const { message } = await authedFetch("/api/messages/send", { client_id: clientId, content });
    return message as Message;
  },
  async markRead(clientId, readerId) {
    const { error } = await supabaseBrowser()
      .from("messages")
      .update({ is_read: true })
      .eq("client_id", clientId)
      .eq("is_read", false)
      .neq("sender_id", readerId);
    fail(error);
  },
  subscribeMessages(clientId, cb) {
    return channel<Message>(
      `messages-${clientId ?? "all"}-${++seq}`,
      "messages",
      cb,
      clientId ? `client_id=eq.${clientId}` : undefined,
    );
  },
};
