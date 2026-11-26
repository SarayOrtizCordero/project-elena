export type ProfileRole = "trainer" | "client";

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  role: ProfileRole;
  is_in_person: boolean;
  avatar_url: string | null;
  created_at: string;
};

export type Folder = { id: string; name: string; color: string | null; created_at: string };

export type TemplateCategory = "workout" | "nutrition";

export type ExerciseBlock = {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  /** Enlace de YouTube (no listado). Nunca se muestra como enlace al cliente. */
  video_url?: string;
};
export type FoodItem = { name: string; qty: string; kcal: number };
export type MealBlock = { name: string; time?: string; items: FoodItem[] };

export type ContentData = { exercises?: ExerciseBlock[]; meals?: MealBlock[] };

export type Template = {
  id: string;
  folder_id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  content_data: ContentData;
  created_at: string;
};
export type NewTemplate = Omit<Template, "id" | "created_at">;

export type BookingStatus = "confirmed" | "cancelled";
export type Booking = {
  id: string;
  client_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: BookingStatus;
  notes: string | null;
  created_at: string;
};
export type BookingWithClient = Booking & { client: Pick<Profile, "id" | "full_name" | "avatar_url"> | null };
export type BookedSlot = { booking_date: string; start_time: string; taken: number };

export type Message = {
  id: string;
  client_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};
export type Thread = { client: Profile; last: Message | null; unread: number };

export type Identity = {
  id: string;
  role: ProfileRole;
  fullName: string;
  isInPerson: boolean;
  avatarUrl: string | null;
};
