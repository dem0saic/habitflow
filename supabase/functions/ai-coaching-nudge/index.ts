import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function calcStreak(
  habitId: string,
  targetCount: number,
  completions: Array<{ habit_id: string; date: string; count: number }>
): number {
  let streak = 0;
  while (true) {
    const key = new Date(Date.now() - streak * 86400000).toISOString().slice(0, 10);
    const done = completions.find(
      (c) => c.habit_id === habitId && c.date === key && c.count >= targetCount
    );
    if (done) streak++;
    else break;
  }
  return streak;
}

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
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const today = new Date().toISOString().slice(0, 10);

    // Return cached nudge if already generated today
    const { data: cached } = await supabase
      .from("ai_insights")
      .select("content")
      .eq("user_id", user.id)
      .eq("type", "nudge")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ content: cached.content, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [habitsRes, completionsRes] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, emoji, type, target_count")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("completions")
        .select("habit_id, date, count")
        .eq("user_id", user.id),
    ]);

    const habits = habitsRes.data || [];
    const completions = completionsRes.data || [];

    const habitStats = habits.map((habit) => {
      const streak = calcStreak(habit.id, habit.target_count || 1, completions);
      let completed30 = 0;
      for (let i = 0; i < 30; i++) {
        const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        if (completions.find((c) => c.habit_id === habit.id && c.date === key && c.count >= (habit.target_count || 1))) {
          completed30++;
        }
      }
      return {
        name: habit.name,
        emoji: habit.emoji,
        type: habit.type,
        currentStreak: streak,
        consistency30d: Math.round((completed30 / 30) * 100),
      };
    });

    const prompt = habits.length === 0
      ? "The user just started HabitFlow and has no habits yet. Write a warm, encouraging 2-sentence welcome message that inspires them to add their first habit and hints at the power of small daily actions."
      : `You are a supportive AI coach for HabitFlow, a habit tracking app. Generate a personalized coaching nudge based on this habit data:\n\n${JSON.stringify(habitStats, null, 2)}\n\nRules:\n- 2-3 sentences max, warm and conversational\n- Celebrate the strongest habit (highest streak or consistency)\n- Identify the weakest habit and give one specific, practical micro-tip\n- Weave in 1 emoji naturally, don't force it\n- No bullet points or headers\n- Reference actual habit names from the data\n- Never use dashes of any kind (no hyphens, em dashes, or en dashes) anywhere in the response`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 220,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0].type === "text" ? message.content[0].text : "";

    await supabase.from("ai_insights").insert({
      user_id: user.id,
      type: "nudge",
      content,
      period_start: today,
      period_end: today,
      metadata: { habitCount: habits.length },
    });

    return new Response(JSON.stringify({ content, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
