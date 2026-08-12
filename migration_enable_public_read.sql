-- Enable public read access for services
alter table "services" enable row level security;
create policy "Public read access for services" on "services" for select to public using (true);

-- Enable public read access for carousel_items
alter table "carousel_items" enable row level security;
create policy "Public read access for carousel_items" on "carousel_items" for select to public using (true);

-- Enable public read access for system_settings
alter table "system_settings" enable row level security;
create policy "Public read access for system_settings" on "system_settings" for select to public using (true);

-- Enable public read access for professionals
alter table "professionals" enable row level security;
create policy "Public read access for professionals" on "professionals" for select to public using (true);
