import type { Context } from "hono";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";

export async function handleLogMeal(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json<{
    date?: string;
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    description: string;
  }>();
  if (!body.meal_type || !body.description) {
    return c.json({ error: "meal_type and description are required" }, 400);
  }

  const supabase = getSupabase(c.env);
  const date = body.date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("meals")
    .insert({ date, meal_type: body.meal_type, description: body.description })
    .select()
    .single();
  if (error) return c.json({ error: error.message }, 500);

  await supabase.from("check_ins").upsert({ date, meal_logged: true }, { onConflict: "date" });

  return c.json({ meal: data });
}
