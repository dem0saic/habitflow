// Sends Expo push notifications to all tokens registered for a user_id.
// Looks up tokens in public.push_tokens, POSTs to https://exp.host/--/api/v2/push/send,
// and deletes tokens that come back with DeviceNotRegistered so the table self-cleans.
//
// Deploy: npx supabase functions deploy send-push --project-ref <ref>
// verify_jwt: true at the gateway accepts both user JWTs and the service role.
//
// Authorization model (Finding #6):
//   - If the caller's bearer token === SUPABASE_SERVICE_ROLE_KEY, accept any
//     user_id in the body. This is the server-to-server path used by
//     ai-coaching-nudge to fan a generated nudge out as a push.
//   - Otherwise, resolve the user from the JWT and require body.user_id to
//     match the caller's own user.id. This prevents an authenticated end
//     user from sending push notifications to other accounts.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const ANDROID_CHANNEL_ID = "habitflow-reminders";
const BATCH_SIZE = 100; // Expo's documented per-request max

type ExpoPushMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  channelId?: string;
  priority?: "default" | "normal" | "high";
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(401, { error: "Missing Authorization header" });
  }
  const token = authHeader.replace("Bearer ", "").trim();

  let payload: { user_id?: string; title?: string; body?: string; data?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const { user_id, title, body, data } = payload;
  if (!user_id || typeof user_id !== "string") {
    return jsonResponse(400, { error: "user_id is required" });
  }
  if (!body || typeof body !== "string") {
    return jsonResponse(400, { error: "body is required" });
  }
  if (body.length > 500) {
    return jsonResponse(400, { error: "body too long" });
  }
  if (title && (typeof title !== "string" || title.length > 200)) {
    return jsonResponse(400, { error: "title invalid" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
    { auth: { persistSession: false } },
  );

  // Authorization: service role bypasses, end users must own the target.
  const isServiceRole = token === serviceRoleKey;
  if (!isServiceRole) {
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse(401, { error: "Invalid or expired session" });
    }
    if (user.id !== user_id) {
      console.warn(`send-push: caller ${user.id} attempted to push to ${user_id}`);
      return jsonResponse(403, { error: "Forbidden" });
    }
  }

  const { data: tokens, error: tokensErr } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", user_id);

  if (tokensErr) {
    console.error("send-push: token lookup failed:", tokensErr.message);
    return jsonResponse(500, { error: "Internal error" });
  }

  const tokenList = (tokens ?? []).map((r) => r.token as string).filter(Boolean);
  if (tokenList.length === 0) {
    return jsonResponse(200, { sent: 0, removed: 0, note: "No registered tokens" });
  }

  const messages: ExpoPushMessage[] = tokenList.map((to) => ({
    to,
    title: title || "HabitFlow",
    body,
    data: data ?? {},
    sound: "default",
    channelId: ANDROID_CHANNEL_ID,
    priority: "high",
  }));

  let sent = 0;
  const toRemove: string[] = [];

  for (const batch of chunk(messages, BATCH_SIZE)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        console.error("send-push: Expo API non-OK:", res.status, await res.text());
        continue;
      }
      const json = await res.json() as { data?: ExpoTicket[] };
      const tickets = json.data ?? [];
      tickets.forEach((ticket, i) => {
        if (ticket.status === "ok") {
          sent++;
        } else if (ticket.details?.error === "DeviceNotRegistered") {
          toRemove.push(batch[i].to);
        } else {
          console.warn("send-push: ticket error:", ticket.message, ticket.details);
        }
      });
    } catch (e) {
      console.error("send-push: batch failed:", (e as Error).message);
    }
  }

  if (toRemove.length > 0) {
    const { error: delErr } = await supabase
      .from("push_tokens")
      .delete()
      .in("token", toRemove);
    if (delErr) console.error("send-push: cleanup failed:", delErr.message);
  }

  return jsonResponse(200, { sent, removed: toRemove.length, total: tokenList.length });
});
