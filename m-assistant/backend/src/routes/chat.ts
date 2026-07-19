import type { Context } from "hono";
import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";
import { getAnthropic, MODEL_HAIKU, MODEL_SONNET } from "../lib/anthropic";
import { buildSystemPrompt } from "../lib/persona";
import { TOOLS, executeTool } from "../lib/tools";

const HISTORY_LIMIT = 20;
const MAX_TOOL_ITERATIONS = 8;

export async function handleChat(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json<{ message: string; mode?: "default" | "monthly_review" }>();
  if (!body.message) return c.json({ error: "message is required" }, 400);

  const supabase = getSupabase(c.env);
  const anthropic = getAnthropic(c.env);
  const model = body.mode === "monthly_review" ? MODEL_SONNET : MODEL_HAIKU;

  const { data: summaryRow } = await supabase
    .from("rolling_summary")
    .select("summary")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: historyRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const history: Anthropic.MessageParam[] = (historyRows ?? [])
    .reverse()
    .map((row) => ({ role: row.role as "user" | "assistant", content: row.content as string }));

  const messages: Anthropic.MessageParam[] = [...history, { role: "user", content: body.message }];
  const system = buildSystemPrompt(summaryRow?.summary ?? null);

  let finalText = "";
  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system,
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      break;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const result = await executeTool(supabase, block.name, block.input as Record<string, any>);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result ?? null),
        });
      } catch (err) {
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: String(err instanceof Error ? err.message : err),
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: toolResults });
  }

  await supabase.from("chat_messages").insert([
    { role: "user", content: body.message },
    { role: "assistant", content: finalText },
  ]);

  return c.json({ reply: finalText });
}
