import type { Context } from "hono";
import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";
import { getAnthropic, MODEL_SONNET } from "../lib/anthropic";

const PLANNER_SYSTEM = `You break a long-term goal into a concrete task list and calendar entries.
Respond with ONLY a JSON object, no prose, matching this shape:
{
  "description": string | null,
  "target_date": "YYYY-MM-DD" | null,
  "tasks": [{ "title": string, "due_date": "YYYY-MM-DD" | null }],
  "calendar_events": [{ "title": string, "start_time": "ISO 8601 timestamp", "end_time": "ISO 8601 timestamp" | null, "notes": string | null }]
}
Be concrete and realistic. Space tasks and events out sensibly given today's date: ${new Date().toISOString().slice(0, 10)}.`;

export async function handleCreateGoal(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json<{ title: string }>();
  if (!body.title) return c.json({ error: "title is required" }, 400);

  const supabase = getSupabase(c.env);
  const anthropic = getAnthropic(c.env);

  const response = await anthropic.messages.create({
    model: MODEL_SONNET,
    max_tokens: 4096,
    system: PLANNER_SYSTEM,
    messages: [{ role: "user", content: `Goal: ${body.title}` }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  let plan: {
    description: string | null;
    target_date: string | null;
    tasks: { title: string; due_date: string | null }[];
    calendar_events: { title: string; start_time: string; end_time: string | null; notes: string | null }[];
  };
  try {
    plan = JSON.parse(text);
  } catch {
    return c.json({ error: "Planner returned invalid JSON", raw: text }, 502);
  }

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({ title: body.title, description: plan.description, target_date: plan.target_date })
    .select()
    .single();
  if (goalError) return c.json({ error: goalError.message }, 500);

  const tasksToInsert = (plan.tasks ?? []).map((t) => ({ ...t, goal_id: goal.id }));
  const { data: tasks, error: tasksError } = tasksToInsert.length
    ? await supabase.from("tasks").insert(tasksToInsert).select()
    : { data: [], error: null };
  if (tasksError) return c.json({ error: tasksError.message }, 500);

  const eventsToInsert = (plan.calendar_events ?? []).map((e) => ({ ...e, goal_id: goal.id }));
  const { data: events, error: eventsError } = eventsToInsert.length
    ? await supabase.from("calendar_events").insert(eventsToInsert).select()
    : { data: [], error: null };
  if (eventsError) return c.json({ error: eventsError.message }, 500);

  return c.json({ goal, tasks, calendar_events: events });
}
