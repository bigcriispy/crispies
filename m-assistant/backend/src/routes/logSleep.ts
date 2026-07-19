import type { Context } from "hono";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";

export async function handleLogSleep(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json<{ date?: string; hours: number; quality?: number; notes?: string }>();
  if (typeof body.hours !== "number") return c.json({ error: "hours is required" }, 400);

  const supabase = getSupabase(c.env);
  const date = body.date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("sleep_logs")
    .insert({ date, hours: body.hours, quality: body.quality ?? null, notes: body.notes ?? null })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);

  await supabase.from("check_ins").upsert({ date, sleep_logged: true }, { onConflict: "date" });

  return c.json({ sleep_log: data });
}
