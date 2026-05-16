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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Resolve the user from the caller's JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");
    const userId = user.id;

    // Cascade-delete every row owned by this user across the public schema.
    // Order doesn't matter — all five tables key off user_id with RLS bypass via service role.
    const tables = ["completions", "challenges", "habits", "ai_insights", "user_settings"];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      if (error) {
        // Don't fail the whole deletion on a single table missing rows; log & continue.
        console.error(`delete-account: failed to delete from ${table}:`, error.message);
      }
    }

    // Remove the auth.users row last — once this succeeds the session is invalid.
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
