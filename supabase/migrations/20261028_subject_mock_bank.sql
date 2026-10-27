-- ============================================================================
-- MedLadder subject mocks + bank authoring + post-window practice.
-- Run this WHOLE file in the Supabase SQL editor (after
-- 20261015_mock_my_attempts.sql). Idempotent: safe to run again.
--
-- What it does
--   1. mock_test_questions gains a NULLABLE module_id (topic) column, so
--      snapshots remember which topic each question came from. Existing rows
--      stay NULL. The subject column is untouched.
--   2. start_mock_attempt: the TEST_ENDED block is REMOVED. Attempts started
--      after ends_at are allowed as unranked practice with a full-duration
--      timer (deadline = started_at + duration, NOT capped at the past
--      ends_at). In-window behavior is unchanged (deadline capped at
--      ends_at, TEST_NOT_STARTED, PRO_REQUIRED, sign-in all still enforced).
--      The response gains a `practice` flag.
--   3. submit_mock_attempt: practice attempts are accepted and graded, but
--      return rank = null (unranked). Ranked attempts are ranked ONLY
--      against other ranked attempts (started_at <= ends_at), so practice
--      scores can never move a ranked user's rank. Grading itself is
--      untouched.
--   4. get_leaderboard: ranks ONLY attempts started at or before ends_at.
--      Practice attempts never appear. The board stays visible after the
--      window as the final frozen board.
--   5. get_my_mock_attempts: same ranked-only rule for its rank column, and
--      a `practice` flag per row so the UI can label practice results.
--   6. admin_add_question gains an optional p_module_id (backward
--      compatible: old calls without it still work, module_id stays NULL).
--   7. admin_fill_from_bank now copies module_id into snapshots.
--   8. NEW admin_fill_subject_bank: random draw from chosen topics only.
--   9. NEW admin_add_bank_question: write a question straight into the
--      questions bank. Questions go live immediately — NO review queue.
--      The answer is stored UPPERCASE: the main site compares the answer
--      letter strictly against 'A'–'E'.
--
-- DO NOT run this against the live database from this PR: the user applies
-- migrations himself in the Supabase SQL editor.
-- ============================================================================

-- ── 1. snapshot topic column ────────────────────────────────────────────────
alter table public.mock_test_questions add column if not exists module_id integer;


-- ── 2. start (or resume) — post-window starts are unranked practice ─────────
create or replace function public.start_mock_attempt(p_mock_test_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_test      public.mock_tests%rowtype;
  v_attempt   public.mock_attempts%rowtype;
  v_name      text;
  v_practice  boolean;
  v_deadline  timestamptz;
begin
  if v_user_id is null then
    raise exception 'SIGNIN_REQUIRED';
  end if;

  select * into v_test from public.mock_tests where id = p_mock_test_id;
  if not found then
    raise exception 'TEST_NOT_FOUND';
  end if;
  if v_test.status <> 'published' then
    raise exception 'TEST_NOT_PUBLISHED';
  end if;
  if now() < v_test.starts_at then
    raise exception 'TEST_NOT_STARTED';
  end if;
  -- No TEST_ENDED check any more: starting after ends_at is practice.
  if not v_test.is_free and not public.mock_is_pro(v_user_id) then
    raise exception 'PRO_REQUIRED';
  end if;

  select * into v_attempt
  from public.mock_attempts
  where mock_test_id = p_mock_test_id and user_id = v_user_id;

  if found then
    -- Resume the in-progress attempt, or report the submitted one.
    -- Practice (started after the window) gets a full-duration timer;
    -- in-window attempts keep the deadline capped at the window end.
    v_practice := v_attempt.started_at > v_test.ends_at;
    v_deadline := case when v_practice
      then v_attempt.started_at + (v_test.duration_minutes || ' minutes')::interval
      else least(v_attempt.started_at + (v_test.duration_minutes || ' minutes')::interval,
                 v_test.ends_at)
    end;
    return jsonb_build_object(
      'attempt_id', v_attempt.id,
      'resumed', v_attempt.status = 'in_progress',
      'already_submitted', v_attempt.status = 'submitted',
      'started_at', v_attempt.started_at,
      'deadline_at', v_deadline,
      'practice', v_practice,
      'server_now', now()
    );
  end if;

  select coalesce(nullif(u.raw_user_meta_data->>'display_name', ''),
                  nullif(u.raw_user_meta_data->>'full_name', ''),
                  split_part(u.email, '@', 1),
                  'Anonymous')
    into v_name
  from auth.users u where u.id = v_user_id;

  insert into public.mock_attempts (mock_test_id, user_id, display_name)
  values (p_mock_test_id, v_user_id, v_name)
  returning * into v_attempt;

  v_practice := v_attempt.started_at > v_test.ends_at;
  v_deadline := case when v_practice
    then v_attempt.started_at + (v_test.duration_minutes || ' minutes')::interval
    else least(v_attempt.started_at + (v_test.duration_minutes || ' minutes')::interval,
               v_test.ends_at)
  end;
  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'resumed', false,
    'already_submitted', false,
    'started_at', v_attempt.started_at,
    'deadline_at', v_deadline,
    'practice', v_practice,
    'server_now', now()
  );
