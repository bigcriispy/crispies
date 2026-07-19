import type { Context } from "hono";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";

export async function handleLogWorkout(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json<{
    date?: string;
    type?: string;
    duration_minutes?: number;
    intensity?: number;
    notes?: string;
  }>();

  const supabase = getSupabase(c.env);
  const date = body.date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      date,
      type: body.type ?? null,
      duration_minutes: body.duration_minutes ?? null,
      intensity: body.intensity ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);

  await supabase.from("check_ins").upsert({ date, workout_logged: true }, { onConflict: "date" });

  return c.json({ workout: data });
}
