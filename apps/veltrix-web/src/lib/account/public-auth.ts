import { publicEnv } from "@/lib/env";

export const publicAuthRoutes = {
  start: "/start",
  signIn: "/sign-in",
  signUp: "/auth/sign-up",
  verify: "/auth/verify",
  recover: "/auth/recover",
  postAuth: "/getting-started",
} as const;

function resolveWebappOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return publicEnv.webappUrl;
}

export function buildPublicAuthRedirect(pathname: string) {
  return new URL(pathname, resolveWebappOrigin()).toString();
}

export function buildVerificationRedirectUrl() {
  return buildPublicAuthRedirect(publicAuthRoutes.verify);
}

export function buildRecoveryRedirectUrl() {
  return buildPublicAuthRedirect(`${publicAuthRoutes.recover}?mode=reset`);
}
