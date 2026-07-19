import Anthropic from "@anthropic-ai/sdk";
import type { Env } from "./env";

// Model routing: Haiku carries the bulk of usage (chat, logging, quotes,
// phrases); Sonnet is reserved for goal planning, monthly reviews, and the
// news digest, which need stronger synthesis.
export const MODEL_HAIKU = "claude-haiku-4-5-20251001";
export const MODEL_SONNET = "claude-sonnet-5";

export function getAnthropic(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}
