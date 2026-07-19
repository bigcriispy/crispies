import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";
import { getAnthropic, MODEL_SONNET } from "../lib/anthropic";

function tomorrow(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// @anthropic-ai/sdk 0.68 only types the basic web search tool variant.
// Bump to web_search_20260209 (dynamic filtering) once the SDK adds it.
const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search" } as const;

async function searchAndSummarize(anthropic: Anthropic, prompt: string): Promise<string> {
  let messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  for (let i = 0; i < 4; i++) {
    const response = await anthropic.messages.create({
      model: MODEL_SONNET,
      max_tokens: 1024,
      tools: [WEB_SEARCH_TOOL],
      messages,
    });

    if (response.stop_reason === "pause_turn") {
      messages = [...messages, { role: "assistant", content: response.content }];
      continue;
    }

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  }
  return "";
}

export async function runGenerateNewsDigest(env: Env): Promise<void> {
  const supabase = getSupabase(env);
  const anthropic = getAnthropic(env);

  const prompts = {
    world_news: "Search the web and summarize today's most important world news in 4-6 sentences.",
    us_news: "Search the web and summarize today's most important US national news in 4-6 sentences.",
    us_politics: "Search the web and summarize today's key US politics developments in 4-6 sentences.",
    stock_market: "Search the web and summarize today's US stock market action (major indices, notable movers) in 4-6 sentences.",
  };

  const [world_news, us_news, us_politics, stock_market] = await Promise.all([
    searchAndSummarize(anthropic, prompts.world_news),
    searchAndSummarize(anthropic, prompts.us_news),
    searchAndSummarize(anthropic, prompts.us_politics),
    searchAndSummarize(anthropic, prompts.stock_market),
  ]);

  await supabase
    .from("news_digests")
    .insert({ date: tomorrow(), world_news, us_news, us_politics, stock_market });
}
