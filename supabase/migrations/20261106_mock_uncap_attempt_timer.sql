-- Uncap the mock attempt timer (2026-11-06, Paradox).
--
-- Before: deadline_at = least(started_at + duration_minutes, ends_at), so the
-- test window cut a late starter's time short. A 10:00-13:00 test with a
-- 180-minute duration gave a 12:00 starter only 60 minutes.
--
-- After: deadline_at = started_at + duration_minutes, always. The window
-- (starts_at/ends_at) now only decides WHEN an attempt can start as ranked:
-- start any time while the mock is live and you get the test's full fixed
-- duration from your own start (e.g. a mock live for 7 days, 280 questions
-- for 300 minutes: anyone starting inside the 7 days gets the full 300).
-- Post-window starts were already full-duration practice; unchanged.
-- Resume keeps the original started_at, so re-entering never extends the clock.
--
-- Consequence (Paradox's call, stated 2026-11-06): a ranked attempt can now
-- finish after ends_at. The leaderboard ranks by started_at <= ends_at, so
-- late finishers still rank, but the board only settles once the last
-- in-window attempt submits (up to ends_at + duration), not at ends_at.
-- Nothing else changes: the client already counts down to deadline_at and
-- auto-submits at 0, so no app.js change is needed for this fix.
--
-- Run in the Supabase SQL editor (safe to re-run; create or replace).

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
  -- No TEST_ENDED check: starting after ends_at is practice.
  if not v_test.is_free and not public.mock_is_pro(v_user_id) then
    raise exception 'PRO_REQUIRED';
  end if;

  select * into v_attempt
  from public.mock_attempts
  where mock_test_id = p_mock_test_id and user_id = v_user_id;

  if found then
    -- Resume the in-progress attempt, or report the submitted one.
    -- Full fixed duration from the ORIGINAL start, never capped by the
    -- window end, never extended by resuming.
    v_practice := v_attempt.started_at > v_test.ends_at;
    v_deadline := v_attempt.started_at + (v_test.duration_minutes || ' minutes')::interval;
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
  v_deadline := v_attempt.started_at + (v_test.duration_minutes || ' minutes')::interval;
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
