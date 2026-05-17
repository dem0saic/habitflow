import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type PauseRange = { start: string; end: string };

function isPaused(habitPauses: PauseRange[] | null, globalPause: PauseRange | null, dateStr: string): boolean {
  if (globalPause && globalPause.start && globalPause.end
      && dateStr >= globalPause.start && dateStr <= globalPause.end) return true;
  if (!Array.isArray(habitPauses)) return false;
  for (const p of habitPauses) {
    if (p?.start && p?.end && dateStr >= p.start && dateStr <= p.end) return true;
  }
  return false;
}

// Mirrors src/utils/streak.js so the AI coach sees the same streak the user does
function calcStreak(
  habitId: string,
  targetCount: number,
  shieldsPerMonth: number,
  habitPauses: PauseRange[] | null,
  globalPause: PauseRange | null,
  completions: Array<{ habit_id: string; date: string; count: number }>
): number {
  const todayStr = new Date().toISOString().slice(0, 10);
  const shieldsUsed: Record<string, number> = {};
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 730; i++) {
    const key = d.toISOString().slice(0, 10);
    if (isPaused(habitPauses, globalPause, key)) {
      d.setDate(d.getDate() - 1);
      continue;
    }
    const hit = completions.find(c => c.habit_id === habitId && c.date === key && c.count >= targetCount);
    if (hit) {
      streak++;
    } else if (key === todayStr) {
      // Today not done yet — grace
    } else {
      const monthKey = key.slice(0, 7);
      const used = shieldsUsed[monthKey] || 0;
      if (used < shieldsPerMonth) {
        shieldsUsed[monthKey] = used + 1;
      } else {
        break;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Look back 28 days (4 even weeks). For each weekday, compute completion rate
// and surface the weakest one if it's meaningfully worse than the habit's average.
// Returns null if there isn't enough data or no clear pattern.
function weakestWeekday(
  habitId: string,
  targetCount: number,
  completions: Array<{ habit_id: string; date: string; count: number }>,
  habitCreatedAt: string | null
): { day: string; rate: number; overall: number; misses: number } | null {
  // Need at least 14 days of habit history to claim a pattern
  if (habitCreatedAt) {
    const ageDays = (Date.now() - new Date(habitCreatedAt).getTime()) / 86400000;
    if (ageDays < 14) return null;
  }
  const byDow: Array<{ done: number; total: number }> = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
  for (let i = 0; i < 28; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    if (habitCreatedAt && key < habitCreatedAt.slice(0, 10)) continue;
    const dow = d.getDay();
    byDow[dow].total++;
    const hit = completions.find(c => c.habit_id === habitId && c.date === key && c.count >= targetCount);
    if (hit) byDow[dow].done++;
  }
  const totalDone = byDow.reduce((a, b) => a + b.done, 0);
  const totalTotal = byDow.reduce((a, b) => a + b.total, 0);
  if (totalTotal < 14) return null;
  const overallRate = totalDone / totalTotal;
  // Pick the weekday with the lowest completion rate, at least 3 occurrences
  let worst = -1;
  let worstRate = 1;
  for (let i = 0; i < 7; i++) {
    if (byDow[i].total < 3) continue;
    const rate = byDow[i].done / byDow[i].total;
    if (rate < worstRate) { worstRate = rate; worst = i; }
  }
  // Only call it a pattern if the weakest day is ≥30% worse than the overall rate
  if (worst < 0 || overallRate - worstRate < 0.3) return null;
  return {
    day: DAY_NAMES[worst],
    rate: Math.round(worstRate * 100),
    overall: Math.round(overallRate * 100),
    misses: byDow[worst].total - byDow[worst].done,
  };
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

    const [habitsRes, completionsRes, settingsRes] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, emoji, type, target_count, created_at, shields_per_month, pauses")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("completions")
        .select("habit_id, date, count")
        .eq("user_id", user.id),
      supabase
        .from("user_settings")
        .select("global_pause")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const habits = habitsRes.data || [];
    const completions = completionsRes.data || [];
    const globalPause: PauseRange | null = settingsRes.data?.global_pause ?? null;

    const habitStats = habits.map((habit) => {
      const target = habit.target_count || 1;
      const shields = habit.shields_per_month ?? 2;
      const habitPauses: PauseRange[] = Array.isArray(habit.pauses) ? habit.pauses : [];
      const streak = calcStreak(habit.id, target, shields, habitPauses, globalPause, completions);
      let completed30 = 0;
      let eligible30 = 0;
      for (let i = 0; i < 30; i++) {
        const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        if (isPaused(habitPauses, globalPause, key)) continue;
        eligible30++;
        if (completions.find((c) => c.habit_id === habit.id && c.date === key && c.count >= target)) {
          completed30++;
        }
      }
      const pattern = weakestWeekday(habit.id, target, completions, habit.created_at);
      return {
        name: habit.name,
        emoji: habit.emoji,
        type: habit.type,
        currentStreak: streak,
        consistency30d: eligible30 > 0 ? Math.round((completed30 / eligible30) * 100) : 0,
        ...(pattern && { weakestWeekday: pattern }),
      };
    });

    // Surface the single strongest pattern across all habits for the prompt
    const patternedHabits = habitStats.filter(h => h.weakestWeekday);
    const headlinePattern = patternedHabits
      .sort((a, b) => (a.weakestWeekday!.rate - b.weakestWeekday!.rate))[0] || null;

    const prompt = habits.length === 0
      ? "The user just started HabitFlow and has no habits yet. Write a warm, encouraging 2-sentence welcome message that inspires them to add their first habit and hints at the power of small daily actions."
      : `You are a supportive AI coach for HabitFlow, a habit tracking app. Generate a personalized coaching nudge based on this habit data:

${JSON.stringify(habitStats, null, 2)}

${headlinePattern ? `Notice: ${headlinePattern.name} has a weak spot on ${headlinePattern.weakestWeekday!.day}s (${headlinePattern.weakestWeekday!.rate}% vs ${headlinePattern.weakestWeekday!.overall}% overall, ${headlinePattern.weakestWeekday!.misses} misses in the last 4 weeks).` : ''}

Rules:
- 2-3 sentences max, warm and conversational
- If a weekday pattern is noted above, lead with a curious, non-judgmental observation about it and ask a gentle question (e.g. "what's different about Wednesdays?"). Patterns are the headline; streaks are secondary.
- Otherwise, celebrate the strongest habit (highest streak or consistency) and give one specific, practical micro-tip for the weakest
- Weave in 1 emoji naturally, don't force it
- No bullet points or headers
- Reference actual habit names from the data
- Never use dashes of any kind (no hyphens, em dashes, or en dashes) anywhere in the response`;

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
      metadata: {
        habitCount: habits.length,
        ...(headlinePattern && { pattern: { habit: headlinePattern.name, day: headlinePattern.weakestWeekday!.day } }),
      },
    });

    // Fire-and-forget push so the user gets the nudge even if they don't open StatsScreen.
    // Truncate to keep notification body readable on the lock screen.
    const pushBody = content.length > 140 ? `${content.slice(0, 137)}…` : content;
    supabase.functions.invoke("send-push", {
      body: {
        user_id: user.id,
        title: "Your coach has a note for you",
        body: pushBody,
        data: { type: "nudge" },
      },
    }).catch((e) => console.warn("send-push invoke failed:", e?.message ?? e));

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
