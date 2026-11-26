-- ElenitaFit · esquema completo (Supabase) · tablas + RLS + Realtime
-- Ejecutar UNA vez en el SQL Editor de un proyecto Supabase vacío.
-- Datos de salud = categoría especial RGPD: RLS activada en TODAS las tablas.
--
-- Cómo convertir a Elena en entrenadora (tras registrarse ella):
--   update public.profiles set role = 'trainer' where email = 'elena@tu-dominio.com';
-- Nadie puede auto-asignarse el rol 'trainer': el trigger de registro siempre crea 'client'
-- y un trigger de guarda impide que un cliente cambie su propio role / is_in_person.

create extension if not exists pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════
-- 1. TABLAS
-- ═══════════════════════════════════════════════════════════════════════

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  email         text,
  role          text not null default 'client' check (role in ('trainer', 'client')),
  -- true = cliente de entrenamiento presencial → puede reservar franjas
  is_in_person  boolean not null default false,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

create table public.template_folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  color       text,
  created_at  timestamptz not null default now()
);

create table public.templates (
  id            uuid primary key default gen_random_uuid(),
  folder_id     uuid not null references public.template_folders (id) on delete cascade,
  title         text not null,
  category      text not null check (category in ('workout', 'nutrition')),
  description   text not null default '',
  -- workout:   { "exercises": [{ "name", "sets", "reps", "rest_seconds", "video_url" }] }
  -- nutrition: { "meals": [{ "name", "time", "items": [{ "name", "qty", "kcal" }] }] }
  content_data  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create table public.assigned_plans (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles (id) on delete cascade,
  category      text not null check (category in ('workout', 'nutrition')),
  title         text not null,
  description   text not null default '',
  content_data  jsonb not null default '{}'::jsonb,   -- copia editable de la plantilla
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.progress_logs (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles (id) on delete cascade,
  weight_kg     numeric(5, 1) check (weight_kg > 0),
  body_fat_pct  numeric(4, 1) check (body_fat_pct between 0 and 100),
  measurements  jsonb not null default '{}'::jsonb,
  notes         text not null default '',
  logged_at     date not null default current_date
);

create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.profiles (id) on delete cascade,
  booking_date  date not null,
  start_time    time not null,
  end_time      time not null,
  status        text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  notes         text,
  created_at    timestamptz not null default now(),
  constraint bookings_weekday   check (extract(isodow from booking_date) between 1 and 5),   -- lun-vie
  constraint bookings_hours     check (start_time >= time '08:00' and end_time <= time '20:00'),
  constraint bookings_order     check (end_time > start_time)
);

create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles (id) on delete cascade,   -- hilo = cliente
  sender_id   uuid not null references public.profiles (id),
  content     text not null check (length(trim(content)) between 1 and 4000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  endpoint      text not null unique,
  subscription  jsonb not null,
  device_type   text,
  created_at    timestamptz not null default now()
);

-- Ajustes configurables. slot_capacity = nº máx. de reservas confirmadas por franja.
create table public.app_settings (
  key    text primary key,
  value  jsonb not null
);
insert into public.app_settings (key, value) values ('slot_capacity', '1'::jsonb);

-- Carpetas iniciales
insert into public.template_folders (name, color) values
  ('Entrenamiento', '#FAA307'),
  ('Nutrición',     '#4ADE80');

-- Índices
create index templates_folder_idx        on public.templates (folder_id);
create index assigned_plans_client_idx   on public.assigned_plans (client_id, is_active);
create index progress_logs_client_idx    on public.progress_logs (client_id, logged_at desc);
create index bookings_date_idx           on public.bookings (booking_date, start_time) where status = 'confirmed';
create index bookings_client_idx         on public.bookings (client_id, booking_date);
create index messages_thread_idx         on public.messages (client_id, created_at);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. FUNCIONES AUXILIARES (security definer: evitan recursión de RLS)
-- ═══════════════════════════════════════════════════════════════════════

create or replace function public.is_trainer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer');
$$;

create or replace function public.is_in_person_client() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'client' and is_in_person
  );
$$;

-- Alta automática de perfil. El rol SIEMPRE es 'client' (Elena se promociona a mano).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Franjas ocupadas SIN datos privados (sólo fecha y hora) para clientes presenciales.
create or replace function public.get_booked_slots(p_from date, p_to date)
returns table (booking_date date, start_time time, end_time time, taken bigint)
language sql stable security definer set search_path = '' as $$
  select b.booking_date, b.start_time, b.end_time, count(*) as taken
  from public.bookings b
  where b.status = 'confirmed'
    and b.booking_date between p_from and p_to
    and (public.is_trainer() or public.is_in_person_client())
  group by b.booking_date, b.start_time, b.end_time;
$$;

