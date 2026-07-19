import type { Context } from "hono";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";

export async function handleGetNewsDigest(c: Context<{ Bindings: Env }>) {
  const supabase = getSupabase(c.env);
  const date = c.req.query("date") ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("news_digests")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) return c.json({ error: error.message }, 500);
  if (!data) return c.json({ error: "No digest for this date" }, 404);

  return c.json({ digest: data });
}
