// Sends Expo push notifications to all tokens registered for a user_id.
// Looks up tokens in public.push_tokens, POSTs to https://exp.host/--/api/v2/push/send,
// and deletes tokens that come back with DeviceNotRegistered so the table self-cleans.
//
// Deploy: npx supabase functions deploy send-push --project-ref <ref>
// Invoke from another Edge Function with the service-role key in Authorization
// (verify_jwt: true accepts both user JWTs and the service role).

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: tokens, error: tokensErr } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", user_id);

  if (tokensErr) {
    console.error("send-push: token lookup failed:", tokensErr.message);
    return jsonResponse(500, { error: tokensErr.message });
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
