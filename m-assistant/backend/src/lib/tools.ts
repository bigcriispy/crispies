import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_goals",
    description: "List all goals, optionally filtered by status.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "on_track", "slipping", "done", "abandoned"],
        },
      },
    },
  },
  {
    name: "create_goal",
    description: "Create a new goal.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        target_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_goal_status",
    description: "Update a goal's status.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string" },
        status: {
          type: "string",
          enum: ["active", "on_track", "slipping", "done", "abandoned"],
        },
      },
      required: ["goal_id", "status"],
    },
  },
  {
    name: "create_task",
    description: "Create a task, optionally linked to a goal.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        goal_id: { type: "string" },
        due_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["title"],
    },
  },
  {
    name: "update_task",
    description: "Mark a task done/not done or change its due date.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
        done: { type: "boolean" },
        due_date: { type: "string" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "get_tasks",
    description: "List tasks, optionally filtered by goal or completion status.",
    input_schema: {
      type: "object",
      properties: {
        goal_id: { type: "string" },
        done: { type: "boolean" },
      },
    },
  },
  {
    name: "create_calendar_event",
    description: "Create a calendar event, optionally linked to a goal.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        goal_id: { type: "string" },
        start_time: { type: "string", description: "ISO 8601 timestamp" },
        end_time: { type: "string", description: "ISO 8601 timestamp" },
        notes: { type: "string" },
      },
      required: ["title", "start_time"],
    },
  },
  {
    name: "get_calendar_events",
    description: "List calendar events in a date range.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string", description: "ISO 8601 timestamp, inclusive" },
        end: { type: "string", description: "ISO 8601 timestamp, exclusive" },
      },
    },
  },
  {
    name: "log_workout",
    description: "Log a workout.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD, defaults to today" },
        type: { type: "string" },
        duration_minutes: { type: "integer" },
        intensity: { type: "integer", description: "1-5" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "get_workouts",
    description: "List workouts in a date range.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
    },
  },
  {
    name: "log_meal",
    description: "Log a meal.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string" },
        meal_type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
        description: { type: "string" },
      },
      required: ["meal_type", "description"],
    },
  },
  {
    name: "get_meals",
    description: "List meals in a date range.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
    },
  },
  {
    name: "log_sleep",
    description: "Log a sleep entry.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string" },
        hours: { type: "number" },
        quality: { type: "integer", description: "1-5" },
        notes: { type: "string" },
      },
      required: ["hours"],
    },
  },
  {
    name: "get_sleep_logs",
    description: "List sleep logs in a date range.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
    },
  },
  {
    name: "log_screen_time",
    description: "Log screen time for a day.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string" },
        total_minutes: { type: "integer" },
        top_app: { type: "string" },
      },
      required: ["total_minutes"],
    },
  },
  {
    name: "get_screen_time",
    description: "List screen time logs in a date range.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
    },
  },
  {
    name: "get_rituals",
    description: "List rituals, optionally filtered by active status.",
    input_schema: {
      type: "object",
      properties: {
        active: { type: "boolean" },
      },
    },
  },
  {
    name: "log_ritual_completion",
    description: "Mark a ritual's occurrence (ritual_logs row) done for a given due date.",
    input_schema: {
      type: "object",
      properties: {
        ritual_log_id: { type: "string" },
      },
      required: ["ritual_log_id"],
    },
  },
  {
    name: "get_ritual_logs",
    description: "List ritual completion logs, optionally filtered by ritual and date range.",
    input_schema: {
      type: "object",
      properties: {
        ritual_id: { type: "string" },
        start: { type: "string" },
        end: { type: "string" },
      },
    },
  },
  {
    name: "save_book_excerpt",
    description: "Save a book excerpt.",
    input_schema: {
      type: "object",
      properties: {
        book_title: { type: "string" },
        excerpt: { type: "string" },
      },
      required: ["excerpt"],
    },
  },
  {
    name: "get_book_excerpts",
    description: "List saved book excerpts, optionally filtered by book title.",
    input_schema: {
      type: "object",
      properties: {
        book_title: { type: "string" },
      },
    },
  },
  {
    name: "get_quotes_history",
    description: "List past motivational quotes.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
    },
  },
  {
    name: "get_check_ins",
    description: "List daily check-in flags (sleep/meal/workout logged) in a date range.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
    },
  },
  {
    name: "log_hiit_session",
    description: "Log a completed HIIT session.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string" },
        interval_work_sec: { type: "integer" },
        interval_rest_sec: { type: "integer" },
        rounds: { type: "integer" },
        notes: { type: "string" },
      },
    },
  },
];

function rangeFilter(query: any, column: string, start?: string, end?: string) {
  if (start) query = query.gte(column, start);
  if (end) query = query.lt(column, end);
  return query;
}

