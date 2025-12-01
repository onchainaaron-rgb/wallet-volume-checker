-- COMPLETE DATABASE SETUP SCRIPT
-- Run this in the Supabase SQL Editor to fix/reset your database configuration.

-- 1. Create the 'scans' table if it doesn't exist
create table if not exists "public"."scans" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null references auth.users(id),
    "wallet_address" text not null,
    "chains" jsonb not null, -- Stores the list of chains scanned
    "total_volume" numeric not null,
    primary key ("id")
);

-- 2. Enable Row Level Security (RLS)
-- This is crucial for security. Without this, policies won't work.
alter table "public"."scans" enable row level security;

-- 3. Clean up existing policies
-- We drop them first to ensure we don't get "policy already exists" errors.
drop policy if exists "Enable read access for all users" on "public"."scans";
drop policy if exists "Enable insert for authenticated users only" on "public"."scans";
drop policy if exists "Enable read access for all users" on "public"."scans"; -- Duplicate check
drop policy if exists "Enable insert for authenticated users only" on "public"."scans"; -- Duplicate check

-- 4. Create Policy: PUBLIC READ ACCESS
-- This allows the Global Leaderboard to work for everyone.
create policy "Enable read access for all users"
on "public"."scans"
as PERMISSIVE
for SELECT
to public
using (true);

-- 5. Create Policy: AUTHENTICATED INSERT ACCESS
-- This allows logged-in users to save their scans.
create policy "Enable insert for authenticated users only"
on "public"."scans"
as PERMISSIVE
for INSERT
to authenticated
with check (auth.uid() = user_id);

-- Done!
