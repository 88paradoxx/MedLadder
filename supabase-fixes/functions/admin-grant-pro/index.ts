// Supabase Edge Function: admin-grant-pro
// Deploy with: supabase functions deploy admin-grant-pro
//
// Lets a real admin (app_metadata.role === 'admin', checked server-side from
// their JWT — not from anything the browser claims) grant Pro to a target
// user by email. This replaces the old client-side "Grant Pro" button, which
// only wrote to the admin's own browser localStorage and did nothing for the
// target user at all.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) {
    return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401 });
  }

  // Service-role client — bypasses RLS, used only after we've verified the
  // caller is really an admin below. Never expose SERVICE_ROLE_KEY to the browser.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1. Verify the caller's own identity from their JWT (server-side check —
  //    this cannot be spoofed by editing anything in the browser).
  const { data: callerData, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !callerData?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }
  const caller = callerData.user;
  const isCallerAdmin = caller.app_metadata?.role === "admin" || caller.app_metadata?.is_admin === true;
  if (!isCallerAdmin) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403 });
  }

  // 2. Parse and validate the request.
  let body: { target_email?: string; days?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }
  const targetEmail = (body.target_email || "").trim().toLowerCase();
  const days = Number.isFinite(body.days) ? Math.max(1, Math.min(3650, body.days!)) : 365;
  if (!targetEmail || !targetEmail.includes("@")) {
    return new Response(JSON.stringify({ error: "Invalid target_email" }), { status: 400 });
  }

  // 3. Look up the target user by email.
  const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    return new Response(JSON.stringify({ error: "Failed to look up user" }), { status: 500 });
  }
  const targetUser = usersPage.users.find((u) => (u.email || "").toLowerCase() === targetEmail);
  if (!targetUser) {
    return new Response(JSON.stringify({ error: "No account found with that email" }), { status: 404 });
  }

  // 4. Write the real subscription row (this is what index.html's isUserPro
  //    should eventually check via a server call — see README for the
  //    remaining wiring on the client side to read from `subscriptions`
  //    instead of user_metadata).
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { error: insertErr } = await admin.from("subscriptions").insert({
    user_id: targetUser.id,
    plan_id: "admin_grant",
    status: "active",
    expires_at: expiresAt,
    granted_by: caller.email,
  });
  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, expires_at: expiresAt }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
