const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const webappUrl =
  process.env.NEXT_PUBLIC_WEBAPP_URL ??
  "https://veltrix-web.vercel.app";
const portalUrl =
  process.env.NEXT_PUBLIC_PORTAL_URL ??
  "https://crypto-raid-admin-portal.vercel.app";

export const publicEnv = {
  supabaseUrl,
  supabasePublishableKey,
  webappUrl,
  portalUrl,
  authConfigured: Boolean(supabaseUrl && supabasePublishableKey),
} as const;
