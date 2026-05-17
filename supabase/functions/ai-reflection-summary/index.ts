import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");

    const body = await req.json().catch(() => ({}));
    const period: "weekly" | "monthly" = body.period === "monthly" ? "monthly" : "weekly";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const daysBack = period === "monthly" ? 30 : 7;
    const type = period === "monthly" ? "monthly_summary" : "weekly_summary";
    const now = Date.now();
    const periodStartStr = new Date(now - daysBack * 86400000).toISOString().slice(0, 10);
    const periodEndStr = new Date(now).toISOString().slice(0, 10);

    // Return cached summary if one exists for this exact period start
    const { data: cached } = await supabase
      .from("ai_insights")
      .select("content")
      .eq("user_id", user.id)
      .eq("type", type)
      .eq("period_start", periodStartStr)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ content: cached.content, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [habitsRes, completionsRes, notesRes] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, emoji, type, target_count")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("completions")
        .select("habit_id, date, count")
        .eq("user_id", user.id)
        .gte("date", periodStartStr)
        .lte("date", periodEndStr),
      supabase
        .from("day_notes")
        .select("date, note")
        .eq("user_id", user.id)
        .gte("date", periodStartStr)
        .lte("date", periodEndStr)
        .order("date", { ascending: true }),
    ]);

    const habits = habitsRes.data || [];
    const completions = completionsRes.data || [];
    const notes = notesRes.data || [];

    const habitStats = habits.map((habit) => {
      const habitDone = completions.filter(
        (c) => c.habit_id === habit.id && c.count >= (habit.target_count || 1)
      );
      const consistency = Math.round((habitDone.length / daysBack) * 100);

      // Find weakest day-of-week
      const dowCounts = [0, 0, 0, 0, 0, 0, 0];
      const dowTotals = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < daysBack; i++) {
        const d = new Date(now - i * 86400000);
        const dow = d.getDay();
        dowTotals[dow]++;
        if (habitDone.find((c) => c.date === d.toISOString().slice(0, 10))) dowCounts[dow]++;
      }
      const dowRates = dowTotals.map((t, i) => (t > 0 ? dowCounts[i] / t : null));
      const weakestDow = dowRates.reduce(
        (minI: number, rate, i) =>
          rate !== null && (minI === -1 || (dowRates[minI] ?? 1) > rate) ? i : minI,
        -1
      );

      return {
        name: habit.name,
        emoji: habit.emoji,
        completedDays: habitDone.length,
        consistency,
        weakestDay: weakestDow !== -1 ? DAY_NAMES[weakestDow] : null,
      };
    });

    const allDates = [...new Set(completions.map((c) => c.date))];
    const perfectDays = allDates.filter((date) =>
      habits.every((h) => {
        const c = completions.find((c) => c.habit_id === h.id && c.date === date);
        return (c?.count || 0) >= (h.target_count || 1);
      })
    ).length;

    const notesBlock = notes.length > 0
      ? `\n\nUser notes for this period (their own words about specific days):\n${notes.map(n => `  ${n.date}: ${n.note}`).join("\n")}`
      : "";

    const prompt = habits.length === 0
      ? `Generate a warm, encouraging ${period} reflection for a user who hasn't added any habits yet. Inspire them to start with 1-2 small habits and explain the compound effect of daily consistency. 3 sentences max, no headers.`
      : `You are an insightful AI coach for HabitFlow. Generate a ${period} reflection summary.\n\nPeriod: ${periodStartStr} to ${periodEndStr} (${daysBack} days)\nActive habits: ${habits.length}\nPerfect days (all habits completed): ${perfectDays} of ${daysBack}\n\nHabit breakdown:\n${JSON.stringify(habitStats, null, 2)}${notesBlock}\n\nWrite a flowing, personal ${period} reflection in 3-4 sentences:\n- Open with the standout win (best performing habit or highest-consistency metric)\n- Note a meaningful pattern or trend (e.g. a day they consistently struggle)\n- If user notes are provided above, reference one of them naturally to show you saw their context (e.g. "the travel days clearly slowed momentum, but you bounced back"). Do not quote the note verbatim or list it; weave it in.\n- Give one specific, actionable suggestion for next ${period === "weekly" ? "week" : "month"}\n- Close with a forward-looking encouragement\n- 1-2 emojis integrated naturally, not at the start\n- No bullet points, headers, or markdown, flowing prose only\n- Never use dashes of any kind (no hyphens, em dashes, or en dashes) anywhere in the response`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 380,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0].type === "text" ? message.content[0].text : "";

    await supabase.from("ai_insights").insert({
      user_id: user.id,
      type,
      content,
      period_start: periodStartStr,
      period_end: periodEndStr,
      metadata: { habitCount: habits.length, perfectDays, totalDays: daysBack, noteCount: notes.length },
    });

    return new Response(JSON.stringify({ content, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("ai-reflection-summary:", msg);
    const isAuthError = msg === "Unauthorized" || msg === "No auth header";
    return new Response(
      JSON.stringify({ error: isAuthError ? msg : "Could not generate summary" }),
      {
        status: isAuthError ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
