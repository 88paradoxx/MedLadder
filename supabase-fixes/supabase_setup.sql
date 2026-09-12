-- ============================================================================
-- MedLadder security fixes — run this whole file in the Supabase SQL editor.
-- Review each section before running; adjust the email/limits to match yours.
-- ============================================================================

-- ── 1. Grant yourself real admin status ─────────────────────────────────────
-- app_metadata can only be edited server-side (unlike user_metadata, which the
-- signed-in user can change on themselves), so this is the only thing the
-- fixed isAdmin() in index.html trusts. EDIT THE EMAIL BELOW to your own
-- admin account before running.
update auth.users
set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin')
where email = '99abuluqman@gmail.com';  -- <-- change this if needed

-- ============================================================================
-- 2. Subscriptions table — the real source of truth for Pro, replacing
--    user_metadata.expires_at / localStorage.
-- ============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id text,
  status text not null default 'active', -- 'active' | 'expired' | 'cancelled'
  expires_at timestamptz not null,
  razorpay_payment_id text,
  granted_by text, -- 'razorpay' | admin email who granted it
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users can read only their own subscription rows (used by the client to
-- show "you have Pro until <date>" — never to GRANT Pro, that's server-side).
drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policies for regular users at all — only Edge
-- Functions using the service-role key can write to this table.

-- Helper view the client can call to answer "am I Pro right now?"
create or replace view public.my_pro_status as
select
  exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid()
      and s.status = 'active'
      and s.expires_at > now()
  ) as is_pro;

-- ============================================================================
-- 3. Lock down the questions table with real RLS
--    Replaces the "Authenticated read questions ... USING (true)" policy.
-- ============================================================================
-- Adjust FREE_MODULE_LIMIT to match PRO_CONFIG.FREE_MODULES_PER_SUBJECT (8)
-- in index.html. This assumes `questions` has a `module_index` int column
-- indicating a question's position within its subject — adjust the column
-- name to match your actual schema if it differs.

drop policy if exists "Authenticated read questions" on public.questions;

create policy "Free users see first 8 modules only"
  on public.questions for select
  to authenticated
  using (
    module_index < 8
    or exists (
      select 1 from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status = 'active'
        and s.expires_at > now()
    )
    or exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and (u.raw_app_meta_data->>'role') = 'admin'
    )
  );

-- ============================================================================
-- 4. Payments table RLS (referenced by logPaymentToSupabase in index.html)
--    Users can insert their own payment attempt logs but can't fake others',
--    and can't mark themselves as verified — only a service-role Edge
--    Function should ever set verified_on_server = true.
-- ============================================================================
alter table if exists public.payments enable row level security;

drop policy if exists "Users insert own payment logs" on public.payments;
create policy "Users insert own payment logs"
  on public.payments for insert
  to authenticated
  with check (user_id = auth.uid() and verified_on_server = false);

drop policy if exists "Users read own payment logs" on public.payments;
create policy "Users read own payment logs"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid());
