import { Router } from "express";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const supabaseHost = (() => {
    try {
      return new URL(env.SUPABASE_URL).host;
    } catch {
      return "invalid";
    }
  })();

  const callbackHost = (() => {
    try {
      return new URL(env.VERIFICATION_CALLBACK_URL).host;
    } catch {
      return "invalid";
    }
  })();

  res.json({
    ok: true,
    service: "veltrix-community-bot",
    supabaseHost,
    callbackHost,
    providers: {
      discord: Boolean(env.DISCORD_BOT_TOKEN),
      telegram: Boolean(env.TELEGRAM_BOT_TOKEN)
    }
  });
});
