-- Run this in the Supabase SQL Editor

create table if not exists scans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  wallet_address text not null,
  chains jsonb not null,
  total_volume numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table scans enable row level security;

create policy "Users can insert their own scans"
  on scans for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own scans"
  on scans for select
  using (auth.uid() = user_id);
