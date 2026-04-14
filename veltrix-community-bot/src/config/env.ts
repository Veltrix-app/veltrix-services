import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4300),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  VERIFICATION_CALLBACK_URL: z.string().url(),
  VERIFICATION_CALLBACK_SECRET: z.string().min(1),
  DISCORD_BOT_TOKEN: z.string().min(1).optional(),
  DISCORD_CLIENT_ID: z.string().min(1).optional(),
  DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  COMMUNITY_BOT_WEBHOOK_SECRET: z.string().min(1).optional()
});

export const env = envSchema.parse(process.env);
