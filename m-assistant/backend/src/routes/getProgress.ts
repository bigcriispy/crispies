import type { Context } from "hono";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function handleGetProgress(c: Context<{ Bindings: Env }>) {
  const days = Number(c.req.query("days") ?? "7");
  const since = daysAgo(days);
  const supabase = getSupabase(c.env);

  const [workouts, sleepLogs, checkIns, rituals] = await Promise.all([
    supabase.from("workouts").select("*").gte("date", since),
    supabase.from("sleep_logs").select("hours, quality, date").gte("date", since),
    supabase.from("check_ins").select("*").gte("date", since),
    supabase.from("ritual_logs").select("done, due_date").gte("due_date", since),
  ]);

  const avgSleep = sleepLogs.data?.length
    ? sleepLogs.data.reduce((sum, r) => sum + Number(r.hours ?? 0), 0) / sleepLogs.data.length
    : null;

  const ritualsDue = rituals.data?.length ?? 0;
  const ritualsDone = rituals.data?.filter((r) => r.done).length ?? 0;

  return c.json({
    period_days: days,
    workouts_logged: workouts.data?.length ?? 0,
    avg_sleep_hours: avgSleep,
    check_ins: checkIns.data ?? [],
    rituals_due: ritualsDue,
    rituals_done: ritualsDone,
  });
}
