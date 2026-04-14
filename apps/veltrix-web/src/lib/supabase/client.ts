import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../env";

export function createSupabaseBrowserClient() {
  if (!publicEnv.authConfigured) {
    throw new Error("Supabase public envs are not configured.");
  }

  return createClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
