-- M — Personal Assistant App
-- Initial schema. Run this in the Supabase SQL editor (or `supabase db push`)
-- against a fresh project.

create extension if not exists pgcrypto;

create table goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_date date,
  status text check (status in ('active','on_track','slipping','done','abandoned')) default 'active',
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id),
  title text not null,
  due_date date,
  done boolean default false,
  created_at timestamptz default now()
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id),
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  notes text
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  type text,
  duration_minutes int,
  intensity int check (intensity between 1 and 5),
  notes text
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')),
  description text,
  created_at timestamptz default now()
);

create table sleep_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  hours numeric(3,1),
  quality int check (quality between 1 and 5),
  notes text
);

create table screen_time_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  total_minutes int,
  top_app text
);

create table rituals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  frequency text check (frequency in ('daily','weekly','monthly')) not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table ritual_logs (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid references rituals(id),
  period_start date not null,
  due_date date not null,
  done boolean default false,
  completed_at timestamptz
);

create table book_excerpts (
  id uuid primary key default gen_random_uuid(),
  book_title text,
  excerpt text,
  date_added timestamptz default now()
);

create table quotes_history (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  quote text
);

create table check_ins (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date unique,
  sleep_logged boolean default false,
  meal_logged boolean default false,
  workout_logged boolean default false
);

create table hiit_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  interval_work_sec int default 20,
  interval_rest_sec int default 20,
  rounds int,
  notes text
);

create table news_digests (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  world_news text,
  us_news text,
  us_politics text,
  stock_market text,
  created_at timestamptz default now()
);

create table language_settings (
  id uuid primary key default gen_random_uuid(),
  active_language text not null default 'Farsi',
  updated_at timestamptz default now()
);

create table daily_phrases (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  language text not null,
  phrase_native text not null,       -- phrase in target language (native script)
  phrase_transliteration text,        -- romanized pronunciation guide
  phrase_english text not null,       -- English meaning
  usage_note text,                    -- when/how it's used
  created_at timestamptz default now()
);

-- Additions beyond the base spec, needed for chat context + persistence:

-- Single upserted row holding a rolling summary of recent activity, refreshed
-- nightly by the quote-generation cron job and injected into the chat system
-- prompt so Haiku has cheap context without re-querying everything per turn.
create table rolling_summary (
  id uuid primary key default gen_random_uuid(),
  summary text not null,
  updated_at timestamptz default now()
);

-- Persisted chat transcript (the spec describes a chat interface with tool
-- use and progress recall, but defines no storage table for it).
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  role text check (role in ('user','assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Seed the single active-language row (spec: "Start with Farsi").
insert into language_settings (active_language) values ('Farsi');

-- Row Level Security: this app is sideloaded for a single user and never
-- distributed. RLS is enabled with a single permissive policy per table so
-- the iOS app can use the anon key directly for plain CRUD (goals, tasks,
-- calendar, rituals, reading, screen time, hiit, sleep/meal/workout lists),
-- while the Anthropic key and all AI-mediated writes stay server-side in the
-- Worker using the service role key. If this app is ever shared or the
-- Supabase project reused for anything else, tighten these policies first.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'goals','tasks','calendar_events','workouts','meals','sleep_logs',
      'screen_time_logs','rituals','ritual_logs','book_excerpts',
      'quotes_history','check_ins','hiit_sessions','news_digests',
      'language_settings','daily_phrases','rolling_summary','chat_messages'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'create policy %I on %I for all to anon using (true) with check (true);',
      t || '_anon_all', t
    );
  end loop;
end $$;
