import { Router } from "express";
import { env } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "veltrix-community-bot",
    providers: {
      discord: Boolean(env.DISCORD_BOT_TOKEN),
      telegram: Boolean(env.TELEGRAM_BOT_TOKEN)
    }
  });
});
