# What's fixed in index.html vs. what you still need to deploy

## Fixed directly in this zip (no backend needed)
1. **Admin console bypass removed.** `window.unlockAdmin` / `window.activateAdminSession`
   are no longer exposed. `isAdmin()` now only trusts `app_metadata.role`
   (server-settable only) — it no longer trusts `user_metadata` (which any
   signed-in user can edit on themselves) or a hardcoded `admin-device-owner`
   id.
2. **Persistent admin-from-localStorage bypass removed.** Previously,
   `localStorage.setItem('medladder_admin_session','true')` + a page reload
   was enough to become admin forever, with zero server check. `initAuth()`
   and `onAuthStateChange()` no longer fabricate an admin user from that flag
   — admin status is only ever read off a real Supabase session.
3. **Local-only OTP/passkey admin login removed.** The admin login form used
   to accept a locally-generated OTP or local passkey and grant access
   without ever calling Supabase. Now every login path requires a real
   `signInWithPassword` / `verifyOtp` call, and the result is checked against
   `app_metadata.role === 'admin'` before the admin UI renders.
4. **Payment verification now fails closed.** `verified === null` (edge
   function unreachable) used to be treated as a pass. Now only
   `verified === true` grants Pro; anything else (including `null`) is
   rejected and shown a "contact support" message instead.
5. **"Grant Pro" admin button no longer lies.** It used to write to the
   *admin's own browser* localStorage and show a success toast — which does
   nothing for the target user on their own device. It now calls a real
   Edge Function (see below) and honestly reports failure until that
   function is deployed and wired up.
6. **Stored XSS fixed.** Question text, options, and explanations are now
   escaped (`esc()`) everywhere they're inserted into the DOM.

## Still needs you to deploy (I don't have access to your Supabase project)

Run `supabase_setup.sql` in your Supabase SQL editor. It:
- Sets your own account's `app_metadata.role = 'admin'` (**edit the email
  at the top of the file first** — this is what makes the fixed
  `isAdmin()` recognize you again, since the old local-passkey path is gone).
- Creates a `subscriptions` table and locks `questions` down with real RLS
  (free users only see the first 8 modules per subject; Pro users see
  everything; nobody can read the `answer` field unless entitled).
- Replaces the `USING (true)` policy your admin panel was displaying.

Deploy `functions/admin-grant-pro/index.ts` as a Supabase Edge Function,
then set `PRO_CONFIG.EDGE_ADMIN_GRANT_URL` in `index.html` to its URL.
It verifies the caller is really an admin (via their JWT + `app_metadata`)
before writing to `subscriptions` — so, unlike before, it can't be spoofed
from the browser.

## Known remaining gap (needs more work than a patch — flagging honestly)
`questions.select('*')` still fetches `answer`/`explanation` for every row
the RLS policy lets a user see. The SQL below restricts *which rows* a free
vs. Pro user can see, but a technically capable Pro user can still read
answers via the network tab before answering (this was true for them even
in the "intended" design). If you want to fully close that, the real fix is
splitting question delivery from answer verification into two Edge
Functions, which is a larger change I didn't make here — happy to do it as
a follow-up if you want it.
