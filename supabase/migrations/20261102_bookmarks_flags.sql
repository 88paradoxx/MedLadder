-- ============================================================================
-- MedLadder bookmarks + question flags — run this WHOLE file in the
-- Supabase SQL editor (after 20261014_mock_admin.sql, which defines
-- public.mock_is_admin()). Idempotent.
--
-- What it adds:
--   user_bookmarks  — one row per (user, bank question). Users manage only
--                     their own rows via RLS; the app reads/writes them
--                     directly over REST.
--   question_flags  — a user report that a bank question has an error.
--                     Users insert only (RLS); all reads and admin actions
--                     go through the role-gated RPCs below, same pattern as
--                     the mock-test admin RPCs.
--
--   admin_list_flags(...)           — flagged questions + current location
--   admin_resolve_flag(...)         — optionally move the question to a new
--                                     subject/topic, then mark resolved
--   admin_dismiss_flag(...)         — mark dismissed (not an error)
--   admin_update_bank_question(...) — fix a bank question's content
--
-- A user can have only one OPEN flag per question (partial unique index);
-- once it is resolved or dismissed they may flag it again if needed.
-- ============================================================================

-- ── bookmarks ───────────────────────────────────────────────────────────────
create table if not exists public.user_bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  question_id bigint not null references public.questions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.user_bookmarks enable row level security;

drop policy if exists "Users read own bookmarks" on public.user_bookmarks;
create policy "Users read own bookmarks" on public.user_bookmarks
  for select using (auth.uid() = user_id);

drop policy if exists "Users add own bookmarks" on public.user_bookmarks;
create policy "Users add own bookmarks" on public.user_bookmarks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users remove own bookmarks" on public.user_bookmarks;
create policy "Users remove own bookmarks" on public.user_bookmarks
  for delete using (auth.uid() = user_id);

create index if not exists user_bookmarks_user_idx
  on public.user_bookmarks(user_id, created_at desc);

-- ── flags ───────────────────────────────────────────────────────────────────
create table if not exists public.question_flags (
  id                 uuid primary key default gen_random_uuid(),
  question_id        bigint not null references public.questions(id) on delete cascade,
  user_id            uuid not null,
  reason             text not null
                     check (reason in ('wrong_key', 'wrong_explanation',
                                       'wrong_location', 'unclear', 'other')),
  detail             text not null default '',
  status             text not null default 'open'
                     check (status in ('open', 'resolved', 'dismissed')),
  admin_note         text not null default '',
  resolved_module_id bigint references public.modules(id) on delete set null,
  created_at         timestamptz not null default now(),
  resolved_at        timestamptz
);

alter table public.question_flags enable row level security;

-- Users may insert their own flags only, and read back only their own
-- reports (the select policy also lets the insert call return its row).
-- Admins go through the RPCs below, which bypass RLS as SECURITY DEFINER.
drop policy if exists "Users report flags" on public.question_flags;
create policy "Users report flags" on public.question_flags
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users read own flags" on public.question_flags;
create policy "Users read own flags" on public.question_flags
  for select using (auth.uid() = user_id);

create index if not exists question_flags_question_idx
  on public.question_flags(question_id, created_at desc);
create index if not exists question_flags_status_idx
  on public.question_flags(status, created_at desc);
create unique index if not exists question_flags_one_open_per_user
  on public.question_flags(user_id, question_id) where status = 'open';

-- ── admin: list flags ──────────────────────────────────────────────────────
create or replace function public.admin_list_flags(p_status text default 'open')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_status not in ('open', 'resolved', 'dismissed') then
    raise exception 'BAD_STATUS';
  end if;
  return (
    select coalesce(jsonb_agg(row_to_json(r) order by r.created_at desc), '[]'::jsonb)
    from (
      select f.id, f.question_id, f.user_id, f.reason, f.detail, f.status,
             f.admin_note, f.created_at, f.resolved_at,
             q.question_num, q.question_text,
             q.option_a, q.option_b, q.option_c, q.option_d, q.option_e,
             q.answer, q.explanation,
             sc.name as current_subject, mc.name as current_topic,
             sr.name as resolved_subject, mr.name as resolved_topic,
             (select count(*) from public.question_flags f2
              where f2.question_id = f.question_id
                and f2.status = 'open')::int as open_flag_count
      from public.question_flags f
      join public.questions q on q.id = f.question_id
      left join public.modules mc on mc.id = q.module_id
      left join public.subjects sc on sc.id = mc.subject_id
      left join public.modules mr on mr.id = f.resolved_module_id
      left join public.subjects sr on sr.id = mr.subject_id
      where f.status = p_status
    ) r
  );
