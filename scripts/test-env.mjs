const testDefaults = {
  NODE_ENV: "test",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  NEXT_PUBLIC_PORTAL_URL: "https://crypto-raid-admin-portal.vercel.app",
  NEXT_PUBLIC_WEBAPP_URL: "https://veltrix-web.vercel.app",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  VERIFICATION_CALLBACK_URL: "https://crypto-raid-admin-portal.vercel.app/api/verify/confirm",
  VERIFICATION_CALLBACK_SECRET: "test-verification-secret",
  COMMUNITY_BOT_WEBHOOK_SECRET: "test-community-webhook-secret",
  COMMUNITY_RETRY_JOB_SECRET: "test-community-retry-secret",
  PUBLIC_APP_URL: "https://veltrix-web.vercel.app",
  PUBLIC_ADMIN_PORTAL_URL: "https://crypto-raid-admin-portal.vercel.app",
  ADMIN_PORTAL_URL: "https://crypto-raid-admin-portal.vercel.app",
  BASE_RPC_URLS: "https://mainnet.base.org",
};

for (const [key, value] of Object.entries(testDefaults)) {
  process.env[key] ||= value;
}