-- Upsert de suscripción push (endpoint único: un dispositivo compartido pasa al último usuario).
create or replace function public.upsert_push_subscription(p_endpoint text, p_subscription jsonb, p_device_type text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.push_subscriptions (user_id, endpoint, subscription, device_type)
  values (auth.uid(), p_endpoint, p_subscription, p_device_type)
  on conflict (endpoint) do update
    set user_id = excluded.user_id, subscription = excluded.subscription, device_type = excluded.device_type;
end;
$$;

revoke execute on function public.get_booked_slots(date, date)            from public, anon;
revoke execute on function public.upsert_push_subscription(text, jsonb, text) from public, anon;
grant  execute on function public.get_booked_slots(date, date)            to authenticated;
grant  execute on function public.upsert_push_subscription(text, jsonb, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. TRIGGERS DE GUARDA (integridad que RLS por sí sola no cubre)
-- ═══════════════════════════════════════════════════════════════════════

-- Un cliente no puede cambiarse role / is_in_person / email / id.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_trainer() then
    if new.role is distinct from old.role
       or new.is_in_person is distinct from old.is_in_person
       or new.id is distinct from old.id
       or new.email is distinct from old.email then
      raise exception 'Solo la entrenadora puede cambiar rol, acceso presencial o email';
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Un cliente solo puede pasar su reserva de 'confirmed' a 'cancelled'.
create or replace function public.guard_booking_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_trainer() then
    if new.client_id is distinct from old.client_id
       or new.booking_date is distinct from old.booking_date
       or new.start_time is distinct from old.start_time
       or new.end_time is distinct from old.end_time
       or new.notes is distinct from old.notes
       or new.status <> 'cancelled' then
      raise exception 'Solo puedes cancelar tu reserva';
    end if;
  end if;
  return new;
end;
$$;
create trigger bookings_guard before update on public.bookings
  for each row execute function public.guard_booking_update();

-- Aforo por franja (configurable en app_settings.slot_capacity) + sin reservar en el pasado.
-- El advisory lock serializa reservas simultáneas de la misma franja (evita carreras).
create or replace function public.enforce_booking_capacity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  cap int;
  used int;
begin
  if new.status <> 'confirmed' then return new; end if;
  if tg_op = 'INSERT' and new.booking_date < current_date and not public.is_trainer() then
    raise exception 'No se puede reservar en una fecha pasada';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.booking_date::text || new.start_time::text, 0));
  select coalesce((value #>> '{}')::int, 1) into cap from public.app_settings where key = 'slot_capacity';
  select count(*) into used from public.bookings
    where status = 'confirmed' and booking_date = new.booking_date and start_time = new.start_time
      and id <> new.id;
  if used >= coalesce(cap, 1) then
    raise exception 'Esa franja ya está ocupada' using errcode = '23505';
  end if;
  return new;
end;
$$;
create trigger bookings_capacity before insert or update on public.bookings
  for each row execute function public.enforce_booking_capacity();

-- Un cliente solo puede marcar como leído (y solo mensajes que NO envió él).
create or replace function public.guard_message_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_trainer() then
    if new.content is distinct from old.content
       or new.client_id is distinct from old.client_id
       or new.sender_id is distinct from old.sender_id
       or new.created_at is distinct from old.created_at
       or old.sender_id = auth.uid() then
      raise exception 'Solo puedes marcar como leídos los mensajes recibidos';
    end if;
  end if;
  return new;
end;
$$;
create trigger messages_guard before update on public.messages
  for each row execute function public.guard_message_update();

-- ═══════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════

alter table public.profiles           enable row level security;
alter table public.template_folders   enable row level security;
alter table public.templates          enable row level security;
alter table public.assigned_plans     enable row level security;
alter table public.progress_logs      enable row level security;
alter table public.bookings           enable row level security;
alter table public.messages           enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.app_settings       enable row level security;

-- Entrenadora: control total (CRUD) sobre todo.
create policy trainer_all on public.profiles           for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.template_folders   for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.templates          for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.assigned_plans     for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.progress_logs      for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.bookings           for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.messages           for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.push_subscriptions for all to authenticated using (public.is_trainer()) with check (public.is_trainer());
create policy trainer_all on public.app_settings       for all to authenticated using (public.is_trainer()) with check (public.is_trainer());

-- profiles: cada usuario ve y edita el suyo (campos sensibles protegidos por trigger);
-- todos pueden ver el perfil de las entrenadoras (nombre/avatar en el chat).
create policy own_select      on public.profiles for select to authenticated using (id = auth.uid());
create policy own_update      on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy trainers_public on public.profiles for select to authenticated using (role = 'trainer');

-- assigned_plans: el cliente ve y edita SOLO los suyos (no crea ni borra).
create policy own_select on public.assigned_plans for select to authenticated using (client_id = auth.uid());
create policy own_update on public.assigned_plans for update to authenticated using (client_id = auth.uid()) with check (client_id = auth.uid());

-- progress_logs: el cliente gestiona los suyos.
create policy own_all on public.progress_logs for all to authenticated
  using (client_id = auth.uid()) with check (client_id = auth.uid());

-- bookings: SOLO clientes presenciales; ven y crean/cancelan las suyas.
-- Las franjas de otros se consultan con get_booked_slots() (sin datos privados).
create policy own_select on public.bookings for select to authenticated
  using (client_id = auth.uid() and public.is_in_person_client());
create policy own_insert on public.bookings for insert to authenticated
  with check (client_id = auth.uid() and public.is_in_person_client() and status = 'confirmed');
create policy own_cancel on public.bookings for update to authenticated
  using (client_id = auth.uid() and public.is_in_person_client() and status = 'confirmed')
  with check (client_id = auth.uid() and status = 'cancelled');

-- messages: el cliente solo su hilo; solo puede enviar como él mismo.
create policy own_select on public.messages for select to authenticated using (client_id = auth.uid());
create policy own_insert on public.messages for insert to authenticated
  with check (client_id = auth.uid() and sender_id = auth.uid());
create policy own_mark_read on public.messages for update to authenticated
  using (client_id = auth.uid()) with check (client_id = auth.uid());

-- push_subscriptions: solo las propias.
create policy own_all on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- app_settings: lectura para cualquier usuario autenticado (aforo visible en la UI).
create policy read_all on public.app_settings for select to authenticated using (true);

-- ═══════════════════════════════════════════════════════════════════════
-- 5. REALTIME (mensajes y reservas al instante; RLS se aplica a cada evento)
-- ═══════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.bookings;
