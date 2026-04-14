import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../env";

export function createSupabaseBrowserClient() {
  if (!publicEnv.authConfigured) {
    return null;
  }

  return createClient(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
