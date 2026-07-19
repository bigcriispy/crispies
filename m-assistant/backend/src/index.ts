import { Hono } from "hono";
import type { Env } from "./lib/env";
import { handleChat } from "./routes/chat";
import { handleLogSleep } from "./routes/logSleep";
import { handleLogMeal } from "./routes/logMeal";
import { handleLogWorkout } from "./routes/logWorkout";
import { handleCreateGoal } from "./routes/createGoal";
import { handleGetProgress } from "./routes/getProgress";
import { handleGetNewsDigest } from "./routes/getNewsDigest";
import { runGenerateQuote } from "./cron/generateQuote";
import { runGenerateNewsDigest } from "./cron/generateNewsDigest";
import { runGeneratePhrase } from "./cron/generatePhrase";

const app = new Hono<{ Bindings: Env }>();

app.post("/chat", handleChat);
app.post("/log-sleep", handleLogSleep);
app.post("/log-meal", handleLogMeal);
app.post("/log-workout", handleLogWorkout);
app.post("/create-goal", handleCreateGoal);
app.get("/get-progress", handleGetProgress);
app.get("/get-news-digest", handleGetNewsDigest);

export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // wrangler.toml defines 3 staggered crons matching the 3 nightly jobs, in order.
    const [quoteCron, newsCron, phraseCron] = ["0 9 * * *", "15 9 * * *", "30 9 * * *"];
    switch (event.cron) {
      case quoteCron:
        await runGenerateQuote(env);
        break;
      case newsCron:
        await runGenerateNewsDigest(env);
        break;
      case phraseCron:
        await runGeneratePhrase(env);
        break;
    }
  },
};
