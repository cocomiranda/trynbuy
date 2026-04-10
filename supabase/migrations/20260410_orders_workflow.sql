-- Try 'n Buy: order lifecycle schema
-- Run this in the Supabase SQL editor before wiring the app to the new workflow.

create extension if not exists pgcrypto;

create type public.order_mode as enum (
  'trial',
  'buy_now',
  'trial_upgrade'
);

create type public.order_status as enum (
  'checkout_pending',
  'trial_active',
  'trial_return_requested',
  'trial_pending_inspection',
  'trial_return_completed',
  'trial_converted_to_purchase',
  'purchase_paid',
  'purchase_to_be_delivered',
  'purchase_delivered',
  'purchase_cancelled'
);

create type public.delivery_status as enum (
  'not_applicable',
  'pending',
  'preparing',
  'shipped',
  'delivered',
  'returned'
);

create type public.inspection_status as enum (
  'not_required',
  'not_started',
  'pending',
  'passed',
  'failed',
  'partial_charge'
);

create type public.photo_stage as enum (
  'before',
  'return'
);

create type public.order_event_type as enum (
  'order_created',
  'checkout_started',
  'checkout_completed',
  'trial_activated',
  'trial_photo_uploaded',
  'trial_photo_deleted',
  'return_requested',
  'inspection_started',
  'inspection_passed',
  'inspection_failed',
  'trial_upgraded',
  'purchase_paid',
  'delivery_updated'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shoe_slug text not null,
  shoe_name text not null,
  size text not null,
  mode public.order_mode not null,
  status public.order_status not null default 'checkout_pending',
  delivery_status public.delivery_status not null default 'not_applicable',
  inspection_status public.inspection_status not null default 'not_required',
  trial_days integer,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trial_fee_paid numeric(10,2) not null default 0,
  buy_price numeric(10,2) not null default 0,
  remaining_buy_amount numeric(10,2) not null default 0,
  guarantee_hold_amount numeric(10,2) not null default 0,
  return_requested_at timestamptz,
  delivered_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint orders_trial_days_check
    check (trial_days is null or trial_days in (3, 5))
);

create table if not exists public.order_photos (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stage public.photo_stage not null,
  storage_bucket text not null default 'trial-photos',
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.order_event_type not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_stripe_checkout_session_id_idx
  on public.orders(stripe_checkout_session_id);
create index if not exists orders_trial_ends_at_idx on public.orders(trial_ends_at);

create index if not exists order_photos_order_id_idx on public.order_photos(order_id);
create index if not exists order_photos_user_id_idx on public.order_photos(user_id);
create index if not exists order_photos_stage_idx on public.order_photos(stage);

create index if not exists order_events_order_id_idx on public.order_events(order_id);
create index if not exists order_events_user_id_idx on public.order_events(user_id);
create index if not exists order_events_type_idx on public.order_events(type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case
          when excluded.full_name = '' then public.profiles.full_name
          else excluded.full_name
        end,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_photos enable row level security;
alter table public.order_events enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
on public.orders
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own orders" on public.orders;
create policy "Users can insert their own orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own orders" on public.orders;
create policy "Users can update their own orders"
on public.orders
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own order photos" on public.order_photos;
create policy "Users can view their own order photos"
on public.order_photos
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own order photos" on public.order_photos;
create policy "Users can insert their own order photos"
on public.order_photos
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own order photos" on public.order_photos;
create policy "Users can update their own order photos"
on public.order_photos
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own order photos" on public.order_photos;
create policy "Users can delete their own order photos"
on public.order_photos
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own order events" on public.order_events;
create policy "Users can view their own order events"
on public.order_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own order events" on public.order_events;
create policy "Users can insert their own order events"
on public.order_events
for insert
to authenticated
with check (auth.uid() = user_id);
