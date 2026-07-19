import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";
import { getAnthropic, MODEL_HAIKU } from "../lib/anthropic";

function tomorrow(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function runGenerateQuote(env: Env): Promise<void> {
  const supabase = getSupabase(env);
  const anthropic = getAnthropic(env);
  const since = daysAgo(14);

  const [workouts, sleepLogs, rituals, tasks] = await Promise.all([
    supabase.from("workouts").select("date, type, duration_minutes").gte("date", since),
    supabase.from("sleep_logs").select("date, hours, quality").gte("date", since),
    supabase.from("ritual_logs").select("done, due_date").gte("due_date", since),
    supabase.from("tasks").select("done, due_date").gte("due_date", since),
  ]);

  const activitySnapshot = JSON.stringify({
    workouts: workouts.data ?? [],
    sleep: sleepLogs.data ?? [],
    ritual_logs: rituals.data ?? [],
    tasks: tasks.data ?? [],
  });

  const response = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 1024,
    system: `You write a single short, discipline-themed motivational quote for tomorrow, and a
terse rolling summary of the user's recent activity for future context injection.
Respond with ONLY a JSON object: { "quote": string, "summary": string }.
The quote should be blunt and discipline-focused, not saccharine — 1-2 sentences max.
The summary should be a few sentences citing real numbers from the data below, for internal use by
another assistant instance — not shown to the user directly.`,
    messages: [{ role: "user", content: `Last 14 days of activity:\n${activitySnapshot}` }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  let parsed: { quote: string; summary: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  await supabase.from("quotes_history").insert({ date: tomorrow(), quote: parsed.quote });
  await supabase.from("rolling_summary").insert({ summary: parsed.summary });
}
