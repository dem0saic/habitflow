// Deletes the calling user's account: cascades all user rows across
// public tables, then removes the auth.users row via the service-role admin
// API. Invoked from the client via supabase.functions.invoke("delete-account").
//
// Deploy:  npx supabase functions deploy delete-account --project-ref <ref>
// verify_jwt: true (set via the gateway, same as the other functions).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Validate the JWT from the caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, { error: "Missing Authorization header" });
  }
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // 2. Resolve the user from the caller's JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    console.error("delete-account: getUser failed:", userError?.message);
    return jsonResponse(401, { error: "Invalid or expired session" });
  }
  const userId = user.id;
  console.log(`delete-account: cascading delete for user ${userId}`);

  // 3. Cascade-delete every row owned by this user across the public schema.
  // Order doesn't matter — every table keys off user_id with RLS bypass
  // via the service role. We collect non-fatal errors and continue so a single
  // table issue doesn't block account removal.
  const tables = ["completions", "challenges", "habits", "day_notes", "ai_insights", "push_tokens", "user_settings"];
  const tableErrors: string[] = [];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) {
      console.error(`delete-account: ${table} delete failed:`, error.message);
      tableErrors.push(`${table}: ${error.message}`);
    }
  }

  // 4. Remove the auth.users row last. If this fails the user still has
  // their account but their rows are gone — better to surface this loudly
  // so the client can show a useful message.
  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteUserError) {
    console.error("delete-account: admin.deleteUser failed:", deleteUserError.message);
    return jsonResponse(500, {
      error: `Account data was removed but the auth record could not be deleted: ${deleteUserError.message}`,
      tableErrors,
    });
  }

  return jsonResponse(200, { ok: true, tableErrors });
});
