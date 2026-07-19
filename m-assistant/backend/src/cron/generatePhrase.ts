import type Anthropic from "@anthropic-ai/sdk";
import type { Env } from "../lib/env";
import { getSupabase } from "../lib/supabase";
import { getAnthropic, MODEL_HAIKU } from "../lib/anthropic";

function tomorrow(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function runGeneratePhrase(env: Env): Promise<void> {
  const supabase = getSupabase(env);
  const anthropic = getAnthropic(env);

  const { data: settings } = await supabase
    .from("language_settings")
    .select("active_language")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const language = settings?.active_language ?? "Farsi";

  const { data: recentPhrases } = await supabase
    .from("daily_phrases")
    .select("phrase_native")
    .eq("language", language)
    .order("date", { ascending: false })
    .limit(30);
  const avoid = (recentPhrases ?? []).map((r) => r.phrase_native);

  const response = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 512,
    system: `You produce one useful everyday phrase in the target language for a language learner.
Respond with ONLY a JSON object:
{ "phrase_native": string, "phrase_transliteration": string, "phrase_english": string, "usage_note": string }
phrase_native is in the language's native script. phrase_transliteration is a romanized pronunciation guide.
usage_note explains briefly when/how the phrase is used. Do not repeat any phrase already used before.`,
    messages: [
      {
        role: "user",
        content: `Target language: ${language}\nPhrases already used (do not repeat): ${JSON.stringify(avoid)}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  let parsed: {
    phrase_native: string;
    phrase_transliteration: string;
    phrase_english: string;
    usage_note: string;
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    return;
  }

  await supabase.from("daily_phrases").insert({
    date: tomorrow(),
    language,
    phrase_native: parsed.phrase_native,
    phrase_transliteration: parsed.phrase_transliteration,
    phrase_english: parsed.phrase_english,
    usage_note: parsed.usage_note,
  });
}