export async function executeTool(
  supabase: SupabaseClient,
  name: string,
  input: Record<string, any>
): Promise<unknown> {
  switch (name) {
    case "get_goals": {
      let q = supabase.from("goals").select("*").order("created_at", { ascending: false });
      if (input.status) q = q.eq("status", input.status);
      return (await q).data;
    }
    case "create_goal": {
      const { data, error } = await supabase
        .from("goals")
        .insert({ title: input.title, description: input.description ?? null, target_date: input.target_date ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "update_goal_status": {
      const { data, error } = await supabase
        .from("goals")
        .update({ status: input.status })
        .eq("id", input.goal_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "create_task": {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ title: input.title, goal_id: input.goal_id ?? null, due_date: input.due_date ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "update_task": {
      const updates: Record<string, any> = {};
      if (typeof input.done === "boolean") updates.done = input.done;
      if (input.due_date) updates.due_date = input.due_date;
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", input.task_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_tasks": {
      let q = supabase.from("tasks").select("*").order("due_date", { ascending: true });
      if (input.goal_id) q = q.eq("goal_id", input.goal_id);
      if (typeof input.done === "boolean") q = q.eq("done", input.done);
      return (await q).data;
    }
    case "create_calendar_event": {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          title: input.title,
          goal_id: input.goal_id ?? null,
          start_time: input.start_time,
          end_time: input.end_time ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_calendar_events": {
      let q = supabase.from("calendar_events").select("*").order("start_time", { ascending: true });
      q = rangeFilter(q, "start_time", input.start, input.end);
      return (await q).data;
    }
    case "log_workout": {
      const { data, error } = await supabase
        .from("workouts")
        .insert({
          date: input.date ?? new Date().toISOString().slice(0, 10),
          type: input.type ?? null,
          duration_minutes: input.duration_minutes ?? null,
          intensity: input.intensity ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_workouts": {
      let q = supabase.from("workouts").select("*").order("date", { ascending: false });
      q = rangeFilter(q, "date", input.start, input.end);
      return (await q).data;
    }
    case "log_meal": {
      const { data, error } = await supabase
        .from("meals")
        .insert({
          date: input.date ?? new Date().toISOString().slice(0, 10),
          meal_type: input.meal_type,
          description: input.description,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_meals": {
      let q = supabase.from("meals").select("*").order("date", { ascending: false });
      q = rangeFilter(q, "date", input.start, input.end);
      return (await q).data;
    }
    case "log_sleep": {
      const { data, error } = await supabase
        .from("sleep_logs")
        .insert({
          date: input.date ?? new Date().toISOString().slice(0, 10),
          hours: input.hours,
          quality: input.quality ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_sleep_logs": {
      let q = supabase.from("sleep_logs").select("*").order("date", { ascending: false });
      q = rangeFilter(q, "date", input.start, input.end);
      return (await q).data;
    }
    case "log_screen_time": {
      const { data, error } = await supabase
        .from("screen_time_logs")
        .insert({
          date: input.date ?? new Date().toISOString().slice(0, 10),
          total_minutes: input.total_minutes,
          top_app: input.top_app ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_screen_time": {
      let q = supabase.from("screen_time_logs").select("*").order("date", { ascending: false });
      q = rangeFilter(q, "date", input.start, input.end);
      return (await q).data;
    }
    case "get_rituals": {
      let q = supabase.from("rituals").select("*");
      if (typeof input.active === "boolean") q = q.eq("active", input.active);
      return (await q).data;
    }
    case "log_ritual_completion": {
      const { data, error } = await supabase
        .from("ritual_logs")
        .update({ done: true, completed_at: new Date().toISOString() })
        .eq("id", input.ritual_log_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_ritual_logs": {
      let q = supabase.from("ritual_logs").select("*").order("due_date", { ascending: false });
      if (input.ritual_id) q = q.eq("ritual_id", input.ritual_id);
      q = rangeFilter(q, "due_date", input.start, input.end);
      return (await q).data;
    }
    case "save_book_excerpt": {
      const { data, error } = await supabase
        .from("book_excerpts")
        .insert({ book_title: input.book_title ?? null, excerpt: input.excerpt })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "get_book_excerpts": {
      let q = supabase.from("book_excerpts").select("*").order("date_added", { ascending: false });
      if (input.book_title) q = q.eq("book_title", input.book_title);
      return (await q).data;
    }
    case "get_quotes_history": {
      let q = supabase.from("quotes_history").select("*").order("date", { ascending: false });
      q = rangeFilter(q, "date", input.start, input.end);
      return (await q).data;
    }
    case "get_check_ins": {
      let q = supabase.from("check_ins").select("*").order("date", { ascending: false });
      q = rangeFilter(q, "date", input.start, input.end);
      return (await q).data;
    }
    case "log_hiit_session": {
      const { data, error } = await supabase
        .from("hiit_sessions")
        .insert({
          date: input.date ?? new Date().toISOString().slice(0, 10),
          interval_work_sec: input.interval_work_sec ?? 20,
          interval_rest_sec: input.interval_rest_sec ?? 20,
          rounds: input.rounds ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
