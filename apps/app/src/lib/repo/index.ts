import { isSupabaseConfigured } from "../env";
import { mockRepo } from "./mock";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./types";

/** Con NEXT_PUBLIC_SUPABASE_URL/ANON_KEY → Supabase real. Sin ellas → demo local. */
export const repo: Repo = isSupabaseConfigured ? supabaseRepo : mockRepo;
export type { Repo, RowEvent, Unsub } from "./types";