end;
$$;
revoke all on function public.admin_list_flags(text) from anon;
grant execute on function public.admin_list_flags(text) to authenticated;

-- ── admin: resolve a flag (optionally moving the question) ────────────────
create or replace function public.admin_resolve_flag(
  p_flag_id uuid, p_module_id bigint default null, p_admin_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag public.question_flags%rowtype;
  v_mod_name text;
  v_subj_name text;
  v_note text;
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  select * into v_flag from public.question_flags where id = p_flag_id;
  if not found then raise exception 'FLAG_NOT_FOUND'; end if;
  if v_flag.status <> 'open' then raise exception 'FLAG_CLOSED'; end if;

  v_note := coalesce(nullif(trim(p_admin_note), ''), '');
  if p_module_id is not null then
    select m.name, s.name into v_mod_name, v_subj_name
    from public.modules m
    left join public.subjects s on s.id = m.subject_id
    where m.id = p_module_id;
    if not found then raise exception 'BAD_MODULE'; end if;
    update public.questions set module_id = p_module_id
    where id = v_flag.question_id;
    v_note := 'Moved to ' || coalesce(v_subj_name, '?') || ' / ' || v_mod_name
      || case when v_note <> '' then ' — ' || v_note else '' end;
  end if;

  update public.question_flags
  set status = 'resolved',
      resolved_at = now(),
      resolved_module_id = p_module_id,
      admin_note = v_note
  where id = p_flag_id;

  return jsonb_build_object(
    'flag_id', p_flag_id,
    'question_id', v_flag.question_id,
    'moved', (p_module_id is not null)
  );
end;
$$;
revoke all on function public.admin_resolve_flag(uuid, bigint, text) from anon;
grant execute on function public.admin_resolve_flag(uuid, bigint, text) to authenticated;

-- ── admin: dismiss a flag ──────────────────────────────────────────────────
create or replace function public.admin_dismiss_flag(
  p_flag_id uuid, p_admin_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flag public.question_flags%rowtype;
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  select * into v_flag from public.question_flags where id = p_flag_id;
  if not found then raise exception 'FLAG_NOT_FOUND'; end if;
  if v_flag.status <> 'open' then raise exception 'FLAG_CLOSED'; end if;

  update public.question_flags
  set status = 'dismissed',
      resolved_at = now(),
      admin_note = coalesce(nullif(trim(p_admin_note), ''), '')
  where id = p_flag_id;

  return jsonb_build_object('flag_id', p_flag_id, 'question_id', v_flag.question_id);
end;
$$;
revoke all on function public.admin_dismiss_flag(uuid, text) from anon;
grant execute on function public.admin_dismiss_flag(uuid, text) to authenticated;

-- ── admin: fix a bank question's content ───────────────────────────────────
create or replace function public.admin_update_bank_question(
  p_question_id bigint, p_question_text text,
  p_option_a text, p_option_b text, p_option_c text, p_option_d text,
  p_option_e text, p_answer text, p_explanation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q public.questions%rowtype;
  v_answer text;
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  select * into v_q from public.questions where id = p_question_id;
  if not found then raise exception 'QUESTION_NOT_FOUND'; end if;
  if coalesce(nullif(trim(p_question_text), ''), '') = '' then
    raise exception 'BAD_QUESTION';
  end if;
  if coalesce(nullif(trim(p_option_a), ''), '') = '' or
     coalesce(nullif(trim(p_option_b), ''), '') = '' or
     coalesce(nullif(trim(p_option_c), ''), '') = '' or
     coalesce(nullif(trim(p_option_d), ''), '') = '' then
    raise exception 'BAD_OPTION';
  end if;
  if coalesce(nullif(trim(p_explanation), ''), '') = '' then
    raise exception 'BAD_EXPLANATION';
  end if;
  v_answer := upper(trim(p_answer));
  if v_answer not in ('A', 'B', 'C', 'D', 'E') then
    raise exception 'BAD_ANSWER';
  end if;

  update public.questions
  set question_text = trim(p_question_text),
      option_a = trim(p_option_a), option_b = trim(p_option_b),
      option_c = trim(p_option_c), option_d = trim(p_option_d),
      option_e = nullif(trim(coalesce(p_option_e, '')), ''),
      answer = v_answer,
      explanation = trim(p_explanation)
  where id = p_question_id;

  return jsonb_build_object('question_id', p_question_id,
                            'question_num', v_q.question_num);
end;
$$;
revoke all on function public.admin_update_bank_question(bigint, text, text, text, text, text, text, text, text) from anon;
grant execute on function public.admin_update_bank_question(bigint, text, text, text, text, text, text, text, text) to authenticated;
