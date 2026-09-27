-- Doubt Board v1 schema. Paste into the Supabase SQL editor and run. Safe to re-run.

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 280),
  votes int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.questions enable row level security;

-- Browsers may only read and insert. Hiding happens server-side with the secret key.
revoke update, delete, truncate on public.questions from anon, authenticated;
grant select, insert on public.questions to anon, authenticated;

drop policy if exists "read visible questions" on public.questions;
create policy "read visible questions"
  on public.questions for select
  to anon, authenticated
  using (hidden = false);

drop policy if exists "post new questions" on public.questions;
create policy "post new questions"
  on public.questions for insert
  to anon, authenticated
  with check (votes = 0 and hidden = false);

-- Atomic increment so concurrent votes don't overwrite each other.
create or replace function public.upvote(question_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update questions set votes = votes + 1
  where id = question_id and hidden = false;
$$;

revoke execute on function public.upvote(uuid) from public;
grant execute on function public.upvote(uuid) to anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'questions'
  ) then
    alter publication supabase_realtime add table public.questions;
  end if;
end $$;
