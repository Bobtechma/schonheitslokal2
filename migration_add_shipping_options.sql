-- Create shipping_options table
create table if not exists public.shipping_options (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.shipping_options enable row level security;

-- Create policies
create policy "Public read access"
  on public.shipping_options for select
  using (true);

create policy "Admin full access"
  on public.shipping_options for all
  using (auth.role() = 'authenticated');
