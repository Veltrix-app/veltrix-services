const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const portalUrl =
  process.env.NEXT_PUBLIC_PORTAL_URL ??
  "https://crypto-raid-admin-portal-bu2lofn3c-veltrix-apps-projects.vercel.app";

export const publicEnv = {
  supabaseUrl,
  supabasePublishableKey,
  portalUrl,
  authConfigured: Boolean(supabaseUrl && supabasePublishableKey),
} as const;
