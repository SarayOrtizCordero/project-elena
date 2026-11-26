import type {
  BookedSlot,
  Booking,
  BookingWithClient,
  Folder,
  Message,
  NewTemplate,
  Profile,
  Template,
  Thread,
} from "../types";

export type Unsub = () => void;
export type RowEvent<T> = { type: "INSERT" | "UPDATE" | "DELETE"; row: T };

/** Contrato único de datos. Dos implementaciones: Supabase real y demo local (localStorage). */
export interface Repo {
  mode: "supabase" | "demo";

  // Usuarios
  listClients(): Promise<Profile[]>;
  setInPerson(clientId: string, value: boolean): Promise<void>;

  // Plantillas
  listFolders(): Promise<Folder[]>;
  createFolder(name: string, color?: string): Promise<Folder>;
  renameFolder(id: string, name: string): Promise<void>;
  listTemplates(folderId: string): Promise<Template[]>;
  createTemplate(input: NewTemplate): Promise<Template>;
  deleteTemplate(id: string): Promise<void>;
  /** Copia la plantilla a assigned_plans del cliente (copia editable e independiente). */
  assignTemplate(template: Template, clientId: string): Promise<void>;

  // Reservas
  getSlotCapacity(): Promise<number>;
  /** Franjas ocupadas (sin datos privados) entre dos fechas YYYY-MM-DD. */
  listBookedSlots(from: string, to: string): Promise<BookedSlot[]>;
  listMyBookings(clientId: string): Promise<Booking[]>;
  /** Vista de Elena: todas las reservas confirmadas del rango, con nombre del cliente. */
  listBookings(from: string, to: string): Promise<BookingWithClient[]>;
  createBooking(input: { clientId: string; date: string; start: string; end: string; notes?: string }): Promise<Booking>;
  cancelBooking(id: string): Promise<void>;
  subscribeBookings(cb: (e: RowEvent<Booking>) => void): Unsub;

  // Chat
  listMessages(clientId: string): Promise<Message[]>;
  listThreads(): Promise<Thread[]>;
  sendMessage(input: { clientId: string; senderId: string; content: string }): Promise<Message>;
  /** Marca como leídos los mensajes del hilo que NO envió `readerId`. */
  markRead(clientId: string, readerId: string): Promise<void>;
  /** clientId = null → todos los hilos (Elena). */
  subscribeMessages(clientId: string | null, cb: (e: RowEvent<Message>) => void): Unsub;
}
