-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Characters
create table characters (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  tool text,
  image_url text,
  hp integer not null default 100,
  attack integer not null default 10,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: Maps
create table maps (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  background_template text not null, -- 'FOREST', 'CITY', 'SPACE', etc.
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Table: Map Characters (Placement)
create table map_characters (
  id uuid primary key default uuid_generate_v4(),
  map_id uuid references maps(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  position_x numeric not null,
  position_y numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Storage Bucket: images
insert into storage.buckets (id, name, public)
values ('images', 'images', true);

-- Storage Policy: Allow Public Read
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- Storage Policy: Allow Authenticated (or Anon) Uploads
-- Note: allowing anon uploads for the sake of this demo app
create policy "Allow Uploads"
on storage.objects for insert
with check ( bucket_id = 'images' );