end;
$$;

revoke all on function public.start_mock_attempt(uuid) from anon;
grant execute on function public.start_mock_attempt(uuid) to authenticated;


-- ── 3. submit + server-side grading — practice accepted, but unranked ───────
create or replace function public.submit_mock_attempt(p_attempt_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := auth.uid();
  v_attempt  public.mock_attempts%rowtype;
  v_test     public.mock_tests%rowtype;
  v_q        record;
  v_given    text;
  v_correct  integer := 0;
  v_wrong    integer := 0;
  v_skipped  integer := 0;
  v_score    numeric := 0;
  v_time     integer;
  v_rank     integer;
  v_practice boolean;
begin
  if v_user_id is null then
    raise exception 'SIGNIN_REQUIRED';
  end if;

  select * into v_attempt from public.mock_attempts where id = p_attempt_id;
  if not found or v_attempt.user_id <> v_user_id then
    raise exception 'ATTEMPT_NOT_FOUND';
  end if;
  if v_attempt.status = 'submitted' then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  select * into v_test from public.mock_tests where id = v_attempt.mock_test_id;
  v_practice := v_attempt.started_at > v_test.ends_at;

  for v_q in
    select sort_order, lower(trim(answer)) as ans
    from public.mock_test_questions
    where mock_test_id = v_attempt.mock_test_id
    order by sort_order
  loop
    v_given := lower(trim(coalesce(p_answers ->> v_q.sort_order::text, '')));
    if v_given is null or v_given = '' then
      v_skipped := v_skipped + 1;
    elsif v_given = v_q.ans then
      v_correct := v_correct + 1;
      v_score := v_score + v_test.positive_marks;
    else
      v_wrong := v_wrong + 1;
      v_score := v_score - v_test.negative_marks;
    end if;
  end loop;

  v_time := greatest(0, extract(epoch from (now() - v_attempt.started_at))::integer);

  update public.mock_attempts
  set status = 'submitted',
      submitted_at = now(),
      answers = coalesce(p_answers, '{}'),
      score = v_score,
      correct_count = v_correct,
      wrong_count = v_wrong,
      skipped_count = v_skipped,
      time_taken_seconds = v_time
  where id = p_attempt_id;

  if v_practice then
    -- Practice attempts are graded and stored, but never ranked.
    v_rank := null;
  else
    -- Ranked pool only: practice submissions must not move ranked ranks.
    select count(*) + 1 into v_rank
    from public.mock_attempts
    where mock_test_id = v_attempt.mock_test_id
      and status = 'submitted'
      and id <> p_attempt_id
      and started_at <= v_test.ends_at
      and (score > v_score
           or (score = v_score and coalesce(time_taken_seconds, 99999999) < v_time));
  end if;

  return jsonb_build_object(
    'score', v_score,
    'correct', v_correct,
    'wrong', v_wrong,
    'skipped', v_skipped,
    'time_taken_seconds', v_time,
    'rank', v_rank,
    'practice', v_practice,
    'total_questions', v_test.total_questions
  );
end;
$$;

revoke all on function public.submit_mock_attempt(uuid, jsonb) from anon;
grant execute on function public.submit_mock_attempt(uuid, jsonb) to authenticated;


-- ── 4. leaderboard — ranked attempts only, frozen at the window end ─────────
create or replace function public.get_leaderboard(p_mock_test_id uuid, p_limit integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'SIGNIN_REQUIRED';
  end if;

  return (
    select coalesce(jsonb_agg(row_to_json(r) order by r.rank), '[]'::jsonb)
    from (
      select
        rank() over (order by a.score desc, a.time_taken_seconds asc) as rank,
        a.display_name,
        a.score,
        a.correct_count  as correct,
        a.wrong_count    as wrong,
        a.skipped_count  as skipped,
        a.time_taken_seconds as time_taken,
        a.submitted_at,
        (a.user_id = auth.uid()) as is_you
      from public.mock_attempts a
      where a.mock_test_id = p_mock_test_id
        and a.status = 'submitted'
        and a.started_at <= (select ends_at from public.mock_tests where id = p_mock_test_id)
      order by a.score desc, a.time_taken_seconds asc
      limit greatest(1, least(coalesce(p_limit, 100), 500))
    ) r
  );
end;
$$;

revoke all on function public.get_leaderboard(uuid, integer) from anon;
grant execute on function public.get_leaderboard(uuid, integer) to authenticated;


-- ── 5. past results — same ranked-only rule, practice flagged ───────────────
create or replace function public.get_my_mock_attempts(p_limit integer default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'SIGNIN_REQUIRED';
  end if;

  return (
    select coalesce(jsonb_agg(row_to_json(r) order by r.submitted_at desc), '[]'::jsonb)
    from (
      select
        a.id as attempt_id,
        a.mock_test_id,
        t.title as test_title,
        t.exam,
        a.score,
        a.correct_count as correct,
        a.wrong_count as wrong,
        a.skipped_count as skipped,
        a.time_taken_seconds as time_taken,
        a.submitted_at,
        (a.started_at > t.ends_at) as practice,
        -- same ranking rule as the leaderboard, over ranked attempts only
        case when a.started_at > t.ends_at then null else
        (select count(*) + 1
         from public.mock_attempts b
         where b.mock_test_id = a.mock_test_id
           and b.status = 'submitted'
           and b.started_at <= t.ends_at
           and (b.score > a.score
                or (b.score = a.score and b.time_taken_seconds < a.time_taken_seconds))
        ) end as rank
      from public.mock_attempts a
      join public.mock_tests t on t.id = a.mock_test_id
      where a.user_id = v_user_id
        and a.status = 'submitted'
      order by a.submitted_at desc
      limit greatest(1, least(coalesce(p_limit, 20), 50))
    ) r
  );
end;
$$;

revoke all on function public.get_my_mock_attempts(integer) from anon;
grant execute on function public.get_my_mock_attempts(integer) to authenticated;


-- ── 6. admin_add_question gains an optional topic (module_id) ───────────────
-- The old 11-argument signature is dropped first: CREATE OR REPLACE cannot
-- change a signature, and keeping both overloads would leave old callers on
-- the version without module_id. Calls without p_module_id still work: it
-- defaults to null, so this is backward compatible.
drop function if exists public.admin_add_question(uuid,text,text,text,text,text,text,text,text,text,integer);
create or replace function public.admin_add_question(
  p_test_id uuid, p_question_text text,
  p_option_a text, p_option_b text, p_option_c text, p_option_d text, p_option_e text,
  p_answer text, p_explanation text, p_subject text, p_question_num integer default null,
  p_module_id integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_ord integer; v_id uuid;
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_question_text is null or trim(p_question_text) = '' then raise exception 'BAD_QUESTION'; end if;
  if lower(trim(coalesce(p_answer, ''))) not in ('a','b','c','d','e') then raise exception 'BAD_ANSWER'; end if;
  if not exists (select 1 from public.mock_tests where id = p_test_id) then
    raise exception 'TEST_NOT_FOUND';
  end if;
  select coalesce(max(sort_order), 0) + 1 into v_ord
  from public.mock_test_questions where mock_test_id = p_test_id;
  insert into public.mock_test_questions
    (mock_test_id, sort_order, question_num, question_text,
     option_a, option_b, option_c, option_d, option_e, answer, explanation, subject, module_id)
  values
    (p_test_id, v_ord, p_question_num, p_question_text,
     nullif(p_option_a,''), nullif(p_option_b,''), nullif(p_option_c,''),
     nullif(p_option_d,''), nullif(p_option_e,''),
     lower(trim(p_answer)), p_explanation, nullif(p_subject,''), p_module_id)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'sort_order', v_ord);
end;
$$;
revoke all on function public.admin_add_question(uuid,text,text,text,text,text,text,text,text,text,integer,integer) from anon;
grant execute on function public.admin_add_question(uuid,text,text,text,text,text,text,text,text,text,integer,integer) to authenticated;


-- ── 7. fill from bank now copies the topic into snapshots ───────────────────
create or replace function public.admin_fill_from_bank(p_test_id uuid, p_count integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_base integer; v_n integer;
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  if not exists (select 1 from public.mock_tests where id = p_test_id) then
    raise exception 'TEST_NOT_FOUND';
  end if;
  v_n := greatest(1, least(coalesce(p_count, 50), 500));
  select coalesce(max(sort_order), 0) into v_base
  from public.mock_test_questions where mock_test_id = p_test_id;
  insert into public.mock_test_questions
    (mock_test_id, sort_order, question_num, question_text,
     option_a, option_b, option_c, option_d, option_e, answer, explanation, subject, module_id)
  select p_test_id,
         v_base + row_number() over (),
         question_num, question_text,
         option_a, option_b, option_c, option_d, option_e, answer, explanation, subject, module_id
  from public.questions
  where answer is not null and question_text is not null
  order by random()
  limit v_n;
  return jsonb_build_object('added', v_n);
end;
$$;
revoke all on function public.admin_fill_from_bank(uuid, integer) from anon;
grant execute on function public.admin_fill_from_bank(uuid, integer) to authenticated;


-- ── 8. NEW: fill from chosen topics only (subject-mock builder) ─────────────
create or replace function public.admin_fill_subject_bank(p_test_id uuid, p_module_ids integer[], p_count integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_base integer; v_n integer; v_added integer;
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  if not exists (select 1 from public.mock_tests where id = p_test_id) then
    raise exception 'TEST_NOT_FOUND';
  end if;
  if p_module_ids is null or cardinality(p_module_ids) = 0 then
    raise exception 'BAD_MODULES';
  end if;
  v_n := greatest(1, least(coalesce(p_count, 50), 500));
  select coalesce(max(sort_order), 0) into v_base
  from public.mock_test_questions where mock_test_id = p_test_id;
  insert into public.mock_test_questions
    (mock_test_id, sort_order, question_num, question_text,
     option_a, option_b, option_c, option_d, option_e, answer, explanation, subject, module_id)
  select p_test_id,
         v_base + row_number() over (),
         question_num, question_text,
         option_a, option_b, option_c, option_d, option_e, answer, explanation, subject, module_id
  from public.questions
  where module_id = any(p_module_ids)
    and answer is not null and question_text is not null
  order by random()
  limit v_n;
  get diagnostics v_added = row_count;
  -- Actual inserted count (topics may hold fewer questions than requested).
  return jsonb_build_object('added', v_added);
end;
$$;
revoke all on function public.admin_fill_subject_bank(uuid, integer[], integer) from anon;
grant execute on function public.admin_fill_subject_bank(uuid, integer[], integer) to authenticated;


-- ── 9. NEW: write a question straight into the bank (live immediately) ──────
create or replace function public.admin_add_bank_question(
  p_module_id integer, p_subject text, p_question_text text,
  p_option_a text, p_option_b text, p_option_c text, p_option_d text, p_option_e text,
  p_answer text, p_explanation text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_num bigint; v_id bigint;
begin
  if not public.mock_is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_module_id is null then raise exception 'BAD_MODULE'; end if;
  if p_question_text is null or trim(p_question_text) = '' then raise exception 'BAD_QUESTION'; end if;
  if p_option_a is null or trim(p_option_a) = ''
     or p_option_b is null or trim(p_option_b) = ''
     or p_option_c is null or trim(p_option_c) = ''
     or p_option_d is null or trim(p_option_d) = '' then raise exception 'BAD_OPTION'; end if;
  if lower(trim(coalesce(p_answer, ''))) not in ('a','b','c','d','e') then raise exception 'BAD_ANSWER'; end if;
  if p_explanation is null or trim(p_explanation) = '' then raise exception 'BAD_EXPLANATION'; end if;
  -- question_num follows the bank's existing global sequence (largest number
  -- in use + 1), matching how bank questions were numbered before. It is
  -- deliberately NOT per-module: a per-module number could collide with
  -- another module's existing numbers.
  select coalesce(max(question_num), 0) + 1 into v_num from public.questions;
  insert into public.questions
    (module_id, subject, question_num, question_text,
     option_a, option_b, option_c, option_d, option_e, answer, explanation, is_pyq, has_image)
  values
    (p_module_id, nullif(p_subject, ''), v_num, p_question_text,
     nullif(p_option_a, ''), nullif(p_option_b, ''), nullif(p_option_c, ''),
     nullif(p_option_d, ''), nullif(p_option_e, ''),
     upper(trim(p_answer)), p_explanation, false, false)
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'question_num', v_num);
end;
$$;
revoke all on function public.admin_add_bank_question(integer,text,text,text,text,text,text,text,text,text) from anon;
grant execute on function public.admin_add_bank_question(integer,text,text,text,text,text,text,text,text,text) to authenticated;
